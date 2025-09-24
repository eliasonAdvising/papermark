import { NextRequest, NextResponse } from "next/server";

export default async function IncomingWebhookMiddleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Only handle /services/* paths
  if (path.startsWith("/services/")) {
    // Rewrite to /api/webhooks/services/*
    url.pathname = `/api/webhooks${path}`;

    return NextResponse.rewrite(url);
  }

  // Return 404 for all other paths
  url.pathname = "/404";
  return NextResponse.rewrite(url, { status: 404 });
}

export function isWebhookPath(host: string | null, path?: string) {
  console.log(`[DEBUG WEBHOOK] Checking webhook path - Host: ${host}, WebhookHost: ${process.env.NEXT_PUBLIC_WEBHOOK_BASE_HOST}, Path: ${path}`);

  if (!process.env.NEXT_PUBLIC_WEBHOOK_BASE_HOST) {
    console.log(`[DEBUG WEBHOOK] No WEBHOOK_BASE_HOST set, returning false`);
    return false;
  }

  // Only treat as webhook if it's the webhook host AND has a /services/ path
  const isWebhookHost = host === process.env.NEXT_PUBLIC_WEBHOOK_BASE_HOST;
  const isWebhookPath = path?.startsWith("/services/") || false;
  const result = isWebhookHost && isWebhookPath;

  console.log(`[DEBUG WEBHOOK] isWebhookHost: ${isWebhookHost}, isWebhookPath: ${isWebhookPath}, result: ${result}`);

  return result;
}
