# Futurol App - Projektová specifikace

*Verze: 1.1 | Datum: 14. ledna 2026*

> **📌 Tento dokument je "source of truth" pro projekt Futurol App.**

---

## 1. Přehled projektu

### Vize
Centrální datová platforma pro firmu Futurol.cz – správa zákazníků, zakázek, zaměření, servisů a firemních KPI. Data vstupují z různých zdrojů (mobilní app, Excel import, B2C rádce) do jednotné databáze.

### Klíčové vlastnosti
- 📱 Responzivní web-app (mobil, tablet, desktop)
- 👥 Role-based přístup (10 zaměstnanců)
- 🎯 B2C Rádce výběru pergoly (veřejný dotazník)
- 📊 Dashboard s KPI pro vedení
- 📥 Flexibilní import dat (Excel, CSV)
- 📄 PDF export (technologické zadání)
- 🔔 Push notifikace

### Uživatelé
| Typ | Počet | Přístup |
|-----|-------|---------|
| Zaměstnanci | ~10 | Přihlášení (číslo + PIN) |
| B2C zákazníci | jednotky/den | Veřejný Rádce |

---

## 2. Tech Stack

| Vrstva | Technologie | Verze |
|--------|-------------|-------|
| **Frontend** | SvelteKit | 2.x |
| **Styling** | TailwindCSS + shadcn-svelte | 3.x |
| **Backend** | Node.js + Fastify | 20 LTS / 4.x |
| **ORM** | Prisma | 5.x |
| **Databáze** | PostgreSQL | 16 |
| **Jazyk** | TypeScript | 5.x |
| **Auth** | Custom JWT + httpOnly cookies | - |
| **Push** | Web Push API | - |
| **PDF** | Puppeteer nebo PDFKit | - |
| **Storage** | Google Drive API | - |
| **Kontejnerizace** | Docker + docker-compose | - |
| **CI/CD** | GitHub Actions + GHCR | - |
| **Hosting** | VPS + Nginx + Let's Encrypt | - |

### Proč tento stack?
- **SvelteKit** – nejmodernější DX, skvělé pro formuláře, minimální bundle
- **Fastify** – rychlý, TypeScript-first, schema validace
- **Prisma** – type-safe, migrations, skvělá DX
- **TypeScript všude** – sdílené typy FE/BE

---

## 3. Role uživatelů

| Role | Kód | Popis | Moduly |
|------|-----|-------|--------|
| **Admin** | `admin` | Správa systému | Vše + nastavení |
| **Ředitel** | `director` | Dashboard, reporty | Dashboard, Reporty, Read-only vše |
| **Obchodník** | `sales` | Péče o zákazníky | Zákazníci, Zakázky, Leady |
| **Vedoucí výroby** | `production_manager` | Přehled zadání | Zadání do výroby, Výroba |
| **Zaměřovač** | `surveyor` | Zaměření v terénu | Zaměření, Servis |
| **Servisní technik** | `technician` | Servisní zásahy | Servis |

> Zaměstnanec může mít **více rolí** (např. zaměřovač + technik)

---

## 4. Databázové schéma

### 4.1 Core Entities

```prisma
// ============================================
// EMPLOYEE - Zaměstnanec
// ============================================
model Employee {
  id            String   @id @default(uuid())
  personalNumber String  @unique // 4 číslice (0001-9999)
  pin           String   // 6 číslic, hashed
  fullName      String
  email         String?
  phone         String?
  roles         Role[]   // Multi-role
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  measurements  Measurement[]
  serviceTickets ServiceTicket[]
  auditLogs     AuditLog[]
}

enum Role {
  admin
  director
  sales
  production_manager
  surveyor
  technician
}

// ============================================
// CUSTOMER - Zákazník
// ============================================
model Customer {
  id            String   @id @default(uuid())
  fullName      String
  email         String?
  phone         String
  company       String?  // Firma (pokud B2B)
  note          String?
  source        CustomerSource @default(manual)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  locations     Location[]
  orders        Order[]
  leads         Lead[]
}

enum CustomerSource {
  manual        // Ruční zadání
  advisor       // Z Rádce
  import        // Excel import
  web           // Z webu (budoucí)
}

// ============================================
// LOCATION - Místo realizace
// ============================================
model Location {
  id            String   @id @default(uuid())
  customerId    String
  customer      Customer @relation(fields: [customerId], references: [id])
  
  street        String
  city          String
  zip           String
  country       String   @default("CZ")
  gpsLat        Float?
  gpsLng        Float?
  note          String?  // Poznámky k přístupu apod.
  
  createdAt     DateTime @default(now())
  
  // Relations
  orders        Order[]
}

// ============================================
// PRODUCT - Typ pergoly
// ============================================
model Product {
  id            String   @id @default(uuid())
  code          String   @unique // KLIMO, HORIZONTAL, KLASIK...
  name          String
  description   String?
  isActive      Boolean  @default(true)
  
  // Relations
  orders        Order[]
  advisorResults AdvisorResult[]
}
```

### 4.2 Order & Workflow

