import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();


const REGION = process.env.REGION

// Create an Amazon S3 service client object.
const s3Client = new S3Client({region: REGION});

export { s3Client };