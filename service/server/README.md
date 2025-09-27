# Vspo Portal Server

Backend services for Vspo Portal

### Architecture Overview
![alt text](./docs/images/architecture.png)

### Requirements

- Node.js: >=22.15.0
- Package Manager: pnpm >=10.17.1

### Setup

- copy env vars
```bash
for dir in config/wrangler/dev/vspo-portal-gateway config/wrangler/dev/vspo-portal-app config/wrangler/dev/vspo-portal-cron; do cp .dev.example.vars "$dir/.dev.vars"; done
```

- install dependencies
```bash
pnpm i
```

- start db/otel collector
```bash
pnpm db:up
```

- migrate db
```bash
pnpm db:migrate
```

- start services (necessary to start as it aggregates processing for the internal app)
```bash
pnpm dev:internal # Must run
pnpm dev:gateway # API
pnpm dev:cron # For schedule verification
pnpm db:studio # Optional, allows browser access to DB contents
```

### Local Development

- Running Cron

Specify and run the set schedule
```bash
curl "http://localhost:3002/__scheduled?cron=*+*+*+*+*"
```

### Format
```bash
pnpm biome:check:write
```

### Used Packages

- @vspo-lab/api: 0.1.0
- @vspo-lab/dayjs: 0.1.0
- @vspo-lab/error: 0.1.0
- @vspo-lab/logging: 0.1.0

#### Discord Interaction

- require `cloudflared`

```
# add interaction endpoint to discord portal
cloudflared tunnel --url localhost:3000
```

- tutorial: https://discord.com/developers/docs/tutorials/hosting-on-cloudflare-workers