```prisma
// ============================================
// ORDER - Zakázka (hlavní entita)
// ============================================
model Order {
  id            String      @id @default(uuid())
  orderNumber   String      @unique // FUT-2026-0001
  
  customerId    String
  customer      Customer    @relation(fields: [customerId], references: [id])
  
  locationId    String
  location      Location    @relation(fields: [locationId], references: [id])
  
  productId     String?
  product       Product?    @relation(fields: [productId], references: [id])
  
  status        OrderStatus @default(lead)
  priority      Priority    @default(normal)
  
  estimatedValue Decimal?   // Předběžná cena
  finalValue     Decimal?   // Finální cena
  
  deadlineAt    DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  // Relations
  measurement   Measurement?
  serviceTickets ServiceTicket[]
  statusHistory OrderStatusHistory[]
}

enum OrderStatus {
  lead              // Nový lead (z Rádce nebo ručně)
  contacted         // Kontaktován
  measurement_scheduled // Naplánováno zaměření
  measurement_done  // Zaměřeno
  quote_sent        // Nabídka odeslána
  quote_approved    // Nabídka schválena
  in_production     // Ve výrobě
  production_done   // Vyrobeno
  installation_scheduled // Naplánována montáž
  installed         // Namontováno
  completed         // Dokončeno (předáno)
  cancelled         // Zrušeno
}

enum Priority {
  low
  normal
  high
  urgent
}

// ============================================
// ORDER STATUS HISTORY - Historie stavů
// ============================================
model OrderStatusHistory {
  id            String      @id @default(uuid())
  orderId       String
  order         Order       @relation(fields: [orderId], references: [id])
  
  fromStatus    OrderStatus?
  toStatus      OrderStatus
  changedById   String?
  note          String?
  createdAt     DateTime    @default(now())
}
```

### 4.3 Measurement (Zaměření)

```prisma
// ============================================
// MEASUREMENT - Zaměření (flexibilní struktura)
// ============================================
model Measurement {
  id            String   @id @default(uuid())
  orderId       String   @unique
  order         Order    @relation(fields: [orderId], references: [id])
  
  employeeId    String
  employee      Employee @relation(fields: [employeeId], references: [id])
  
  measuredAt    DateTime @default(now())
  
  // === CORE FIELDS (vždy vyplněné) ===
  pergolaType   String   // HORIZONTAL, KLASIK, etc.
  width         Int      // mm
  depth         Int      // mm
  height        Int      // mm (montážní výška)
  clearanceHeight Int?   // mm (podchozí výška)
  
  // === FLEXIBLE DETAILS (JSONB) ===
  // Obsahuje všechny detaily z formuláře "ZÁKLADNÍ ÚDAJE"
  details       Json     // Viz struktura níže
  
  // === PHOTOS ===
  photos        String[] // Google Drive URLs
  
  // === METADATA ===
  deviceInfo    Json?    // { os, browser, appVersion }
  gpsLat        Float?
  gpsLng        Float?
  
  // === PDF ===
  pdfUrl        String?  // URL vygenerovaného PDF
  pdfGeneratedAt DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// Struktura details (JSONB):
// {
//   "roofPanels": 4,
//   "legCount": 2,
//   "legLength": 2500,
//   "colorFrame": "RAL 7016",
//   "colorRoof": "RAL 9003",
//   "wallType": "cihla",
//   "insulation": { "type": "EPS", "thickness": 150 },
//   "anchoring": { "type": "závitové tyče", "count": 6 },
//   "concreteFootings": { "needed": true, "count": 2 },
//   "drainOutput": "vpravo",
//   "electrical": {
//     "inlet": "levá přední noha",
//     "preparation": ["vzadu vlevo", "vpředu vpravo"]
//   },
//   "accessories": {
//     "remote": "Situo 5 io Pure II",
//     "motor": "IO",
//     "windSensor": true,
//     "led": { "type": "COB 4000K", "count": 2 },
//     "outlets": 2
//   },
//   "screens": {
//     "front": { "width": 4500, "fabric": "SE6-007007" },
//     "left": null,
//     "right": { "width": 3200, "fabric": "SE6-007007" }
//   },
//   "installationNotes": {
//     "parking": "před domem, vjezd 3m",
//     "terrain": "v pořádku",
//     "duration": "1 den"
//   },
//   "additionalNotes": "Zákazník žádá montáž v sobotu"
// }
```

### 4.4 Service & Leads

```prisma
// ============================================
// SERVICE TICKET - Servisní požadavek
// ============================================
model ServiceTicket {
  id            String        @id @default(uuid())
  ticketNumber  String        @unique // SRV-2026-0001
  
  orderId       String?
  order         Order?        @relation(fields: [orderId], references: [id])
  
  customerId    String
  customer      Customer      @relation(fields: [customerId], references: [id])
  
  assignedToId  String?
  assignedTo    Employee?     @relation(fields: [assignedToId], references: [id])
  
  type          ServiceType
  status        ServiceStatus @default(new)
  priority      Priority      @default(normal)
  
  description   String
  resolution    String?
  
  scheduledAt   DateTime?
  resolvedAt    DateTime?
  
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

enum ServiceType {
  warranty      // Záruční oprava
  paid          // Placený servis
  maintenance   // Údržba
  complaint     // Reklamace
}

enum ServiceStatus {
  new           // Nový
  assigned      // Přiřazeno technikovi
  scheduled     // Naplánováno
  in_progress   // V řešení
  resolved      // Vyřešeno
  closed        // Uzavřeno
}

// ============================================
// LEAD - Lead z Rádce
// ============================================
model Lead {
  id            String   @id @default(uuid())
  
  // Kontakt
  name          String?
  email         String?
  phone         String?
  
  // Výsledek rádce
  answers       Json     // { q1: [1,3], q2: [2], ... }
  scores        Json     // { KLIMO: 12, HORIZONTAL: 8, ... }
  recommendedProduct String // Kód produktu
  
  // Poznámky zákazníka
  customerNote  String?
  
  // Konverze
  customerId    String?
  customer      Customer? @relation(fields: [customerId], references: [id])
  convertedAt   DateTime?
  
  // Metadata
  ipAddress     String?
  userAgent     String?
  utmSource     String?
  utmMedium     String?
  utmCampaign   String?
  
  createdAt     DateTime @default(now())
}
```

