---
description: 
globs: 
alwaysApply: false
---
---
description: Code lint / Formatter
globs: *.ts, *.tsx
alwaysApply: true
---

After completing a series of modifications, please run this command and continue fixing until all errors are resolved. When making fixes, please ensure that you do not break the existing specifications.

```bash
pwd
# /Users/.../vspo-portal
pnpm biome:format
pnpm biome:unsafe-fix
pnpm build
pnpm tsc
```

