# Futurol App

Centrální datová platforma pro firmu Futurol.cz – správa zákazníků, zakázek, zaměření pergol a servisů.

🌐 **Produkce:** https://futurol.ascentalab.cz  
🎯 **Rádce:** https://radce.ascentalab.cz

---

## ✨ Hlavní funkce

- ✅ **Správa zákazníků** - evidence kontaktů, adres, historie
- ✅ **Správa zakázek** - workflow od poptávky po realizaci
- ✅ **Protokol zaměření** - 7-krokový formulář s inline editací
- ✅ **Export do PDF** - protokol zaměření ke stažení s českou diakritikou
- ✅ **B2C Rádce výběru pergoly** - interaktivní dotazník s doporučením produktu
  - Pozadí s animovanou oblohou
  - Elegantní micro-animace výsledku
  - Lead capture s PDF průvodcem
- ✅ **Role a oprávnění** - admin, ředitel, obchodník, zaměřovač, technik
- ✅ **Bezpečnost** - JWT auth, bcrypt, rate limiting, HTTPS

---

## 🚀 Tech Stack

- **Frontend:** SvelteKit 2 + Svelte 5 + TailwindCSS
- **Backend:** SvelteKit API routes + Prisma ORM
- **Database:** PostgreSQL 16
- **Language:** TypeScript
- **Auth:** JWT + bcrypt + httpOnly cookies
- **PDF:** jsPDF + autotable
- **Deployment:** Docker + GitHub Actions + GHCR + Nginx + Let's Encrypt
- **CI/CD:** Automatický build na GitHub, deploy přes GitHub Container Registry

---

## 📚 Dokumentace

### Pro vývojáře

| Dokument | Popis |
|----------|-------|
| [PROJECT_SPEC.md](./PROJECT_SPEC.md) | 📘 Kompletní projektová specifikace |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 🏗️ Architektura systému + diagramy |
| [API.md](./API.md) | 🔌 REST API dokumentace |
| [TESTING.md](./TESTING.md) | 🧪 Testing strategy a příklady |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 🤝 Průvodce pro přispěvatele |
| [SECURITY.md](./SECURITY.md) | 🔐 Bezpečnostní politika |

### Pro deployment

| Dokument | Popis |
|----------|-------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 🚀 Deployment guide (VPS setup, update, rollback) |
| [.github/SETUP_CICD.md](./.github/SETUP_CICD.md) | ⚙️ CI/CD automatizace (GitHub Actions) |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 🔧 Řešení běžných problémů |
| [VPS_CREDENTIALS.md](./VPS_CREDENTIALS.md) | 🔑 Přístupy k serveru |

### Pro uživatele

| Dokument | Popis |
|----------|-------|
| [USER_MANUAL.md](./USER_MANUAL.md) | 📖 Uživatelská příručka pro zaměstnance |

### Historie

| Dokument | Popis |
|----------|-------|
| [CHANGELOG.md](./CHANGELOG.md) | 📝 Historie změn |
| [MILESTONE_01_SUMMARY.md](./MILESTONE_01_SUMMARY.md) | 🎯 Shrnutí 1. fáze |

---

## 🛠️ Lokální vývoj

### Požadavky

- Node.js 20+
- PostgreSQL 16 (nebo Docker)

### Setup

```bash
# Klonovat repo
git clone https://github.com/tomash-ascenta/FUTUROL-app-management.git
cd FUTUROL-app-management

# Instalace závislostí
npm install

# Nastavení environment
cp .env.example .env
# Upravit .env s vašimi hodnotami

# Spustit databázi (Docker)
docker compose up db -d

# Migrace databáze
npm run db:push

# Spustit dev server
npm run dev
```

Aplikace běží na http://localhost:5173

### Další příkazy

```bash
# Build pro produkci
npm run build

# Preview produkčního buildu
npm run preview

# Type checking
npm run check

# Prisma Studio (DB GUI)
npm run db:studio
```

## 🐳 Docker Deployment

### Lokální spuštění
```bash
# Build a spuštění
docker compose up -d --build

# Zobrazit logy
docker compose logs -f
```

Aplikace běží na http://localhost:8081

### Produkční deploy (automatický)

**Push do `main` větve automaticky spustí deployment:**

1. GitHub Actions sestaví Docker image (na GitHub serverech - dostatek RAM)
2. Image se uloží do GitHub Container Registry (ghcr.io)
3. VPS stáhne hotový image a restartuje kontejner

```bash
# Stačí pushnout do main
git push origin main
```

**Ruční deploy (v případě potřeby):**
```bash
ssh vpsuser@37.46.208.167 "cd /home/vpsuser/app/FUTUROL-app-management && \
  docker pull ghcr.io/tomash-ascenta/futurol-app-management:latest && \
  docker tag ghcr.io/tomash-ascenta/futurol-app-management:latest futurol-app:latest && \
  docker compose up -d"
```

Více informací v [VPS_CREDENTIALS.md](./VPS_CREDENTIALS.md)

## 📁 Struktura projektu

```
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte komponenty
│   │   ├── server/         # Server-side kód
│   │   ├── stores/         # Svelte stores
│   │   └── utils/          # Utility funkce
│   ├── routes/             # SvelteKit pages & API
│   └── app.html
├── prisma/
│   └── schema.prisma       # Databázové schéma
├── static/                 # Statické soubory
├── docker-compose.yml
├── Dockerfile
└── PROJECT_SPEC.md         # Specifikace
```

## 👥 Role uživatelů

| Role | Popis |
|------|-------|
| Admin | Správa systému, uživatelů |
| Ředitel | Dashboard, reporty |
| Obchodník | Zákazníci, zakázky |
| Vedoucí výroby | Příchozí zadání |
| Zaměřovač | Zaměření, servis |
| Servisní technik | Servisní zásahy |

## 📄 Licence

Proprietární - FARDAL s.r.o.
