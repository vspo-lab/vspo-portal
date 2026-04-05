import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["cjs", "esm"],
  treeshake: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  bundle: true,
});