import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./s3.js";
import { redis } from "../lib/redis.js";

export async function getAlbum(hash: string): Promise<string> {
  const key = `${
    process.env.NODE_ENV === "production" ? "" : "_dev/"
  }albums/${hash}.webp`;

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ResponseContentType: "image/webp",
  });

  const result = await s3.send(command);

  if (result.Body === undefined) {
    throw new Error("S3 fetch did not return body!");
  }

  const url = `https://cdn.zephyr.bot/${key}`;

  await redis.set(`album:${hash}`, url, { EX: 1 * 60 * 60 * 24 * 7 });

  return url;
}

export async function putAlbum(hash: string, image: Buffer): Promise<string> {
  const key = `${
    process.env.NODE_ENV === "production" ? "" : "_dev/"
  }albums/${hash}.webp`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: image,
    ContentType: "image/webp",
    ACL: "public-read",
  });

  await s3.send(command);

  const url = `https://cdn.zephyr.bot/${key}`;

  await redis.set(`album:${hash}`, url, { EX: 1 * 60 * 60 * 24 * 7 });

  return url;
}