### 4.5 System Entities

```prisma
// ============================================
// AUDIT LOG - Historie změn
// ============================================
model AuditLog {
  id            String   @id @default(uuid())
  
  employeeId    String?
  employee      Employee? @relation(fields: [employeeId], references: [id])
  
  action        String   // CREATE, UPDATE, DELETE, LOGIN, EXPORT...
  entityType    String   // Order, Customer, Measurement...
  entityId      String?
  
  oldValue      Json?
  newValue      Json?
  
  ipAddress     String?
  userAgent     String?
  
  createdAt     DateTime @default(now())
}

// ============================================
// IMPORT LOG - Historie importů
// ============================================
model ImportLog {
  id            String       @id @default(uuid())
  
  employeeId    String
  fileName      String
  fileType      String       // xlsx, csv
  
  status        ImportStatus
  totalRows     Int
  successRows   Int
  errorRows     Int
  
  errors        Json?        // [{ row: 5, field: "phone", error: "Invalid format" }]
  
  createdAt     DateTime     @default(now())
}

enum ImportStatus {
  processing
  completed
  failed
  partial
}

// ============================================
// NOTIFICATION - Push notifikace
// ============================================
model PushSubscription {
  id            String   @id @default(uuid())
  employeeId    String
  
  endpoint      String
  p256dh        String
  auth          String
  
  createdAt     DateTime @default(now())
}
```

---

## 5. Autentizace

### Flow přihlášení
```
1. Uživatel zadá 4-místné osobní číslo
2. Uživatel zadá 6-místný PIN
3. Backend ověří credentials
4. Vytvoří JWT token (exp: 3 min pro session refresh)
5. Uloží do httpOnly cookie
6. Redirect na dashboard dle role
```

### Session management
- **Access token**: 3 minuty (v paměti)
- **Refresh token**: 7 dní (httpOnly cookie)
- **Inaktivita**: Auto-logout po 3 min bez aktivity
- **PIN změna**: Pouze Admin

---

---

## 6. API Endpointy

### 6.1 Autentizace

| Method | Endpoint | Popis | Auth |
|--------|----------|-------|------|
| `POST` | `/api/auth/login` | Přihlášení (číslo + PIN) | ❌ |
| `POST` | `/api/auth/refresh` | Obnovení tokenu | 🔒 |
| `POST` | `/api/auth/logout` | Odhlášení | 🔒 |
| `GET` | `/api/auth/me` | Aktuální uživatel | 🔒 |

### 6.2 Zaměstnanci (Admin only)

| Method | Endpoint | Popis |
|--------|----------|-------|
| `GET` | `/api/employees` | Seznam zaměstnanců |
| `GET` | `/api/employees/:id` | Detail zaměstnance |
| `POST` | `/api/employees` | Vytvořit zaměstnance |
| `PATCH` | `/api/employees/:id` | Upravit zaměstnance |
| `PATCH` | `/api/employees/:id/pin` | Změnit PIN |
| `DELETE` | `/api/employees/:id` | Deaktivovat zaměstnance |

### 6.3 Zákazníci

| Method | Endpoint | Popis | Role |
|--------|----------|-------|------|
| `GET` | `/api/customers` | Seznam zákazníků | all |
| `GET` | `/api/customers/:id` | Detail zákazníka | all |
| `POST` | `/api/customers` | Vytvořit zákazníka | sales, admin |
| `PATCH` | `/api/customers/:id` | Upravit zákazníka | sales, admin |
| `GET` | `/api/customers/:id/orders` | Zakázky zákazníka | all |
| `GET` | `/api/customers/:id/locations` | Adresy zákazníka | all |

### 6.4 Zakázky

| Method | Endpoint | Popis | Role |
|--------|----------|-------|------|
| `GET` | `/api/orders` | Seznam zakázek (filtry) | all |
| `GET` | `/api/orders/:id` | Detail zakázky | all |
| `POST` | `/api/orders` | Vytvořit zakázku | sales, admin |
| `PATCH` | `/api/orders/:id` | Upravit zakázku | sales, admin |
| `PATCH` | `/api/orders/:id/status` | Změnit stav | role-based |
| `GET` | `/api/orders/:id/history` | Historie stavů | all |

**Query parametry pro GET /api/orders:**
```
?status=lead,contacted
&customerId=uuid
&assignedTo=uuid
&from=2026-01-01
&to=2026-01-31
&search=novák
&page=1
&limit=20
&sort=createdAt:desc
```

### 6.5 Zaměření

