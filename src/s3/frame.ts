import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, sqids } from "./s3.js";
import fs, { access, mkdir, writeFile } from "fs/promises";

export async function getFrame(
  id: number,
  useCache: boolean = true
): Promise<string> {
  const directory = `./assets/frames/${id}`;
  const framePath = `${directory}/frame.png`;
  const dyePath = `${directory}/dye.png`;

  if (useCache === true) {
    try {
      await access(framePath, fs.constants.R_OK);
      await access(dyePath, fs.constants.R_OK);
      return directory;
    } catch {}
  }

  const sqid = sqids.encode([id]);

  const frameCommand = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: `${
      process.env.NODE_ENV === "production" ? "" : "_dev/"
    }ugc/frames/${sqid}-frame.png`,
    ResponseContentType: "image/png",
  });

  const dyeCommand = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: `${
      process.env.NODE_ENV === "production" ? "" : "_dev/"
    }ugc/frames/${sqid}-dye.png`,
    ResponseContentType: "image/png",
  });

  const frameResult = await s3.send(frameCommand);
  const dyeResult = await s3.send(dyeCommand);

  if (frameResult.Body === undefined) {
    throw new Error("S3 fetch did not return frame body!");
  }

  if (dyeResult.Body === undefined) {
    throw new Error("S3 fetch did not return dye body!");
  }

  await mkdir(directory, { recursive: true });

  await writeFile(framePath, await frameResult.Body.transformToByteArray(), {});
  await writeFile(dyePath, await dyeResult.Body.transformToByteArray());

  return directory;
}
