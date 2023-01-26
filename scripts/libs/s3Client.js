import { S3Client } from "@aws-sdk/client-s3";

const REGION = process.env.REGION || "ap-northeast-1";

// Create an Amazon S3 service client object.
const s3Client = new S3Client({region: REGION});

export { s3Client };