| Method | Endpoint | Popis | Role |
|--------|----------|-------|------|
| `GET` | `/api/measurements` | Seznam zaměření | all |
| `GET` | `/api/measurements/:id` | Detail zaměření | all |
| `POST` | `/api/orders/:orderId/measurement` | Vytvořit zaměření | surveyor |
| `PATCH` | `/api/measurements/:id` | Upravit zaměření | surveyor, admin |
| `POST` | `/api/measurements/:id/photos` | Upload fotek | surveyor |
| `GET` | `/api/measurements/:id/pdf` | Stáhnout PDF | all |
| `POST` | `/api/measurements/:id/generate-pdf` | Vygenerovat PDF | surveyor, admin |

### 6.6 Servis

| Method | Endpoint | Popis | Role |
|--------|----------|-------|------|
| `GET` | `/api/service-tickets` | Seznam servisů | all |
| `GET` | `/api/service-tickets/:id` | Detail servisu | all |
| `POST` | `/api/service-tickets` | Vytvořit servis | all |
| `PATCH` | `/api/service-tickets/:id` | Upravit servis | technician, admin |
| `PATCH` | `/api/service-tickets/:id/assign` | Přiřadit technika | admin |
| `PATCH` | `/api/service-tickets/:id/resolve` | Vyřešit servis | technician |

### 6.7 Rádce (B2C - veřejné)

| Method | Endpoint | Popis | Auth |
|--------|----------|-------|------|
| `GET` | `/api/advisor/questions` | Získat otázky | ❌ |
| `POST` | `/api/advisor/calculate` | Vypočítat doporučení | ❌ |
| `POST` | `/api/advisor/submit` | Odeslat lead | ❌ |

### 6.8 Import

| Method | Endpoint | Popis | Role |
|--------|----------|-------|------|
| `POST` | `/api/import/customers` | Import zákazníků (Excel) | admin |
| `POST` | `/api/import/orders` | Import zakázek (Excel) | admin |
| `GET` | `/api/import/logs` | Historie importů | admin |
| `GET` | `/api/import/logs/:id` | Detail importu | admin |
| `GET` | `/api/import/template/:type` | Stáhnout šablonu | admin |

### 6.9 Dashboard & Reporty

| Method | Endpoint | Popis | Role |
|--------|----------|-------|------|
| `GET` | `/api/dashboard/stats` | Přehledové statistiky | director, admin |
| `GET` | `/api/dashboard/orders-by-status` | Zakázky dle stavu | director, admin |
| `GET` | `/api/dashboard/revenue` | Tržby (měsíc/rok) | director, admin |
| `GET` | `/api/dashboard/employee-stats` | Statistiky zaměstnanců | director, admin |
| `GET` | `/api/reports/orders` | Export zakázek | director, admin |
| `GET` | `/api/reports/measurements` | Export zaměření | director, admin |

### 6.10 Systém

| Method | Endpoint | Popis | Role |
|--------|----------|-------|------|
| `GET` | `/api/products` | Seznam produktů | all |
| `GET` | `/api/audit-logs` | Audit logy | admin |
| `GET` | `/health` | Health check | ❌ |

---

## 7. UI/UX Struktura

### 7.1 Navigace dle role

```
ADMIN
├── 📊 Dashboard
├── 👥 Zákazníci
├── 📋 Zakázky
├── 📐 Zaměření
├── 🔧 Servis
├── 📈 Reporty
├── 📥 Import
└── ⚙️ Nastavení
    ├── Zaměstnanci
    ├── Produkty
    └── Systém

ŘEDITEL (director)
├── 📊 Dashboard
├── 👥 Zákazníci (read-only)
├── 📋 Zakázky (read-only)
├── 📐 Zaměření (read-only)
├── 🔧 Servis (read-only)
└── 📈 Reporty

OBCHODNÍK (sales)
├── 📊 Moje přehled
├── 👥 Zákazníci
├── 📋 Moje zakázky
└── 📝 Leady (z Rádce)

VEDOUCÍ VÝROBY (production_manager)
├── 📊 Přehled výroby
├── 📋 Příchozí zadání
└── 📐 Zaměření (read-only)

ZAMĚŘOVAČ (surveyor)
├── 📐 Moje zaměření
├── 🔧 Moje servisy
└── 📍 Mapa úkolů

SERVISNÍ TECHNIK (technician)
├── 🔧 Moje servisy
└── 📍 Mapa úkolů
```

### 7.2 Stránky aplikace

| URL | Název | Popis |
|-----|-------|-------|
| `/login` | Přihlášení | 4+6 PIN pad |
| `/` | Dashboard | Dle role |
| `/customers` | Zákazníci | Seznam + CRUD |
| `/customers/:id` | Detail zákazníka | Info + zakázky + adresy |
| `/orders` | Zakázky | Seznam + filtry |
| `/orders/:id` | Detail zakázky | Kompletní info + workflow |
| `/orders/:id/measurement` | Formulář zaměření | Terénní sběr dat |
| `/measurements` | Zaměření | Seznam všech |
| `/measurements/:id` | Detail zaměření | + PDF preview |
| `/service` | Servis | Seznam ticketů |
| `/service/:id` | Detail servisu | + řešení |
| `/leads` | Leady | Z Rádce |
| `/reports` | Reporty | Grafy + export |
| `/import` | Import | Excel upload |
| `/settings` | Nastavení | Admin only |
| `/settings/employees` | Zaměstnanci | CRUD |
| `/settings/products` | Produkty | CRUD |

