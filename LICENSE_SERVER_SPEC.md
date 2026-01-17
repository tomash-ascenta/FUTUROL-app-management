# Specifikace Licenčního Serveru Futurol

> **Vlastník software:** Ascenta Lab | **Zákazník:** FARDAL s.r.o. (Futurol.cz)

## ⏳ Status: Plánováno (Fáze 2)

Tento dokument popisuje **budoucí** centrální licenční server pro vzdálenou správu licencí.

### Aktuální řešení (Fáze 1) - Implementováno ✅

Pro Fázi 1 je implementován **lokální Feature Flags systém** pomocí ENV variable:

```bash
# V .env souboru na serveru
LICENSE_TIER=basic   # nebo "full"
```

Viz: [`FEATURE_FLAGS_SPEC.md`](./FEATURE_FLAGS_SPEC.md)

Tento přístup je jednoduchý a postačuje pro začátek, kdy má každý zákazník vlastní instanci. Centrální licenční server bude implementován v Fázi 2, když bude potřeba:
- Vzdálená správa licencí bez SSH přístupu
- Automatická expirace licencí
- Dashboard pro správu všech zákazníků
- Telemetrie a usage analytics

---

## Přehled

Tento dokument popisuje požadavky na vytvoření centrálního licenčního serveru pro správu a validaci licencí aplikace Futurol App.

---

## 1. Účel systému

Licenční server bude sloužit jako centrální autorita pro:
- Vydávání licencí pro jednotlivé instance aplikace FUTUROL
- Validaci platnosti licencí
- Správu licenčních klíčů a jejich expirace
- Sledování aktivních instalací
- Omezení funkcí na základě typu licence

---

## 2. Typy licencí

| Typ licence | Popis | Funkce |
|-------------|-------|--------|
| **Trial** | Zkušební verze (14/30 dní) | Omezený počet poptávek, vodoznak |
| **Basic** | Základní licence | Plná funkčnost, 1 instalace |
| **Professional** | Profesionální licence | Plná funkčnost, až 5 instalací |
| **Enterprise** | Firemní licence | Neomezené instalace, prioritní podpora |

---

## 3. Technické požadavky

### 3.1 API Endpointy

#### Aktivace licence
```
POST /api/v1/license/activate
```
**Request:**
```json
{
  "licenseKey": "FUTUROL-XXXX-XXXX-XXXX-XXXX",
  "instanceId": "unique-instance-identifier",
  "domain": "example.com",
  "appVersion": "1.0.0"
}
```
**Response:**
```json
{
  "valid": true,
  "licenseType": "professional",
  "expiresAt": "2027-01-15T00:00:00Z",
  "features": ["radce", "dashboard", "api", "export"],
  "maxInstances": 5,
  "currentInstances": 2
}
```

#### Validace licence (heartbeat)
```
POST /api/v1/license/validate
```
**Request:**
```json
{
  "licenseKey": "FUTUROL-XXXX-XXXX-XXXX-XXXX",
  "instanceId": "unique-instance-identifier"
}
```
**Response:**
```json
{
  "valid": true,
  "expiresAt": "2027-01-15T00:00:00Z",
  "features": ["radce", "dashboard", "api", "export"]
}
```

#### Deaktivace licence
```
POST /api/v1/license/deactivate
```
**Request:**
```json
{
  "licenseKey": "FUTUROL-XXXX-XXXX-XXXX-XXXX",
  "instanceId": "unique-instance-identifier"
}
```

#### Informace o licenci (pro admin panel)
```
GET /api/v1/license/info?key=FUTUROL-XXXX-XXXX-XXXX-XXXX
```

---

## 4. Databázový model

### Tabulka: `licenses`
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | UUID | Primární klíč |
| license_key | VARCHAR(50) | Unikátní licenční klíč |
| license_type | ENUM | trial, basic, professional, enterprise |
| customer_name | VARCHAR(255) | Název zákazníka |
| customer_email | VARCHAR(255) | Email zákazníka |
| issued_at | TIMESTAMP | Datum vydání |
| expires_at | TIMESTAMP | Datum expirace (NULL = neomezeně) |
| max_instances | INT | Max počet aktivních instalací |
| features | JSON | Seznam povolených funkcí |
| is_active | BOOLEAN | Zda je licence aktivní |
| created_at | TIMESTAMP | Vytvořeno |
| updated_at | TIMESTAMP | Aktualizováno |

