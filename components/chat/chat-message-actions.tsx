"use client";

import { type UIMessage } from "ai";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { useCopyToClipboard } from "@/lib/utils/use-copy-to-clipboard";

import Check from "../shared/icons/check";
import Copy from "../shared/icons/copy";

interface ChatMessageActionsProps extends React.ComponentProps<"div"> {
  message: UIMessage;
}

// Helper function to extract text content from UIMessage in AI SDK v5
const getMessageContent = (message: UIMessage): string => {
  // In AI SDK v5, message content is in the parts array
  return message.parts?.map(part =>
    part.type === 'text' ? part.text : ''
  ).join('') || '';
};

export function ChatMessageActions({
  message,
  className,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(getMessageContent(message));
  };

  return (
    <div
      className={cn(
        "flex items-center justify-end md:absolute md:-top-2 md:right-0 md:hidden",
        className,
      )}
      {...props}
    >
      <Button variant="ghost" size="icon" onClick={onCopy}>
        {isCopied ? <Check /> : <Copy />}
        <span className="sr-only">Copy message</span>
      </Button>
    </div>
  );
}
