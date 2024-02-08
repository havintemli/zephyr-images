import { access, writeFile } from "fs/promises";
import { CollageData } from "zephyr-images";
import { drawCard } from "./card.js";
import { ffmpeg } from "../lib/ffmpeg.js";

export async function drawCollage(prefabs: CollageData): Promise<Buffer> {
  const paths = [];

  for (let { id, name } of prefabs) {
    const prefabPath = `./assets/prefabs/${id}.png`;

    try {
      await access(prefabPath);
    } catch {
      const prefabImage = await drawCard(
        { prefabId: id, idolName: name },
        { hideSerialNumber: true }
      );
      await writeFile(prefabPath, prefabImage);
    }

    paths.push(prefabPath);
  }

  const points = [];

  for (let [index] of paths.entries()) {
    let rowStrings = [];
    let columnStrings = [];

    const row = Math.floor(index / 4);
    const column = index - row * 4;

    if (row === 0) {
      rowStrings.push("0");
    } else {
      for (let i = 0; i < row; i++) {
        rowStrings.push(`h${i}`);
      }
    }

    if (column === 0) {
      columnStrings.push("0");
    } else {
      for (let i = 0; i < column; i++) {
        columnStrings.push(`w${i}`);
      }
    }

    points.push(`${columnStrings.join("+")}_${rowStrings.join("+")}`);
  }

  const scaleFilters = paths.map(
    (_, index) => `[${index}]scale=w=iw/2:h=-1[scaled${index}]`
  );

  const filter = `${paths
    .map((_, index) => `[scaled${index}]`)
    .join("")}xstack=inputs=${paths.length}:layout=${points.join("|")}`;

  const collage = await ffmpeg(
    paths.map((path) => `-i ${path}`),
    [...scaleFilters, filter]
  );

  return collage;
}
