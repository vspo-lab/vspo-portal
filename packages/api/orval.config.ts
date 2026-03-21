import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "../../service/server/docs/openapi.json",
    output: {
      target: "./src/gen/openapi.ts",
      httpClient: "axios",
    },
  },
});
