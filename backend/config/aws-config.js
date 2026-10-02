const AWS = require("aws-sdk");

AWS.config.update({ region: process.env.AWS_REGION || "ap-south-1" });

const s3 = new AWS.S3();
const S3_BUCKET = process.env.S3_BUCKET || "demobucket2592004";

module.exports = { s3, S3_BUCKET };
