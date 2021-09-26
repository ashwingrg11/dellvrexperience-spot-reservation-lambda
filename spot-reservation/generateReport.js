const util = require("./utility.js");
const AWS = require("aws-sdk");
const client = new AWS.DynamoDB.DocumentClient();
let response;

// Handles incoming get request for generating/downloading report of users/spot reservations.
// First, scan records from dynamodb table, then parse the records into csv format and save as a csv file in s3bucket.
// return response as a text/csv for allowing users to download the csv file.
exports.lambdaHandler = async (event, context) => {
  try {
    await util.uploadToS3();
    const s3Bucket = new AWS.S3({ signatureVersion: "v4" });
    // process dynamodbtable's records, parse json data to csv and put csv file into s3bucket
    const params = {
      Bucket: util.BUCKETNAME,
      Key: util.REPORTFILENAME,
      Expires: 60 * 2,
    };
    let downloadUrl = await s3Bucket.getSignedUrl("getObject", params);
    response = util.response(200, { url: downloadUrl, message: "Success downloading report."});
  } catch (err) {
    response = util.response(500, { message: err.message });
  }
  return response;
};
