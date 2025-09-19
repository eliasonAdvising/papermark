import type { AppProps, AppContext } from "next/app";
import { Inter } from "next/font/google";
import Head from "next/head";

import { TeamProvider } from "@/context/team-context";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import PlausibleProvider from "next-plausible";
import { NuqsAdapter } from "nuqs/adapters/next/pages";

import { EXCLUDED_PATHS } from "@/lib/constants";

import { PostHogCustomProvider } from "@/components/providers/posthog-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getToken } from 'next-auth/jwt'; // Add this import for getToken

import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function App({
  Component,
  pageProps: { session, ...pageProps },
  router,
}: AppProps<{ session: Session }>) {
  console.log('App: Page Props Session', session);
  return (
    <>
      <Head>
        <title>Papermark | The Open Source DocSend Alternative</title>
        <meta name="theme-color" content="#000000" />
        <meta
          name="description"
          content="Papermark is an open-source document sharing alternative to DocSend with built-in analytics."
          key="description"
        />
        <meta
          property="og:title"
          content="Papermark | The Open Source DocSend Alternative"
          key="og-title"
        />
        <meta
          property="og:description"
          content="Papermark is an open-source document sharing alternative to DocSend with built-in analytics."
          key="og-description"
        />
        <meta
          property="og:image"
          content="https://www.papermark.com/_static/meta-image.png"
          key="og-image"
        />
        <meta
          property="og:url"
          content="https://www.papermark.com"
          key="og-url"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@papermarkio" />
        <meta name="twitter:creator" content="@papermarkio" />
        <meta name="twitter:title" content="Papermark" key="tw-title" />
        <meta
          name="twitter:description"
          content="Papermark is an open-source document sharing alternative to DocSend with built-in analytics."
          key="tw-description"
        />
        <meta
          name="twitter:image"
          content="https://www.papermark.com/_static/meta-image.png"
          key="tw-image"
        />
        <link rel="icon" href="/favicon.ico" key="favicon" />
      </Head>
      <SessionProvider session={session}>
        <PostHogCustomProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <PlausibleProvider
              domain="papermark.io"
              enabled={process.env.NEXT_PUBLIC_VERCEL_ENV === "production"}
            >
              <NuqsAdapter>
                <main className={inter.className}>
                  <Toaster closeButton />
                  <TooltipProvider delayDuration={100}>
                    {EXCLUDED_PATHS.includes(router.pathname) ? (
                      <Component {...pageProps} />
                    ) : (
                      <TeamProvider>
                        <Component {...pageProps} />
                      </TeamProvider>
                    )}
                  </TooltipProvider>
                </main>
              </NuqsAdapter>
            </PlausibleProvider>
          </ThemeProvider>
        </PostHogCustomProvider>
      </SessionProvider>
    </>
  );
}

App.getInitialProps = async ({ ctx }: AppContext) => {
  try {
    const token = await getToken({
      req: ctx.req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    console.log('App: Server Token', {
      token,
      nextauthUrl: process.env.NEXTAUTH_URL,
      nextauthSecret: !!process.env.NEXTAUTH_SECRET,
    });
    return {
      pageProps: {
        session: token,
      },
    };
  } catch (error) {
    console.error('App: getToken Error', error);
    return {
      pageProps: {
        session: null,
      },
    };
  }
};
