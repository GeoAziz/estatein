# EstateIn Documentation

| Doc | For | What's in it |
|---|---|---|
| [PRD.md](./PRD.md) | Product/eng leads, anyone scoping new work | Formal Product Requirements Document: goals, personas, in/out of scope, functional & non-functional requirements |
| [SAD.md](./SAD.md) | Engineers, architects | Formal Software Architecture Document: system diagram, auth flow, data model (ERD), deployment architecture, cross-cutting concerns |
| [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md) | Anyone new to the product | Narrative summary of what EstateIn is, who uses it, the feature set by role, tech stack |
| [SETUP.md](./SETUP.md) | Developers | Getting `app/` and `estate-backend/` running locally, env vars, troubleshooting, deploy pipeline |
| [API_REFERENCE.md](./API_REFERENCE.md) | Developers integrating against the API | Every endpoint, auth requirements, request bodies, known gaps |
| [USER_GUIDE.md](./USER_GUIDE.md) | Buyers, agents, admins using the live site | How-to instructions for each role's day-to-day tasks |

Engineering conventions, architecture, and codebase orientation for AI coding agents live in [/CLAUDE.md](../CLAUDE.md) at the repo root — start there if you're about to make changes rather than just read about the product.

Historical implementation notes (`/COMPLETED_IMPLEMENTATIONS.md`, `/IMPLEMENTATION_GUIDE.md`, `/VALIDATION_CHECKLIST.md` at the repo root) track how the Kenya-market feature set was built out against an earlier gap analysis — useful background, but this `docs/` folder is the current source of truth for what the product does and how to work with it.
