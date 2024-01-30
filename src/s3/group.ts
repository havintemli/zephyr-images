import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, sqids } from "./s3.js";
import fs, { access, writeFile } from "fs/promises";

export async function getGroup(
  id: number,
  useCache: boolean = true
): Promise<string> {
  const path = `./assets/groups/${id}.png`;

  if (useCache === true) {
    try {
      await access(path, fs.constants.R_OK);
      return path;
    } catch {}
  }

  const sqid = sqids.encode([id]);

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: `${
      process.env.NODE_ENV === "production" ? "" : "_dev/"
    }groups/${sqid}.png`,
    ResponseContentType: "image/png",
    ResponseCacheControl: "no-cache",
  });

  const result = await s3.send(command);

  if (result.Body === undefined) {
    throw new Error("S3 fetch did not return body!");
  }

  const byteArray = await result.Body.transformToByteArray();

  await writeFile(path, byteArray);
  return path;
}
