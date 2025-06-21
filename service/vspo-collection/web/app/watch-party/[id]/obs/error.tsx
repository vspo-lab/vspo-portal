"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("OBS Overlay Error:", error);
  }, [error]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(220, 38, 38, 0.9)",
          color: "white",
          padding: "20px 30px",
          borderRadius: "8px",
          textAlign: "center",
          maxWidth: "400px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "10px" }}>❌</div>
        <h2 style={{ fontSize: "18px", marginBottom: "10px", fontWeight: "bold" }}>
          OBSオーバーレイエラー
        </h2>
        <p style={{ fontSize: "14px", marginBottom: "15px", opacity: 0.9 }}>
          ウォッチパーティーへの接続に失敗しました
        </p>
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "15px",
            fontSize: "12px",
            wordBreak: "break-word",
          }}
        >
          {error.message || "Unknown error occurred"}
        </div>
        <button
          onClick={reset}
          style={{
            backgroundColor: "white",
            color: "#dc2626",
            padding: "8px 20px",
            borderRadius: "4px",
            border: "none",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#f3f4f6";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "white";
          }}
        >
          再接続
        </button>
        <p style={{ fontSize: "11px", marginTop: "10px", opacity: 0.7 }}>
          問題が続く場合は、ルームコードを確認してください
        </p>
      </div>
    </div>
  );
}