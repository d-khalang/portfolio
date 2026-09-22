import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/portfolio/",
  server: {
    watch: {
      // Browser profiles and traces are diagnostic output, not application inputs.
      ignored: ["**/.cache/journey-perf/**"],
    },
  },
});
