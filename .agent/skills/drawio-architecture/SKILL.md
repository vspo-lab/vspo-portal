---
name: Architecture Diagram Creation (draw.io MCP)
description: Create architecture diagrams using the draw.io MCP server (open_drawio_mermaid / open_drawio_xml) and reflect them in docs/infra/diagrams.
user_invocable: true
---

# Trigger Conditions

- Requests for architecture diagrams, system diagrams, or network diagrams
- Requests to create diagrams using draw.io / diagrams.net
- When `open_drawio_mermaid` or `open_drawio_xml` is specified

# Execution Steps

1. Extract target system components and dependencies from `docs/`
2. First create the diagram using `open_drawio_mermaid` (standard approach)
3. Use `open_drawio_xml` only when precise layout is required
4. Save diagram artifacts to `docs/infra/diagrams/` and update corresponding docs

# Rules

- Prioritize draw.io MCP for diagram creation
- Do not just create a diagram and stop; document the intent and how to read it in `docs/`
- Use `kebab-case` naming with descriptive file names

# Reference Documents

- `docs/infra/drawio-mcp.md` - Setup configuration, operational procedures, reference links
- `docs/web-frontend/architecture.md` - Frontend architecture
- `docs/backend/server-architecture.md` - Backend architecture
- `docs/infra/ci-cd.md` - CI/CD and Terraform architecture
