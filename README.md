# zephyr-images

Where the magic happens. This is the service responsible for generating all of Zephyr's images.

## Requirements

- A computer with [FFmpeg (ideally 6.0.1)](https://ffmpeg.org/download.html), [pnpm](https://pnpm.io/), and [Docker](https://www.docker.com/).
- An IDE with Intellisense and syntax highlighting is recommended, such as [Visual Studio Code](https://code.visualstudio.com/).
- You will need to seed the 'cache' directories in the `assets` folder with your own images. The directories will be automatically created when the program first runs.

### Building

To build the container, simply run `./build.sh` or `powershell ./build.ps1` depending on your platform.

## Contributing

Contributions are welcomed! Please feel free to submit a pull request for any changes or improvements.

If you have questions or need help, don't hesitate to open an issue or join the development channels in the [Zephyr Labs](https://discord.gg/zephyrlabs) Discord.

## License

This repository is licensed under the [GPL-3 license](https://opensource.org/license/gpl-3-0/). Please read [the license file](LICENSE) for more information. [In short](https://www.tldrlegal.com/license/gnu-general-public-license-v3-gpl-3), you are free to modify or distribute this code as long as you state your changes, disclose the source code (this repository), and license your fork under the GPL-3 license as well.

## FAQ

**What is FFmpeg? Why don't you use `node-canvas`?**\
FFmpeg is the industry-standard Swiss Army knife of image, video, and audio manipulation. [Almost anything involving video on the internet](https://twitter.com/FFmpeg/status/1710440696941809868), from YouTube to Instagram to Netflix, runs on FFmpeg. Benchmarks for our use case have shown that FFmpeg can support a greater throughput and faster generation times, alongside being a language agnostic solution. It also contains a much wider variety of useful filters compared to `node-canvas`.

## Projects that use zephyr-images

[Zephyr](https://zephyr.bot) - Next-generation K-pop card game
