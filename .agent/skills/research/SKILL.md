---
name: research
description: Technical research and specification verification skill using Context7 MCP. Used for checking the latest library/framework documentation, verifying API specifications, confirming version differences, and gathering evidence for implementation decisions. Especially useful for investigating "latest", "recommended", "breaking changes", and "migration steps".
---

# Trigger Conditions

- When receiving a research request such as "I want to check the latest specification" or "I want to confirm the official recommendation"
- When compatibility verification is needed before introducing or upgrading a library or framework
- When implementation decisions need to be backed by primary sources

# Research Flow

1. Clarify the target library name, target version, and implementation purpose
2. Resolve the library ID using `mcp__context7__resolve-library-id`
3. Investigate per use case using `mcp__context7__query-docs`
4. Verify important findings against English primary sources (official docs / official blog / release notes / RFC)
5. Organize the response in order of: Conclusion -> Evidence -> Impact Scope -> Unresolved Items

# Important Rules

- The primary source for technical research is Context7 MCP
- Prefer English versions of technical documentation
- Treat Japanese articles as supplementary information; assertions must be limited to content verified against primary sources
- For requests about "latest" or "as of today", always note the reference date, last updated date, and target version
- For breaking changes, deprecations, and security fixes, verify up to release notes/changelog
- Do not mix speculation with facts. Clearly label speculation

# When Context7 Is Unavailable

- Prioritize official documentation, official GitHub, and official release notes
- Annotate information obtained through alternative research with "Context7 not used"
- Separate weakly-evidenced information as an additional verification task before finalizing implementation

# Output Format

- `Conclusion`: Key points for the quickest decision-making
- `Evidence`: Reference links (English preferred) and key points
- `Impact Scope`: Affected layers, files, and configurations
- `Unresolved Items`: Items requiring further confirmation

# Research Quality Check

- Did you specify the library name, version, and runtime environment (Node/Browser/Edge, etc.)?
- Are references primarily from primary sources?
- Are dates and versions consistent?
- Are speculation and facts separated?
- Did you present actionable next steps directly linked to implementation?
