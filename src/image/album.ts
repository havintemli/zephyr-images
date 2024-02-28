import { access } from "fs/promises";
import { AlbumData } from "zephyr-images";
import { drawCard } from "./card.js";
import { ffmpeg } from "../lib/ffmpeg.js";
import hash from "object-hash";
import { getAlbum, putAlbum } from "../s3/album.js";
import { redis } from "../lib/redis.js";

export async function drawAlbum(album: AlbumData): Promise<string> {
  if (album.cards.length === 0) {
    return `https://cdn.zephyr.bot/placeholders/${album.width}x${album.height}.png`;
  }

  const albumHash = hash(album);

  try {
    const cachedUrl = await redis.get(`album:${albumHash}`);

    if (cachedUrl !== null) {
      return cachedUrl;
    }

    const image = await getAlbum(albumHash);
    return image;
  } catch (e) {}

  const slots = album.height * album.width;
  const horizontalGap = 60;
  const horizontalPad = 75;
  const verticalGap = 30;
  const verticalPad = 40;

  const inputs = [
    `-f lavfi -i color=0x000000@0.0:${
      album.width * 385 + (album.width - 1) * horizontalGap + horizontalPad * 2
    }x${
      album.height * 550 + (album.height - 1) * verticalGap + verticalPad * 2
    },format=rgba`,
    `-i ./assets/placeholder.png`,
  ];

  const positionMap: { [key: number]: AlbumData["cards"][number] } = {};

  for (let card of album.cards) {
    const cardHash = hash(card);

    const path = `./assets/cards/${card.id}-${cardHash}.png`;

    try {
      await access(path);
    } catch {
      await drawCard(card, cardHash, { cache: true });
    }

    inputs.push(`-i ${path}`);
    positionMap[card.position] = card;
  }

  const scaleFilters = inputs
    .slice(2)
    .map((_, index) => `[${2 + index}]scale=w=iw/2:h=-1[scaled${index}]`);

  const overlayFilters = [];

  for (let [index, card] of album.cards.entries()) {
    const row = Math.ceil(card.position / album.width);
    const column = card.position - (row - 1) * album.width;

    const x = horizontalPad + (column - 1) * horizontalGap + 385 * (column - 1);
    const y = verticalPad + (row - 1) * verticalGap + 550 * (row - 1);

    overlayFilters.push(
      `[${
        index === 0 ? "0" : `overlaid${index}`
      }][scaled${index}]overlay=format=rgb:x=${x}:y=${y}${
        album.cards[index + 1] !== undefined
          ? `[overlaid${index + 1}]`
          : album.editMode === true
          ? `[cards]`
          : ""
      }`
    );
  }

  let placeholders = 0;

  if (album.editMode === true) {
    for (let position = 1; position <= slots; position++) {
      if (positionMap[position] !== undefined) {
        continue;
      }

      const row = Math.ceil(position / album.width);
      const column = position - (row - 1) * album.width;

      const x =
        horizontalPad + (column - 1) * horizontalGap + 385 * (column - 1);
      const y = verticalPad + (row - 1) * verticalGap + 550 * (row - 1);

      overlayFilters.push(
        `${
          placeholders === 0 ? "[cards]" : `[placeholders${placeholders}]`
        }[1]overlay=format=rgb:x=${x}:y=${y}` +
          (position === slots ? "" : `[placeholders${placeholders + 1}]`)
      );
      placeholders++;
    }

    if (placeholders === 0) {
      overlayFilters.push(`[cards]null`);
    }
  }

  const collage = await ffmpeg(
    inputs,
    [...scaleFilters, ...overlayFilters],
    undefined,
    "libwebp"
  );

  const url = await putAlbum(albumHash, collage);

  return url;
}
