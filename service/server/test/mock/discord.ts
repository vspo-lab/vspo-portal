import type { DiscordEmbed } from "@discordeno/types";
import { vi } from "vitest";

export type MockResponse =
  | {
      body: Record<string, unknown>;
      status: number;
    }
  | Error;

export type TestCase<T> = {
  name: string;
  mockResponses: MockResponse[];
  expectedError?: string;
  expectedResult?: T;
};

// Mock responses
export const mockDiscordResponses = {
  validMessage: {
    id: "message_id_1",
    content: "Test message",
    author: {
      bot: true,
      id: "bot_id_1",
    },
    embeds: [
      {
        title: "Test Embed",
        url: "https://example.com",
        color: 0x00ff00,
        image: {
          url: "https://example.com/image.jpg",
        },
        fields: [
          {
            value: "2024-01-01T00:00:00Z",
          },
        ],
      },
    ],
  },
  validChannel: {
    id: "channel_id_1",
    name: "test-channel",
  },
  validMessages: {
    body: [
      {
        id: "message_id_1",
        content: "Test message 1",
        author: {
          bot: true,
          id: "bot_id_1",
        },
        embeds: [],
      },
      {
        id: "message_id_2",
        content: "Test message 2",
        author: {
          bot: true,
          id: "bot_id_1",
        },
        embeds: [],
      },
    ],
    status: 200,
  },
  networkError: new Error("Network error"),
};

// Mock Discord client
export const mockDiscordClient = {
  rest: {
    sendMessage: vi
      .fn()
      .mockImplementation(
        async (
          channelId: string,
          { content, embeds }: { content?: string; embeds?: DiscordEmbed[] },
        ) => {
          if (channelId === "error_channel") {
            throw mockDiscordResponses.networkError;
          }
          return mockDiscordResponses.validMessage;
        },
      ),

    getChannel: vi.fn().mockImplementation(async (channelId: string) => {
      if (channelId === "error_channel") {
        throw mockDiscordResponses.networkError;
      }
      return mockDiscordResponses.validChannel;
    }),

    editMessage: vi
      .fn()
      .mockImplementation(
        async (
          channelId: string,
          messageId: string,
          { content, embeds }: { content?: string; embeds?: DiscordEmbed[] },
        ) => {
          if (channelId === "error_channel" || messageId === "error_message") {
            throw mockDiscordResponses.networkError;
          }
          return mockDiscordResponses.validMessage;
        },
      ),

    getMessage: vi
      .fn()
      .mockImplementation(async (channelId: string, messageId: string) => {
        if (channelId === "error_channel" || messageId === "error_message") {
          throw mockDiscordResponses.networkError;
        }
        return mockDiscordResponses.validMessage;
      }),

    getMessages: vi
      .fn()
      .mockImplementation(
        async (channelId: string, _query: { limit: number }) => {
          if (channelId === "error_channel") {
            throw mockDiscordResponses.networkError;
          }
          return mockDiscordResponses.validMessages.body;
        },
      ),

    deleteMessage: vi
      .fn()
      .mockImplementation(async (channelId: string, messageId: string) => {
        if (channelId === "error_channel" || messageId === "error_message") {
          throw mockDiscordResponses.networkError;
        }
        return true;
      }),
  },
};
