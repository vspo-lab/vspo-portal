import type { VSPOApiOptions } from "../client";
import type * as apiGen from "../gen/openapi";
import { creators } from "./data/creators";
import { events } from "./data/events";
import { freechats } from "./data/freechats";
// Import mock data sources
import { streams } from "./data/streams";
import { twitchClips } from "./data/twitchClips";
import { youtubeClips } from "./data/youtubeClips";
import { youtubeShorts } from "./data/youtubeShorts";

// Using type assertion since we don't have wrangler file for CF bindings
export const ENV = process.env.ENV || "development";

interface MockData {
  streams: apiGen.ListStreams200;
  creators: apiGen.ListCreators200;
  events: apiGen.ListEvents200;
  freechats: apiGen.ListFreechats200;
  clipsYoutubeClip: apiGen.ListClips200;
  clipsYoutubeShort: apiGen.ListClips200;
  clipsTwitchClip: apiGen.ListClips200;
}

// Initialize mock data with imported values
const mockData: MockData = {
  streams,
  creators,
  events,
  freechats,
  clipsYoutubeClip: youtubeClips,
  clipsYoutubeShort: youtubeShorts,
  clipsTwitchClip: twitchClips,
};

/**
 * Get mock data by key
 */
function getMockData<K extends keyof MockData>(key: K): MockData[K] {
  return mockData[key];
}

/**
 * Mock data handler for API responses
 */
export const MockHandler = {
  /**
   * Returns mock stream data for the streams.list endpoint
   */
  getStreams(_params: apiGen.ListStreamsParams): apiGen.ListStreams200 {
    return getMockData("streams");
  },

  /**
   * Returns mock stream data for the streams.search endpoint
   */
  searchStreams(body: apiGen.PostStreamBody): apiGen.PostStream200 {
    const streamsData = getMockData("streams");

    // Filter streams by the IDs provided in the request body
    const filteredStreams = streamsData.streams.filter((stream) =>
      body.streamIds.includes(stream.id),
    );

    return {
      videos: filteredStreams as unknown as apiGen.PostStream200VideosItem[],
    };
  },

  /**
   * Returns mock creator data for the creators.list endpoint
   */
  getCreators(_params: apiGen.ListCreatorsParams): apiGen.ListCreators200 {
    return getMockData("creators");
  },

  /**
   * Returns mock clips data for the clips.list endpoint
   */
  getClips(params: apiGen.ListClipsParams): apiGen.ListClips200 {
    // Select the appropriate clips mock data based on platform and clip type
    if (params.platform === "youtube") {
      if (params.clipType === "clip") {
        return getMockData("clipsYoutubeClip");
      }
      if (params.clipType === "short") {
        return getMockData("clipsYoutubeShort");
      }
    }
    if (params.platform === "twitch" && params.clipType === "clip") {
      return getMockData("clipsTwitchClip");
    }

    // Default to YouTube clips if no matching mock is found
    return getMockData("clipsYoutubeClip");
  },

  /**
   * Returns mock events data for the events.list endpoint
   */
  getEvents(_params: apiGen.ListEventsParams): apiGen.ListEvents200 {
    return getMockData("events");
  },

  /**
   * Returns mock event data for the events.get endpoint
   */
  getEvent(id: string): apiGen.GetEvent200 {
    const eventsData = getMockData("events");
    const event = eventsData.events.find((event) => event.id === id);

    if (!event) {
      throw new Error(`Event with ID ${id} not found`);
    }

    return event as unknown as apiGen.GetEvent200;
  },

  /**
   * Returns mock freechats data for the freechats.list endpoint
   */
  getFreechats(_params: apiGen.ListFreechatsParams): apiGen.ListFreechats200 {
    return getMockData("freechats");
  },
};

export function isLocalEnv(opts?: Pick<VSPOApiOptions, "baseUrl">): boolean {
  return ENV === "local" || (opts?.baseUrl?.includes("localhost") ?? false);
}
