import { S3 } from "@aws-sdk/client-s3";
import Sqids from "sqids";

export const s3 = new S3({
  forcePathStyle: false,
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

export const sqids = new Sqids({ minLength: 7 });
