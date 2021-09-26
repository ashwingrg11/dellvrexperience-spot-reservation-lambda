const util = require("./utility.js");
const AWS = require("aws-sdk");
let response;

// handles incomng request from contact-us page/endpoint
// process received formdata/json and send and enquiry email
exports.lambdaHandler = async (event, context) => {
  try {
    let data = JSON.parse(event.body);
    await util.contactUsEmail(data);
    response = util.response(200, { message: "success send email from contact us page."});
  } catch (err) {
    response = util.response(500, { message: err.message });
  }
  return response;
};
