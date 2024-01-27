FROM node:18.12.1-alpine AS base

RUN wget https://www.johnvansickle.com/ffmpeg/old-releases/ffmpeg-6.0.1-i686-static.tar.xz
RUN tar xvf ffmpeg-6.0.1-i686-static.tar.xz
RUN mv ffmpeg-*-i686-static/ffmpeg ffmpeg-*-i686-static/ffprobe /usr/local/bin

WORKDIR /zephyr-images

RUN npm install -g pnpm

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY .env ./
RUN pnpm install

COPY src ./src
COPY types ./types
COPY assets ./assets
COPY tsconfig.json ./

RUN pnpm build
CMD pnpm start