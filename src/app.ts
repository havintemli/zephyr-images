import "dotenv/config.js";

import express from "express";
import { cardSchema } from "./schema/card.js";
import { drawCard } from "./image/card.js";
import { mkdir } from "fs/promises";
import { drawDrop } from "./image/drop.js";
import { dyeSchema } from "./schema/dye.js";
import { drawDye } from "./image/dye.js";
import { dropSchema } from "./schema/drop.js";
import { route } from "./lib/route.js";
import { getSticker } from "./s3/sticker.js";
import { routePatch } from "./lib/routePatch.js";
import { getFrame } from "./s3/frame.js";
import { getGroup } from "./s3/group.js";
import { getIdol } from "./s3/idol.js";
import { collageSchema } from "./schema/collage.js";
import { drawCollage } from "./image/collage.js";
import { albumSchema } from "./schema/album.js";
import { drawAlbum } from "./image/album.js";

const app = express().use(express.json());

await mkdir("./assets/cards", { recursive: true });
await mkdir("./assets/idols", { recursive: true });
await mkdir("./assets/prefabs", { recursive: true });
await mkdir("./assets/groups", { recursive: true });
await mkdir("./assets/frames", { recursive: true });
await mkdir("./assets/stickers", { recursive: true });
await mkdir("./assets/tmp", { recursive: true });

app.get("/health", async (_, response) => response.status(204).send());

app.post("/album", route(albumSchema, drawAlbum));
app.post("/card", route(cardSchema, drawCard));
app.post("/drop", route(dropSchema, drawDrop));
app.post("/dye", route(dyeSchema, drawDye));
app.post("/collage", route(collageSchema, drawCollage));

app.patch("/prefabs/:id", routePatch(getIdol));
app.patch("/groups/:id", routePatch(getGroup));
app.patch("/frames/:id", routePatch(getFrame));
app.patch("/stickers/:id", routePatch(getSticker));

const port = parseInt(process.env.PORT || "3000", 10);
app.listen(port, () => {
  console.log(`zephyr-images listening on port ${port}`);
});