### Tabulka: `license_activations`
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | UUID | Primární klíč |
| license_id | UUID | FK na licenses |
| instance_id | VARCHAR(255) | Unikátní ID instance |
| domain | VARCHAR(255) | Doména instalace |
| ip_address | VARCHAR(45) | IP adresa |
| app_version | VARCHAR(20) | Verze aplikace |
| activated_at | TIMESTAMP | Datum aktivace |
| last_heartbeat | TIMESTAMP | Poslední validace |
| is_active | BOOLEAN | Aktivní instance |

### Tabulka: `license_logs`
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | UUID | Primární klíč |
| license_id | UUID | FK na licenses |
| action | VARCHAR(50) | activate, validate, deactivate, expire |
| instance_id | VARCHAR(255) | ID instance |
| ip_address | VARCHAR(45) | IP adresa |
| metadata | JSON | Další data |
| created_at | TIMESTAMP | Čas události |

---

## 5. Bezpečnostní požadavky

### 5.1 Autentizace
- API klíč pro komunikaci mezi FUTUROL app a licenčním serverem
- HMAC podpis požadavků pro ověření integrity
- Rate limiting (max 100 požadavků/min na licenci)

### 5.2 Validace
- Instance ID generované na základě hardware fingerprint nebo UUID
- Kontrola domény proti povolené doméně v licenci
- Automatická deaktivace po 7 dnech bez heartbeat

### 5.3 Šifrování
- HTTPS only
- Licenční klíče hashovány v databázi (nebo šifrovány)
- Citlivá data šifrována at-rest

---

## 6. Admin rozhraní

Požadované funkce administračního panelu:

### 6.1 Správa licencí
- [ ] Vytvoření nové licence
- [ ] Editace existující licence
- [ ] Prodloužení/zkrácení platnosti
- [ ] Deaktivace licence
- [ ] Přehled všech licencí s filtrováním

### 6.2 Monitoring
- [ ] Přehled aktivních instalací
- [ ] Historie aktivací/deaktivací
- [ ] Logy všech API volání
- [ ] Upozornění na podezřelou aktivitu

### 6.3 Reporty
- [ ] Počet aktivních licencí podle typu
- [ ] Licence blížící se expiraci
- [ ] Neaktivní licence
- [ ] Export dat

---

## 7. Integrace s FUTUROL aplikací

### 7.1 Chování aplikace

**Při startu:**
1. Načíst licenční klíč z konfigurace/env
2. Zavolat `/api/v1/license/validate`
3. Pokud platná → pokračovat, uložit features do cache
4. Pokud neplatná → zobrazit chybovou stránku s instrukcemi

**Heartbeat (každých 24h):**
1. Zavolat `/api/v1/license/validate`
2. Aktualizovat cache features
3. Pokud selhává 7× po sobě → omezit funkčnost

**Offline režim:**
- Cache posledního úspěšného stavu (max 7 dní)
- Graceful degradation při nedostupnosti serveru

### 7.2 Env proměnné pro FUTUROL
```env
LICENSE_SERVER_URL=https://license.futurol.cz
LICENSE_KEY=FUTUROL-XXXX-XXXX-XXXX-XXXX
LICENSE_API_SECRET=shared-secret-for-hmac
```

---

## 8. Doporučený tech stack

- **Backend:** Node.js + Express/Fastify nebo Python + FastAPI
- **Databáze:** PostgreSQL
- **Cache:** Redis (pro rate limiting a sessions)
- **Hosting:** Docker + VPS nebo cloud (AWS/GCP)

---

## 9. Fáze implementace

### Fáze 1 - MVP (1-2 týdny)
- [ ] Základní API (activate, validate, deactivate)
- [ ] Databázové schéma
- [ ] Jednoduchý admin pro vytváření licencí

### Fáze 2 - Rozšíření (1-2 týdny)
- [ ] Plné admin rozhraní
- [ ] Logy a monitoring
- [ ] Email notifikace (expirace)

### Fáze 3 - Integrace (1 týden)
- [ ] Integrace do FUTUROL aplikace
- [ ] Testování různých scénářů
- [ ] Dokumentace

---

## 10. Kontakt

**Projekt:** FUTUROL - Systém pro správu poptávek pergol  
**Hlavní aplikace:** https://futurol.ascentalab.cz  
**Rádce:** https://radce.ascentalab.cz

---

*Dokument vytvořen: 16. ledna 2026*  
*Verze: 1.0*
