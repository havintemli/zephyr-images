import { createClient } from "redis";

export const redis = createClient({
  url: `redis://${process.env.REDIS_HOST || "localhost"}:${
    process.env.REDIS_PORT || "6379"
  }`,
});

redis.on("error", (error) => console.error(error));

await redis.connect();
