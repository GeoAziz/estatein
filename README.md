# EstateIn

Real estate marketplace for the Kenyan market — property search, listings, agent tools, and an admin approval workflow, with KSh currency, county/estate geography, and M-Pesa payments built in.

## Repository layout

- [`app/`](./app) — React 19 + TypeScript + Vite frontend
- [`estate-backend/`](./estate-backend) — Express + TypeScript + Prisma/PostgreSQL API
- [`docs/`](./docs) — product and engineering documentation (start at [`docs/README.md`](./docs/README.md))
- [`CLAUDE.md`](./CLAUDE.md) — codebase orientation and engineering conventions

## Quick start

See [`docs/SETUP.md`](./docs/SETUP.md) for full instructions. Short version:

```bash
# Backend
cd estate-backend && npm install && cp .env.example .env
docker-compose up -d && npx prisma migrate dev && npm run seed && npm run dev

# Frontend (separate terminal)
cd app && npm install && npm run dev
```

Demo accounts (password `Password1`): `admin@estatein.com`, `agent@estatein.com`, `buyer@estatein.com`.

## Documentation

| Doc | What's in it |
|---|---|
| [PRD](./docs/PRD.md) | Product requirements: goals, personas, scope |
| [SAD](./docs/SAD.md) | Software architecture: system diagram, data model, deployment |
| [Product Overview](./docs/PRODUCT_OVERVIEW.md) | Narrative summary of the product |
| [Setup](./docs/SETUP.md) | Local development guide |
| [API Reference](./docs/API_REFERENCE.md) | Full endpoint reference |
| [User Guide](./docs/USER_GUIDE.md) | How-to guide for buyers, agents, admins |