### 7.3 Rádce (B2C)

| URL | Název |
|-----|-------|
| `/radce` | Úvodní stránka |
| `/radce/quiz` | Dotazník (multi-step) |
| `/radce/result` | Výsledek + doporučení |
| `/radce/contact` | Kontaktní formulář |
| `/radce/thanks` | Poděkování |

### 7.4 Komponenty (shadcn-svelte)

```
Základní:
├── Button, Input, Select, Checkbox, Radio
├── Card, Dialog, Sheet (side panel)
├── Table, DataTable (s řazením, filtrováním)
├── Tabs, Accordion
├── Badge, Avatar
├── Toast (notifikace)
└── Form (validace)

Custom:
├── PinPad          # Klávesnice pro přihlášení
├── StatusBadge     # Barevný stav zakázky
├── WorkflowStepper # Vizuální workflow
├── PhotoUploader   # Drag & drop + camera
├── MeasurementForm # Dynamický formulář
├── MapView         # Mapa s úkoly (Leaflet/Mapbox)
├── StatsCard       # Dashboard KPI karta
└── QuizStep        # Krok dotazníku Rádce
```

### 7.5 Design System

```css
/* Barvy (Tailwind) */
--primary: #2563eb;     /* Modrá - akce */
--success: #16a34a;     /* Zelená - dokončeno */
--warning: #ea580c;     /* Oranžová - čeká */
--danger: #dc2626;      /* Červená - problém */
--muted: #6b7280;       /* Šedá - neaktivní */

/* Font */
font-family: 'Inter', sans-serif;

/* Spacing */
Konzistentní 4px grid (p-1 = 4px, p-2 = 8px, ...)

/* Border radius */
rounded-lg (8px) pro karty
rounded-md (6px) pro inputy
rounded-full pro avatary
```

---

## 8. Rádce při výběru pergoly (B2C)

### 8.1 Koncept

Veřejný dotazník na samostatné URL (např. `radce.futurol.cz`), který:
1. Provede zákazníka 6 otázkami
2. Na základě odpovědí vypočítá skóre pro každý produkt
3. Doporučí nejvhodnější pergolu
4. Nabídne kontaktní formulář → lead do systému

### 8.2 Produkty

| Kód | Název | Popis |
|-----|-------|-------|
| `KLIMO` | KLIMO | Maximální komfort, regulace světla, stínu a větrání |
| `HORIZONTAL` | HORIZONTAL | Rovná stahovací střecha, moderní vzhled |
| `KLASIK` | KLASIK | Šikmá stahovací střecha, osvědčené řešení |
| `KOMFORT` | KOMFORT / CUBE | Pevná střecha, trvalé zastřešení |
| `EXCELLENT` | EXCELLENT | Parkovací stání pro ochranu automobilu |

### 8.3 Otázky a bodování

```typescript
// Struktura otázky
interface Question {
  id: string;
  text: string;
  description?: string;
  multiSelect: boolean; // Lze vybrat více odpovědí
  answers: Answer[];
}

interface Answer {
  id: string;
  text: string;
  scores: Record<ProductCode, number>; // Body pro každý produkt
}
```

#### Otázka 1: Jak často chcete pergolu využívat?

| Odpověď | KLIMO | HORIZONTAL | KLASIK | KOMFORT | EXCELLENT |
|---------|-------|------------|--------|---------|-----------|
| Především v létě a za hezkého počasí | 1 | 2 | 2 | 1 | 0 |
| Pravidelně od jara do podzimu | 2 | 3 | 3 | 2 | 0 |
| Co nejčastěji během roku | 4 | 2 | 2 | 4 | 0 |
| Chci pergolu používat i při dešti | 5 | 3 | 3 | 5 | 0 |

#### Otázka 2: Co od pergoly očekáváte? (multi-select)

| Odpověď | KLIMO | HORIZONTAL | KLASIK | KOMFORT | EXCELLENT |
|---------|-------|------------|--------|---------|-----------|
| Stínění proti slunci | 3 | 3 | 3 | 2 | 1 |
| Ochranu proti dešti | 4 | 2 | 2 | 5 | 3 |
| Možnost regulovat světlo | 5 | 3 | 3 | 1 | 0 |
| Přirozené větrání prostoru | 4 | 2 | 2 | 1 | 1 |
| Stabilní zastřešení bez pohyblivých částí | 0 | 0 | 0 | 5 | 4 |

#### Otázka 3: Jaký komfort je pro vás důležitý?

| Odpověď | KLIMO | HORIZONTAL | KLASIK | KOMFORT | EXCELLENT |
|---------|-------|------------|--------|---------|-----------|
| Chci mít kontrolu nad klimatem pod pergolou | 5 | 2 | 2 | 2 | 0 |
| Chci reagovat na počasí (slunce / déšť / vítr) | 4 | 3 | 3 | 2 | 0 |
| Oceňuji elektrické nebo automatické ovládání | 3 | 3 | 3 | 2 | 1 |
| Stačí mi jednoduché, funkční řešení | 0 | 2 | 2 | 3 | 4 |

