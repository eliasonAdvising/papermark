import { logger, task } from "@trigger.dev/sdk";

export const testDeploymentTask = task({
  id: "test-deployment",
  run: async (payload: { message: string }) => {
    logger.info("Test deployment task running", { payload });
    return { success: true, message: "Deployment test successful" };
  },
});