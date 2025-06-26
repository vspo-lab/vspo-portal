---
description: 
globs: 
alwaysApply: false
---
---
description: Server Side: Follow DDD and Clean Architecture
globs: *.ts
alwaysApply: true
---

- All implementations should adhere to **Domain-Driven Design (DDD)** principles and **Clean Architecture** best practices.
- Relevant file:  
    - Modeling: [domain_model.md](mdc:service/server/docs/domain_model.md) (must fix)
    - Domain Model: [stream.ts](mdc:service/server/domain/stream.ts)
    - Usecase: [stream.ts](mdc:service/server/usecase/stream.ts)
    - Domain Service: [stream.ts](mdc:service/server/domain/service/stream.ts)
    - Repository: [stream.ts](mdc:service/server/infra/repository/stream.ts)
    - Infra(third party): [index.ts](mdc:service/server/infra/youtube/index.ts)
    - Infra(queue handler): [stream.ts](mdc:service/server/infra/queue/handler/stream.ts)
    - Infra(http router): [stream.ts](mdc:service/server/infra/http/routes/schema/stream.ts)