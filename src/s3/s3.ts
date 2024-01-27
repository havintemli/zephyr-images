import { S3 } from "@aws-sdk/client-s3";
import Sqids from "sqids";

if (process.env.S3_ENDPOINT === undefined) {
  throw new Error("'S3_ENDPOINT' must be specified in .env!");
}

if (process.env.S3_REGION === undefined) {
  throw new Error("'S3_REGION' must be specified in .env!");
}

if (process.env.S3_ACCESS_KEY_ID === undefined) {
  throw new Error("'S3_ACCESS_KEY_ID' must be specified in .env!");
}

if (process.env.S3_SECRET_ACCESS_KEY === undefined) {
  throw new Error("'S3_SECRET_ACCESS_KEY' must be specified in .env!");
}

export const s3 = new S3({
  forcePathStyle: false,
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

export const sqids = new Sqids({ minLength: 7 });
