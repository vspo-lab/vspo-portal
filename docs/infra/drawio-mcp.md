# Creating Architecture Diagrams with Draw.io MCP

## Research Summary

Research date: 2026-02-28

The `drawio-mcp` official repository presents the following approaches for creating architecture diagrams:

1. MCP App Server (`https://mcp.draw.io/mcp`)
2. MCP Tool Server (`@drawio/mcp`)
3. Skill + CLI (`.drawio` file generation)
4. Project Instructions (no MCP required)

This template **adopts the `MCP Tool Server` as the standard for reproducible operations with Claude Code**.

- Reason 1: You can directly use `open_drawio_mermaid` / `open_drawio_xml` / `open_drawio_csv`
- Reason 2: Can be committed to the project's `.mcp.json` for easy team sharing
- Reason 3: Can be combined with Claude's `settings.json` `permissions.allow` to make operational rules explicit

## Project Standard Configuration

### 1. MCP Server Definition (Project Scope)

`.mcp.json` at the project root:

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["@drawio/mcp"],
      "env": {}
    }
  }
}
```

### 2. Claude Code Permission Settings

`.claude/settings.json` at the project root:

- `permissions.allow` includes read-only commands (`ls`, `cat`, `grep`, `rg`)
- Git read-only commands (`git diff`, `git log`, `git show`)

## Diagram Creation Flow (Standard)

1. Extract structural elements from existing docs (frontend/backend/infra/domain)
2. First create a draft using `open_drawio_mermaid`
3. Switch to `open_drawio_xml` if layout adjustments are needed
4. Save the final artifact as `.drawio` in `docs/infra/diagrams/`
5. Add the change intent and how to read the diagram to the markdown under `docs/infra/`

## Initial Diagrams for This Template

- `docs/infra/diagrams/template-services-architecture.drawio`

This diagram shows the following separation of responsibilities:

- Browser / Next.js Web / Hono API / Database
- OAuth Provider (Google)
- IaC and deployment via Terraform + GitHub Actions

## Recommended Prompt Examples

- `Use the draw.io MCP to create an overall architecture diagram for this repository. Start with open_drawio_mermaid.`
- `Use open_drawio_xml to create a version with color-coded communication paths for web/api/db.`

## References

- drawio-mcp official: <https://github.com/jgraph/drawio-mcp>
- drawio-mcp tool server: <https://github.com/jgraph/drawio-mcp/tree/main/mcp-tool-server>
- Claude Code MCP: <https://docs.anthropic.com/en/docs/claude-code/mcp>
- Claude Code settings/permissions: <https://docs.anthropic.com/en/docs/claude-code/settings>
