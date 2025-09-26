
import { createClient } from ' @ai-sdk/provider';
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
