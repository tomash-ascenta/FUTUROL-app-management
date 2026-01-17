# API Dokumentace

Futurol App REST API dokumentace.

**Base URL:** 
- Lokální: `http://localhost:5173/api`
- Produkce: `https://futurol.ascentalab.cz/api`

---

## Autentizace

API používá JWT tokeny uložené v httpOnly cookies. Přihlášení probíhá přes `/api/auth/login`.

### Chráněné endpoints
Všechny endpoints kromě veřejných vyžadují platný `auth_token` cookie.

---

## Auth Endpoints

### POST /api/auth/login

Přihlášení uživatele.

**Request Body:**
```json
{
  "personalNumber": "0001",
  "pin": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "personalNumber": "0001",
    "fullName": "Jan Novák",
    "roles": ["admin"]
  }
}
```

**Errors:**
- `400` - Neplatný formát údajů
- `401` - Neplatné osobní číslo nebo PIN
- `401` - Účet je deaktivován

---

### POST /api/auth/logout

Odhlášení uživatele (smaže auth cookie).

**Response (200):**
```json
{
  "success": true
}
```

---

### GET /api/auth/me

Získání informací o přihlášeném uživateli.

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "personalNumber": "0001",
    "fullName": "Jan Novák",
    "roles": ["admin"]
  }
}
```

**Response (nepřihlášen):**
```json
{
  "user": null
}
```

---

### POST /api/auth/change-pin

Změna PINu přihlášeného uživatele.

**Request Body:**
```json
{
  "currentPin": "123456",
  "newPin": "654321"
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- `400` - Neplatný formát PIN
- `401` - Nepřihlášen / Nesprávný aktuální PIN

---

## Customer Endpoints

### GET /api/customers

Seznam zákazníků s filtrací a stránkováním.

**Query Parameters:**
| Param | Typ | Default | Popis |
|-------|-----|---------|-------|
| search | string | "" | Fulltext vyhledávání |
| page | number | 1 | Číslo stránky |
| limit | number | 20 | Počet záznamů na stránku |
| sortBy | string | "createdAt" | Pole pro řazení |
| sortOrder | string | "desc" | Směr řazení (asc/desc) |

**Response (200):**
```json
{
  "customers": [
    {
      "id": "uuid",
      "fullName": "Jan Novák",
      "email": "jan@example.cz",
      "phone": "+420777888999",
      "company": "Firma s.r.o.",
      "note": "VIP zákazník",
      "source": "manual",
      "createdAt": "2026-01-09T10:00:00Z",
      "updatedAt": "2026-01-09T10:00:00Z",
      "locations": [
        {
          "id": "uuid",
          "street": "Hlavní 123",
          "city": "Praha",
          "zip": "10000"
        }
      ],
      "_count": {
        "orders": 3,
        "serviceTickets": 1
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

**Oprávnění:** Vyžaduje přihlášení

---

### POST /api/customers

Vytvoření nového zákazníka.

**Request Body:**
```json
{
  "fullName": "Jan Novák",
  "phone": "+420777888999",
  "email": "jan@example.cz",
  "company": "Firma s.r.o.",
  "note": "Poznámka",
  "location": {
    "street": "Hlavní 123",
    "city": "Praha",
    "zip": "10000",
    "country": "CZ",
    "note": "Vjezd ze dvora"
  }
}
```

**Povinná pole:** `fullName`, `phone`

**Response (201):**
```json
{
  "customer": {
    "id": "uuid",
    "fullName": "Jan Novák",
    ...
  }
}
```

**Errors:**
- `400` - Neplatná data
- `401` - Nepřihlášen
- `403` - Nedostatečná oprávnění

**Oprávnění:** `admin`, `director`, `sales`

---

### GET /api/customers/[id]

Detail zákazníka včetně zakázek a servisů.

**Response (200):**
```json
{
  "customer": {
    "id": "uuid",
    "fullName": "Jan Novák",
    "email": "jan@example.cz",
    "phone": "+420777888999",
    "company": "Firma s.r.o.",
    "note": "VIP zákazník",
    "source": "manual",
    "createdAt": "2026-01-09T10:00:00Z",
    "locations": [...],
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "FUT-2026-0001",
        "status": "confirmed",
        "createdAt": "2026-01-09T10:00:00Z",
        "product": { "name": "Pergola Premium" },
        "measurement": null
      }
    ],
    "serviceTickets": [...],
    "leads": [...]
  }
}
```

**Errors:**
- `404` - Zákazník nenalezen

---

### PUT /api/customers/[id]

Aktualizace zákazníka.

**Request Body:**
```json
{
  "fullName": "Jan Novák ml.",
  "email": "jan.ml@example.cz",
  "phone": "+420777888999",
  "company": "Nová Firma s.r.o.",
  "note": "Aktualizovaná poznámka"
}
```

**Response (200):**
```json
{
  "customer": { ... }
}
```

**Oprávnění:** `admin`, `director`, `sales`

---

### DELETE /api/customers/[id]

Smazání zákazníka.

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- `403` - Pouze admin může mazat
- `400` - Nelze smazat zákazníka se zakázkami
- `404` - Zákazník nenalezen

**Oprávnění:** `admin` only

---

### POST /api/customers/[id]/locations

Přidání nové adresy zákazníkovi.

**Request Body:**
```json
{
  "street": "Nová 123",
  "city": "Praha",
  "zip": "11000"
}
```

**Response (200):**
```json
{
  "location": {
    "id": "uuid",
    "customerId": "uuid",
    "street": "Nová 123",
    "city": "Praha",
    "zip": "11000",
    "country": "CZ",
    "createdAt": "2026-01-14T10:00:00Z"
  }
}
```

**Errors:**
- `400` - Chybí povinná pole (street, city, zip)
- `404` - Zákazník nenalezen

**Oprávnění:** `admin`, `sales`

---

### PUT /api/locations/[id]

Aktualizace adresy.

**Request Body:**
```json
{
  "street": "Upravená 456",
  "city": "Brno",
  "zip": "60200"
}
```

**Response (200):**
```json
{
  "location": {
    "id": "uuid",
    "street": "Upravená 456",
    "city": "Brno",
    "zip": "60200",
    "country": "CZ",
    "updatedAt": "2026-01-14T11:00:00Z"
  }
}
```

**Errors:**
- `404` - Adresa nenalezena

**Oprávnění:** `admin`, `sales`

---

### DELETE /api/locations/[id]

Smazání adresy.

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- `400` - Nelze smazat adresu používanou v zakázkách
- `404` - Adresa nenalezena

**Oprávnění:** `admin`, `sales`

---

## Inquiry Endpoints

### GET /api/inquiries

Seznam poptávek z Rádce.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "fullName": "Marie Svobodová",
    "email": "marie@example.cz",
    "phone": "+420666777888",
    "note": "Preferuji dopolední kontakt",
    "purpose": "relax",
    "size": "medium",
    "roofType": "bioclimatic",
    "extras": ["led", "heating"],
    "budget": "standard",
    "recommendedProduct": "Pergola Comfort",
    "status": "new",
    "createdAt": "2026-01-10T14:30:00Z"
  }
]
```

