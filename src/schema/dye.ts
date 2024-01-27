import { z } from "zod";
import { hexRegex } from "./card.js";

export const dyeSchema = z.object({ color: z.string().regex(hexRegex) });
