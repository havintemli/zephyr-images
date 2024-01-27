import { ffmpeg } from "../lib/ffmpeg.js";

export async function cropIdol(rawInput: Uint8Array): Promise<Buffer> {
  const inputs = ["-i ./assets/mask.png", "-f image2pipe -c:v png -i -"];
  const filters = ["[0]alphaextract[alpha]", "[1][alpha]alphamerge"];

  const buffer = await ffmpeg(inputs, filters, rawInput);

  return buffer;
}
