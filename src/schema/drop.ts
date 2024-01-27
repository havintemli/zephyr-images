import { cardSchema } from "./card.js";

export const dropSchema = cardSchema.array().length(3);
