const util = require("./utility.js");
const AWS = require("aws-sdk");
const client = new AWS.DynamoDB.DocumentClient();
let response;

// Handles incoming post request of user registration/spot reservation.
// First, parse the received user's data and prepare the same data in order for storing into dynamodb's table,
// populate uuid for user's id and number of seconds since epoch time(UTC) for createdAt attribute,
// after successfully storing user's data into database, send email to the admin of dell-vr notifying about the new spot reservation info,
// returns success response after finishing all abovementioned tasks.
exports.lambdaHandler = async (event, context) => {
  let userInfo = JSON.parse(event.body);
  userInfo.id = util.uuid();
  userInfo.registeredAt = util.createdAt();
  console.log(userInfo);
  const params = {
    TableName: util.DDBTABLENAME,
    Item: userInfo,
  };
  try {
    await client
      .put(params)
      .promise() // insert new item into dynamodb table
      .then(function (data) {
        console.log("new user inserted");
      });
    await util.reservationEmail(userInfo);
    response = util.response(200, { message: "Spot reservation completed successfully."});
  } catch (err) {
    response = util.response(500, { message: err.message });
  }
  return response;
};
