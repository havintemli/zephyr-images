declare module "zephyr-images" {
  type Inputs = {
    frame?: {
      index: number;
      id: number | undefined;
    };
    dye?: {
      index: number;
    };
    prefab?: {
      index: number;
    };
    idol?: {
      index: number;
    };
    overlay?: {
      index: number;
    };
    stickers?: Array<{
      index: number;
      id: number;
      rotation: number;
      posX: number;
      posY: number;
      scale: number;
      isFlipped: boolean;
    }>;
    logo?: {
      index: number;
    };
  };

  type RGB = {
    r: number;
    g: number;
    b: number;
  };

  type CardData = import("zod").z.infer<
    typeof import("../src/schema/card.js").cardSchema
  >;
  type DropData = import("zod").z.infer<
    typeof import("../src/schema/drop.js").dropSchema
  >;
  type DyeData = import("zod").z.infer<
    typeof import("../src/schema/dye.js").dyeSchema
  >;
  type CollageData = import("zod").z.infer<
    typeof import("../src/schema/collage.js").collageSchema
  >;
}
