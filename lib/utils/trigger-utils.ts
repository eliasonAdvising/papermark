import { BasePlan } from "../swr/use-billing";

// In v4, we just return the queue name since queues are pre-defined
export const conversionQueue = (plan: string): string => {
  const planName = plan.split("+")[0] as BasePlan;
  return `conversion-${planName}`;
};
