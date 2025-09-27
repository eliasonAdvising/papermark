import { tenant } from "@teamhanko/passkeys-next-auth-provider";

// Lazy initialization to avoid build-time errors when env vars are missing
let hanko: ReturnType<typeof tenant> | null = null;

const getHanko = () => {
  if (hanko) {
    return hanko;
  }

  if (!process.env.HANKO_API_KEY || !process.env.NEXT_PUBLIC_HANKO_TENANT_ID) {
    // These need to be set in .env.local
    // You get them from the Passkey API itself, e.g. when first setting up the server.
    throw new Error(
      "Please set HANKO_API_KEY and NEXT_PUBLIC_HANKO_TENANT_ID in your .env.local file.",
    );
  }

  hanko = tenant({
    apiKey: process.env.HANKO_API_KEY!,
    tenantId: process.env.NEXT_PUBLIC_HANKO_TENANT_ID!,
  });

  return hanko;
};

// For development/build environments where Hanko env vars might not be set
const hankoInstance = (() => {
  try {
    return getHanko();
  } catch (error) {
    console.warn("Hanko initialization failed during build:", error);
    // Return a stub object for build-time compatibility
    return null;
  }
})();

export default hankoInstance;
