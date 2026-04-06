# Monitoring & Observability

## Current State

### Observability Configuration

```jsonc
// wrangler.jsonc
"observability": {
  "enabled": true
}
```

Cloudflare Workers observability is enabled, providing basic request logging and analytics via the Cloudflare dashboard.

### Current Logging

| Layer | Mechanism | Detail Level |
|-------|-----------|-------------|
| Middleware | No explicit logging | Silent |
| Actions | No explicit logging | Errors thrown as `ActionError` |
| Repository | No explicit logging | Errors wrapped in `Result` |
| UseCase | No explicit logging | Errors passed through |
| API Routes | No explicit logging | Errors returned as JSON |
| Client | No error reporting | Browser console only |

### Problem

The application has **zero server-side logging** beyond what Cloudflare Workers automatically captures. When an error occurs:

1. The user sees a generic error message
2. There is no log trail showing what failed, when, or why
3. Debugging requires reproducing the issue locally

## Issue 1: No Structured Server-Side Logging

### Proposed: Lightweight Logger

Since Cloudflare Workers doesn't support traditional logging frameworks, use `console.log` with structured JSON (which Cloudflare captures in Worker Logs):

```typescript
// features/shared/lib/logger.ts
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

const createLogger = (module: string) => {
  const log = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
    const entry: LogEntry = {
      level,
      message,
      context: { ...context, module },
      timestamp: new Date().toISOString(),
    };
    // Cloudflare Workers captures console output in Worker Logs
    if (level === "error") {
      console.error(JSON.stringify(entry));
    } else if (level === "warn") {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  };

  return {
    debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx),
    info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx),
    warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx),
    error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
  };
};

export const logger = createLogger;
```

### Usage in Middleware

```typescript
// middleware.ts
const log = logger("middleware");

const auth: MiddlewareHandler = async (context, next) => {
  const session = await context.session();
  const user = session?.get("user");

  if (!user) {
    log.info("unauthenticated access", { path: context.url.pathname });
    return context.redirect("/");
  }

  log.debug("authenticated request", {
    path: context.url.pathname,
    userId: user.id,
  });

  return next();
};
```

### Usage in Actions

```typescript
// actions/index.ts
const log = logger("actions");

addChannel: defineAction({
  handler: async (input, context) => {
    log.info("addChannel", { guildId: input.guildId, channelId: input.channelId });

    const result = await AddChannelUsecase.execute({ ... });

    if (result.err) {
      log.error("addChannel failed", {
        guildId: input.guildId,
        code: result.err.code,
        message: result.err.message,
      });
    }

    return unwrapOrThrow(result);
  },
}),
```

## Issue 2: No Client-Side Error Reporting

### Current State

Client-side errors (React Island crashes, failed fetch requests, unhandled promise rejections) are only visible in the user's browser console.

### Proposed: Global Error Handler

```astro
<!-- layouts/Base.astro -->
<script is:inline>
  window.addEventListener("error", (event) => {
    // Send to server-side error collection endpoint
    navigator.sendBeacon("/api/client-error", JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: new Date().toISOString(),
      url: location.href,
      userAgent: navigator.userAgent,
    }));
  });

  window.addEventListener("unhandledrejection", (event) => {
    navigator.sendBeacon("/api/client-error", JSON.stringify({
      message: String(event.reason),
      type: "unhandled_promise_rejection",
      timestamp: new Date().toISOString(),
      url: location.href,
    }));
  });
</script>
```

### Server-Side Collection Endpoint

```typescript
// pages/api/client-error.ts
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const log = logger("client-error");
  log.error("client error", body);
  return new Response(null, { status: 204 });
};
```

## Issue 3: No Request Tracing

### Problem

When an error occurs in the RPC layer, there's no way to correlate it with the originating user request. Each layer handles errors independently.

### Proposed: Request ID Propagation

```typescript
// middleware.ts
const requestId: MiddlewareHandler = async (context, next) => {
  const id = crypto.randomUUID();
  context.locals.requestId = id;

  const response = await next();
  response.headers.set("X-Request-Id", id);
  return response;
};

export const onRequest = sequence(requestId, securityHeaders, auth);
```

Then include `requestId` in all log entries:

```typescript
log.error("addChannel failed", {
  requestId: context.locals.requestId,
  guildId: input.guildId,
  code: result.err.code,
});
```

## Issue 4: No Performance Monitoring

### Current State

No Web Vitals (LCP, FID, CLS, TTFB) are collected. No server-side timing is measured.

### Proposed: Web Vitals Collection

```astro
<!-- layouts/Base.astro (production only) -->
{import.meta.env.PROD && (
  <script type="module">
    import { onCLS, onFID, onLCP, onTTFB } from "web-vitals";

    const sendMetric = (metric) => {
      navigator.sendBeacon("/api/metrics", JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        url: location.href,
        timestamp: new Date().toISOString(),
      }));
    };

    onCLS(sendMetric);
    onFID(sendMetric);
    onLCP(sendMetric);
    onTTFB(sendMetric);
  </script>
)}
```

### Server-Side Timing

```typescript
// middleware.ts
const timing: MiddlewareHandler = async (context, next) => {
  const start = performance.now();
  const response = await next();
  const duration = performance.now() - start;

  response.headers.set("Server-Timing", `total;dur=${duration.toFixed(1)}`);

  if (duration > 1000) {
    log.warn("slow request", {
      path: context.url.pathname,
      duration: Math.round(duration),
    });
  }

  return response;
};
```

## Issue 5: No Health Check Endpoint

### Problem

No endpoint exists to verify the service is healthy. Load balancers, uptime monitors, and CI deployments cannot check if the service is operational.

### Proposed: Health Check

```typescript
// pages/api/health.ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const GET: APIRoute = async () => {
  const checks = {
    status: "ok",
    timestamp: new Date().toISOString(),
    rpc: env.APP_WORKER ? "connected" : "unavailable",
  };

  const allHealthy = checks.rpc === "connected";

  return new Response(JSON.stringify(checks), {
    status: allHealthy ? 200 : 503,
    headers: { "Content-Type": "application/json" },
  });
};
```

## Issue 6: No Alerting on Error Rates

### Consideration

Cloudflare Workers provides built-in analytics and can trigger alerts via Cloudflare Notifications. Configure:

1. **Error rate alerts**: Trigger when 5xx error rate exceeds threshold
2. **Latency alerts**: Trigger when p95 latency exceeds threshold
3. **Worker limit alerts**: Trigger when approaching CPU time or memory limits

This is configured in the Cloudflare dashboard, not in code, but should be documented.

## Migration Checklist

- [ ] Create `logger.ts` structured logging utility
- [ ] Add logging to middleware (auth flow, security headers)
- [ ] Add logging to action handlers (success/failure)
- [ ] Add logging to repository layer (RPC calls)
- [ ] Add request ID middleware and propagate through logs
- [ ] Add global client-side error handler with `sendBeacon`
- [ ] Create `/api/client-error` collection endpoint
- [ ] Add `Server-Timing` header to middleware
- [ ] Create `/api/health` health check endpoint
- [ ] Evaluate Web Vitals collection
- [ ] Configure Cloudflare alerting for error rates
