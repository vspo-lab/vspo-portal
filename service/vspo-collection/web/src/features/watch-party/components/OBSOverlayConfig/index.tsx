"use client";

import { useState } from "react";
import { Button } from "../../../../shared/components/presenters/Button";
import type { OBSOverlayConfig } from "../../pages/OBSOverlay";
import styles from "./styles.module.css";

interface OBSOverlayConfigProps {
  roomId: string;
}

export function OBSOverlayConfigComponent({ roomId }: OBSOverlayConfigProps) {
  const [config, setConfig] = useState<OBSOverlayConfig>({
    position: "bottom-right",
    theme: "dark",
    showChat: true,
    showReactions: true,
    showViewers: true,
    showVideo: true,
    opacity: 1,
    scale: 1,
  });

  const [showConfig, setShowConfig] = useState(false);

  const generateOBSUrl = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
      position: config.position,
      theme: config.theme,
      showChat: config.showChat.toString(),
      showReactions: config.showReactions.toString(),
      showViewers: config.showViewers.toString(),
      showVideo: config.showVideo.toString(),
      opacity: config.opacity.toString(),
      scale: config.scale.toString(),
    });
    return `${baseUrl}/obs-overlay/${roomId}?${params.toString()}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateOBSUrl());
      alert("OBS Browser Source URL copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!showConfig) {
    return (
      <Button
        onClick={() => setShowConfig(true)}
        variant="secondary"
        size="small"
        className={styles.configButton}
      >
        OBS Overlay Settings
      </Button>
    );
  }

  return (
    <div className={styles.configPanel}>
      <div className={styles.configHeader}>
        <h3>OBS Browser Source Configuration</h3>
        <button
          onClick={() => setShowConfig(false)}
          className={styles.closeButton}
        >
          ✕
        </button>
      </div>

      <div className={styles.configBody}>
        {/* Position */}
        <div className={styles.configGroup}>
          <label>Position</label>
          <select
            value={config.position}
            onChange={(e) =>
              setConfig({
                ...config,
                position: e.target.value as OBSOverlayConfig["position"],
              })
            }
          >
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="top-center">Top Center</option>
            <option value="bottom-center">Bottom Center</option>
          </select>
        </div>

        {/* Theme */}
        <div className={styles.configGroup}>
          <label>Theme</label>
          <select
            value={config.theme}
            onChange={(e) =>
              setConfig({
                ...config,
                theme: e.target.value as OBSOverlayConfig["theme"],
              })
            }
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="transparent">Transparent</option>
          </select>
        </div>

        {/* Toggle Options */}
        <div className={styles.toggleGroup}>
          <label>
            <input
              type="checkbox"
              checked={config.showVideo}
              onChange={(e) =>
                setConfig({ ...config, showVideo: e.target.checked })
              }
            />
            Show Video Info
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.showViewers}
              onChange={(e) =>
                setConfig({ ...config, showViewers: e.target.checked })
              }
            />
            Show Viewer Count
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.showReactions}
              onChange={(e) =>
                setConfig({ ...config, showReactions: e.target.checked })
              }
            />
            Show Reactions
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.showChat}
              onChange={(e) =>
                setConfig({ ...config, showChat: e.target.checked })
              }
            />
            Show Chat
          </label>
        </div>

        {/* Opacity */}
        <div className={styles.configGroup}>
          <label>Opacity: {config.opacity}</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={config.opacity}
            onChange={(e) =>
              setConfig({
                ...config,
                opacity: Number.parseFloat(e.target.value),
              })
            }
          />
        </div>

        {/* Scale */}
        <div className={styles.configGroup}>
          <label>Scale: {config.scale}x</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={config.scale}
            onChange={(e) =>
              setConfig({ ...config, scale: Number.parseFloat(e.target.value) })
            }
          />
        </div>

        {/* OBS Setup Instructions */}
        <div className={styles.instructions}>
          <h4>OBS Setup Instructions:</h4>
          <ol>
            <li>Add a Browser Source in OBS</li>
            <li>Set Width: 1920, Height: 1080</li>
            <li>Copy and paste the URL below</li>
            <li>Check "Shutdown source when not visible"</li>
            <li>Check "Refresh browser when scene becomes active"</li>
          </ol>
        </div>

        {/* URL Display */}
        <div className={styles.urlSection}>
          <label>Browser Source URL:</label>
          <div className={styles.urlDisplay}>
            <input
              type="text"
              readOnly
              value={generateOBSUrl()}
              className={styles.urlInput}
            />
            <Button onClick={copyToClipboard} size="small">
              Copy
            </Button>
          </div>
        </div>

        {/* Preview Link */}
        <div className={styles.previewSection}>
          <a
            href={generateOBSUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.previewLink}
          >
            Open Preview in New Tab
          </a>
        </div>
      </div>
    </div>
  );
}
