import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF!,
  runtime: "node",
  maxDuration: 3600,
  logLevel: "log",
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },
  dirs: ["./trigger"],
});
