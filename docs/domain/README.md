# Domain Specification

This directory is the **Single Source of Truth** for domain knowledge of the vspo-portal project (Spodule). All domain concepts, entity definitions, use cases, terminology, and architectural decisions are documented here.

## Contents

| File | Description |
| --- | --- |
| `overview.md` | Project overview, vision, target users, tech stack, and non-functional requirements |
| `entities.md` | Domain entities, attributes, relationships, and business rules |
| `usecases.md` | Use case catalog with priorities (MVP / Phase 2 / Phase 3) |
| `glossary.md` | Glossary of ubiquitous language and domain terms |
| `decisions.md` | Architectural Decision Records -- why each decision was made |

## Creation and Update Flow

1. Initial specification: `/domain-spec-kickoff`
2. Specification evolution during implementation: `/domain-doc-evolution`
3. When a specification change occurs, update `docs/domain/` **before** modifying code. Verbal agreements are not specifications.

## Principles

- This directory is the single source of truth for domain knowledge.
- Entity definitions follow Zod Schema First (`z.infer<typeof schema>`).
- Important specification decisions are recorded in `decisions.md` with rationale.
- Undecided items are marked `TBD` with next actions noted in `usecases.md` or `decisions.md`.

## Related

- `docs/plan/` -- Feature-level specification documents (Spec-Driven Development)
- `docs/web-frontend/` -- Frontend technical documentation
- `docs/backend/` -- Backend technical documentation
