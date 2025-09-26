"use client";

import { useEffect, useState } from "react";

import { type UIMessage } from "ai";
import { useChat } from " @ai-sdk/react";

import { BasePlan } from "@/lib/swr/use-billing";
import { cn } from "@/lib/utils";
import { DefaultChatTransport } from "@/lib/utils/transport";

import { ChatInput } from "./chat-input";
import { ChatList } from "./chat-list";
import { ChatScrollAnchor } from "./chat-scroll-anchor";
import { EmptyScreen } from "./empty-screen";

export interface ChatProps extends React.ComponentProps<"div"> {
  initialMessages: UIMessage[];
  threadId?: string;
  firstPage?: string;
  isPublic?: boolean;
  userId?: string;
  plan?: BasePlan | null;
}

export function Chat({
  initialMessages,
  threadId,
  firstPage,
  className,
  isPublic,
  userId,
  plan,
}: ChatProps) {
  const [input, setInput] = useState("");

  const {
    isLoading,
    messages: hookMessages,
    handleInputChange,
    handleSubmit,
    error,
  } = useChat({
    transport: DefaultChatTransport({
      api: "/api/assistants/chat",
      body: {
        isPublic: isPublic,
        userId: userId,
        plan: plan,
        threadId: threadId,
      },
    }),
    initialMessages,
    sendAutomaticallyWhen: "toolFinished",
  });

  // Map isLoading to status for compatibility
  const status = isLoading ? "in_progress" : "awaiting_message";

  // Create submitMessage function to wrap handleSubmit for compatibility
  const submitMessage = async (e: any) => {
    e.preventDefault();
    handleSubmit(e);
  };

  const [combinedMessages, setCombinedMessages] = useState<UIMessage[]>([]);

  useEffect(() => {
    if (error instanceof Error) {
      let content: string = "";
      if (isPublic) {
        content =
          "You have reached your request limit for the day. Sign up for a free account to continue using Papermark Assistant.";
      }
      if (userId && plan !== "pro") {
        content =
          "You have reached your request limit for the day. Upgrade to a paid account to continue using Papermark Assistant.";
      }

      const message: Message = {
        role: "system",
        content: content,
        id: nanoid(),
      };

      setCombinedMessages((prev) => [...prev, message]);
    }
  }, [error]);

  useEffect(() => {
    // Concatenate existing messages with messages from the hook
    // and reverse the order so that the newest messages are at the bottom:
    const reversedMessages = [...initialMessages].reverse();
    setCombinedMessages([...reversedMessages, ...hookMessages]);
  }, [initialMessages, hookMessages]);

  // isLoading is provided by useChat hook

  return (
    <>
      <div
        className={cn(
          "relative h-[calc(100vh-96px)] overflow-y-auto pb-[20px] pt-24",
          className,
        )}
      >
        {combinedMessages.length ? (
          <>
            <ChatList messages={combinedMessages} status={status} />
            {!isPublic ? (
              <ChatScrollAnchor trackVisibility={isLoading} />
            ) : null}
          </>
        ) : (
          <EmptyScreen
            firstPage={firstPage}
            handleInputChange={handleInputChange}
            setInput={setInput}
          />
        )}
      </div>
      <ChatInput
        status={status}
        error={error}
        messages={combinedMessages}
        input={input}
        setInput={setInput}
        submitMessage={submitMessage}
        handleInputChange={handleInputChange}
      />
    </>
  );
}
