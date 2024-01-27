import { RGB } from "zephyr-images";

export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i.exec(hex);

  if (result === null) throw new Error(`'${hex}' is not a valid hex code.`);

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}
