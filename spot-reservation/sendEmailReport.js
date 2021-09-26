const util = require("./utility.js");
const AWS = require("aws-sdk");
let response;

// Handles incoming get request for generating/downloading report of users/spot reservations.
// First, scan records from dynamodb table, then parse the records into csv format and save as a csv file in s3bucket.
// return response as a text/csv for allowing users to download the csv file.
exports.lambdaHandler = async (event, context) => {
  try {
    await util.emailReport();
    await util.uploadToS3();
    response = util.response(200, { message: "Email report function executed successfully."});
  } catch (err) {
    response = util.response(500, { message: err.message });
  }
  return response;
};