**Oprávnění:** Vyžaduje přihlášení

---

### POST /api/inquiries

Vytvoření poptávky (veřejné - z Rádce).

**Request Body:**
```json
{
  "fullName": "Marie Svobodová",
  "email": "marie@example.cz",
  "phone": "+420666777888",
  "note": "Volitelná poznámka",
  "purpose": "relax",
  "size": "medium",
  "roofType": "bioclimatic",
  "extras": ["led", "heating"],
  "budget": "standard",
  "recommendedProduct": "Pergola Comfort"
}
```

**Response (201):**
```json
{
  "success": true,
  "id": "uuid",
  "message": "Poptávka byla úspěšně odeslána"
}
```

**Oprávnění:** Veřejné (bez přihlášení)

---

## Lead Endpoints

### POST /api/leads

Uložení leadu (pro PDF download apod.).

**Request Body:**
```json
{
  "email": "lead@example.cz",
  "source": "pdf_guide"
}
```

**Response (201):**
```json
{
  "success": true,
  "id": "uuid"
}
```

**Oprávnění:** Veřejné (bez přihlášení)

---

### POST /api/leads/[id]/convert

Konverze leadu na zákazníka.

**Path Parameters:**
| Param | Typ | Popis |
|-------|-----|-------|
| id | uuid | ID leadu |

