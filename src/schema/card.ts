import { z } from "zod";
import { TextAlignField } from "../lib/enums.js";

export const hexRegex = /^#?([a-f0-9]{6})|([a-f0-9]{3})$/i;

export const cardSchema = z.object({
  prefabId: z.number().int().positive(),
  serialNumber: z.number().int(),
  idolName: z.string(),
  groupId: z.number().int().positive().optional(),
  colors: z.array(z.string().regex(hexRegex)).optional(),
  textColor: z.string().regex(hexRegex).optional(),
  isFlipped: z.boolean().optional(),
  frame: z
    .object({
      id: z.number().int().positive(),
      frameTextColor: z.string().regex(hexRegex).optional(),
      frameTextOpacity: z.number().int().optional(),
      frameShouldUnderlayDye: z.boolean().optional(),
      frameNamePositionX: z.number().int().optional(),
      frameNamePositionY: z.number().int().optional(),
      frameNameAlign: TextAlignField.optional(),
      frameSerialPositionX: z.number().int().optional(),
      frameSerialPositionY: z.number().int().optional(),
      frameSerialAlign: TextAlignField.optional(),
      frameLogoPositionX: z.number().int().optional(),
      frameLogoPositionY: z.number().int().optional(),
      frameLogoAlignX: TextAlignField.optional(),
      frameLogoAlignY: TextAlignField.optional(),
      frameMaxDyeLuminance: z.number().optional(),
    })
    .optional(),
  stickers: z
    .array(
      z.object({
        id: z.number().int().positive(),
        rotation: z.number().int().min(0).max(360),
        posX: z.number().int(),
        posY: z.number().int(),
        scale: z.number(),
        isFlipped: z.boolean(),
      })
    )
    .optional(),
});
