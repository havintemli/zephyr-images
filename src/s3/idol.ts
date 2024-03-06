import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, sqids } from "./s3.js";
import fs, { access, unlink, writeFile } from "fs/promises";
import { cropIdol } from "../image/idol.js";

export async function getIdol(
  id: number,
  useCache: boolean = true
): Promise<string> {
  const path = `./assets/idols/${id}.png`;

  if (useCache === true) {
    try {
      await access(path, fs.constants.R_OK);
      return path;
    } catch {}
  }

  const sqid = sqids.encode([id]);

  const key = `${
    process.env.NODE_ENV === "production" ? "" : "_dev/"
  }prefabs/${sqid}.png`;

  console.log(`Requesting file from ${key} ...`);

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ResponseContentType: "image/png",
  });

  const result = await s3.send(command);

  if (result.Body === undefined) {
    throw new Error("S3 fetch did not return body!");
  }

  const byteArray = await result.Body.transformToByteArray();

  const croppedIdol = await cropIdol(byteArray);

  await writeFile(path, croppedIdol);
  try {
    await unlink(`./assets/prefabs/${id}.png`);
  } catch {}

  return path;
}
