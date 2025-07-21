import { DiscordHono } from "discord-hono";
import { cors } from "hono/cors";
import type { ApiEnv } from "../../config/env/api";
import { setFeatureFlagProvider } from "../../config/featureFlag";
import {
  botAddComponent,
  botRemoveComponent,
  cancelComponent,
  customMemberDirectSelectComponent,
  customMemberSelectENComponent,
  customMemberSelectJPComponent,
  type DiscordCommandEnv,
  langSelectComponent,
  langSettingComponent,
  memberTypeSelectComponent,
  memberTypeSettingComponent,
  spoduleSettingCommand,
  yesBotRemoveComponent,
} from "../../infra/discord/command";
import { init } from "../../infra/http/hono";
import { newApp } from "../../infra/http/hono/app";
import { maintenanceMiddleware } from "../../infra/http/hono/middleware/discord/maintenance";
import { registerCreatorListApi } from "../../infra/http/routes";
import { registerClipListApi } from "../../infra/http/routes/clip";
import {
  registerEventCreateApi,
  registerEventGetApi,
  registerEventListApi,
} from "../../infra/http/routes/event";
import { registerFreechatListApi } from "../../infra/http/routes/freechat";
import {
  registerStreamListApi,
  registerStreamPostApi,
} from "../../infra/http/routes/stream";
import { createHandler, withTracer } from "../../infra/http/trace";

const app = newApp();
app.notFound((c) => {
  return c.text("Not Found", 404);
});
app.get("/health", (c) => {
  return c.text("OK");
});

const discord = new DiscordHono<DiscordCommandEnv>()
  //setting
  .command(spoduleSettingCommand.name, spoduleSettingCommand.handler)
  .component(botAddComponent.name, botAddComponent.handler)
  .component(botRemoveComponent.name, botRemoveComponent.handler)
  .component(yesBotRemoveComponent.name, yesBotRemoveComponent.handler)
  .component(langSettingComponent.name, langSettingComponent.handler)
  .component(langSelectComponent.name, langSelectComponent.handler)
  .component(
    memberTypeSettingComponent.name,
    memberTypeSettingComponent.handler,
  )
  .component(memberTypeSelectComponent.name, memberTypeSelectComponent.handler)
  .component(
    customMemberDirectSelectComponent.name,
    customMemberDirectSelectComponent.handler,
  )
  .component(
    customMemberSelectJPComponent.name,
    customMemberSelectJPComponent.handler,
  )
  .component(
    customMemberSelectENComponent.name,
    customMemberSelectENComponent.handler,
  )
  //common
  .component(cancelComponent.name, cancelComponent.handler);
app.use("/interaction", maintenanceMiddleware);
app.mount("/interaction", discord.fetch);
app.use(
  "/api/*",
  cors({
    origin: process.env.ORIGINS?.split(",") ?? ["localhost:8000"],
    allowHeaders: ["*"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
    credentials: true,
  }),
  init,
);
registerStreamListApi(app);
registerCreatorListApi(app);
registerStreamPostApi(app);
registerClipListApi(app);
registerEventListApi(app);
registerEventGetApi(app);
registerEventCreateApi(app);
registerFreechatListApi(app);

export default createHandler({
  fetch: async (req: Request, env: ApiEnv, executionCtx: ExecutionContext) => {
    setFeatureFlagProvider(env);
    return await withTracer("OTelCFWorkers:Fetcher", "Exec", async () => {
      return app.fetch(req, env, executionCtx);
    });
  },
});
