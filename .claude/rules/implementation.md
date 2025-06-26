---
description: 
globs: 
alwaysApply: false
---
---
description: Code Implementation Guidelines
globs: *.ts
alwaysApply: true
---
1. **Use `Result` for Error Handling**  
   - All error handling should be implemented using the `Result` type.(No Use `try-catch`)
   - When dealing with asynchronous processing using libraries, always use `wrap`.
   - Workspace: `import { Result } from "@vspo-lab/error"`
   - [error-handling.md](mdc:.cursor/rules/error-handling.md)

2. **Use a Custom Library for Date Processing**  
   - Always use the designated custom library for handling dates.  
   - Workspace: `import { Result } from "@vspo-lab/dayjs"`
   - [dayjs.ts](mdc:packages/dayjs/dayjs.ts)

3. Create Tests with Vitest
- Intercept YouTube/Twitch/TwitCasting APIs using MSW and prepare mock data
- Use TestContainers for database testing
- Create concurrent table-driven tests as the basic testing approach
- Example: [stream.test.ts](mdc:service/server/usecase/stream.test.ts)

4. TypeScript First
- [typescript.md](mdc:.cursor/rules/typescript.md)

5. Server Side
- [](mdc:.cursor/rules/frontend-architecture.md)[](mdc:.cursor/rules/server-side.md)[](mdc:.cursor/rules/server-side.md)