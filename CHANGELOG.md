# Changelog

Všechny významné změny projektu Futurol App budou dokumentovány v tomto souboru.

> **Vlastník software:** Ascenta Lab | **Zákazník:** FARDAL s.r.o. (Futurol.cz)

Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.0.0/),
a projekt dodržuje [Semantic Versioning](https://semver.org/lang/cs/).

---

## [0.13.1] - 2026-01-17

### Přidáno

#### Admin plný přístup
- **Admin role** - nyní má plná oprávnění (read, write, delete) ke všem business modulům
- **Sidebar navigace** - admin vidí všechny položky: Poptávky, Zákazníci, Zakázky, Zaměření, Servis, Reporty

#### Poptávky - zobrazení zpracovatele
- **Sekce Zpracováno** - u konvertovaných a zamítnutých leadů se zobrazuje jméno zpracovatele a datum
- **API reject** - při zamítnutí se nyní ukládá `convertedById` a `convertedAt`
- **Formát zobrazení** - "Konvertoval: Jan Novák • 17. led. 2026" / "Zamítl: Jan Novák • 17. led. 2026"

### Změněno

#### Dokumentace
- **Vlastník software** - změněno z "Ascenta Lab s.r.o." na "Ascenta Lab" ve všech dokumentech

---

## [0.13.0] - 2026-01-17

### Přidáno - Stage Environment & Feature Flags

#### Stage prostředí
- **Stage server** - https://stage.futurol.ascentalab.cz (37.46.209.39)
- **CI/CD rozšíření** - `develop` branch → automatický deploy na Stage
- **Noční sync dat** - CRON ve 3:00 kopíruje data z produkce s anonymizací
- **SSH klíč** - `~/.ssh/futurol-stage` pro přístup na Stage server

#### Feature Flags (licenční tiering)
- **`LICENSE_TIER` ENV variable** - přepínání mezi `basic` a `full` verzí
- **Centrální konfigurace** - `src/lib/server/features.ts`
- **Sidebar filtrování** - moduly se zobrazují dle licence
- **API guards** - `requireFeature()` pro API endpointy
- **Page redirecty** - `requireFeatureOrRedirect()` pro stránky
- **Badge "Basic verze"** - zobrazuje se v sidebar pro Basic licenci

#### Rozdíly verzí
| Funkce | Basic | Full |
|--------|:-----:|:----:|
| Zákazníci, Zaměření, Poptávky | ✅ | ✅ |
| Zakázky, Servis, Reporty | ❌ | ✅ |
| Max uživatelů | 3 | 6 |

### Změněno

#### CI/CD workflow
- **Nový trigger** - `develop` branch spouští build a deploy
- **Docker tagy** - `:develop` pro Stage, `:latest` pro Production
- **Nový job** - `deploy-stage` pro automatický deploy na Stage

#### Dokumentace
- **README.md** - přidány Stage URLs a Feature Flags info
- **DEPLOYMENT.md** - přidány sekce Stage a Feature Flags
- **VPS_CREDENTIALS.md** - přidány Stage server přístupy
- **ARCHITECTURE.md** - přidány diagramy pro Stage a Feature Flags

---

## [0.12.1] - 2026-01-17

### Opraveno - TypeScript compatibility

#### API opravy
- **Customer API** - `company` → `companyName` v Zod schématech a queries
- **Lead API** - `email` → `originalEmail` pro správnou vazbu na schema
- **Order API** - odstranění neexistujících `estimatedValue`/`finalValue`
- **Measurement API** - aktualizace status hodnot (`measurement_done` → `measurement`)

#### Frontend opravy
- **Orders detail** - zobrazení hodnoty z Quote místo neexistujících polí Order
- **Inquiries stránka** - přidání `updatedAt` do LeadData interface

### Změněno - Deployment

#### Automatická migrace
- **Dockerfile** - `prisma migrate deploy` se automaticky spouští při startu kontejneru
- Bezpečné pro produkci - aplikuje pouze pending migrace bez ztráty dat
- Idempotentní - pokud migrace proběhla, prostě pokračuje

---

## [0.12.0] - 2026-01-17

### Přidáno - Dashboard redesign

#### Pipeline zakázek
- **Vizuální pipeline** - 8 fází obchodního procesu
  - Lead → Zákazník → Nabídka → Zaměření → Smlouva → Výroba → Montáž → Předání
  - Barevné rozlišení každé fáze
  - Počty zakázek v reálném čase z databáze
  - Šipky mezi fázemi pro intuitivní orientaci

#### Stats karty (KPI)
- **Konverze tento měsíc** - počet leadů konvertovaných na zákazníky v aktuálním měsíci
- **Čekající follow-upy** - nesplněné follow-upy s datem do dneška
- **Podepsané smlouvy** - zakázky ve fázi smlouvy (před výrobou)
- **Otevřené servisy** - servisní tikety k vyřízení
- Barvy sjednocené s pipeline (slate, amber, green, orange)

#### Follow-upy sekce
- **Nahrazuje "Nedávná aktivita"** - praktičtější pro obchodníky
- Zobrazuje nesplněné follow-upy na tento týden
- Ikony podle typu aktivity (telefon, email, schůzka)
- Barevné rozlišení urgence (dnes = červená, zítra = oranžová)
- Odkaz na detail zákazníka

### Přidáno - API endpointy

#### Activities API
- `GET /api/activities` - seznam aktivit s filtrací
- `POST /api/activities` - vytvoření nové aktivity
- `PUT /api/activities/[id]` - aktualizace aktivity
- `DELETE /api/activities/[id]` - smazání aktivity

#### Leads API
- `POST /api/leads/[id]/convert` - konverze leadu na zákazníka
- `POST /api/leads/[id]/reject` - zamítnutí leadu

### Změněno - OrderStatus enum
- **Nové fáze zakázky** - přizpůsobeno reálnému workflow
  - `lead` - nový lead
  - `customer` - kontaktovaný zákazník
  - `quote_sent` - odeslaná nabídka
  - `measurement` - naplánované zaměření
  - `contract` - podepsaná smlouva
  - `production` - ve výrobě
  - `installation` - montáž
  - `handover` - předáno zákazníkovi
  - `cancelled` - zrušeno

### Změněno - UI Design
- **Technický vzhled** - menší zaoblení rohů
  - `rounded-xl` → `rounded` (4px)
  - `rounded-md` → `rounded-sm` (2px)
- Konzistentní design across celé aplikace

### Databáze
- **Prisma migrace** `20260117101133_init`
- Aktualizovaný seed s novými statusy zakázek
- 10 leadů v různých stavech pro testování

---

## [0.11.0] - 2026-01-16

### Infrastruktura - Kompletní migrace

#### Nový server (vps3870)
- **Migrace na nový VPS** - 37.46.209.22
- **Čistá instalace** - Ubuntu 24.04 LTS, Docker, Nginx
- **Bezpečnostní hardening:**
  - SSH přístup pouze klíčem (hesla zakázána)
  - UFW firewall (porty 22, 80, 443)
  - Fail2ban ochrana proti brute-force
  - Automatické security updates (unattended-upgrades)
  - Silná hesla pro DB a JWT (uložena v .env)
- **SSL certifikáty** - Let's Encrypt pro oba domény

#### Nové GitHub repozitář
- **Přesun na `FUTUROL-app-management`** - čistá historie bez citlivých dat
- **CI/CD pipeline** - plně funkční automatický deployment
  - Lint & Type Check → Build Test → Docker Build → Deploy
  - GitHub Container Registry pro Docker images
  - Automatické nasazení při push do main

### Bezpečnost
- Odstraněna kompromitovaná hesla z Git historie
- Dokumentace `VPS_CREDENTIALS.md` již neobsahuje hesla

---

## [0.10.0] - 2026-01-16

### Přidáno
- **Specifikace licenčního serveru** - `LICENSE_SERVER_SPEC.md`
  - Dokumentace pro budoucí licenční systém
  - API endpointy, databázový model, bezpečnostní požadavky

### Změněno - UI redesign
- **Main page** - nový design sjednocený s Rádcem
  - Pozadí `strana_99.jpg`
  - Logo F v levém horním rohu
  - Tmavý header s "Central Management System"
  - Přidán "Powered by AscentaLab" pod karty
  - Odstraněn CTA prvek pro Rádce
- **Login page** - redesign
  - Pozadí `strana_99.jpg` (stejné jako main page)
  - Logo F místo plného loga
  - Odstraněna bílá linka nad "Powered by"
- **Rádce** - ikona rozpočtu změněna na `Coins` (mince)

### Opraveno
- **Rádce** - reset formuláře při restartu wizardu
  - `submitSuccess`, `submitError`, `formData` se správně resetují
- **API** - telefon je nyní skutečně volitelný
  - Prisma schéma: `phone String?`
  - Convert endpoint: `phone || ''`

### Infrastruktura
- **CI/CD Pipeline refaktoring** - sloučeno do jednoho workflow
  - Sekvenční závislosti: lint → build-test → docker-build → deploy
  - Concurrency group - nový push zruší předchozí běžící workflow
  - Docker cache pro rychlejší build
  - PR safe - na pull request pouze testy, ne deploy
  - Automatický cleanup starých Docker images

---

## [0.9.0] - 2026-01-15

### Přidáno - Rádce redesign
- **Nový vizuální design** - moderní tmavé téma s obrázkovým pozadím
  - Dynamické pozadí pro každý krok (strana_1.jpg až strana_5.jpg)
  - Výsledková stránka s vlastním pozadím (strana_99.jpg)
  - Plynulé přechody mezi kroky
- **Preload obrázků** - eliminace problikávání při změně kroků
  - `<link rel="preload">` pro kritické obrázky
  - JavaScript preload s Promise.all
  - Fade-in efekt po načtení obrázků
- **Dynamické texty v záhlaví**
  - Kroky: "RÁDCE PRO VÝBĚR PERGOLY FUTUROL"
  - Doporučení: "MÁME PRO VÁS DOPORUČENÍ NA ZÁKLADĚ VAŠICH ODPOVĚDÍ"
  - Po odeslání: "DĚKUJEME ZA VAŠI POPTÁVKU"
- **Upravený layout výsledků**
  - Odstraněn Success badge (zelená ikona s fajfkou)
  - Centrovaný obsah horizontálně i vertikálně
  - Bonus sekce se slide-up animací
- **Úprava success stránky**
  - Odstraněn panel "Další kroky"
  - Centrovaný obsah s kartou potvrzení a bonusem

### Změněno - UI/UX vylepšení
- **Tlačítka** - zelený outline styl s hover efektem
- **Checkboxy** - zelená barva místo wine
- **Karty** - odstraněny zaoblené rohy
- **Obsah** - posunutý doprava při krocích, centrovaný na výsledcích

### Opraveno
- **Ascenta Lab branding** - vycentrovaný text na login stránce

---

## [0.8.0] - 2026-01-14

### Přidáno - Servisní modul
- **Přehled servisních tiketů** - `/dashboard/service`
  - Seznam všech servisních požadavků
  - Filtrování podle stavu (Otevřené, Přiřazené, Vyřešené)
  - Vyhledávání podle čísla tiketu nebo zákazníka
- **Vytvoření servisního tiketu** - `/dashboard/service/new`
  - Výběr zákazníka a volitelně zakázky
  - Typ tiketu (Reklamace, Záruka, Placený servis, Údržba)
  - Priorita a popis problému
  - Přiřazení technikovi
  - Předvyplnění z URL parametrů (`customerId`, `orderId`)
- **Detail servisního tiketu** - `/dashboard/service/[id]`
  - Přehled informací o tiketu
  - Vazba na zákazníka a zakázku

### Přidáno - Správa adres zákazníka
- **Přidání nové adresy** - modal v detailu zákazníka
  - Ulice, město, PSČ
  - API endpoint `/api/customers/[id]/locations`
- **Editace adresy** - úprava existujících adres
  - API endpoint `/api/locations/[id]`

### Přidáno - Editace zakázky
- **Stránka editace zakázky** - `/dashboard/orders/[id]/edit`
  - Změna stavu zakázky (lead, kontaktováno, ve výrobě, dokončeno...)
  - Nastavení priority
  - Výběr produktu (typu pergoly)
  - Výběr místa realizace z adres zákazníka
  - Předběžná a konečná hodnota zakázky
  - Deadline

### Změněno - Zjednodušení workflow poptávek
- **Statistiky poptávek** - zredukováno ze 4 na 3 karty
  - Odstraněna karta "Rozpracované"
  - Zůstaly: Celkem, Nové, Zpracováno
- **Statusy poptávek** - pouze "new" a "converted"
  - Odstraněn status "contacted" z UI

### Změněno - Role a oprávnění (Obchodník)
- **Zaměření** - pouze čtení (bez možnosti vytvářet)
  - Skryto tlačítko "Nové zaměření" v přehledu
  - Skryto v rychlých akcích na dashboardu
  - Skryto v detailu zakázky
- **Zakázky** - klikatelné řádky v tabulce
  - Přidán `cursor-pointer` a `onclick` pro navigaci na detail
- **Servis** - může vytvářet tikety a číst
- **Technici** - v přiřazení tiketu zobrazeni pouze technici (ne admini)

### Opraveno
- **404 při editaci zakázky** - vytvořena chybějící stránka `/dashboard/orders/[id]/edit`
- **500 Internal Error na poptávkách** - odstraněna reference na `PhoneCall` ikonu
- **Předvyplnění parametrů** - servisní tikety nyní přebírají `customerId` i `orderId` z URL

---

## [0.7.0] - 2026-01-14

### Přidáno - Správa uživatelů (Admin)
- **Admin dashboard** - `/dashboard/admin/users`
  - Přehled všech uživatelů systému
  - Vytváření nových uživatelů s rolemi
  - Editace uživatelů včetně změny rolí
  - Deaktivace/aktivace uživatelů
  - Smazání uživatelů
- **Multi-role systém** - uživatel může mít více rolí současně
- **Role-based access** - pouze admin má přístup ke správě uživatelů

### Změněno - CI/CD Architektura
- **GitHub Container Registry (GHCR)** - nový deployment systém
  - Build probíhá na GitHub Actions (7GB RAM) - řeší OOM problémy na VPS
  - VPS pouze stahuje hotový Docker image
  - Automatický deploy při push do `main`
- **Nový workflow** `.github/workflows/deploy.yml`:
  - Build job: sestaví image a pushne do GHCR
  - Deploy job: SSH na VPS, pull image, restart kontejneru
- **docker-compose.yml** - upraveno pro použití lokálního image `futurol-app:latest`
- **Dockerfile** - přidány dummy env vars pro build (JWT_SECRET, JWT_REFRESH_SECRET)

### Opraveno
- **OOM při Docker buildu na VPS** - build přesunut na GitHub Actions
- **502 Bad Gateway** - stabilní deployment bez pádů serveru

---

## [0.6.0] - 2026-01-11

### Bezpečnost
- **Rate limiting** - ochrana proti brute-force útokům na login
  - Max 5 pokusů za 15 minut na IP a účet
  - Automatický 15minutový blok po překročení
  - In-memory store (resets při restartu)
- **Bcrypt hashování** - upgrade z SHA-256 na bcrypt
  - Cost factor 10 pro bezpečné hashování PINů
  - Async operace pro non-blocking
- **Security headers** v Nginx konfiguraci
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
- **Cookie flags** - ověřeno HttpOnly, Secure, SameSite=Lax

### Přidáno
- `src/lib/server/rateLimit.ts` - rate limiting modul
- `futurol-nginx.conf` - nginx konfigurace pro hlavní aplikaci

### Změněno
- `src/lib/server/auth.ts` - přechod na bcrypt
- `src/routes/api/auth/login/+server.ts` - integrace rate limiting
- `src/routes/api/auth/change-pin/+server.ts` - async bcrypt
- `prisma/seed.ts` - bcrypt pro seed data

---

## [0.5.1] - 2026-01-11

### Přidáno - Dokumentace
- **SECURITY.md** - bezpečnostní politika a postupy
  - Popis autentizace a autorizace
  - Bezpečnostní praktiky v kódu
  - Incident response postupy
  - Checklist pro vývoj a deploy
- **CONTRIBUTING.md** - průvodce pro přispěvatele
  - Lokální setup a development workflow
  - Coding standards (TypeScript, Svelte, Tailwind)
  - Git konvence a code review proces
  - Deployment postupy

---

## [0.5.0] - 2026-01-11

### Přidáno - B2C Rádce vizuální vylepšení
- **Pozadí s oblohou** - animované pozadí s mraky na všech stránkách (Rádce, Login, Homepage)
  - WebP optimalizovaný obrázek pro rychlé načítání
  - Jemný parallax efekt při scrollování
- **Zelené design elementy** - zelená jako hlavní brand barva
  - Zelené rámečky u formulářů a tlačítek
  - Hover efekty v zelené
- **Favicon** - logo "F" jako favicon pro všechny stránky
- **Page titles** - správné titulky stránek v browseru
- **Logo jako link** - kliknutí na logo v Rádci restartuje wizard
- **Animace doporučení** - elegantní micro-animace při zobrazení výsledku:
  - Bounce efekt zeleného kruhu s fajfkou (0.4s delay)
  - Progresivní vykreslení fajfky pomocí stroke-dashoffset (1s delay)
  - Slide-up bonus sekce zpod karty s nabídkou (1.8s delay, 1s trvání)

### Změněno
- Odstranění patičky u Rádce pro čistší design
- Optimalizace timing animací pro plynulejší UX

### Technické
- Custom SVG animace checkmarku (nahrazení lucide komponenty)
- CSS keyframes: `success-badge`, `draw-checkmark`, `bonus-slide-up`
- Overflow hidden wrapper pro slide-up efekt

---

## [0.4.1] - 2026-01-10

### Přidáno
- **Export protokolu do PDF** - možnost stáhnout protokol zaměření jako PDF dokument
  - Tlačítko "Stáhnout PDF" v detailu zaměření
  - Plná podpora české diakritiky (Roboto font embedded)
  - Všechny sekce protokolu: základní info, rozměry, konstrukce, montáž, příslušenství, rolety, logistika, poznámky
  - Profesionální design s firemními barvami Futurol
  - Automaticky generovaný název souboru podle čísla zakázky

### Technické
- Použití jsPDF + jspdf-autotable pro generování PDF
- Embedded Roboto Regular a Bold font (cca 1.3 MB) pro podporu UTF-8/české znaky

---

## [0.4.0] - 2026-01-10

### Přidáno
- **Inline editace protokolu zaměření** - možnost editovat jednotlivé položky přímo v detailu
  - Základní rozměry (šířka, hloubka, výška, podchozí výška)
  - Konstrukce (střešní profily, nohy, délka nohou, konzole, barva rámu, barva střechy)
  - Montáž (typ stěny, zateplení, tloušťka, kotvení, betonové patky, odvod vody, elektro)
  - Příslušenství (ovladač, motor, čidlo větru, LED, zásuvky, trapézový kryt, profily, Tahoma)
  - Rolety (5 pozic - přední, přední levá/pravá, levá, pravá - každá s šířkou a látkou)
  - Logistika (parkování, prostor, doba, terén, přístup)
  - Doplňující poznámky
  - Vizuální indikace při ukládání (spinner, potvrzení)
- **Zobrazení všech polí protokolu** - i prázdné položky jsou nyní viditelné
- **Vylepšený deploy skript** (`deploy.sh`)
  - Bezpečné zastavení kontejneru před buildem
  - Dvojitá pojistka proti "container name already in use" chybě
  - Pouze app kontejner se restartuje (DB běží kontinuálně)
  - Automatický status check a výpis logů
- **Aktualizovaná VPS dokumentace** - jasný návod na deploy

### Změněno
- Optimalizace deploy procesu - databáze zůstává běžet při redeployi
- API endpoint `PATCH /api/measurements/[id]` rozšířen o hlavní rozměry

### Opraveno
- Konflikty Docker kontejnerů při opakovaném nasazení
- Svelte 5 @const direktiva nahrazena $derived runou

---

## [0.3.0] - 2026-01-10

### Přidáno
- **Modul Zaměření** - kompletní workflow pro zaměřovače
  - 7-krokový formulář pro zaměření zakázky
    1. Typ pergoly
    2. Rozměry (šířka, hloubka, výška, podchozí výška)
    3. Konstrukce (střešní profily, nohy, konzole, barvy)
    4. Montáž (typ stěny, zateplení, kotvení, betonové patky, odvod vody, elektro)
    5. Příslušenství (ovladač, motor, čidlo větru, LED, trapézový kryt, zásuvky, Tahoma)
    6. Screenové rolety (přední, boční, látky)
    7. Poznámky pro servis (parkování, prostor, terén, přístup)
  - Seznam zaměření s vyhledáváním a stránkováním
  - Detail zaměření s kompletními informacemi
  - Automatická změna statusu zakázky na `measurement_done`
- **API endpoint** `POST /api/orders/[orderId]/measurement` - vytvoření zaměření

### Opraveno
- **Prisma relation syntax** - použití `connect: { id }` místo přímého `fieldId`
- **Zod validace** - přidáno `.nullable().optional()` pro číselná pole
- **Serializace Decimal** - převod Prisma Decimal na Number pro JSON
- **Auth locals** - oprava `locals.user.id` na `locals.user.employeeId` v API

---

## [0.2.0] - 2026-01-10

### Přidáno
- **Modul Zákazníci** - kompletní CRUD
  - Seznam zákazníků s vyhledáváním a stránkováním
  - Detail zákazníka s historií zakázek a servisů
  - Formulář pro vytvoření nového zákazníka
  - Editace existujícího zákazníka
  - Mazání zákazníka (s ochranou pokud má zakázky)
  - Podpora více lokací na zákazníka
- **B2C Rádce výběru pergoly** (`/radce`)
  - 5-krokový dotazník (účel, velikost, střecha, doplňky, rozpočet)
  - Algoritmus doporučení produktu
  - Lead capture formulář
  - PDF průvodce jako lead magnet
- **Modul Poptávky** (`/dashboard/inquiries`)
  - Seznam poptávek z Rádce
  - Statistiky (nové, rozpracované, získané)
  - Detail s odpověďmi z dotazníku
- **API endpoints**
  - `GET/POST /api/customers` - seznam a vytvoření
  - `GET/PUT/DELETE /api/customers/[id]` - detail, update, smazání
  - `GET/POST /api/inquiries` - poptávky
  - `POST /api/leads` - lead capture
- **Produkční nasazení**
  - VPS na 37.46.208.167
  - Nginx reverse proxy s SSL
  - Domény futurol.ascentalab.cz a radce.ascentalab.cz
- **Utility funkce** (`lib/utils`)
  - `formatShortDate`, `formatLongDate`, `getRelativeTime`
  - `getRoleLabel`, `getSourceLabel`
  - `getOrderStatusLabel`, `getServiceTypeLabel`

### Změněno
- UI přechod z dark theme na light professional theme
- Brand barvy: `futurol-wine` (#722F37), `futurol-green` (#4A7C59)
- Prisma logging - pouze warn/error místo všech queries
- Oprava Svelte 5 warnings (`$state` reference)

### Odstraněno
- Prázdný `$effect` v admin/users

---

## [0.1.0] - 2026-01-09

### Přidáno
- **Autentizační systém**
  - Login UI s PIN padem (4-místné osobní číslo + 6-místný PIN)
  - JWT autentizace s httpOnly cookies
  - Server-side session validace přes hooks.server.ts
  - Logout s mazáním cookies
  - Změna PINu
- **Dashboard layout**
  - Responzivní sidebar navigace
  - Role-based menu (dynamické podle oprávnění)
  - Mobile-first design
- **Admin sekce**
  - Správa uživatelů - seznam
  - Audit logy - funkční
- **Databázové schéma** (Prisma)
  - 12+ modelů: Employee, Customer, Location, Order, Measurement, ServiceTicket, Product, Lead, Inquiry, ProductionOrder, AuditLog, OrderStatusHistory
  - Migrace a seed data
- **DevOps**
  - Docker + docker-compose
  - PostgreSQL 16
  - Vite build pipeline

### Technologie
- SvelteKit 2.x
- Svelte 5.x
- TailwindCSS 3.4
- Prisma 5.x
- TypeScript 5.x
- Zod validace

---

## [Unreleased]

### Plánováno pro Milestone 2
- Modul Zakázky (workflow, stavy)
- ~~Modul Zaměření (digitální formulář, fotky)~~ ✅ Hotovo v 0.3.0 a 0.4.0
- ~~B2C Rádce design vylepšení~~ ✅ Hotovo v 0.5.0
- Nahrávání fotek k zaměření
- Konverze poptávky → zákazník → zakázka
- PDF export technologického zadání
- Email notifikace
- Dashboard s reálnými statistikami
- CI/CD pipeline
