# EstateIn Backend API

Node.js/Express backend for the EstateIn real estate platform.

## Tech Stack

- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js 4.x with TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 14+
- **Auth**: JWT (Bearer tokens) + bcryptjs
- **Email**: Nodemailer
- **Storage**: AWS S3 (LocalStack for dev)
- **Validation**: Zod
- **Logging**: Pino

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start Docker services (PostgreSQL + LocalStack)
docker-compose up -d

# Run database migrations
npx prisma migrate dev

# Seed the database
npm run seed

# Start development server
npm run dev
```

## Demo Accounts

| Role  | Email                | Password  |
|-------|---------------------|-----------|
| Admin | admin@estatein.com  | Password1 |
| Agent | agent@estatein.com  | Password1 |
| Buyer | buyer@estatein.com  | Password1 |

## API Endpoints

### Authentication
| Method | Endpoint                     | Description              |
|--------|------------------------------|--------------------------|
| POST   | /api/auth/register           | Register new user        |
| POST   | /api/auth/login              | Login                    |
| POST   | /api/auth/refresh-token      | Refresh access token     |
| POST   | /api/auth/logout             | Logout                   |
| GET    | /api/auth/me                 | Get current user         |
| POST   | /api/auth/forgot-password    | Request password reset   |
| POST   | /api/auth/reset-password     | Reset password           |

### Properties
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/properties                   | Search/list properties   |
| GET    | /api/properties/:id               | Get property details     |
| POST   | /api/properties/:id/views         | Increment view count     |
| GET    | /api/properties/:id/comparable    | Get comparable properties|
| GET    | /api/properties/:id/price-history | Get price history        |
| GET    | /api/properties/:id/zestimate     | Get zestimate            |
| POST   | /api/properties                   | Create property (auth)   |
| PUT    | /api/properties/:id               | Update property (auth)   |
| DELETE | /api/properties/:id               | Delete property (auth)   |

### Listings
| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | /api/listings                   | List all listings        |
| GET    | /api/listings/:id               | Get listing details      |
| POST   | /api/listings                   | Create listing (agent)   |
| PUT    | /api/listings/:id               | Update listing (owner)   |
| DELETE | /api/listings/:id               | Delete listing (owner)   |
| PUT    | /api/listings/:id/status        | Update listing status    |
| GET    | /api/listings/:id/analytics     | Get listing analytics    |

### Agents
| Method | Endpoint                     | Description              |
|--------|------------------------------|--------------------------|
| GET    | /api/agents                  | List agents              |
| GET    | /api/agents/:id              | Get agent profile        |
| PUT    | /api/agents/:id              | Update agent (self)      |
| POST   | /api/agents/:id/contact      | Contact agent            |
| GET    | /api/agents/:id/reviews      | Get agent reviews        |
| POST   | /api/agents/:id/reviews      | Create review            |

### Inquiries
| Method | Endpoint                           | Description              |
|--------|------------------------------------|--------------------------|
| GET    | /api/inquiries                     | List inquiries           |
| GET    | /api/inquiries/:id                 | Get inquiry details      |
| POST   | /api/inquiries                     | Create inquiry           |
| PUT    | /api/inquiries/:id/status          | Update status            |
| PUT    | /api/inquiries/:id/viewing-status  | Update viewing status    |
| POST   | /api/inquiries/:id/reply           | Reply to inquiry         |
| DELETE | /api/inquiries/:id                 | Delete inquiry           |

### Favorites
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/favorites              | List favorites           |
| POST   | /api/favorites/:propertyId  | Add to favorites         |
| DELETE | /api/favorites/:propertyId  | Remove from favorites    |
| GET    | /api/favorites/:propertyId  | Check if favorited       |

### Saved Searches
| Method | Endpoint                     | Description              |
|--------|------------------------------|--------------------------|
| GET    | /api/saved-searches          | List saved searches      |
| POST   | /api/saved-searches          | Create saved search      |
| PUT    | /api/saved-searches/:id      | Update saved search      |
| DELETE | /api/saved-searches/:id      | Delete saved search      |
| POST   | /api/saved-searches/:id/alert| Trigger search alert     |

### Admin
| Method | Endpoint                              | Description              |
|--------|---------------------------------------|--------------------------|
| GET    | /api/admin/pending-listings           | Pending listings         |
| PUT    | /api/admin/listings/:id/approve       | Approve listing          |
| PUT    | /api/admin/listings/:id/reject        | Reject listing           |
| GET    | /api/admin/users                      | List all users           |
| PUT    | /api/admin/users/:id/status           | Update user status       |
| GET    | /api/admin/stats                      | Platform statistics      |

### Mortgage
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/mortgage/rates         | Get current rates        |
| POST   | /api/mortgage/calculate     | Calculate payment        |
| POST   | /api/mortgage/pre-qualify   | Pre-qualify buyer        |

### Market
| Method | Endpoint                              | Description              |
|--------|---------------------------------------|--------------------------|
| GET    | /api/market/trends/:location          | Market trends            |
| GET    | /api/market/sold/:location            | Sold data                |
| GET    | /api/market/inventory/:location       | Inventory stats          |
| GET    | /api/market/days-on-market/:location  | Days on market           |

### Neighborhoods
| Method | Endpoint                             | Description              |
|--------|--------------------------------------|--------------------------|
| GET    | /api/neighborhoods                   | List neighborhoods       |
| GET    | /api/neighborhoods/:id               | Get neighborhood details |
| GET    | /api/neighborhoods/:id/demographics  | Get demographics         |
| GET    | /api/neighborhoods/:id/schools       | Get nearby schools       |

### Uploads
| Method | Endpoint        | Description              |
|--------|-----------------|--------------------------|
| POST   | /api/uploads    | Upload image (S3)        |
| DELETE | /api/uploads/:key | Delete image           |

## Project Structure

```
estate-backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── scripts/
│   └── init-localstack.sh # LocalStack setup
├── src/
│   ├── config/            # Configuration (DB, AWS, Auth, Email)
│   ├── controllers/       # Route handlers (13 controllers)
│   ├── middleware/         # Auth, validation, errors, rate limit, logging
│   ├── routes/            # Express routes (13 route files + index)
│   ├── services/          # Business logic (auth, email, S3, search, notifications)
│   ├── types/             # TypeScript types
│   ├── utils/             # Utilities (errors, response, JWT, hash)
│   ├── validators/        # Zod schemas (auth, properties, listings, common)
│   ├── app.ts             # Express app setup
│   └── server.ts          # Server entry point
├── .env.example
├── docker-compose.yml
├── package.json
└── tsconfig.json
```
