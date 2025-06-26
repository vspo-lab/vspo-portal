import { useEffect, useState } from "react";
import { LoadedConfig, loadConfigFromUrl } from "../utils/configLoader";

export interface UseConfigurationLoaderOptions {
  onConfigLoaded?: (config: LoadedConfig) => void;
  onError?: () => void;
}

export interface UseConfigurationLoaderReturn {
  state: {
    isLoading: boolean;
    loadedConfig: LoadedConfig | null;
  };
  isReady: boolean;
  hasError: boolean;
  needsUserAction: boolean;
}

export const useConfigurationLoader = (
  options: UseConfigurationLoaderOptions = {},
): UseConfigurationLoaderReturn => {
  const { onConfigLoaded, onError } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [loadedConfig, setLoadedConfig] = useState<LoadedConfig | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const configUrl = searchParams.get("config");

    if (configUrl) {
      setIsLoading(true);
      loadConfigFromUrl(configUrl)
        .then((config) => {
          setLoadedConfig(config);
          if (onConfigLoaded) {
            onConfigLoaded(config);
          }
        })
        .catch(() => {
          if (onError) {
            onError();
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [onConfigLoaded, onError]);

  return {
    state: {
      isLoading,
      loadedConfig,
    },
    isReady: !isLoading && loadedConfig !== null,
    hasError: false,
    needsUserAction: false,
  };
};

export const useUrlConfigurationLoader = useConfigurationLoader;
export const useManualConfigurationLoader = useConfigurationLoader;
