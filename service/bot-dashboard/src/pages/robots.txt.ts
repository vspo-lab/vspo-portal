import type { APIRoute } from "astro";

const robotsTxt = `User-agent: *
Allow: /
Allow: /en/
Disallow: /dashboard/
Disallow: /en/dashboard/
Disallow: /auth/
Disallow: /en/auth/
Disallow: /api/
`;

export const GET: APIRoute = () =>
  new Response(robotsTxt, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
