import { z } from "zod";

export const TextAlignField = z.enum(["LEFT", "CENTER", "RIGHT"]);
export const TextAlign = TextAlignField.enum;
