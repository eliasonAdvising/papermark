import { BasePlan } from "../swr/use-billing";
import { getConversionQueueByPlan } from "../trigger/queues";

// In v4, we return the queue name since triggers expect string for queue parameter
export const conversionQueue = (plan: string) => {
  const queue = getConversionQueueByPlan(plan);
  return queue.name;
};
