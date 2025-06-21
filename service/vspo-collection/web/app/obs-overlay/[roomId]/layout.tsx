export default function OBSOverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            background: transparent;
            overflow: hidden;
          }
          
          /* Hide any default UI elements */
          header, footer, nav {
            display: none !important;
          }
          
          /* Ensure transparency for OBS */
          html, body {
            background-color: rgba(0, 0, 0, 0) !important;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
