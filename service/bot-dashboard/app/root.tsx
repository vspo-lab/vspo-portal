import type { LinksFunction } from "react-router";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "react-router";
import stylesheet from "./app.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Spodule Bot Dashboard</title>
        <meta
          name="description"
          content="Discord Bot の配信通知設定を Web から管理するダッシュボード"
        />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  let status = 500;
  let message = "予期しないエラーが発生しました。";

  if (isRouteErrorResponse(error)) {
    status = error.status;
    message =
      status === 404 ? "ページが見つかりません。" : error.statusText || message;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-6xl font-bold">{status}</h1>
      <p className="text-lg text-muted-foreground">{message}</p>
      <a
        href="/"
        className="mt-4 rounded-md bg-discord px-4 py-2 text-sm text-white hover:bg-discord/90"
      >
        トップに戻る
      </a>
    </div>
  );
}