**Request Body (volitelné pro B2B):**
```json
{
  "type": "B2B",
  "companyName": "Firma s.r.o.",
  "ico": "12345678",
  "dic": "CZ12345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "customerId": "uuid",
  "message": "Zákazník úspěšně vytvořen"
}
```

**Errors:**
- `401` - Nepřihlášen
- `403` - Nemáte oprávnění (povoleno: admin, sales)
- `404` - Lead nenalezen
- `400` - Lead již byl konvertován

**Oprávnění:** admin, sales

---

### POST /api/leads/[id]/reject

Zamítnutí leadu.

**Path Parameters:**
| Param | Typ | Popis |
|-------|-----|-------|
| id | uuid | ID leadu |

**Request Body:**
```json
{
  "reason": "not_interested",
  "note": "Zákazník zvolil konkurenci"
}
```

**Dostupné důvody (reason):**
- `not_interested` - Nemá zájem
- `budget` - Rozpočet
- `competition` - Zvolil konkurenci
- `unreachable` - Nekontaktní
- `duplicate` - Duplicitní
- `other` - Jiný důvod

**Response (200):**
```json
{
  "success": true,
  "message": "Lead byl zamítnut"
}
```

**Errors:**
- `401` - Nepřihlášen
- `403` - Nemáte oprávnění
- `404` - Lead nenalezen
- `400` - Lead již byl konvertován nebo zamítnut

**Oprávnění:** admin, sales

---

## Activity Endpoints

### GET /api/activities

Seznam aktivit s filtrací.

