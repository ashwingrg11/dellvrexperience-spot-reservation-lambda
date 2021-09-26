const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTPHOST,
  port: process.env.SMTPPORT,
  auth: {
    user: process.env.SMTPUSER,
    pass: process.env.SMTPPASS
  }
});
const { performance, PerformanceObserver } = require("perf_hooks");
const AWS = require("aws-sdk");
const client = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES({region: process.env.AWSREGION});
const { parse } = require("json2csv");
const { config } = require("process");

// this function returns uuid for providing id attribute of new user
const generateUUID = () => {
  var d = new Date().getTime(); //Timestamp
  var d2 = (performance && performance.now && performance.now() * 1000) || 0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// This function returns number of seconds since epoch time in UTC
const generateCreatedAt = () => {
  const now = new Date();
  const secondsSinceEpoch = Math.round(now.getTime() / 1000);
  return secondsSinceEpoch;
};

// First, scan all the records from dynamodb table and parse the same data into csv format.
// then, config the s3bucket parameters and store csv file into s3bucket.
const uploadToS3 = async () => {
  const s3Bucket = new AWS.S3({ signatureVersion: "v4" });
  const allUsers = await scanAllUsers({ TableName: process.env.DDBTABLENAME });
  const fields = [
    "firstName",
    "lastName",
    "email",
    "company",
    "street",
    "city",
    "postalCode",
    "country",
    "id",
    "registeredAt",
    "registrationCode"
  ];
  const opts = { fields };
  const csvData = parse(allUsers, opts);
  const params = {
    Bucket: process.env.BUCKETNAME,
    Key: process.env.REPORTFILENAME,
    ContentType: "text/csv",
    Body: csvData,
  };
  await s3Bucket
    .putObject(params)
    .promise()
    .then(function (data) {
      console.log("uploading to s3 completed");
    });
  return csvData;
};

// Scan all the records from dynamodb table and return the same.
const scanAllUsers = async (params) => {
  let lastEvaluatedKey = "lastevaluatedkey";
  let allUsers = [];
  while (lastEvaluatedKey) {
    const data = await client.scan(params).promise();
    allUsers.push(...data.Items);
    lastEvaluatedKey = data.LastEvaluatedKey;
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }
  }
  return allUsers;
};

// send email after a successful user registration
const sendEmailAfterRegistration = async (newInfo) => {
  let message = {
    from: process.env.SENDEREMAIL,
    to: process.env.TOADDRESSES,
    cc: process.env.CCADDRESSES,
    subject: 'New Spot Reservation - DELL VR-EXP',
    html: "Hello Dell VR Experience Admin, <br><br> There is a new registration for a new SPOT. The details are as follows:<br><br><strong>Name: </strong>"+newInfo.firstName+' '+newInfo.lastName+'<br><strong>Email: </strong>'+ newInfo.email+'<br><strong>Company:</strong> '+newInfo.company+'<br><strong>Street:</strong> '+newInfo.street+'<br><strong>City:</strong> '+newInfo.city+'<br><strong>Postal Code:</strong> '+newInfo.postalCode+'<br><strong>Country:</strong> '+newInfo.country+' <br><br>Regards,<br> Dell VR Experience Team'
  };
  console.log(`sending: ${JSON.stringify(message)}`);
  return transporter.sendMail(message);
  // return ses.sendEmail(emailParams, null).promise();
};

// functionality to send report link in email
const sendEmailReport = async () => {
  let message = {
    from: process.env.SENDEREMAIL,
    to: process.env.TOADDRESSES,
    cc: process.env.CCADDRESSES,
    subject: 'Spot Reservations Report - Dell VR-Exp',
    html: "Hello Dell VR Experience Admin, <br><br> You can view and download the up to date spot reservations report by clicking the link below."+'<br><br><a href="' +process.env.FRONTENDURL +'/index.html?action=download-report" target="_blank">Download Reservation Report</a>'+'<br><br>Regards,<br> Dell VR Experience Team'
  };
  console.log(`sending: ${JSON.stringify(message)}`);
  // return ses.sendEmail(emailParams, null).promise();
  return transporter.sendMail(message);
};

// handles functionality to send email from contact us page/endpoint
const sendContactUsEmail = async (data) => {
  let message = {
    from: process.env.SENDEREMAIL,
    to: process.env.TOADDRESSES,
    cc: process.env.CCADDRESSES,
    subject: 'Enquiry on Dell VR-Exp',
    html: 'Hello Dell VR Experience Admin, <br><br>A new enquiry has been received from Contact us form. The details are as follows:<br><br><strong>Name:</strong> '+data.salutation+' '+data.firstName+' '+data.lastName+'. <br><strong>Email:</strong> '+data.email+' <br><strong>Company:</strong> '+data.company+' <br><strong>Message:</strong> '+data.message+' <br><br>Regards,<br> Dell VR Experience Team'
  };
  console.log(`sending: ${JSON.stringify(message)}`);
  // return ses.sendEmail(emailParams, null).promise();
  return transporter.sendMail(message);

};

// construct success/error response data
const responseData = (code, data) => {
  return {
    statusCode: code,
    headers: { 'Access-Control-Allow-Origin': '*'},
    body: JSON.stringify(data),
  }
}

// functions/variables exports
exports.uploadToS3 = uploadToS3;
exports.allUsers = scanAllUsers;
exports.uuid = generateUUID;
exports.response = responseData;
exports.createdAt = generateCreatedAt;
exports.reservationEmail = sendEmailAfterRegistration;
exports.emailReport = sendEmailReport;
exports.contactUsEmail = sendContactUsEmail;
exports.BUCKETNAME = process.env.BUCKETNAME;
exports.DDBTABLENAME = process.env.DDBTABLENAME;
exports.REPORTFILENAME = process.env.REPORTFILENAME;
