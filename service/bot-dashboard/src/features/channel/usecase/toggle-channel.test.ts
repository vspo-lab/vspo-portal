import { AppError, Err, Ok } from "@vspo-lab/error";
import type { ApplicationService } from "~/types/api";
import { VspoChannelApiRepository } from "../repository/vspo-channel-api";
import { ToggleChannelUsecase } from "./toggle-channel";

vi.mock("../repository/vspo-channel-api", () => ({
  VspoChannelApiRepository: {
    enableChannel: vi.fn(),
    disableChannel: vi.fn(),
  },
}));

describe("ToggleChannelUsecase", () => {
  const params = {
    appWorker: {} as ApplicationService,
    guildId: "guild-1",
    channelId: "ch-1",
  };

  it("calls enableChannel when enable=true", async () => {
    vi.mocked(VspoChannelApiRepository.enableChannel).mockResolvedValue(
      Ok(undefined),
    );

    const result = await ToggleChannelUsecase.execute({
      ...params,
      enable: true,
    });

    expect(result.err).toBeUndefined();
    expect(VspoChannelApiRepository.enableChannel).toHaveBeenCalledWith(
      params.appWorker,
      params.guildId,
      params.channelId,
    );
    expect(VspoChannelApiRepository.disableChannel).not.toHaveBeenCalled();
  });

  it("calls disableChannel when enable=false", async () => {
    vi.mocked(VspoChannelApiRepository.disableChannel).mockResolvedValue(
      Ok(undefined),
    );

    const result = await ToggleChannelUsecase.execute({
      ...params,
      enable: false,
    });

    expect(result.err).toBeUndefined();
    expect(VspoChannelApiRepository.disableChannel).toHaveBeenCalledWith(
      params.appWorker,
      params.guildId,
      params.channelId,
    );
    expect(VspoChannelApiRepository.enableChannel).not.toHaveBeenCalled();
  });

  it("propagates Err from enableChannel", async () => {
    const error = new AppError({
      message: "network error",
      code: "INTERNAL_SERVER_ERROR",
    });
    vi.mocked(VspoChannelApiRepository.enableChannel).mockResolvedValue(
      Err(error),
    );

    const result = await ToggleChannelUsecase.execute({
      ...params,
      enable: true,
    });

    expect(result.err).toBeDefined();
    expect(result.err).toBe(error);
  });

  it("propagates Err from disableChannel", async () => {
    const error = new AppError({
      message: "forbidden",
      code: "FORBIDDEN",
    });
    vi.mocked(VspoChannelApiRepository.disableChannel).mockResolvedValue(
      Err(error),
    );

    const result = await ToggleChannelUsecase.execute({
      ...params,
      enable: false,
    });

    expect(result.err).toBeDefined();
    expect(result.err).toBe(error);
  });
});
