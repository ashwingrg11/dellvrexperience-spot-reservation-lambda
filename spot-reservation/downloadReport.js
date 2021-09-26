let AWS = require("aws-sdk");
const util = require("./utility.js");
let response;

//
exports.lambdaHandler = async (event, context) => {
  try {
    const s3Bucket = new AWS.S3({ signatureVersion: "v4" });
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
