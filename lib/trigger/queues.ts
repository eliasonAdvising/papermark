import { queue } from "@trigger.dev/sdk";

// Define queues for different concurrency requirements
export const conversionQueue = queue({
  name: "file-conversion",
  concurrencyLimit: 10,
});

export const cadConversionQueue = queue({
  name: "cad-conversion",
  concurrencyLimit: 2,
});

// Plan-based queues for different billing tiers
export const freeConversionQueue = queue({
  name: "conversion-free",
  concurrencyLimit: 1,
});

export const starterConversionQueue = queue({
  name: "conversion-starter",
  concurrencyLimit: 1,
});

export const proConversionQueue = queue({
  name: "conversion-pro",
  concurrencyLimit: 2,
});

export const businessConversionQueue = queue({
  name: "conversion-business",
  concurrencyLimit: 10,
});

export const dataroomsConversionQueue = queue({
  name: "conversion-datarooms",
  concurrencyLimit: 10,
});

export const dataroomsPlusConversionQueue = queue({
  name: "conversion-datarooms-plus",
  concurrencyLimit: 10,
});

// Helper function to get queue by plan name
export function getConversionQueueByPlan(plan: string) {
  const planName = plan.split("+")[0];

  switch (planName) {
    case "free":
      return freeConversionQueue;
    case "starter":
      return starterConversionQueue;
    case "pro":
      return proConversionQueue;
    case "business":
      return businessConversionQueue;
    case "datarooms":
      return dataroomsConversionQueue;
    case "datarooms-plus":
      return dataroomsPlusConversionQueue;
    default:
      return freeConversionQueue;
  }
}