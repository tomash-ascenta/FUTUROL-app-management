# Architecture Documentation

Architektura Futurol App - Centrální datová platforma pro správu zákazníků, zakázek a zaměření pergol.

> **Vlastník software:** Ascenta Lab | **Zákazník:** FARDAL s.r.o. (Futurol.cz)

---

## 📋 Obsah

- [High-Level Overview](#high-level-overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Authentication Flow](#authentication-flow)
- [Data Flow](#data-flow)
- [API Design](#api-design)
- [File Structure](#file-structure)

---

## High-Level Overview

Futurol App je full-stack TypeScript aplikace postavená na SvelteKit frameworku. Slouží jako centrální systém pro:

1. **Interní zaměstnance** (10 uživatelů) - správa zákazníků, zakázek, zaměření, servisů
2. **B2C zákazníky** - veřejný rádce výběru pergoly s lead capture

### Klíčové vlastnosti

- 📱 **Responzivní** - mobile-first design
- 🔐 **Bezpečné** - JWT auth, bcrypt, rate limiting
- 🚀 **Rychlé** - server-side rendering, optimalizované bundle
- 📊 **Data-driven** - PostgreSQL s Prisma ORM
- 🐳 **Containerized** - Docker deployment

---

## Tech Stack

```mermaid
graph TB
    subgraph "Frontend"
        A[Svelte 5] --> B[SvelteKit 2]
        B --> C[TailwindCSS]
        B --> D[TypeScript]
    end
    
    subgraph "Backend"
        E[SvelteKit API Routes] --> F[Prisma ORM]
        F --> G[PostgreSQL 16]
        E --> H[JWT Auth]
    end
    
    subgraph "Infrastructure"
        I[Docker] --> J[Nginx]
        J --> K[Let's Encrypt SSL]
    end
    
    B --> E
    I --> B
```

### Dependency Matrix

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | SvelteKit | 2.x | Full-stack framework |
| **UI** | Svelte | 5.x | Reactive components |
| **Styling** | TailwindCSS | 3.4 | Utility-first CSS |
| **Language** | TypeScript | 5.x | Type safety |
| **ORM** | Prisma | 5.x | Database toolkit |
| **Database** | PostgreSQL | 16 | Relational DB |
| **Auth** | jsonwebtoken | 9.x | JWT tokens |
| **Hashing** | bcrypt | 6.x | Password hashing |
| **Icons** | lucide-svelte | 0.469 | Icon library |
| **PDF** | jsPDF + autotable | 4.x / 5.x | PDF generation |
| **Runtime** | Node.js | 20 LTS | Server runtime |
| **Container** | Docker | - | Containerization |
| **Web Server** | Nginx | - | Reverse proxy |

---

## System Architecture

### Deployment Architecture

```mermaid
graph LR
    subgraph "GitHub"
        A[develop branch] -->|push| B[GitHub Actions]
        C[main branch] -->|push| B
    end
    
    subgraph "Build"
        B -->|build| D[GHCR :develop]
        B -->|build| E[GHCR :latest]
    end
    
    subgraph "Stage (37.46.209.39)"
        D -->|pull| F[Stage App]
        F --> G[(Stage DB)]
    end
    
    subgraph "Production (37.46.209.22)"
        E -->|pull| H[Prod App]
        H --> I[(Prod DB)]
    end
    
    G -.->|nightly sync| I
    
    style A fill:#fff4e6
    style C fill:#e8f5e9
    style F fill:#e1f5ff
    style H fill:#f3e5f5
```

### Environments

| Environment | URL | Branch | Server IP |
|-------------|-----|--------|-----------|
| Production | futurol.ascentalab.cz | `main` | 37.46.209.22 |
| Stage | stage.futurol.ascentalab.cz | `develop` | 37.46.209.39 |

### Feature Flags Architecture

```mermaid
graph TB
    A[ENV: LICENSE_TIER] -->|basic/full| B[features.ts]
    B --> C{hasFeature?}
    C -->|yes| D[Show Module]
    C -->|no| E[Hide/Redirect]
    
    subgraph "Basic Tier"
        F[Zákazníci]
        G[Zaměření]
        H[Poptávky]
    end
    
    subgraph "Full Tier"
        I[Zakázky]
        J[Servis]
        K[Reporty]
    end
```

### Original Architecture

```mermaid
graph LR
    A[Client Browser] -->|HTTPS| B[Nginx]
    B -->|Reverse Proxy| C[SvelteKit App<br/>Port 8081]
    C -->|Prisma| D[(PostgreSQL<br/>Port 5433)]
    B -->|SSL| E[Let's Encrypt]
    C -->|Upload| F[/uploads Volume]
    D -->|Persist| G[postgres_data Volume]
    
    style A fill:#e1f5ff
    style B fill:#fff4e6
    style C fill:#f3e5f5
    style D fill:#e8f5e9
```

### Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Nginx
    participant SvelteKit
    participant Prisma
    participant PostgreSQL
    
    Client->>Nginx: HTTPS Request
    Nginx->>SvelteKit: Proxy to :8081
    
    alt Has auth_token cookie
        SvelteKit->>SvelteKit: Verify JWT
        SvelteKit->>Prisma: Check employee active
        Prisma->>PostgreSQL: Query
        PostgreSQL-->>Prisma: Result
        Prisma-->>SvelteKit: Employee data
    end
    
    SvelteKit->>Prisma: Business logic
    Prisma->>PostgreSQL: SQL Query
    PostgreSQL-->>Prisma: Data
    Prisma-->>SvelteKit: Result
    SvelteKit-->>Nginx: HTML/JSON
    Nginx-->>Client: Response
```

### Container Architecture

```
┌─────────────────────────────────────────┐
│  Docker Host (VPS)                      │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  futurol-app Container         │    │
│  │                                 │    │
│  │  - Node.js 20                  │    │
│  │  - SvelteKit App               │    │
│  │  - Port 3000 -> 8081           │    │
│  │  - /app/uploads volume         │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  futurol-db Container          │    │
│  │                                 │    │
│  │  - PostgreSQL 16               │    │
│  │  - Port 5432 -> 5433           │    │
│  │  - postgres_data volume        │    │
│  └────────────────────────────────┘    │
│                                         │
│  Network: futurol-app_default          │
└─────────────────────────────────────────┘
```

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    Employee ||--o{ Measurement : creates
    Employee ||--o{ ServiceTicket : assigned
    Employee ||--o{ AuditLog : performs
    Employee ||--o{ OrderStatusHistory : changes
    
    Customer ||--o{ Location : has
    Customer ||--o{ Order : places
    Customer ||--o{ Lead : converts_from
    Customer ||--o{ ServiceTicket : requests
    
    Location ||--o{ Order : for
    
    Product ||--o{ Order : type
    
    Order ||--o| Measurement : has
    Order ||--o{ ServiceTicket : generates
    Order ||--o{ OrderStatusHistory : tracks
    
    Employee {
        uuid id PK
        string personalNumber UK
        string pin
        string fullName
        enum roles
        boolean isActive
    }
    
    Customer {
        uuid id PK
        string fullName
        string companyName
        string phone
        string email
        enum type
        enum source
    }
    
    Order {
        uuid id PK
        string orderNumber UK
        uuid customerId FK
        uuid locationId FK
        uuid productId FK
        enum status
    }
    
    Quote {
        uuid id PK
        string quoteNumber UK
        uuid orderId FK
        decimal amount
        enum status
    }
    
    Measurement {
        uuid id PK
        uuid orderId FK
        uuid employeeId FK
        int width
        int depth
        int height
        json details
    }
```

### Core Entities

#### Employee (Zaměstnanec)
```typescript
{
  id: uuid
  personalNumber: string (4 digits, unique)
  pin: string (hashed)
  fullName: string
  roles: Role[] (multi-role)
  isActive: boolean
  
  // Relations
  measurements: Measurement[]
  serviceTickets: ServiceTicket[]
  auditLogs: AuditLog[]
}

enum Role {
  admin, director, sales, 
  production_manager, surveyor, technician
}
```

#### Customer (Zákazník)
```typescript
{
  id: uuid
  fullName: string
  phone: string (required)
  email?: string
  company?: string
  source: CustomerSource (manual | advisor | import | web)
  
  // Relations
  locations: Location[]
  orders: Order[]
  leads: Lead[]
  serviceTickets: ServiceTicket[]
}
```

#### Order (Zakázka)
```typescript
{
  id: uuid
  orderNumber: string (FUT-YYYY-NNNN)
  customerId: uuid FK
  locationId: uuid FK
  productId?: uuid FK
  status: OrderStatus (9 stavů)
  priority: Priority
  deadlineAt?: datetime
  
  // Relations
  measurement?: Measurement
  quotes: Quote[]
  serviceTickets: ServiceTicket[]
  statusHistory: OrderStatusHistory[]
}

enum OrderStatus {
  lead →           // Nový lead
  customer →       // Kontaktovaný zákazník
  quote_sent →     // Odeslaná nabídka
  measurement →    // Naplánované zaměření
  contract →       // Podepsaná smlouva
  production →     // Ve výrobě
  installation →   // Montáž
  handover |       // Předáno zákazníkovi
  cancelled        // Zrušeno
}
```

#### Measurement (Zaměření)
```typescript
{
  id: uuid
  orderId: uuid FK (unique)
  employeeId: uuid FK
  measuredAt: datetime
  
  // Core measurements
  pergolaType: string
  width: int (mm)
  depth: int (mm)
  height: int (mm)
  clearanceHeight?: int (mm)
  
  // Flexible data
  details: json {
    roofPanels, legCount, legLength,
    colorFrame, colorRoof,
    wallType, insulation, anchoring,
    electrical, accessories, screens,
    installationNotes, additionalNotes
  }
  
  // Media
  photos: string[]
  pdfUrl?: string
  
  // Metadata
  gpsLat?, gpsLng?
  deviceInfo?: json
}
```

### Data Model Design Decisions

**Proč JSONB pro measurement.details?**
- ✅ Flexibilita - různé typy pergol mají různá pole
- ✅ Rychlá iterace - nové fieldy bez migrace
- ✅ Zachování struktury dat z formuláře
- ❌ Mínus: Nemůžeš indexovat vnořené pole

**Proč multi-role na Employee?**
- ✅ Realita - zaměstnanec může být zaměřovač + technik
- ✅ Jednoduší oprávnění - array.includes(role)
- ✅ Audit trail - vidíš všechny role v historii

**Proč soft delete?**
- ✅ Data retention - neztrácíme historii
- ✅ Audit - vidíme, co bylo smazáno
- ✅ Recovery - můžeme obnovit
- Implementováno přes `isActive` flag

---

## Authentication Flow

### Login Process

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API /auth/login
    participant RL as Rate Limiter
    participant DB as Database
    participant J as JWT
    
    U->>F: Enter PIN (4+6 digits)
    F->>A: POST personalNumber + pin
    
    A->>RL: Check rate limit
    alt Too many attempts
        RL-->>A: Blocked
        A-->>F: 429 Too Many Requests
        F-->>U: Wait 15 minutes
    end
    
    A->>DB: Find employee by personalNumber
    alt Not found
        DB-->>A: null
        A-->>F: 401 Unauthorized
    end
    
    A->>A: bcrypt.compare(pin, hashedPin)
    alt Invalid PIN
        A-->>F: 401 Unauthorized
    end
    
    alt Employee inactive
        A-->>F: 401 Account disabled
    end
    
    A->>J: Sign JWT (8h expiry)
    J-->>A: token
    
    A->>F: Set httpOnly cookie
    A-->>F: 200 + user data
    F-->>U: Redirect to dashboard
```

### Session Validation (hooks.server.ts)

```mermaid
graph TD
    A[Request] --> B{Has auth_token?}
    B -->|No| C{Public route?}
    C -->|Yes| D[Allow]
    C -->|No| E[Redirect to /login]
    
    B -->|Yes| F[Verify JWT]
    F --> G{Valid token?}
    G -->|No| E
    
    G -->|Yes| H[Query employee]
    H --> I{Active & exists?}
    I -->|No| J[Delete cookie]
    J --> E
    
    I -->|Yes| K[Set locals.user]
    K --> L[Continue to route]
    
    style D fill:#a5d6a7
    style L fill:#a5d6a7
    style E fill:#ef9a9a
```

### Authorization Levels

```typescript
// Public routes (no auth)
['/login', '/radce', '/api/auth/login', '/api/inquiries']

// Authenticated routes (any logged-in user)
['/dashboard', '/api/customers', '/api/orders']

// Role-based routes
{
  admin: ['ALL'],
  director: ['READ_ONLY'],
  sales: ['customers', 'orders', 'leads'],
  surveyor: ['measurements', 'service'],
  technician: ['service'],
  production_manager: ['orders:read', 'measurements:read']
}
```

---

## Data Flow

### B2C Rádce → Lead → Customer → Order

```mermaid
graph LR
    A[Visitor] -->|Vyplní dotazník| B[Rádce]
    B -->|Algoritmus| C[Doporučení produktu]
    C -->|Lead capture| D[Lead v DB]
    
    D -->|Obchodník kontaktuje| E[Customer]
    E -->|Objednávka| F[Order: status=lead]
    
    F -->|Zaměřovač| G[Measurement]
    G -->|Auto update| H[Order: status=measurement_done]
    
    H -->|Nabídka| I[Order: status=quote_sent]
    I -->|Schválení| J[Order: status=quote_approved]
    J -->|Výroba| K[Order: status=in_production]
    K -->|Montáž| L[Order: status=installed]
    L -->|Předání| M[Order: status=completed]
    
    style D fill:#fff9c4
    style E fill:#c8e6c9
    style M fill:#a5d6a7
```

### Measurement Data Flow

```mermaid
graph TD
    A[Zaměřovač v terénu] --> B[Vyplní 7-krokový formulář]
    B --> C[Submit API /measurements]
    
    C --> D[Validace Zod schema]
    D --> E[Uložení do DB]
    E --> F[Změna Order.status]
    E --> G[Vytvoření StatusHistory]
    
    H[Zobrazení detailu] --> I[Inline editace polí]
    I --> J[PATCH /measurements/:id]
    J --> E
    
    K[Export PDF] --> L[GET /measurements/:id/pdf]
    L --> M{PDF existuje?}
    M -->|Ano| N[Stáhnout existující]
    M -->|Ne| O[Generovat jsPDF]
    O --> P[Uložit do /uploads]
    P --> N
```

---

## API Design

### RESTful Principles

```
Resource-based URLs:
  ✅ GET    /api/customers
  ✅ POST   /api/customers
  ✅ GET    /api/customers/:id
  ✅ PUT    /api/customers/:id
  ✅ DELETE /api/customers/:id

Nested resources:
  ✅ POST   /api/orders/:orderId/measurement
  ✅ GET    /api/customers/:id/orders

Action endpoints:
  ✅ PATCH  /api/service-tickets/:id/resolve
  ✅ POST   /api/auth/change-pin
```

### Response Format

**Success (200/201):**
```json
{
  "customer": { ... },
  "pagination": { ... }
}
```

**Error (4xx/5xx):**
```json
{
  "error": "Validation failed",
  "details": {
    "phone": "Invalid format"
  }
}
```

### Pagination Pattern

```typescript
// Query params
?page=1&limit=20&sortBy=createdAt&sortOrder=desc

// Response
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

## File Structure

```
futurol-app/
├── src/
│   ├── lib/
│   │   ├── components/          # Reusable Svelte components
│   │   │   ├── ui/             # Basic UI (Button, Input...)
│   │   │   └── features/       # Feature components (CustomerCard...)
│   │   ├── server/             # Server-only code
│   │   │   ├── auth.ts         # JWT + bcrypt utilities
│   │   │   ├── db.ts           # Prisma client singleton
│   │   │   └── rateLimit.ts    # Rate limiting
│   │   ├── stores/             # Svelte stores
│   │   │   └── user.ts         # User state
│   │   └── utils/              # Shared utilities
│   │       └── index.ts        # Helper functions
│   ├── routes/                 # SvelteKit file-based routing
│   │   ├── +layout.svelte      # Root layout
│   │   ├── +page.svelte        # Homepage
│   │   ├── api/                # API endpoints
│   │   │   ├── auth/
│   │   │   ├── customers/
│   │   │   ├── orders/
│   │   │   └── measurements/
│   │   ├── dashboard/          # Protected app
│   │   │   ├── +layout.server.ts  # Auth check
│   │   │   ├── customers/
│   │   │   ├── orders/
│   │   │   └── measurements/
│   │   ├── login/              # Login page
│   │   └── radce/              # Public advisor
│   ├── hooks.server.ts         # Request interceptor
│   ├── app.html                # HTML shell
│   └── app.css                 # Global styles
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Seed data
│   └── migrations/             # DB migrations
├── static/                     # Static assets
│   ├── futurol-logo.svg
│   └── sky-background.webp
├── uploads/                    # User uploads
│   └── measurements/           # PDF exports
├── docker-compose.yml          # Container orchestration
├── Dockerfile                  # App container
├── futurol-nginx.conf         # Nginx config
└── deploy.sh                   # Deployment script
```

### Routing Convention

```
SvelteKit file-based routing:

/routes/dashboard/customers/+page.svelte
  → GET /dashboard/customers
  
/routes/api/customers/+server.ts
  → API /api/customers (GET, POST)
  
/routes/api/customers/[id]/+server.ts
  → API /api/customers/:id (GET, PUT, DELETE)
  
/routes/dashboard/+layout.server.ts
  → Server load function for all /dashboard/* routes
```

---

## Performance Considerations

### Frontend Optimization
- ✅ Server-side rendering (SSR)
- ✅ Code splitting per route
- ✅ WebP images (sky background)
- ✅ TailwindCSS tree-shaking
- ✅ Lazy component loading

### Backend Optimization
- ✅ Prisma query optimization (select only needed fields)
- ✅ Database indexing (unique constraints, FKs)
- ✅ Connection pooling (Prisma default)
- ✅ Rate limiting (prevent abuse)

### Database Optimization
```sql
-- Indexes (auto-created by Prisma)
CREATE UNIQUE INDEX employees_personalNumber_idx ON employees(personalNumber);
CREATE UNIQUE INDEX orders_orderNumber_idx ON orders(orderNumber);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_customerId_idx ON orders(customerId);
```

---

## Security Architecture

### Defense in Depth

```
Layer 1: Network (Firewall, HTTPS only)
Layer 2: Application (Nginx reverse proxy)
Layer 3: Authentication (JWT + bcrypt + rate limiting)
Layer 4: Authorization (Role-based access control)
Layer 5: Data (Input validation, SQL injection prevention)
Layer 6: Audit (Logging all sensitive operations)
```

### Security Headers (Nginx)

```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

---

**Naposledy aktualizováno:** 13. ledna 2026  
**Verze:** 1.0
