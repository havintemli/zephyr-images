import { z } from "zod";

export const collageSchema = z.array(
  z.object({ id: z.number().int().positive(), name: z.string() })
);
