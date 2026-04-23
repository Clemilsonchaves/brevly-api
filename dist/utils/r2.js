"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToR2 = uploadToR2;
const aws_sdk_1 = require("aws-sdk");
const s3 = new aws_sdk_1.S3({
    endpoint: process.env.CLOUDFLARE_PUBLIC_URL,
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    region: "auto",
    signatureVersion: "v4",
});
async function uploadToR2(fileName, buffer) {
    const bucket = process.env.CLOUDFLARE_BUCKET;
    await s3
        .putObject({
        Bucket: bucket,
        Key: fileName,
        Body: buffer,
        ContentType: "text/csv",
    })
        .promise();
    return `${process.env.CLOUDFLARE_PUBLIC_URL}/${fileName}`;
}
