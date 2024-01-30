import { drawCard } from "./card.js";
import { CardData } from "zephyr-images";
import { access, unlink, writeFile } from "fs/promises";
import { ffmpeg } from "../lib/ffmpeg.js";

export async function drawDrop(cards: Array<CardData>): Promise<Buffer> {
  const inputs: string[] = [];
  const filters: string[] = [];
  const finals: string[] = [];
  const tempFiles: string[] = [];

  let imageToPipe: Buffer | undefined;

  for (let [index, card] of cards.entries()) {
    const isCustomCard =
      (card.colors !== undefined && card.colors.length > 0) ||
      card.isFlipped === true ||
      (card.stickers !== undefined && card.stickers.length > 0) ||
      (card.textColor !== undefined && card.textColor !== "000000") ||
      card.frame !== undefined;

    if (isCustomCard === true) {
      const tempPath = `./assets/tmp/${Date.now()}-${Math.round(
        Math.random() * 1000
      )}.png`;

      const tempImage = await drawCard(card);

      await writeFile(tempPath, tempImage);
      tempFiles.push(tempPath);

      inputs.push(`-i ${tempPath}`);
      filters.push(`[${inputs.length - 1}]scale=385:-1[final${index}]`);
      finals.push(`[final${index}]`);

      continue;
    }

    const prefabPath = `./assets/prefabs/${card.prefabId}.png`;

    try {
      await access(prefabPath);
    } catch {
      const prefabImage = await drawCard(card, { hideSerialNumber: true });
      await writeFile(prefabPath, prefabImage);
    }

    inputs.push(`-i ${prefabPath}`);

    filters.push(
      `[${0 + index}]drawtext=text=#${
        card.serialNumber
      }:fontsize=40:fontfile='./assets/fonts/default.ttf':x=111:y=897[printed${index}]`,
      `[printed${index}]scale=385:-1[final${index}]`
    );

    finals.push(`[final${index}]`);
  }

  filters.push(`${finals.join("")}xstack=inputs=3:layout=0_0|w0_0|w0+w1_0`);

  const buffer = await ffmpeg(inputs, filters, imageToPipe);

  for (let file of tempFiles) {
    await unlink(file);
  }

  return buffer;
}
