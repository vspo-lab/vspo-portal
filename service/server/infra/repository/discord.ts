import {
  convertToUTC,
  convertToUTCDate,
  getCurrentUTCDate,
} from "@vspo-lab/dayjs";
import { AppError, Err, Ok, type Result, wrap } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import { asc, count, eq, inArray } from "drizzle-orm";
import {
  type DiscordServer,
  type DiscordServers,
  createDiscordServers,
  discordChannels,
} from "../../domain";
import { createUUID } from "../../pkg/uuid";
import { withTracerResult } from "../http/trace/cloudflare";
import { buildConflictUpdateColumns } from "./helper";
import {
  type SelectDiscordChannel,
  createInsertDiscordServer,
  discordChannelTable,
  discordServerTable,
} from "./schema";
import type { DB } from "./transaction";

type ListQuery = {
  limit: number;
  page: number;
};

export interface IDiscordServerRepository {
  list(query: ListQuery): Promise<Result<DiscordServers, AppError>>;
  count(query: ListQuery): Promise<Result<number, AppError>>;
  batchUpsert(
    discordServers: DiscordServers,
  ): Promise<Result<DiscordServers, AppError>>;
  batchDeleteChannelsByRowChannelIds(
    discordChannelIds: string[],
  ): Promise<Result<void, AppError>>;
  get(query: { serverId: string }): Promise<Result<DiscordServer, AppError>>;
  exists(query: { serverId: string }): Promise<Result<boolean, AppError>>;
  existsChannel(query: { channelId: string }): Promise<
    Result<boolean, AppError>
  >;
}

