import { CardData, Inputs, RGB } from "zephyr-images";
import { TextAlign } from "../lib/enums.js";
import { hexToRgb } from "../lib/conversions.js";
import { getLerp } from "../lib/lerp.js";
import { getIdol } from "../s3/idol.js";
import { getFrame } from "../s3/frame.js";
import { getSticker } from "../s3/sticker.js";
import { ffmpeg } from "../lib/ffmpeg.js";
import { orDefaultValue } from "../lib/default.js";
import { getGroup } from "../s3/group.js";
import { writeFile } from "fs/promises";
import hash from "object-hash";

export async function drawCard(
  card: CardData,
  options?: {
    cache?: boolean;
    hideSerialNumber?: boolean;
    dyeOverride?: string;
    frameOverride?: string;
  }
): Promise<Buffer> {
  const inputData: Inputs = {};
  const inputFiles: string[] = [];
  const filters: string[] = [];
  const frameFolder =
    card.frame !== undefined
      ? await getFrame(card.frame.id)
      : `./assets/frames/default`;

  const framePath = `${frameFolder}/frame.png`;
  const dyePath = `${frameFolder}/dye.png`;

  if (
    card.frame === undefined &&
    card.textColor === null &&
    card.isFlipped === false
  ) {
    inputFiles.push(`-i ./assets/prefabs/${card.prefabId}.png`);
    inputData.prefab = {
      index: 0,
    };

    if (card.colors !== undefined && card.colors.length > 0) {
      inputFiles.push(`-i ${options?.dyeOverride || dyePath}`);
      inputData.dye = {
        index: 1,
      };
    }
  } else {
    inputFiles.push(`-i ${options?.frameOverride || framePath}`);
    inputData.frame = {
      id: card.frame?.id,
      index: 0,
    };

    inputFiles.push(`-i ${options?.dyeOverride || dyePath}`);
    inputData.dye = {
      index: 1,
    };

    const idolPath = await getIdol(card.prefabId);
    inputFiles.push(`-i ${idolPath}`);
    inputData.idol = {
      index: 2,
    };

    inputFiles.push("-f lavfi -i color=0x000000@0.0:770x1100,format=rgba");
    inputData.overlay = {
      index: 3,
    };

    if (card.groupId !== undefined) {
      const groupPath = await getGroup(card.groupId);
      inputFiles.push(`-i ${groupPath}`);
      inputData.logo = {
        index: 4,
      };
    }
  }

  if (card.stickers !== undefined && card.stickers.length > 0) {
    inputData.stickers = [];

    for (let [_, sticker] of card.stickers
      .sort((a, b) => a.id - b.id)
      .entries()) {
      const existingInput = inputData.stickers.find((s) => s.id === sticker.id);

      if (existingInput !== undefined) {
        inputData.stickers.push({
          id: sticker.id,
          index: existingInput.index,
          rotation: sticker.rotation,
          posX: sticker.posX,
          posY: sticker.posY,
          scale: sticker.scale,
          isFlipped: sticker.isFlipped,
        });
      } else {
        inputData.stickers.push({
          id: sticker.id,
          index: inputFiles.length,
          rotation: sticker.rotation,
          posX: sticker.posX,
          posY: sticker.posY,
          scale: sticker.scale,
          isFlipped: sticker.isFlipped,
        });

        const stickerPath = await getSticker(sticker.id);
        inputFiles.push(`-i ${stickerPath}`);
      }
    }
  }

  filters.push(generateCardFilters(card, inputData, options));

  const buffer = await ffmpeg(inputFiles, filters);

  if (options?.cache === true) {
    await writeFile(`./assets/cards/${card.id}-${hash(card)}.png`, buffer);
  }

  return buffer;
}

