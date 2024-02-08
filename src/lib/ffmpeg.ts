import { spawn } from "child_process";
import { Writable } from "stream";

export async function ffmpeg(
  inputs: string[],
  filters: string[] = [],
  pipeImage?: Buffer | Uint8Array
): Promise<Buffer> {
  const buffers: Buffer[] = [];

  const writable = new Writable({
    write(chunk, _, callback) {
      buffers.push(chunk);
      callback();
    },
  });

  const child = spawn("ffmpeg", [
    "-loglevel",
    "error",
    "-hide_banner",
    ...inputs.map((i) => i.split(" ")).flat(),
    ...(filters.length > 0 ? ["-filter_complex", filters.join(";")] : []),
    "-frames:v",
    "1",
    "-f",
    "image2",
    "-codec",
    "png",
    "-compression_level",
    "1",
    "pipe:1",
  ]);

  if (pipeImage !== undefined) {
    child.stdin.write(pipeImage);
    child.stdin.end();
  }

  child.stdout.pipe(writable);
  child.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  const buffer: Buffer = await new Promise((resolve) => {
    writable.on("close", () => {
      resolve(Buffer.concat(buffers));
    });
  });

  return buffer;
}