#### Otázka 4: Kde bude pergola umístěna?

| Odpověď | KLIMO | HORIZONTAL | KLASIK | KOMFORT | EXCELLENT |
|---------|-------|------------|--------|---------|-----------|
| Terasa u rodinného domu | 3 | 3 | 3 | 3 | 0 |
| Samostatně stojící pergola v zahradě | 2 | 2 | 2 | 3 | 0 |
| Komerční prostor (restaurace, provozovna) | 3 | 2 | 2 | 3 | 0 |
| Parkovací stání pro auto | 0 | 0 | 0 | 1 | 5 |

#### Otázka 5: Jaký vzhled a provedení preferujete? (multi-select)

| Odpověď | KLIMO | HORIZONTAL | KLASIK | KOMFORT | EXCELLENT |
|---------|-------|------------|--------|---------|-----------|
| Moderní, čistý design | 4 | 4 | 2 | 3 | 2 |
| Rovná střecha | 3 | 5 | 0 | 3 | 3 |
| Šikmá střecha | 0 | 0 | 5 | 2 | 2 |
| Design je pro mě důležitý | 3 | 3 | 2 | 3 | 1 |
| Upřednostňuji technicky jednoduché řešení | 0 | 1 | 2 | 3 | 4 |

#### Otázka 6: Jaké doplňky zvažujete? (multi-select)

| Odpověď | KLIMO | HORIZONTAL | KLASIK | KOMFORT | EXCELLENT |
|---------|-------|------------|--------|---------|-----------|
| Boční stínění (screeny / rolety) | 2 | 2 | 2 | 2 | 0 |
| Zasklení | 1 | 1 | 1 | 3 | 0 |
| LED osvětlení | 2 | 2 | 2 | 2 | 1 |
| Topení | 2 | 1 | 1 | 3 | 0 |
| Dálkové nebo chytré ovládání | 3 | 3 | 3 | 2 | 1 |

### 8.4 Výpočet skóre

```typescript
function calculateScores(answers: SelectedAnswer[]): ProductScores {
  const scores: ProductScores = {
    KLIMO: 0,
    HORIZONTAL: 0,
    KLASIK: 0,
    KOMFORT: 0,
    EXCELLENT: 0
  };

  for (const answer of answers) {
    for (const [product, points] of Object.entries(answer.scores)) {
      scores[product] += points;
    }
  }

  return scores;
}

function getRecommendation(scores: ProductScores): string {
  // Najdi produkt s nejvyšším skóre
  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);
  
  return sorted[0][0]; // Vrať kód produktu
}
```

### 8.5 UI Flow Rádce

```
┌─────────────────────────────────────────┐
│  🏠 Najděte svou ideální pergolu        │
│                                          │
│  Odpovězte na 6 jednoduchých otázek     │
│  a my vám doporučíme tu pravou.         │
│                                          │
│         [ Začít → ]                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Otázka 1 z 6                    ███░░░ │
│                                          │
│  Jak často chcete pergolu využívat?     │
│                                          │
│  ○ Především v létě a za hezkého počasí │
│  ○ Pravidelně od jara do podzimu        │
│  ○ Co nejčastěji během roku             │
│  ○ Chci pergolu používat i při dešti    │
│                                          │
│  [ ← Zpět ]              [ Pokračovat → ]│
└─────────────────────────────────────────┘
                    ↓
        ... otázky 2-6 ...
                    ↓
┌─────────────────────────────────────────┐
│  ✨ Vaše ideální pergola                 │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  🏆 KLIMO                        │    │
│  │                                  │    │
│  │  Maximální komfort s regulací   │    │
│  │  světla, stínu a větrání.       │    │
│  │                                  │    │
│  │  [ Zobrazit detail ]            │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Další vhodné varianty:                 │
│  • HORIZONTAL (85% shoda)               │
│  • KOMFORT (72% shoda)                  │
│                                          │
│  ──────────────────────────────────     │
│                                          │
│  Chcete nezávaznou konzultaci?          │
│                                          │
│  Jméno:    [________________]           │
│  Telefon:  [________________]           │
│  E-mail:   [________________]           │
│  Poznámka: [________________]           │
│                                          │
│         [ Odeslat poptávku ]            │
└─────────────────────────────────────────┘
```

### 8.6 Lead konverze

Po odeslání formuláře:
1. Uloží se `Lead` do databáze (odpovědi, skóre, kontakt)
2. Push notifikace obchodníkům
3. Zákazník vidí děkovací stránku
4. Obchodník může lead konvertovat na `Customer` + `Order`

---

## 9. Import systém

### 9.1 Podporované formáty
- Excel (.xlsx, .xls)
- CSV (.csv)

### 9.2 Typy importu

| Typ | Entita | Povinná pole |
|-----|--------|--------------|
| Zákazníci | `Customer` | fullName, phone |
| Zakázky | `Order` | customerPhone, productCode |
| Lokace | `Location` | customerPhone, street, city |

### 9.3 Import flow

```
1. Admin nahraje Excel soubor
2. Systém načte hlavičky sloupců
3. Admin mapuje sloupce na DB pole
4. Validace dat (preview)
5. Potvrzení importu
6. Zpracování na pozadí
7. Výsledek: X úspěšných, Y chyb
```

### 9.4 Mapování sloupců (UI)

