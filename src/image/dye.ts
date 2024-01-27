import { DyeData } from "zephyr-images";
import { ffmpeg } from "../lib/ffmpeg.js";

export async function drawDye({ color }: DyeData): Promise<Buffer> {
  const input = `-f lavfi -i color=size=96x96:color=#${color}`;

  const buffer = await ffmpeg([input]);

  return buffer;
}
