import { AppError, Err, Ok } from "@vspo-lab/error";
import type { ApplicationService } from "~/types/api";
import { VspoChannelApiRepository } from "../repository/vspo-channel-api";
import { AddChannelUsecase } from "./add-channel";

vi.mock("../repository/vspo-channel-api", () => ({
  VspoChannelApiRepository: {
    enableChannel: vi.fn(),
  },
}));

describe("AddChannelUsecase", () => {
  const params = {
    appWorker: {} as ApplicationService,
    guildId: "guild-1",
    channelId: "ch-new",
  };

  it("delegates to enableChannel and returns Ok on success", async () => {
    vi.mocked(VspoChannelApiRepository.enableChannel).mockResolvedValue(
      Ok(undefined),
    );

    const result = await AddChannelUsecase.execute(params);

    expect(result.err).toBeUndefined();
    expect(VspoChannelApiRepository.enableChannel).toHaveBeenCalledWith(
      params.appWorker,
      params.guildId,
      params.channelId,
    );
  });

  it("propagates Err from enableChannel", async () => {
    const error = new AppError({
      message: "channel not found",
      code: "NOT_FOUND",
    });
    vi.mocked(VspoChannelApiRepository.enableChannel).mockResolvedValue(
      Err(error),
    );

    const result = await AddChannelUsecase.execute(params);

    expect(result.err).toBe(error);
  });
});
