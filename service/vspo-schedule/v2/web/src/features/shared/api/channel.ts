import { type ListCreators200CreatorsItem, VSPOApi } from "@vspo-lab/api";
import { type BaseError, Err, Ok, type Result } from "@vspo-lab/error";
import { getCloudflareEnvironmentContext } from "@/lib/cloudflare/context";
import type { Channel } from "../domain/channel";

type FetchVspoMembersResult = Result<
  {
    members: Channel[];
  },
  BaseError
>;

/**
 * Worker response type for creator data
 */
type WorkerCreatorResponse = {
  id: string;
  name?: string;
  thumbnailURL?: string;
  memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "general" | "vspo_all";
  channel?: {
    youtube?: {
      name: string;
    } | null;
  } | null;
};

/**
 * Convert API response to Channel type
 */
const mapToChannel = (creator: ListCreators200CreatorsItem): Channel => {
  return {
    id: creator.id,
    name: creator.name,
    thumbnailURL: creator.thumbnailURL, // Match API response property name
    active: true, // Treat all as active for now
    memberType: creator.memberType,
  };
};

/**
 * Convert APP_WORKER response to Channel type.
 * Prefers YouTube channel name over creator name.
 */
const mapWorkerResponseToChannel = (
  creator: WorkerCreatorResponse,
): Channel => {
  return {
    id: creator.id,
    name: creator.channel?.youtube?.name || creator.name || "",
    thumbnailURL: creator.thumbnailURL || "",
    active: true, // Treat all as active for now
    memberType: creator.memberType,
  };
};

/**
 * Fetch VSPO member information.
 * Precondition: optional sessionId for API authentication.
 * Postcondition: returns Ok with JP and EN members, or Err on failure.
 */
export const fetchVspoMembers = async ({
  sessionId,
}: {
  sessionId?: string;
}): Promise<FetchVspoMembersResult> => {
  const { cfEnv } = await getCloudflareEnvironmentContext();

  const members: Channel[] = [];

  if (cfEnv) {
    const { APP_WORKER } = cfEnv;

    // Fetch Japanese and English members in parallel using APP_WORKER
    const [vspoJpResult, vspoEnResult] = await Promise.all([
      APP_WORKER.newCreatorUsecase().list({
        limit: 100,
        page: 0,
        memberType: "vspo_jp",
      }),
      APP_WORKER.newCreatorUsecase().list({
        limit: 100,
        page: 0,
        memberType: "vspo_en",
      }),
    ]);

    if (vspoJpResult.err) {
      return Err(vspoJpResult.err);
    }

    if (vspoEnResult.err) {
      return Err(vspoEnResult.err);
    }

    // Add Japanese members
    if (vspoJpResult.val?.creators) {
      for (const creator of vspoJpResult.val.creators) {
        members.push(mapWorkerResponseToChannel(creator));
      }
    }

    // Add English members
    if (vspoEnResult.val?.creators) {
      for (const creator of vspoEnResult.val.creators) {
        members.push(mapWorkerResponseToChannel(creator));
      }
    }
  } else {
    // Use regular VSPO API
    const client = new VSPOApi({
      baseUrl: process.env.API_URL_V2 || "",
      sessionId: sessionId,
    });

    // Fetch Japanese and English members in parallel
    const [vspoJpResponse, vspoEnResponse] = await Promise.all([
      client.creators.list({
        limit: "100",
        page: "0",
        memberType: "vspo_jp",
      }),
      client.creators.list({
        limit: "100",
        page: "0",
        memberType: "vspo_en",
      }),
    ]);

    if (vspoJpResponse.err) {
      return Err(vspoJpResponse.err);
    }

    if (vspoEnResponse.err) {
      return Err(vspoEnResponse.err);
    }

    // Add Japanese members
    for (const creator of vspoJpResponse.val.creators) {
      members.push(mapToChannel(creator));
    }

    // Add English members
    for (const creator of vspoEnResponse.val.creators) {
      members.push(mapToChannel(creator));
    }
  }

  return Ok({ members });
};
