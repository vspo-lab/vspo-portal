// eslint-disable-next-line no-restricted-imports
import type { CSSProperties } from "@mui/material/styles/createMixins";
import type { DeepPartial } from "./deep-partial";
// biome-ignore lint: Required for MUI theme CSS vars type augmentation
import type {} from "@mui/material/themeCssVarsAugmentation";

interface CustomPalette {
  customColors: {
    vspoPurple: string;
    darkBlue: string;
    gray: string;
    darkGray: string;
    videoHighlight: {
      live: string;
      upcoming: string;
      trending: string;
    };
  };
}

declare module "@mui/material/styles" {
  interface Mixins {
    scrollbar: CSSProperties;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Palette extends CustomPalette {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface PaletteOptions extends DeepPartial<CustomPalette> {}
}
