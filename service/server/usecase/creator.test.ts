import { beforeEach, describe, expect, it } from "vitest";
import type { Creators } from "../domain/creator";
import { MemberTypeSchema, createCreators } from "../domain/creator";
import { TargetLangSchema } from "../domain/translate";
import type { IAppContext } from "../infra/dependency";
import { createUUID } from "../pkg/uuid";
import { setupTxManager } from "../test/setup";
import { type ICreatorInteractor, createCreatorInteractor } from "./creator";

describe.concurrent("CreatorInteractor", () => {
  let context: IAppContext;
  let interactor: ICreatorInteractor;

  beforeEach(async () => {
    context = await setupTxManager();
    interactor = createCreatorInteractor(context);
  });

  describe.concurrent("searchByChannelIds", () => {
    interface TestCase {
      name: string;
      input: {
        channel: {
          id: string;
          memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "general";
        }[];
      };
      expectedError?: string;
    }

    const testCases: TestCase[] = [
      {
        name: "should search creators by channel ids successfully",
        input: {
          channel: [{ id: "channel-1", memberType: "vspo_jp" }],
        },
      },
      {
        name: "should handle empty channel list",
        input: {
          channel: [],
        },
      },
    ];

    for (const tc of testCases) {
      it.concurrent(tc.name, async () => {
        const result = await interactor.searchByChannelIds(tc.input);

        if (tc.expectedError) {
          expect(result.err).toBeTruthy();
          if (result.err) {
            expect(result.err.message).toContain(tc.expectedError);
          }
        } else {
          expect(result.err).toBeFalsy();
          if (!result.err) {
            expect(Array.isArray(result.val)).toBeTruthy();
          }
        }
      });
    }
  });

  describe.concurrent("searchByMemberType", () => {
    interface TestCase {
      name: string;
      input: {
        memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "general";
      };
      expectedError?: string;
      expectedLength?: number;
    }

    const testCases: TestCase[] = [
      {
        name: "should search creators by vspo_jp member type",
        input: { memberType: "vspo_jp" },
        expectedLength: 0,
      },
      {
        name: "should search creators by vspo_en member type",
        input: { memberType: "vspo_en" },
        expectedLength: 0,
      },
      {
        name: "should search creators by vspo_ch member type",
        input: { memberType: "vspo_ch" },
        expectedLength: 0,
      },
      {
        name: "should search creators by general member type",
        input: { memberType: "general" },
        expectedLength: 0,
      },
    ];

    for (const tc of testCases) {
      it.concurrent(tc.name, async () => {
        const result = await interactor.searchByMemberType(tc.input);

        if (tc.expectedError) {
          expect(result.err).toBeTruthy();
          if (result.err) {
            expect(result.err.message).toContain(tc.expectedError);
          }
        } else {
          expect(result.err).toBeFalsy();
          if (!result.err) {
            expect(Array.isArray(result.val)).toBeTruthy();
            if (tc.expectedLength !== undefined) {
              expect(result.val).toHaveLength(tc.expectedLength);
            }
          }
        }
      });
    }
  });

  describe.concurrent("batchUpsert", () => {
    it.concurrent("should upsert a single creator successfully", async () => {
      // Create test creator data
      const creatorId = createUUID();
      const testCreators = createCreators([
        {
          id: creatorId,
          name: "Test Creator",
          languageCode: "default",
          memberType: MemberTypeSchema.Enum.vspo_jp,
          thumbnailURL: "https://example.com/thumbnail.jpg",
          channel: {
            id: createUUID(),
            creatorID: creatorId,
            youtube: {
              rawId: "test-youtube-channel-id",
              name: "Test YouTube Channel",
              description: "Test YouTube channel description",
              thumbnailURL: "https://example.com/youtube-thumbnail.jpg",
              publishedAt: new Date().toISOString(),
              subscriberCount: 1000,
            },
            twitch: null,
            twitCasting: null,
            niconico: null,
            bilibili: null,
          },
        },
      ]);

      // Call batchUpsert
      const result = await interactor.batchUpsert(testCreators);

      // Verify result
      expect(result.err).toBeFalsy();
      if (result.err) return;

      // Check returned creators
      expect(Array.isArray(result.val)).toBeTruthy();
      expect(result.val.length).toBe(1);

      // Verify creator data is returned correctly
      const upsertedCreator = result.val[0];
      expect(upsertedCreator.id).toBe(creatorId);
      expect(upsertedCreator.name).toBe("Test Creator");
      expect(upsertedCreator.memberType).toBe(MemberTypeSchema.Enum.vspo_jp);
    });

    it.concurrent("should update an existing creator", async () => {
      // First create a creator
      const creatorId = createUUID();
      const originalCreators = createCreators([
        {
          id: creatorId,
          name: "Original Creator",
          languageCode: "default",
          memberType: MemberTypeSchema.Enum.vspo_jp,
          thumbnailURL: "https://example.com/original-thumbnail.jpg",
          channel: {
            id: createUUID(),
            creatorID: creatorId,
            youtube: {
              rawId: "original-youtube-channel-id",
              name: "Original YouTube Channel",
              description: "Original YouTube channel description",
              thumbnailURL: "https://example.com/original-thumbnail.jpg",
              publishedAt: new Date().toISOString(),
              subscriberCount: 1000,
            },
            twitch: null,
            twitCasting: null,
            niconico: null,
            bilibili: null,
          },
        },
      ]);

      // Insert the original creator
      const originalResult = await interactor.batchUpsert(originalCreators);

      expect(originalResult.err).toBeFalsy();
      if (originalResult.err) return;

      // Now create an updated version with the same id but different data
      const updatedCreators = createCreators([
        {
          id: creatorId,
          name: "Updated Creator",
          languageCode: "default",
          memberType: MemberTypeSchema.Enum.vspo_jp,
          thumbnailURL: "https://example.com/updated-thumbnail.jpg",
          channel: {
            id: originalCreators[0].channel?.id || createUUID(),
            creatorID: creatorId,
            youtube: {
              rawId: "original-youtube-channel-id", // Same channel ID
              name: "Updated YouTube Channel",
              description: "Updated YouTube channel description",
              thumbnailURL: "https://example.com/updated-thumbnail.jpg",
              publishedAt: new Date().toISOString(),
              subscriberCount: 2000, // Updated subscriber count
            },
            twitch: null,
            twitCasting: null,
            niconico: null,
            bilibili: null,
          },
        },
      ]);

      // Update the creator
      const updateResult = await interactor.batchUpsert(updatedCreators);

      expect(updateResult.err).toBeFalsy();
      if (updateResult.err) return;

      // Verify the update was successful
      expect(updateResult.val.length).toBe(1);

      // Verify the creator was updated - in this implementation it returns just what we sent in
      const updatedCreator = updateResult.val[0];
      expect(updatedCreator.id).toBe(creatorId);
      expect(updatedCreator.name).toBe("Updated Creator");
      expect(updatedCreator.thumbnailURL).toBe(
        "https://example.com/updated-thumbnail.jpg",
      );
    });

    it.concurrent(
      "should handle multiple creators in a single batch",
      async () => {
        // Create test creators with different platforms
        const creatorIds = [createUUID(), createUUID()];
        const testCreators = createCreators([
          {
            id: creatorIds[0],
            name: "YouTube Creator",
            languageCode: "default",
            memberType: MemberTypeSchema.Enum.vspo_jp,
            thumbnailURL: "https://example.com/youtube-thumbnail.jpg",
            channel: {
              id: createUUID(),
              creatorID: creatorIds[0],
              youtube: {
                rawId: "youtube-channel-id",
                name: "YouTube Channel",
                description: "YouTube channel description",
                thumbnailURL: "https://example.com/youtube-thumbnail.jpg",
                publishedAt: new Date().toISOString(),
                subscriberCount: 1000,
              },
              twitch: null,
              twitCasting: null,
              niconico: null,
              bilibili: null,
            },
          },
          {
            id: creatorIds[1],
            name: "Twitch Creator",
            languageCode: "default",
            memberType: MemberTypeSchema.Enum.vspo_en,
            thumbnailURL: "https://example.com/twitch-thumbnail.jpg",
            channel: {
              id: createUUID(),
              creatorID: creatorIds[1],
              youtube: null,
              twitch: {
                rawId: "twitch-channel-id",
                name: "Twitch Channel",
                description: "Twitch channel description",
                thumbnailURL: "https://example.com/twitch-thumbnail.jpg",
                publishedAt: new Date().toISOString(),
                subscriberCount: 2000,
              },
              twitCasting: null,
              niconico: null,
              bilibili: null,
            },
          },
        ]);

        // Call batchUpsert with multiple creators
        const result = await interactor.batchUpsert(testCreators);

        // Verify result
        expect(result.err).toBeFalsy();
        if (result.err) return;

        // Check returned creators
        expect(Array.isArray(result.val)).toBeTruthy();
        expect(result.val.length).toBe(2);

        // Verify both types are in the result
        const youtubeCreator = result.val.find((c) => c.id === creatorIds[0]);
        const twitchCreator = result.val.find((c) => c.id === creatorIds[1]);

        expect(youtubeCreator).toBeDefined();
        expect(twitchCreator).toBeDefined();

        if (youtubeCreator && twitchCreator) {
          expect(youtubeCreator.name).toBe("YouTube Creator");
          expect(twitchCreator.name).toBe("Twitch Creator");
        }
      },
    );

    it.concurrent("should handle creator translations", async () => {
      // Create a creator with multiple translations
      const creatorId = createUUID();
      const channelId = createUUID();

      // Create all versions in one array (default, English, and Japanese translations)
      const testCreators = createCreators([
        {
          id: creatorId,
          name: "Default Name",
          languageCode: "default",
          memberType: MemberTypeSchema.Enum.vspo_jp,
          thumbnailURL: "https://example.com/thumbnail.jpg",
          channel: {
            id: channelId,
            creatorID: creatorId,
            youtube: {
              rawId: "translation-channel-id",
              name: "YouTube Channel",
              description: "YouTube channel description",
              thumbnailURL: "https://example.com/thumbnail.jpg",
              publishedAt: new Date().toISOString(),
              subscriberCount: 1000,
            },
            twitch: null,
            twitCasting: null,
            niconico: null,
            bilibili: null,
          },
        },
        {
          id: creatorId,
          name: "English Name",
          languageCode: TargetLangSchema.Enum.en,
          memberType: MemberTypeSchema.Enum.vspo_jp,
          thumbnailURL: "https://example.com/thumbnail.jpg",
          channel: {
            id: channelId,
            creatorID: creatorId,
            youtube: {
              rawId: "translation-channel-id",
              name: "YouTube Channel",
              description: "YouTube channel description",
              thumbnailURL: "https://example.com/thumbnail.jpg",
              publishedAt: new Date().toISOString(),
              subscriberCount: 1000,
            },
            twitch: null,
            twitCasting: null,
            niconico: null,
            bilibili: null,
          },
          translated: true,
        },
        {
          id: creatorId,
          name: "日本語名",
          languageCode: TargetLangSchema.Enum.ja,
          memberType: MemberTypeSchema.Enum.vspo_jp,
          thumbnailURL: "https://example.com/thumbnail.jpg",
          channel: {
            id: channelId,
            creatorID: creatorId,
            youtube: {
              rawId: "translation-channel-id",
              name: "YouTube Channel",
              description: "YouTube channel description",
              thumbnailURL: "https://example.com/thumbnail.jpg",
              publishedAt: new Date().toISOString(),
              subscriberCount: 1000,
            },
            twitch: null,
            twitCasting: null,
            niconico: null,
            bilibili: null,
          },
          translated: true,
        },
      ]);

      // Insert all creators at once
      const result = await interactor.batchUpsert(testCreators);

      expect(result.err).toBeFalsy();
      if (result.err) return;

      // Verify all translations were processed
      expect(result.val.length).toBe(3);

      // Check specific translations
      const defaultTranslation = result.val.find(
        (c) => c.languageCode === "default",
      );
      const enTranslation = result.val.find(
        (c) => c.languageCode === TargetLangSchema.Enum.en,
      );
      const jaTranslation = result.val.find(
        (c) => c.languageCode === TargetLangSchema.Enum.ja,
      );

      expect(defaultTranslation).toBeDefined();
      expect(enTranslation).toBeDefined();
      expect(jaTranslation).toBeDefined();

      if (defaultTranslation && enTranslation && jaTranslation) {
        expect(defaultTranslation.name).toBe("Default Name");
        expect(enTranslation.name).toBe("English Name");
        expect(jaTranslation.name).toBe("日本語名");
      }
    });
  });

  describe.concurrent("list", () => {
    interface TestCase {
      name: string;
      input: {
        limit: number;
        page: number;
        memberType?: "vspo_jp" | "vspo_en" | "vspo_ch" | "general";
        languageCode?: string;
      };
      expectedError?: string;
    }

    const testCases: TestCase[] = [
      {
        name: "should list creators with basic parameters",
        input: {
          limit: 10,
          page: 0,
        },
      },
      {
        name: "should list creators filtered by vspo_jp member type",
        input: {
          limit: 10,
          page: 0,
          memberType: "vspo_jp",
        },
      },
      {
        name: "should list creators filtered by vspo_en member type",
        input: {
          limit: 10,
          page: 0,
          memberType: "vspo_en",
        },
      },
      {
        name: "should list creators with English language code",
        input: {
          limit: 10,
          page: 0,
          languageCode: "en",
        },
      },
      {
        name: "should list creators with Japanese language code",
        input: {
          limit: 10,
          page: 0,
          languageCode: "ja",
        },
      },
      {
        name: "should handle pagination correctly (page 1)",
        input: {
          limit: 5,
          page: 1,
        },
      },
      {
        name: "should handle smaller page size",
        input: {
          limit: 3,
          page: 0,
        },
      },
      {
        name: "should combine filters (member type and language)",
        input: {
          limit: 10,
          page: 0,
          memberType: "vspo_jp",
          languageCode: "ja",
        },
      },
    ];

    for (const tc of testCases) {
      it.concurrent(tc.name, async () => {
        const result = await interactor.list(tc.input);

        if (tc.expectedError) {
          expect(result.err).toBeTruthy();
          if (result.err) {
            expect(result.err.message).toContain(tc.expectedError);
          }
        } else {
          expect(result.err).toBeFalsy();
          if (!result.err) {
            // Verify structure of response
            expect(result.val).toHaveProperty("creators");
            expect(result.val).toHaveProperty("pagination");

            // Verify creators is an array
            expect(Array.isArray(result.val.creators)).toBeTruthy();

            // Verify pagination structure
            expect(result.val.pagination).toHaveProperty("totalCount");
            expect(result.val.pagination).toHaveProperty("totalPage");
            expect(result.val.pagination).toHaveProperty("currentPage");
            expect(result.val.pagination).toHaveProperty("hasNext");
            expect(result.val.pagination).toHaveProperty("nextPage");
            expect(result.val.pagination).toHaveProperty("prevPage");

            // Verify pagination values are reasonable
            expect(typeof result.val.pagination.totalCount).toBe("number");
            expect(typeof result.val.pagination.totalPage).toBe("number");
            expect(typeof result.val.pagination.currentPage).toBe("number");

            // Verify returned item count doesn't exceed limit
            expect(result.val.creators.length).toBeLessThanOrEqual(
              tc.input.limit,
            );

            // Verify correct page is returned
            expect(result.val.pagination.currentPage).toBe(
              Math.max(tc.input.page, 1),
            ); // currentPage is 1-indexed in the API

            // If filter is applied, verify all returned items match the filter
            if (tc.input.memberType && result.val.creators.length > 0) {
              for (const creator of result.val.creators) {
                expect(creator.memberType).toBe(tc.input.memberType);
              }
            }
          }
        }
      });
    }

    it.concurrent("should handle empty result set", async () => {
      // Use an unlikely filter to get empty results
      const result = await interactor.list({
        limit: 10,
        page: 0,
        memberType: "general", // Assuming this will return no results in test DB
        languageCode: "xx", // Non-existent language code
      });

      expect(result.err).toBeFalsy();
      if (!result.err) {
        expect(Array.isArray(result.val.creators)).toBeTruthy();
        expect(result.val.creators.length).toBe(0);
        expect(result.val.pagination.totalCount).toBe(0);
        expect(result.val.pagination.totalPage).toBe(0);
        expect(result.val.pagination.currentPage).toBe(1); // currentPage is 1-indexed
        expect(result.val.pagination.prevPage).toBe(0);
        expect(result.val.pagination.nextPage).toBe(0);
        expect(result.val.pagination.hasNext).toBe(false);
      }
    });
  });

  describe.concurrent("translateCreator", () => {
    interface TestCase {
      name: string;
      input: {
        languageCode: string;
        creators: Creators;
      };
      expectedError?: string;
    }

    const testCases: TestCase[] = [
      {
        name: "should translate creators to English",
        input: {
          languageCode: "en",
          creators: [],
        },
      },
      {
        name: "should translate creators to Japanese",
        input: {
          languageCode: "ja",
          creators: [],
        },
      },
    ];

    for (const tc of testCases) {
      it.concurrent(tc.name, async () => {
        const result = await interactor.translateCreator(tc.input);

        if (tc.expectedError) {
          expect(result.err).toBeTruthy();
          if (result.err) {
            expect(result.err.message).toContain(tc.expectedError);
          }
        } else {
          expect(result.err).toBeFalsy();
          if (!result.err) {
            expect(Array.isArray(result.val)).toBeTruthy();
          }
        }
      });
    }
  });
});
