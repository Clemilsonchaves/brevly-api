import { S3 } from "aws-sdk";

const s3 = new S3({
  endpoint: process.env.CLOUDFLARE_PUBLIC_URL,
  accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  region: "auto",
  signatureVersion: "v4",
});

export async function uploadToR2(fileName: string, buffer: Buffer) {
  const bucket = process.env.CLOUDFLARE_BUCKET!;
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
