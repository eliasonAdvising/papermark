// This file is deprecated and not compatible with AI SDK v5
// The DefaultChatTransport functionality has been removed from the AI SDK
// Custom transports are no longer supported in AI SDK v5

/*
import { createClient } from '@ai-sdk/provider';
import { createChatRequest } from 'ai';

export function DefaultChatTransport(options) {
  const { apiKey, api, ...rest } = options;
  const provider = createClient({
    ...rest,
    headers: () => ({
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    }),
  });

  return async ({ messages, ...restApiData }) => {
    const chatRequest = createChatRequest({
      ...restApiData,
      messages,
    });

    const { body, ...restOfResponse } = await provider(chatRequest, {
      fetch: {
        body: JSON.stringify({
          ...chatRequest,
          ...options.body,
        }),
        method: 'POST',
        url: api,
      },
    });

    return {
      ...restOfResponse,
      body,
    };
  };
}
*/