```
┌─────────────────────────────────────────────────┐
│  Import zákazníků                               │
│                                                  │
│  Soubor: zakaznici_2026.xlsx (150 řádků)        │
│                                                  │
│  Mapování sloupců:                              │
│                                                  │
│  Excel sloupec      →  Databázové pole          │
│  ─────────────────────────────────────────      │
│  "Jméno"            →  [fullName ▼]             │
│  "Tel"              →  [phone ▼]                │
│  "Email"            →  [email ▼]                │
│  "Firma"            →  [company ▼]              │
│  "Ulice"            →  [-- ignorovat -- ▼]      │
│                                                  │
│  [ Náhled dat ]  [ Spustit import ]             │
└─────────────────────────────────────────────────┘
```

### 9.5 Validační pravidla

```typescript
const validationRules = {
  customer: {
    fullName: { required: true, maxLength: 100 },
    phone: { required: true, pattern: /^\+?[0-9]{9,14}$/ },
    email: { required: false, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  },
  order: {
    customerPhone: { required: true }, // Lookup zákazníka
    productCode: { required: true, enum: ['KLIMO', 'HORIZONTAL', 'KLASIK', 'KOMFORT', 'EXCELLENT'] },
    estimatedValue: { required: false, type: 'number', min: 0 },
  }
};
```

### 9.6 Error handling

```typescript
interface ImportError {
  row: number;
  field: string;
  value: string;
  error: string; // "Povinné pole", "Neplatný formát", "Zákazník nenalezen"
}

// Uloženo v ImportLog.errors jako JSON
```

### 9.7 Šablony ke stažení

Admin může stáhnout vzorové Excel šablony:
- `sablona_zakaznici.xlsx`
- `sablona_zakazky.xlsx`

---

## 10. Deployment

### 10.1 Architektura

```
┌─────────────────────────────────────────────────────────┐
│                      VPS Server                          │
│                   37.46.208.167                          │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │                    Nginx                         │    │
│  │            (reverse proxy + SSL)                 │    │
│  │   :443 → futurol-app.ascentalab.cz              │    │
│  │   :443 → radce.futurol.cz (alias)               │    │
│  └─────────────────┬───────────────────────────────┘    │
│                    │                                     │
│                    ▼ :8081                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │              futurol-app (Docker)                │    │
│  │                                                  │    │
│  │   ┌──────────────┐    ┌──────────────────┐      │    │
│  │   │   Frontend   │    │     Backend      │      │    │
│  │   │  SvelteKit   │◄──►│ Fastify + Prisma │      │    │
│  │   │   (SSR)      │    │                  │      │    │
│  │   └──────────────┘    └────────┬─────────┘      │    │
│  │                                 │                │    │
│  └─────────────────────────────────┼────────────────┘    │
│                                    │                     │
│                                    ▼ :5433                │
│  ┌─────────────────────────────────────────────────┐    │
│  │              PostgreSQL 16                       │    │
│  │           (futurol-db container)                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 10.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    container_name: futurol-app
    restart: unless-stopped
    ports:
      - "8081:3000"
    environment:
      - DATABASE_URL=postgresql://futurol:${DB_PASSWORD}@db:5432/futurol
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_DRIVE_CREDENTIALS=${GOOGLE_DRIVE_CREDENTIALS}
      - VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}
      - VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:16-alpine
    container_name: futurol-db
    restart: unless-stopped
    ports:
      - "5433:5432"  # Jiný port než HBC (5432)
    environment:
      - POSTGRES_USER=futurol
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=futurol
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 10.3 Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "build"]
```

### 10.4 Nginx konfigurace

```nginx
# /etc/nginx/sites-available/futurol-app.ascentalab.cz

server {
    listen 443 ssl http2;
    server_name futurol-app.ascentalab.cz radce.futurol.cz;

    ssl_certificate /etc/letsencrypt/live/futurol-app.ascentalab.cz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/futurol-app.ascentalab.cz/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout pro dlouhé operace (import)
        proxy_read_timeout 300s;
    }

    # Upload limit
    client_max_body_size 50M;
}

server {
    listen 80;
    server_name futurol-app.ascentalab.cz radce.futurol.cz;
    return 301 https://$server_name$request_uri;
}
```

### 10.5 GitHub Actions (CI/CD)

```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: 37.46.208.167
          username: vpsuser
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/app/FUTUROL-app-management
            git pull origin main
            docker compose down
            docker compose up -d --build
            docker system prune -f
```

### 10.6 Deployment checklist

```bash
# 1. DNS záznam
# futurol-app.ascentalab.cz → A → 37.46.208.167
# radce.futurol.cz → CNAME → futurol-app.ascentalab.cz

# 2. Klonovat repo
ssh vpsuser@37.46.208.167
cd ~/app
git clone https://github.com/tomash-ascenta/FUTUROL-app-management.git
cd FUTUROL-app-management

# 3. Vytvořit .env
cp .env.example .env
nano .env  # Nastavit secrets

# 4. Spustit
docker compose up -d --build

# 5. Nginx konfigurace
sudo nano /etc/nginx/sites-available/futurol-app.ascentalab.cz
sudo ln -s /etc/nginx/sites-available/futurol-app.ascentalab.cz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. SSL certifikát
sudo certbot --nginx -d futurol-app.ascentalab.cz -d radce.futurol.cz

# 7. Firewall
sudo ufw allow 8081/tcp

# 8. Ověřit
curl https://futurol-app.ascentalab.cz/health
```

