import Link from "next/link";

import { useEffect } from "react";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { type UIMessage } from "ai";
import { getServerSession } from "next-auth";
import { usePlausible } from "next-plausible";

import { Chat } from "@/components/chat/chat";
import Sparkle from "@/components/shared/icons/sparkle";
import { Button } from "@/components/ui/button";

import { getFile } from "@/lib/files/get-file";
import prisma from "@/lib/prisma";
import { usePlan } from "@/lib/swr/use-billing";
import { CustomUser } from "@/lib/types";

// Simplified - just get the link ID from params, everything else happens client-side
export const getServerSideProps = async (context: any) => {
  const { linkId } = context.params;

  // Just pass the link ID, all authentication and data fetching happens client-side
  return {
    props: {
      linkId,
    },
  };
};

export default function ChatPage({
  linkId,
}: {
  linkId: string;
}) {
  const { plan } = usePlan();
  const plausible = usePlausible();

  useEffect(() => {
    plausible("assistantViewedFromLink", { props: { linkId: linkId } });
  }, [linkId, plausible]);

  // All data will be fetched client-side by the Chat component
  return (
    <>
      <Nav linkId={linkId} />
      <Chat
        initialMessages={[]}
        threadId=""
        firstPage=""
        userId=""
        plan={plan}
      />
    </>
  );
}

function Nav({ linkId }: { linkId: string }) {
  return (
    <nav className="fixed inset-x-0 top-0 z-10 bg-black">
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex flex-shrink-0 items-center gap-x-2">
              <p className="text-2xl font-bold tracking-tighter text-white">
                Papermark
              </p>
              <Sparkle className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <Link href={`/view/${linkId}`}>
              <Button variant="secondary">Back to document</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
