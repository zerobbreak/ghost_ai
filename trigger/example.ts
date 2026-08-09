import { task, logger } from "@trigger.dev/sdk";

export const helloWorldTask = task({
  id: "hello-world",
  run: async (payload: { message: string }) => {
    logger.log("Hello, World!", { message: payload.message });
    return { success: true, message: payload.message };
  },
});