### 10.7 Environment variables

```bash
# .env.example
DATABASE_URL="postgresql://futurol:password@db:5432/futurol"
JWT_SECRET="your-32-char-secret-key-here"
JWT_REFRESH_SECRET="your-another-32-char-secret"

# Google Drive
GOOGLE_DRIVE_FOLDER_ID="1abc..."
GOOGLE_DRIVE_CREDENTIALS='{"type":"service_account",...}'

# Web Push (VAPID)
VAPID_PUBLIC_KEY="BPxxx..."
VAPID_PRIVATE_KEY="xxx..."
VAPID_SUBJECT="mailto:info@futurol.cz"

# App
PUBLIC_APP_URL="https://futurol-app.ascentalab.cz"
PUBLIC_ADVISOR_URL="https://radce.futurol.cz"
```

---

## 11. Roadmap

### Fáze 1: MVP (4-6 týdnů)
- [x] Projektová specifikace
- [ ] Setup projektu (SvelteKit + Fastify + Prisma)
- [ ] Autentizace (PIN login)
- [ ] CRUD Zákazníci
- [ ] CRUD Zakázky (základní workflow)
- [ ] Role a permissions
- [ ] Deployment na VPS

### Fáze 2: Core Features (4-6 týdnů)
- [ ] Formulář zaměření (kompletní)
- [ ] PDF generování
- [ ] Google Drive integrace (fotky)
- [ ] Rádce B2C (dotazník)
- [ ] Push notifikace
- [ ] Servisní modul

### Fáze 3: Advanced (4 týdny)
- [ ] Excel import
- [ ] Dashboard s KPI
- [ ] Reporty a export
- [ ] Mapa úkolů (zaměřovač/technik)

### Fáze 4: Polish (2 týdny)
- [ ] PWA optimalizace
- [ ] Testování
- [ ] Dokumentace
- [ ] Školení uživatelů

---

## 12. GitHub Repository

**URL:** https://github.com/tomash-ascenta/FUTUROL-app-management

### Struktura repozitáře

```
FUTUROL-app-management/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   ├── lib/
│   │   ├── components/      # Svelte komponenty
│   │   ├── server/          # Backend (Fastify routes)
│   │   ├── stores/          # Svelte stores
│   │   └── utils/           # Utility funkce
│   ├── routes/              # SvelteKit pages
│   │   ├── (app)/           # Chráněné stránky
│   │   ├── (public)/        # Veřejné (Rádce)
│   │   └── api/             # API endpointy
│   └── app.html
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── static/
├── tests/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
├── svelte.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 13. Realizované funkce (Changelog)

### 9. ledna 2026

#### Light Theme Design System
- Kompletní přepracování z dark theme na light theme
- Brand barvy:
  - `futurol-wine`: `#a50046` (primární)
  - `futurol-green`: `#16a34a` (sekundární)
- Nové logo `/static/futurol-logo.svg`

#### Login stránka (`/login`)
- 2-krokové přihlášení: osobní číslo (4 číslice) → PIN (6 číslic)
- Automatické odeslání po zadání PINu (bez tlačítka)
- Klávesnice (keypad) s wine akcentem
- Wine pozadí karty (`bg-futurol-wine/15`)
- Podpora klávesnice (čísla, Backspace, Escape)

#### Hlavní landing page (`/`)
- Hero sekce s CTA tlačítky
- 5 feature karet (Pergoly, Poradenství, Realizace, Záruka, Reference)
- Wine akcentová barva
- Responzivní design

#### Rádce výběru pergoly (`/radce`)
- 5-krokový průvodce výběrem pergoly:
  1. Účel využití (relax, hostiny, pracovní prostor, wellness)
  2. Požadovaná velikost (do 12m², 12-20m², 20-30m², 30m²+)
  3. Typ střechy (lamelová, zip screen, skleněná, kombinovaná)
  4. Doplňky (multi-select: LED, topení, mlha, audio, rolety)
  5. Rozpočet (do 150k, 150-300k, 300-500k, 500k+)
- Výsledek s doporučením produktu (ARTESA, LAGUNA, RIVIERA)
- Poptávkový formulář (jméno, email, telefon, poznámka)
- Sticky CTA formulář na pravé straně výsledku

#### Inquiry System (Poptávky)
- **Prisma model**: `Inquiry` s polemi:
  - `fullName`, `email`, `phone`, `note`
  - `purpose`, `size`, `roofType`, `extras[]`, `budget`
  - `recommendedProduct`, `status`, `assignedTo`, `customerId`
- **Status enum**: `new`, `contacted`, `meeting_scheduled`, `quote_sent`, `won`, `lost`
- **API endpoint**: `POST /api/inquiries` (veřejný), `GET /api/inquiries` (chráněný)
- **Dashboard stránka**: `/dashboard/inquiries` se statistikami a seznamem poptávek
- **Navigace**: "Poptávky" v sidebaru dashboardu

#### Dashboard
- Light theme design
- Sidebar navigace s wine akcentem
- Statistické karty

---

*Poslední aktualizace: 9. ledna 2026*
*Verze dokumentu: 1.1*
