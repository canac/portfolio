import { defineConfig } from "astro/config";
import resumePdf from "./src/integrations/resume-pdf.ts";

export default defineConfig({
  site: "https://calebcox.dev",
  output: "static",
  integrations: [resumePdf()],
  server: {
    port: Number(process.env.PORT) || undefined,
  },
  build: {
    format: "file",
  },
});
