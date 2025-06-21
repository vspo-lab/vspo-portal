export default function Loading() {
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
          color: "white",
          fontSize: "16px",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)",
          padding: "20px",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          borderRadius: "8px",
          animation: "pulse 2s infinite",
        }}
      >
        <div style={{ marginBottom: "10px", fontSize: "24px" }}>🔄</div>
        <div>OBSオーバーレイを接続中...</div>
        <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.8 }}>
          ウォッチパーティー情報を取得しています
        </div>
      </div>
      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}