**Query Parameters:**
| Param | Typ | Default | Popis |
|-------|-----|---------|-------|
| customerId | uuid | - | Filtr dle zákazníka |
| orderId | uuid | - | Filtr dle zakázky |
| followUp | boolean | false | Pouze nesplněné follow-upy |
| limit | number | 50 | Max. počet záznamů |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "type": "call",
    "content": "Domluveno zaměření na pondělí",
    "followUpDate": "2026-01-20T10:00:00Z",
    "followUpDone": false,
    "createdAt": "2026-01-17T14:30:00Z",
    "createdBy": {
      "id": "uuid",
      "fullName": "Jan Novák"
    },
    "order": {
      "id": "uuid",
      "orderNumber": "FUT-2026-0001"
    }
  }
]
```

**Oprávnění:** Vyžaduje přihlášení

---

### POST /api/activities

Vytvoření nové aktivity.

**Request Body:**
```json
{
  "customerId": "uuid",
  "orderId": "uuid",
  "type": "call",
  "content": "Zákazník potvrdil zájem o nabídku",
  "followUpDate": "2026-01-20T10:00:00Z"
}
```

**Typy aktivit:**
- `note` - Poznámka
- `call` - Telefonát
- `email` - Email
- `meeting` - Schůzka
- `status_change` - Změna stavu (systémová)
- `system` - Systémová událost

**Povinná pole:** `customerId`, `content`

**Response (201):**
```json
{
  "id": "uuid",
  "type": "call",
  "content": "Zákazník potvrdil zájem o nabídku",
  "followUpDate": "2026-01-20T10:00:00Z",
  "followUpDone": false,
  "createdAt": "2026-01-17T14:30:00Z"
}
```

**Oprávnění:** admin, sales, technician, production_manager

---

### PUT /api/activities/[id]

Aktualizace aktivity (např. označení follow-upu jako splněného).

**Path Parameters:**
| Param | Typ | Popis |
|-------|-----|-------|
| id | uuid | ID aktivity |

**Request Body:**
```json
{
  "followUpDone": true,
  "content": "Aktualizovaná poznámka"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "type": "call",
  "content": "Aktualizovaná poznámka",
  "followUpDone": true,
  "updatedAt": "2026-01-17T15:00:00Z"
}
```

**Oprávnění:** admin, sales, technician, production_manager

---

### DELETE /api/activities/[id]

Smazání aktivity.

**Path Parameters:**
| Param | Typ | Popis |
|-------|-----|-------|
| id | uuid | ID aktivity |

**Response (200):**
```json
{
  "success": true
}
```

**Oprávnění:** admin

---

## Order Endpoints

### GET /api/orders

Seznam zakázek s filtrací a stránkováním.

**Query Parameters:**
| Param | Typ | Default | Popis |
|-------|-----|---------|-------|
| status | string | "" | Filtrace dle stavu (csv: "lead,contacted") |
| customerId | string | "" | Filtr dle zákazníka |
| search | string | "" | Fulltext vyhledávání (zákazník, číslo) |
| page | number | 1 | Číslo stránky |
| limit | number | 20 | Počet záznamů na stránku |
| sortBy | string | "createdAt" | Pole pro řazení |
| sortOrder | string | "desc" | Směr řazení (asc/desc) |

**Response (200):**
```json
{
  "orders": [
    {
      "id": "uuid",
      "orderNumber": "FUT-2026-0001",
      "status": "measurement",
      "priority": "normal",
      "deadlineAt": "2026-02-15T00:00:00Z",
      "createdAt": "2026-01-09T10:00:00Z",
      "customer": {
        "id": "uuid",
        "fullName": "Jan Novák",
        "phone": "+420777888999"
      },
      "location": {
        "street": "Hlavní 123",
        "city": "Praha",
        "zip": "10000"
      },
      "product": {
        "code": "KLIMO",
        "name": "KLIMO Bioklimatická pergola"
      },
      "quotes": [
        {
          "id": "uuid",
          "quoteNumber": "NAB-2026-0001-v1",
          "amount": 250000,
          "status": "approved"
        }
      ],
      "measurement": {
        "id": "uuid",
        "measuredAt": "2026-01-10T14:00:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Oprávnění:** Vyžaduje přihlášení

---

### POST /api/orders

Vytvoření nové zakázky.

**Request Body:**
```json
{
  "customerId": "uuid",
  "locationId": "uuid",
  "productId": "uuid",
  "priority": "normal",
  "deadlineAt": "2026-02-15",
  "note": "Zákazník žádá montáž v sobotu"
}
```

**Povinná pole:** `customerId`, `locationId`

**Response (201):**
```json
{
  "order": {
    "id": "uuid",
    "orderNumber": "FUT-2026-0042",
    "status": "lead",
    ...
  }
}
```

**Oprávnění:** `sales`, `admin`

---

### GET /api/orders/[id]

Detail zakázky včetně historie.

**Response (200):**
```json
{
  "order": {
    "id": "uuid",
    "orderNumber": "FUT-2026-0001",
    "status": "measurement",
    "priority": "normal",
    "customer": { ... },
    "location": { ... },
    "product": { ... },
    "quotes": [
      {
        "id": "uuid",
        "quoteNumber": "NAB-2026-0001-v1",
        "amount": 250000,
        "status": "approved"
      }
    ],
    "measurement": { ... },
    "statusHistory": [
      {
        "fromStatus": "lead",
        "toStatus": "customer",
        "changedAt": "2026-01-09T11:00:00Z",
        "changedBy": {
          "fullName": "Petr Obchodník"
        },
        "note": "Volal zákazník, dohodli jsme zaměření"
      }
    ],
    "serviceTickets": []
  }
}
```

**Errors:**
- `404` - Zakázka nenalezena

**Oprávnění:** Vyžaduje přihlášení

---

### PATCH /api/orders/[id]

Aktualizace zakázky.

**Request Body:**
```json
{
  "status": "quote_sent",
  "deadlineAt": "2026-02-20",
  "note": "Aktualizace po zaměření"
}
```

**Response (200):**
```json
{
  "order": { ... }
}
```

**Oprávnění:** `sales`, `admin`

---

### DELETE /api/orders/[id]

Smazání zakázky (pouze admin).

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- `403` - Pouze admin může mazat
- `400` - Nelze smazat zakázku s měřením/servisem

**Oprávnění:** `admin` only

---

## Measurement Endpoints

### GET /api/measurements

Seznam zaměření s filtrací.

**Query Parameters:**
| Param | Typ | Popis |
|-------|-----|-------|
| employeeId | string | Filtr dle zaměřovače |
| orderId | string | Filtr dle zakázky |
| from | string | Datum od (YYYY-MM-DD) |
| to | string | Datum do (YYYY-MM-DD) |

**Response (200):**
```json
{
  "measurements": [
    {
      "id": "uuid",
      "measuredAt": "2026-01-10T14:00:00Z",
      "pergolaType": "HORIZONTAL",
      "width": 4500,
      "depth": 3200,
      "height": 2800,
      "clearanceHeight": 2400,
      "order": {
        "orderNumber": "FUT-2026-0001",
        "customer": {
          "fullName": "Jan Novák"
        }
      },
      "employee": {
        "fullName": "Tomáš Zaměřovač"
      },
      "pdfUrl": "/uploads/measurements/FUT-2026-0001.pdf"
    }
  ]
}
```

**Oprávnění:** Vyžaduje přihlášení

---

### POST /api/orders/[orderId]/measurement

Vytvoření zaměření pro zakázku.

**Request Body:**
```json
{
  "pergolaType": "HORIZONTAL",
  "width": 4500,
  "depth": 3200,
  "height": 2800,
  "clearanceHeight": 2400,
  "details": {
    "roofPanels": 4,
    "legCount": 2,
    "legLength": 2500,
    "colorFrame": "RAL 7016",
    "colorRoof": "RAL 9003",
    "wallType": "cihla",
    "anchoring": {
      "type": "závitové tyče",
      "count": 6
    },
    "electrical": {
      "inlet": "levá přední noha",
      "preparation": ["vzadu vlevo"]
    },
    "accessories": {
      "remote": "Situo 5 io Pure II",
      "motor": "IO",
      "windSensor": true,
      "led": {
        "type": "COB 4000K",
        "count": 2
      }
    },
    "screens": {
      "front": {
        "width": 4500,
        "fabric": "SE6-007007"
      }
    },
    "installationNotes": {
      "parking": "před domem",
      "terrain": "v pořádku",
      "duration": "1 den"
    },
    "additionalNotes": "Zákazník žádá montáž v sobotu"
  },
  "photos": [],
  "gpsLat": 50.0755,
  "gpsLng": 14.4378
}
```

**Povinná pole:** `pergolaType`, `width`, `depth`, `height`

**Response (201):**
```json
{
  "measurement": {
    "id": "uuid",
    "orderId": "uuid",
    ...
  }
}
```

**Side effects:**
- Zakázka se automaticky přesune do stavu `measurement_done`
- Vytvoří se záznam v `OrderStatusHistory`

**Oprávnění:** `surveyor`, `admin`

---

### GET /api/measurements/[id]

Detail zaměření.

**Response (200):**
```json
{
  "measurement": {
    "id": "uuid",
    "measuredAt": "2026-01-10T14:00:00Z",
    "pergolaType": "HORIZONTAL",
    "width": 4500,
    "depth": 3200,
    "height": 2800,
    "clearanceHeight": 2400,
    "details": { ... },
    "photos": [
      "https://drive.google.com/...",
      "https://drive.google.com/..."
    ],
    "order": { ... },
    "employee": { ... },
    "pdfUrl": "/uploads/measurements/FUT-2026-0001.pdf",
    "pdfGeneratedAt": "2026-01-10T15:30:00Z"
  }
}
```

**Oprávnění:** Vyžaduje přihlášení

---

### PATCH /api/measurements/[id]

Aktualizace zaměření (inline editace).

**Request Body:**
```json
{
  "width": 4600,
  "details": {
    "roofPanels": 5,
    "led": {
      "count": 3
    }
  }
}
```

**Response (200):**
```json
{
  "measurement": { ... }
}
```

**Oprávnění:** `surveyor`, `admin`

---

### GET /api/measurements/[id]/pdf

Generování a stažení PDF protokolu zaměření.

**Response (200):**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="protokol-FUT-2026-0001.pdf"`

**Side effects:**
- Pokud PDF neexistuje, vygeneruje se
- Uloží se do `/uploads/measurements/`
- Aktualizuje se `pdfUrl` a `pdfGeneratedAt` v DB

**Oprávnění:** Vyžaduje přihlášení

---

## Service Ticket Endpoints

### GET /api/service-tickets

Seznam servisních požadavků s filtrací.

**Query Parameters:**
| Param | Typ | Popis |
|-------|-----|-------|
| status | string | Filtrace dle stavu |
| type | string | Filtrace dle typu |
| assignedToId | string | Filtr dle technika |
| customerId | string | Filtr dle zákazníka |

**Response (200):**
```json
{
  "tickets": [
    {
      "id": "uuid",
      "ticketNumber": "SRV-2026-0001",
      "type": "warranty",
      "status": "assigned",
      "priority": "high",
      "description": "Nefunguje motor střechy",
      "scheduledAt": "2026-01-15T09:00:00Z",
      "createdAt": "2026-01-12T10:00:00Z",
      "customer": {
        "fullName": "Jan Novák",
        "phone": "+420777888999"
      },
      "order": {
        "orderNumber": "FUT-2025-0234"
      },
      "assignedTo": {
        "fullName": "Karel Technik"
      }
    }
  ],
  "stats": {
    "new": 5,
    "assigned": 12,
    "inProgress": 3,
    "resolved": 45
  }
}
```

**Oprávnění:** Vyžaduje přihlášení

---

### POST /api/service-tickets

Vytvoření servisního požadavku.

**Request Body:**
```json
{
  "customerId": "uuid",
  "orderId": "uuid",
  "type": "warranty",
  "priority": "high",
  "description": "Nefunguje motor střechy",
  "scheduledAt": "2026-01-15T09:00:00Z"
}
```

**Povinná pole:** `customerId`, `type`, `description`

**Response (201):**
```json
{
  "ticket": {
    "id": "uuid",
    "ticketNumber": "SRV-2026-0042",
    "status": "new_ticket",
    ...
  }
}
```

**Oprávnění:** Všechny přihlášené role

---

### GET /api/service-tickets/[id]

Detail servisního požadavku.

**Response (200):**
```json
{
  "ticket": {
    "id": "uuid",
    "ticketNumber": "SRV-2026-0001",
    "type": "warranty",
    "status": "resolved",
    "priority": "high",
    "description": "Nefunguje motor střechy",
    "resolution": "Vyměněn motor, otestováno",
    "scheduledAt": "2026-01-15T09:00:00Z",
    "resolvedAt": "2026-01-15T11:30:00Z",
    "customer": { ... },
    "order": { ... },
    "assignedTo": { ... }
  }
}
```

**Oprávnění:** Vyžaduje přihlášení

---

### PATCH /api/service-tickets/[id]

Aktualizace servisního požadavku.

**Request Body:**
```json
{
  "status": "in_progress",
  "assignedToId": "uuid",
  "scheduledAt": "2026-01-16T10:00:00Z",
  "resolution": "Dílčí poznámka"
}
```

**Response (200):**
```json
{
  "ticket": { ... }
}
```

**Oprávnění:** `technician`, `admin`

---

### PATCH /api/service-tickets/[id]/resolve

Označení servisu jako vyřešeného.

**Request Body:**
```json
{
  "resolution": "Vyměněn motor, otestováno. Zákazník spokojen."
}
```

**Response (200):**
```json
{
  "ticket": {
    "status": "resolved",
    "resolvedAt": "2026-01-15T11:30:00Z",
    ...
  }
}
```

**Side effects:**
- Status změněn na `resolved`
- Nastaveno `resolvedAt` na aktuální čas

**Oprávnění:** `technician`, `admin`

---

## Hodnoty enumerací

### CustomerSource
| Hodnota | Popis |
|---------|-------|
| `manual` | Ruční zadání |
| `advisor` | Z Rádce |
| `import` | Excel import |
| `web` | Z webu |

### InquiryStatus
| Hodnota | Popis |
|---------|-------|
| `new` | Nová |
| `contacted` | Kontaktován |
| `meeting_scheduled` | Schůzka naplánována |
| `quote_sent` | Nabídka odeslána |
| `won` | Získáno |
| `lost` | Ztraceno |

### Role
| Hodnota | Popis |
|---------|-------|
| `admin` | Správce systému |
| `director` | Ředitel |
| `sales` | Obchodník |
| `production_manager` | Vedoucí výroby |
| `surveyor` | Zaměřovač |
| `technician` | Servisní technik |

### Purpose (Rádce)
| Hodnota | Popis |
|---------|-------|
| `relax` | Relaxace a posezení |
| `dining` | Venkovní jídelna |
| `pool` | Zastřešení bazénu |
| `parking` | Parkování vozidla |

### Size (Rádce)
| Hodnota | Popis |
|---------|-------|
| `small` | Malá (do 12 m²) |
| `medium` | Střední (12-20 m²) |
| `large` | Velká (20-35 m²) |
| `xl` | Extra velká (35+ m²) |

### RoofType (Rádce)
| Hodnota | Popis |
|---------|-------|
| `bioclimatic` | Bioklimatická lamela |
| `fixed` | Pevná střecha |
| `retractable` | Stahovací markýza |
| `glass` | Skleněná střecha |

### Budget (Rádce)
| Hodnota | Popis |
|---------|-------|
| `economy` | Do 150 000 Kč |
| `standard` | 150 000 - 300 000 Kč |
| `premium` | 300 000 - 500 000 Kč |
| `luxury` | 500 000+ Kč |

### OrderStatus
| Hodnota | Popis |
|---------|-------|
| `lead` | Nový lead |
| `contacted` | Kontaktován |
| `measurement_scheduled` | Naplánováno zaměření |
| `measurement_done` | Zaměřeno |
| `quote_sent` | Nabídka odeslána |
| `quote_approved` | Nabídka schválena |
| `in_production` | Ve výrobě |
| `production_done` | Vyrobeno |
| `installation_scheduled` | Naplánována montáž |
| `installed` | Namontováno |
| `completed` | Dokončeno |
| `cancelled` | Zrušeno |

### Priority
| Hodnota | Popis |
|---------|-------|
| `low` | Nízká |
| `normal` | Normální |
| `high` | Vysoká |
| `urgent` | Urgentní |

### ServiceType
| Hodnota | Popis |
|---------|-------|
| `warranty` | Záruční oprava |
| `paid` | Placený servis |
| `maintenance` | Údržba |
| `complaint` | Reklamace |

### ServiceStatus
| Hodnota | Popis |
|---------|-------|
| `new_ticket` | Nový |
| `assigned` | Přiřazeno |
| `scheduled` | Naplánováno |
| `in_progress` | V řešení |
| `resolved` | Vyřešeno |
| `closed` | Uzavřeno |

---

## Error Responses

Všechny chyby mají jednotný formát:

```json
{
  "error": "Popis chyby",
  "details": { ... }  // Volitelné - validační chyby
}
```

### HTTP Status kódy
| Kód | Význam |
|-----|--------|
| 200 | OK |
| 201 | Vytvořeno |
| 400 | Neplatná data |
| 401 | Nepřihlášen |
| 403 | Nedostatečná oprávnění |
| 404 | Nenalezeno |
| 500 | Interní chyba serveru |