export function createDiscordServerRepository(
  db: DB,
): IDiscordServerRepository {
  const list = async (
    query: ListQuery,
  ): Promise<Result<DiscordServers, AppError>> => {
    return withTracerResult("DiscordServerRepository", "list", async (span) => {
      AppLogger.info("DiscordServerRepository list", {
        query,
      });
      const discordServerResult = await wrap(
        db
          .select()
          .from(discordServerTable)
          .leftJoin(
            discordChannelTable,
            eq(discordServerTable.serverId, discordChannelTable.serverId),
          )
          // .where(and(...filters))
          .limit(query.limit)
          .offset(query.page * query.limit)
          .orderBy(asc(discordServerTable.createdAt))
          .execute(),
        (err) =>
          new AppError({
            message: `Database error during discordServer list query: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );

      if (discordServerResult.err) {
        return Err(discordServerResult.err);
      }

      const discordServersHasChannelIdsMap = new Map<
        string,
        SelectDiscordChannel[]
      >();
      for (const row of discordServerResult.val) {
        const serverId = row.discord_server.serverId;
        const channels = discordServersHasChannelIdsMap.get(serverId) ?? [];
        if (row.discord_channel) {
          channels.push(row.discord_channel);
        }
        discordServersHasChannelIdsMap.set(serverId, channels);
      }

      return Ok(
        createDiscordServers(
          discordServerResult.val.map((row) => ({
            id: row.discord_server.id,
            rawId: row.discord_server.serverId,
            discordChannels: discordChannels.parse(
              discordServersHasChannelIdsMap
                .get(row.discord_server.serverId)
                ?.map((s) => {
                  return {
                    id: s.id,
                    rawId: s.channelId,
                    serverId: s.serverId,
                    name: s.name,
                    languageCode: s.languageCode,
                    memberType: s.memberType,
                    selectedMemberIds: s.selectedMemberIds
                      ? s.selectedMemberIds.split(",")
                      : undefined,
                    createdAt: convertToUTC(s.createdAt),
                    updatedAt: convertToUTC(s.updatedAt),
                  };
                }) ?? [],
            ),
            name: row.discord_server.name,
            languageCode: row.discord_server.languageCode,
            createdAt: convertToUTC(row.discord_server.createdAt),
            updatedAt: convertToUTC(row.discord_server.updatedAt),
          })),
        ),
      );
    });
  };

  const countFunc = async (
    query: ListQuery,
  ): Promise<Result<number, AppError>> => {
    return withTracerResult(
      "DiscordServerRepository",
      "count",
      async (span) => {
        const discordServerResult = await wrap(
          db
            .select({ count: count() })
            .from(discordServerTable)
            // .where(and(...filters))
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during discordServer count query: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (discordServerResult.err) {
          return Err(discordServerResult.err);
        }

        return Ok(discordServerResult.val.at(0)?.count ?? 0);
      },
    );
  };

  const batchUpsert = async (
    discordServers: DiscordServers,
  ): Promise<Result<DiscordServers, AppError>> => {
    return withTracerResult(
      "DiscordServerRepository",
      "batchUpsert",
      async (span) => {
        // Deduplicate servers and merge their channels
        const serverMap = new Map<string, DiscordServer>();
        for (const server of discordServers) {
          if (!server.rawId) {
            continue;
          }
          const existingServer = serverMap.get(server.rawId);
          if (existingServer) {
            // Merge channels, avoiding duplicates by channelId
            const channelMap = new Map<
              string,
              (typeof server.discordChannels)[0]
            >();
            for (const ch of existingServer.discordChannels) {
              channelMap.set(ch.rawId, ch);
            }
            for (const ch of server.discordChannels) {
              channelMap.set(ch.rawId, ch);
            }
            existingServer.discordChannels = Array.from(channelMap.values());
          } else {
            serverMap.set(server.rawId, server);
          }
        }
        const uniqueServers = Array.from(serverMap.values());
        AppLogger.info("DiscordServerRepository batchUpsert", {
          uniqueServers,
        });

        const dbDiscordServers = uniqueServers.map((server) =>
          createInsertDiscordServer({
            id: server.id || createUUID(),
            serverId: server.rawId,
            name: server.name || "",
            languageCode: server.languageCode || "default",
            createdAt: convertToUTCDate(server.createdAt),
            updatedAt: convertToUTCDate(server.updatedAt),
          }),
        );

        const discordServerResult = await wrap(
          db
            .insert(discordServerTable)
            .values(dbDiscordServers)
            .onConflictDoUpdate({
              target: discordServerTable.serverId,
              set: buildConflictUpdateColumns(discordServerTable, [
                "name",
                "languageCode",
                "updatedAt",
              ]),
            })
            .returning()
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during discord server batch upsert: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (discordServerResult.err) {
          return Err(discordServerResult.err);
        }

        const dbDiscordChannels = uniqueServers.flatMap((server) =>
          server.discordChannels.map((c) => ({
            id: c.id || createUUID(),
            channelId: c.rawId,
            serverId: server.rawId,
            name: c.name || "",
            languageCode: c.languageCode,
            memberType: c.memberType,
            selectedMemberIds: c.selectedMemberIds?.join(",") || null,
            createdAt: convertToUTCDate(c.createdAt ?? getCurrentUTCDate()),
            updatedAt: convertToUTCDate(c.updatedAt ?? getCurrentUTCDate()),
          })),
        );

        const discordChannelResult = await wrap(
          db
            .insert(discordChannelTable)
            .values(dbDiscordChannels)
            .onConflictDoUpdate({
              target: [
                discordChannelTable.channelId,
                discordChannelTable.serverId,
              ],
              set: buildConflictUpdateColumns(discordChannelTable, [
                "name",
                "languageCode",
                "memberType",
                "selectedMemberIds",
                "updatedAt",
              ]),
            })
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during discord channel batch upsert: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (discordChannelResult.err) {
          return Err(discordChannelResult.err);
        }

        return Ok(
          createDiscordServers(
            discordServerResult.val.map((r) => ({
              id: r.id,
              rawId: r.serverId,
              discordChannels: discordChannels.parse(
                dbDiscordChannels
                  .filter((ch) => ch.serverId === r.serverId)
                  .map((ch) => ({
                    id: ch.id,
                    rawId: ch.channelId,
                    serverId: ch.serverId,
                    name: ch.name,
                    languageCode: ch.languageCode,
                    memberType: ch.memberType,
                    selectedMemberIds: ch.selectedMemberIds
                      ? ch.selectedMemberIds.split(",")
                      : undefined,
                    createdAt: convertToUTC(ch.createdAt),
                    updatedAt: convertToUTC(ch.updatedAt),
                  })),
              ),
              name: r.name,
              languageCode: r.languageCode,
              createdAt: convertToUTC(r.createdAt),
              updatedAt: convertToUTC(r.updatedAt),
            })),
          ),
        );
      },
    );
  };

  const batchDeleteChannelsByRowChannelIds = async (
    discordChannelIds: string[],
  ): Promise<Result<void, AppError>> => {
    return withTracerResult(
      "DiscordServerRepository",
      "batchDeleteChannelsByRowChannelIds",
      async (span) => {
        const discordChannelResult = await wrap(
          db
            .delete(discordChannelTable)
            .where(inArray(discordChannelTable.channelId, discordChannelIds))
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during discord channel batch delete: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );
        if (discordChannelResult.err) {
          return Err(discordChannelResult.err);
        }
        return Ok();
      },
    );
  };

  const get = async (query: { serverId: string }): Promise<
    Result<DiscordServer, AppError>
  > => {
    return withTracerResult("DiscordServerRepository", "get", async (span) => {
      const discordServerResult = await wrap(
        db
          .select()
          .from(discordServerTable)
          .leftJoin(
            discordChannelTable,
            eq(discordServerTable.serverId, discordChannelTable.serverId),
          )
          .where(eq(discordServerTable.serverId, query.serverId))
          .execute(),
        (err) =>
          new AppError({
            message: `Database error during discordServer get query: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );

      if (discordServerResult.err) {
        return Err(discordServerResult.err);
      }

      const discordServer = discordServerResult.val[0];
      if (!discordServer) {
        return Err(
          new AppError({
            message: `Discord server not found: ${query.serverId}`,
            code: "NOT_FOUND",
          }),
        );
      }

      const dc = discordServerResult.val
        ?.map((c) => c.discord_channel)
        .filter((c) => c !== null);

      const dcc = dc.map((c) => ({
        id: c.id,
        rawId: c.channelId,
        serverId: c.serverId,
        name: c.name,
        languageCode: c.languageCode,
        memberType: c.memberType,
        selectedMemberIds: c.selectedMemberIds
          ? c.selectedMemberIds.split(",")
          : undefined,
        createdAt: convertToUTC(c.createdAt),
        updatedAt: convertToUTC(c.updatedAt),
      }));
      return Ok({
        id: discordServer.discord_server.id,
        rawId: discordServer.discord_server.serverId,
        discordChannels: discordChannels.parse(dcc),
        name: discordServer.discord_server.name,
        languageCode: discordServer.discord_server.languageCode,
        createdAt: convertToUTC(discordServer.discord_server.createdAt),
        updatedAt: convertToUTC(discordServer.discord_server.updatedAt),
      });
    });
  };

  const exists = async (query: { serverId: string }): Promise<
    Result<boolean, AppError>
  > => {
    return withTracerResult(
      "DiscordServerRepository",
      "exists",
      async (span) => {
        const discordServerResult = await wrap(
          db
            .select()
            .from(discordServerTable)
            .where(eq(discordServerTable.serverId, query.serverId))
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during discordServer exists query: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (discordServerResult.err) {
          return Err(discordServerResult.err);
        }

        return Ok(discordServerResult.val.length > 0);
      },
    );
  };

  const existsChannel = async (query: { channelId: string }): Promise<
    Result<boolean, AppError>
  > => {
    return withTracerResult(
      "DiscordServerRepository",
      "existsChannel",
      async (span) => {
        const discordChannelResult = await wrap(
          db
            .select()
            .from(discordChannelTable)
            .where(eq(discordChannelTable.channelId, query.channelId))
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during discord channel exists query: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (discordChannelResult.err) {
          return Err(discordChannelResult.err);
        }

        return Ok(discordChannelResult.val.length > 0);
      },
    );
  };

  return {
    list,
    count: countFunc,
    batchUpsert,
    batchDeleteChannelsByRowChannelIds,
    get,
    exists,
    existsChannel,
  };
}
