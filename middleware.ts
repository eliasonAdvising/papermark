import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

import AppMiddleware from "@/lib/middleware/app";
import DomainMiddleware from "@/lib/middleware/domain";

import { BLOCKED_PATHNAMES } from "./lib/constants";
import IncomingWebhookMiddleware, {
  isWebhookPath,
} from "./lib/middleware/incoming-webhooks";
import PostHogMiddleware from "./lib/middleware/posthog";

function isAnalyticsPath(path: string) {
  // Create a regular expression
  // ^ - asserts position at start of the line
  // /ingest/ - matches the literal string "/ingest/"
  // .* - matches any character (except for line terminators) 0 or more times
  const pattern = /^\/ingest\/.*/;

  return pattern.test(path);
}

function isCustomDomain(host: string) {
  // In development, only treat .local and papermark.dev as custom domains
  if (process.env.NODE_ENV === "development") {
    const result = host?.includes(".local") || host?.includes("papermark.dev");
    console.log(`[DEBUG] Development mode - isCustomDomain(${host}): ${result}`);
    return result;
  }

  // In production, check if this is a legitimate app domain
  const authUrl = process.env.NEXTAUTH_URL;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  console.log(`[DEBUG] Environment variables - NEXTAUTH_URL: ${authUrl}, NEXT_PUBLIC_BASE_URL: ${baseUrl}`);

  // Get list of legitimate app hostnames
  const legitimateHosts = [];
  if (authUrl) legitimateHosts.push(new URL(authUrl).hostname);
  if (baseUrl) legitimateHosts.push(new URL(baseUrl).hostname);
  console.log(`[DEBUG] Legitimate hosts: ${JSON.stringify(legitimateHosts)}`);

  // Known papermark domains and vercel apps are legitimate
  const isLegitimate = host?.includes("localhost") ||
                      host?.includes("papermark.io") ||
                      host?.includes("papermark.com") ||
                      host?.endsWith(".vercel.app") ||
                      legitimateHosts.includes(host || "");

  console.log(`[DEBUG] Host "${host}" isLegitimate: ${isLegitimate}`);

  // Return true for custom domains (NOT legitimate app domains)
  const result = !isLegitimate;
  console.log(`[DEBUG] Final isCustomDomain result: ${result}`);
  return result;
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/ routes
     * 2. /_next/ (Next.js internals)
     * 3. /_static (inside /public)
     * 4. /_vercel (Vercel internals)
     * 5. /favicon.ico, /sitemap.xml (static files)
     */
    "/((?!api/|_next/|_static|vendor|_icons|_vercel|favicon.ico|sitemap.xml).*)",
  ],
};

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const path = req.nextUrl.pathname;
  const host = req.headers.get("host");

  // Debug logging
  console.log(`[MIDDLEWARE DEBUG] Host: ${host}, Path: ${path}`);

  if (isAnalyticsPath(path)) {
    console.log(`[MIDDLEWARE DEBUG] Analytics path - routing to PostHogMiddleware`);
    return PostHogMiddleware(req);
  }

  // Handle incoming webhooks
  if (isWebhookPath(host, path)) {
    console.log(`[MIDDLEWARE DEBUG] Webhook path - routing to IncomingWebhookMiddleware`);
    return IncomingWebhookMiddleware(req);
  }

  // For custom domains, we need to handle them differently
  const isCustomDom = isCustomDomain(host || "");
  console.log(`[MIDDLEWARE DEBUG] isCustomDomain(${host}): ${isCustomDom}`);

  if (isCustomDom) {
    console.log(`[MIDDLEWARE DEBUG] Custom domain detected - routing to DomainMiddleware`);
    return DomainMiddleware(req);
  }

  // Handle standard papermark.io paths
  if (
    !path.startsWith("/view/") &&
    !path.startsWith("/verify") &&
    !path.startsWith("/unsubscribe")
  ) {
    console.log(`[MIDDLEWARE DEBUG] Standard app path - routing to AppMiddleware`);
    return AppMiddleware(req);
  }

  // Check for blocked pathnames in view routes
  if (
    path.startsWith("/view/") &&
    (BLOCKED_PATHNAMES.some((blockedPath) => path.includes(blockedPath)) ||
      path.includes("."))
  ) {
    console.log(`[MIDDLEWARE DEBUG] Blocked view path - returning 404`);
    const url = req.nextUrl.clone();
    url.pathname = "/404";
    return NextResponse.rewrite(url, { status: 404 });
  }

  console.log(`[MIDDLEWARE DEBUG] No middleware match - continuing to next`);
  return NextResponse.next();
}