export function generateCardFilters(
  card: CardData,
  inputs: Inputs,
  options?: { hideSerialNumber?: boolean }
) {
  const filters: string[] = [];

  if (inputs.dye === undefined && inputs.prefab === undefined) {
    throw new Error("Expected `inputs.dye` to exist on non-prefab card");
  }

  const colors: RGB[] = (card.colors || []).map((color) => {
    return hexToRgb(color);
  });

  if (colors.length === 0) {
    colors.push(hexToRgb("B9B9B9"));
  }

  const r = colors.map((c) => c.r);
  const g = colors.map((c) => c.g);
  const b = colors.map((c) => c.b);

  const luminanceFormula = "(1 - (255 - r(X,Y)) / 255)";

  const dye =
    `[${inputs.dye?.index}]format=rgba,geq=` +
    `r='st(0,${luminanceFormula});` +
    `if(eq(alpha(X,Y),0),0,${getLerp(r, 0, 70)})'` +
    `:g='st(0,${luminanceFormula});` +
    `if(eq(alpha(X,Y),0),0,${getLerp(g, 0, 70)})'` +
    `:b='st(0,${luminanceFormula});` +
    `if(eq(alpha(X,Y),0),0,${getLerp(b, 0, 70)})'` +
    `:a='alpha(X,Y)'[dye]`;

  if (inputs.prefab !== undefined) {
    const prefabIndex = inputs.prefab.index;

    // if the card is undyed, just use the default prefab image
    if (card.colors === undefined || card.colors.length === 0) {
      filters.push(`[${prefabIndex}]null[dyed]`);
    } else {
      filters.push(dye, `[${prefabIndex}][dye]overlay=format=rgb[dyed]`);
    }
  } else {
    if (inputs.frame === undefined) {
      throw new Error("Expected `inputs.frame` to exist on framed, dyed card");
    }

    if (card.frame?.frameShouldUnderlayDye === true) {
      filters.push(dye, `[dye][${inputs.frame.index}]overlay=format=rgb[dyed]`);
    } else {
      filters.push(dye, `[${inputs.frame.index}][dye]overlay=format=rgb[dyed]`);
    }
  }

  // overlay idol
  if (inputs.prefab === undefined) {
    if (inputs.idol === undefined) {
      throw new Error("Expected `inputs.idol` to exist on non-prefab card");
    }

    if (card.isFlipped === true) {
      filters.push(`[${inputs.idol.index}]hflip[idol]`);
    } else {
      filters.push(`[${inputs.idol.index}]null[idol]`);
    }
  }

  if (inputs.prefab !== undefined) {
    filters.push("[dyed]null[blank]");
  } else if (inputs.prefab === undefined) {
    filters.push(`[idol][dyed]overlay=format=rgb[blank]`);
  }

  let textColor = card.textColor || card.frame?.frameTextColor || "000000";

  const rgbTextColor = hexToRgb(textColor);

  if (inputs.prefab !== undefined) {
    if (options?.hideSerialNumber === true || card.serialNumber === undefined) {
      filters.push(`[named]null[printed]`);
    } else {
      filters.push(
        `[named]drawtext=text=#${
          card.serialNumber
        }:fontcolor=${textColor}:fontsize=${
          card.frame?.frameSerialFontSize || 40
        }:fontfile='./assets/fonts/default.ttf':x=111:y=897[printed]`
      );
    }
  } else {
    const frame = card.frame;

    const opacity = orDefaultValue(frame?.frameTextOpacity, 255) / 255;

    const nameX = orDefaultValue(frame?.frameNamePositionX, 108);
    const nameY = orDefaultValue(frame?.frameNamePositionY, 933);
    const nameAlign = frame?.frameNameAlign || TextAlign.LEFT;
    let alignedNameX: string;

    if (nameAlign === TextAlign.RIGHT) {
      alignedNameX = `${nameX}-tw`;
    } else if (nameAlign === TextAlign.CENTER) {
      alignedNameX = `${nameX}-(tw/2)`;
    } else {
      alignedNameX = `${nameX}`;
    }

    const serialX = orDefaultValue(frame?.frameSerialPositionX, 111);
    const serialY = orDefaultValue(frame?.frameSerialPositionY, 897);
    const serialAlign = frame?.frameSerialAlign || TextAlign.LEFT;
    let alignedSerialX: string;

    if (serialAlign === TextAlign.RIGHT) {
      alignedSerialX = `${serialX}-tw`;
    } else if (serialAlign === TextAlign.CENTER) {
      alignedSerialX = `${serialX}-(tw/2)`;
    } else {
      alignedSerialX = `${serialX}`;
    }

    filters.push(
      `[${inputs.overlay!.index}]drawtext=text='${card.idolName
        .replace(/:/g, "\\:")
        .replace(/'/g, "'\\\\\\''")
        .replace(/%/g, "\\\\%")}':fontcolor=${textColor}:fontsize=${
        card.frame?.frameNameFontSize || 55
      }:fontfile='./assets/fonts/default.ttf':x=${alignedNameX}:y=${nameY}[textoverlay_named]`,
      options?.hideSerialNumber === true || card.serialNumber === undefined
        ? `[textoverlay_named]null[textoverlay_printed]`
        : `[textoverlay_named]drawtext=text=#${
            card.serialNumber
          }:fontcolor=${textColor}:fontsize=${
            card.frame?.frameSerialFontSize || 40
          }:fontfile='./assets/fonts/default.ttf':x=${alignedSerialX}:y=${serialY}[textoverlay_printed]`
    );

    if (inputs.logo !== undefined) {
      const logoX = orDefaultValue(frame?.frameLogoPositionX, 656);
      const logoY = orDefaultValue(frame?.frameLogoPositionY, 935);
      const logoAlignX = frame?.frameLogoAlignX || TextAlign.RIGHT;
      const logoAlignY = frame?.frameLogoAlignY || TextAlign.CENTER;
      let alignedLogoX: string;
      let alignedLogoY: string;

      if (logoAlignX === TextAlign.LEFT) {
        alignedLogoX = `${logoX}`;
      } else if (logoAlignX === TextAlign.CENTER) {
        alignedLogoX = `${logoX}-(w/2)`;
      } else {
        alignedLogoX = `${logoX}-w`;
      }

      if (logoAlignY === TextAlign.LEFT) {
        alignedLogoY = `${logoY}`;
      } else if (logoAlignY === TextAlign.RIGHT) {
        alignedLogoY = `${logoY}-h`;
      } else {
        alignedLogoY = `${logoY}-(h/2)`;
      }

      if (textColor === "000000" && opacity === 1) {
        filters.push(
          `[textoverlay_printed][${inputs.logo.index}]overlay=x=${alignedLogoX}:y=${alignedLogoY}:format=rgb[textoverlay_raw]`
        );
      } else {
        filters.push(
          `[${inputs.logo.index}]format=rgba,geq=r=${rgbTextColor.r}:g=${rgbTextColor.g}:b=${rgbTextColor.b}:a='alpha(X,Y)'[colored_group]`,
          `[textoverlay_printed][colored_group]overlay=x=${alignedLogoX}:y=${alignedLogoY}:format=rgb[textoverlay_raw]`
        );
      }
    } else {
      filters.push("[textoverlay_printed]null[textoverlay_raw]");
    }

    filters.push(
      `[textoverlay_raw]format=rgba,geq=r='${rgbTextColor.r}':g='${rgbTextColor.g}':b='${rgbTextColor.b}':a='alpha(X, Y) * ${opacity}'[textoverlay]`
    );
  }

  filters.push(
    `[blank][textoverlay]overlay=format=rgb${
      inputs.stickers !== undefined ? "[grouped]" : ""
    }`
  );

  if (inputs.stickers !== undefined) {
    for (let [index, sticker] of inputs.stickers.entries()) {
      let currentStream = `${sticker.index}`;

      const newSize = 400;

      if (sticker.scale !== 100) {
        filters.push(
          `[${currentStream}]scale=w=(${sticker.scale}/100)*iw:h=(${sticker.scale}/100)*ih[scaled${index}]`
        );
        currentStream = `scaled${index}`;
      }

      const expectedOffset = Math.round(
        (newSize * (sticker.scale / 100) - 300 * (sticker.scale / 100)) / 2
      );

      if (sticker.isFlipped === true) {
        filters.push(`[${currentStream}]hflip[flipped${index}]`);
        currentStream = `flipped${index}`;
      }

      const newWidth = Math.round(newSize * (sticker.scale / 100));

      filters.push(
        `[${currentStream}]pad=x=-1:y=-1:color=0xFF000000:w=${newWidth}:h=${newWidth}[padded${currentStream}]`
      );
      currentStream = `padded${currentStream}`;

      if (sticker.rotation > 0 && sticker.rotation < 360) {
        filters.push(
          `[${currentStream}]rotate=${sticker.rotation}*PI/180:fillcolor=none[rotated${index}]`
        );
        currentStream = `rotated${index}`;
      }

      filters.push(
        `[${
          index === 0 ? "grouped" : `stickered${index - 1}`
        }][${currentStream}]overlay=x=${sticker.posX - expectedOffset}:y=${
          sticker.posY - expectedOffset
        }:format=rgb${
          index === inputs.stickers.length - 1 ? "" : `[stickered${index}]`
        }`
      );
    }
  }

  return filters.join(";");
}
