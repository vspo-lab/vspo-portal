export function OBSOverlayLoading() {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: "white",
        fontSize: "14px",
        fontFamily: "system-ui, sans-serif",
        textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)",
      }}
    >
      Connecting to watch party...
    </div>
  );
}
