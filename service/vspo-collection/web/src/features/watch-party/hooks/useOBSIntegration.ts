import { useCallback, useState } from "react";
import type { OBSSettings } from "../types";

interface UseOBSIntegrationReturn {
  obsUrl: string | null;
  obsSettings: OBSSettings | null;
  generateOBSUrl: (settings: OBSSettings) => Promise<void>;
  updateOBSSettings: (settings: Partial<OBSSettings>) => void;
  testOBSConnection: () => Promise<boolean>;
}

export const useOBSIntegration = (
  roomId: string | undefined,
): UseOBSIntegrationReturn => {
  const [obsUrl, setObsUrl] = useState<string | null>(null);
  const [obsSettings, setObsSettings] = useState<OBSSettings | null>({
    width: 1920,
    height: 1080,
    showChat: true,
    showViewers: true,
    chromaKey: false,
    backgroundColor: "#000000",
    chatPosition: "right",
    chatOpacity: 0.9,
    viewerListPosition: "top-right",
  });

  const generateOBSUrl = useCallback(
    async (settings: OBSSettings) => {
      if (!roomId) return;

      try {
        // Generate OBS browser source URL with settings
        const params = new URLSearchParams({
          roomId,
          width: settings.width.toString(),
          height: settings.height.toString(),
          showChat: settings.showChat.toString(),
          showViewers: settings.showViewers.toString(),
          chromaKey: settings.chromaKey.toString(),
          backgroundColor: settings.backgroundColor,
          chatPosition: settings.chatPosition,
          chatOpacity: settings.chatOpacity.toString(),
          viewerListPosition: settings.viewerListPosition,
        });

        const url = `${window.location.origin}/watch-party/obs?${params.toString()}`;
        setObsUrl(url);
        setObsSettings(settings);

        // Save settings to backend
        await fetch(`/api/watch-party/rooms/${roomId}/obs-settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
      } catch (error) {
        console.error("Error generating OBS URL:", error);
      }
    },
    [roomId],
  );

  const updateOBSSettings = useCallback((settings: Partial<OBSSettings>) => {
    setObsSettings((prev) => (prev ? { ...prev, ...settings } : null));
  }, []);

  const testOBSConnection = useCallback(async () => {
    if (!obsUrl) return false;

    try {
      const response = await fetch(obsUrl);
      return response.ok;
    } catch (error) {
      console.error("Error testing OBS connection:", error);
      return false;
    }
  }, [obsUrl]);

  return {
    obsUrl,
    obsSettings,
    generateOBSUrl,
    updateOBSSettings,
    testOBSConnection,
  };
};
