import { BasePlan } from "../swr/use-billing";
import { getConversionQueueByPlan } from "../trigger/queues";

// In v4, we return the actual queue object since queues are pre-defined
export const conversionQueue = (plan: string) => {
  return getConversionQueueByPlan(plan);
};
