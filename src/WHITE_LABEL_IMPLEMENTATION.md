# White-Label Implementation Guide

## Přehled

Tento dokument obsahuje kompletní specifikaci pro refaktoring FUTUROL aplikace na white-label řešení s konfigurovatelným brandingem přes ENV proměnné.

**Cíl:** Jeden codebase, více instancí (FUTUROL produkce + Demo pro prezentace)

**Odhadovaný čas:** 3-4 hodiny implementace + 1 hodina deployment

---

## 1. Nové ENV proměnné

Přidat do `.env.example` a dokumentace:

```bash
# ===========================================
# BRANDING CONFIGURATION
# ===========================================

# Zobrazované jméno instance (v titles, sidebar, textech)
INSTANCE_NAME="Futurol"

# Název zákaznické firmy (pro dokumentaci, footer - volitelné)
COMPANY_NAME="FARDAL s.r.o."

# Cesty k logům (relativní k /static/)
BRANDING_LOGO="/logo-icon.png"
BRANDING_LOGO_FULL="/Futurol-logo-slogan.svg"
BRANDING_LOGO_ICON="/FUTUROL_logo F.jpg"

# URL instance
PUBLIC_APP_URL="https://futurol.ascentalab.cz"
PUBLIC_ADVISOR_URL="https://radce.ascentalab.cz"
```

### Demo instance hodnoty:

```bash
INSTANCE_NAME="Pergola PMS"
COMPANY_NAME="Ascenta Lab Demo"
BRANDING_LOGO="/ascenta-lab-logo.svg"
BRANDING_LOGO_FULL="/ascenta-lab-logo.svg"
BRANDING_LOGO_ICON="/ascenta-lab-icon.svg"
PUBLIC_APP_URL="https://demo.ascentalab.cz"
PUBLIC_ADVISOR_URL="https://demo.ascentalab.cz/radce"
```

---

## 2. Centrální branding config

### Vytvořit soubor: `src/lib/config/branding.ts`

```typescript
// src/lib/config/branding.ts
// Centrální konfigurace brandingu - čte z ENV proměnných

import { env } from '$env/dynamic/public';

export const branding = {
  // Název instance
  name: env.PUBLIC_INSTANCE_NAME || 'Pergola PMS',
  
  // Zákaznická firma (volitelné)
  companyName: env.PUBLIC_COMPANY_NAME || '',
  
  // Loga
  logo: env.PUBLIC_BRANDING_LOGO || '/logo-icon.png',
  logoFull: env.PUBLIC_BRANDING_LOGO_FULL || '/logo-full.svg',
  logoIcon: env.PUBLIC_BRANDING_LOGO_ICON || '/logo-icon.png',
  
  // URLs
  appUrl: env.PUBLIC_APP_URL || 'http://localhost:5173',
  advisorUrl: env.PUBLIC_ADVISOR_URL || 'http://localhost:5173/radce',
  
  // Meta
  description: env.PUBLIC_META_DESCRIPTION || 'Správa zakázek a zákazníků',
};

// Helper pro page title
export function pageTitle(page?: string): string {
  if (!page) return branding.name;
  return `${page} | ${branding.name}`;
}
```

### Aktualizovat `.env.example`:

Přidat PUBLIC_ prefix pro client-side přístup:

```bash
# Branding (PUBLIC_ prefix = dostupné v browseru)
PUBLIC_INSTANCE_NAME="Futurol"
PUBLIC_COMPANY_NAME="FARDAL s.r.o."
PUBLIC_BRANDING_LOGO="/logo-icon.png"
PUBLIC_BRANDING_LOGO_FULL="/Futurol-logo-slogan.svg"
PUBLIC_BRANDING_LOGO_ICON="/FUTUROL_logo F.jpg"
PUBLIC_META_DESCRIPTION="Futurol - Správa zakázek a zaměření pergol"
```

---

## 3. Soubory k úpravě

### 3.1 Root layout: `src/routes/+layout.svelte`

**Aktuální:**
```svelte
<svelte:head>
  <title>Futurol App</title>
  <meta name="description" content="Futurol - Správa zakázek a zaměření pergol" />
</svelte:head>
```

**Nové:**
```svelte
<script lang="ts">
  import '../app.css';
  import { branding } from '$lib/config/branding';
  
  let { children } = $props();
</script>

<svelte:head>
  <title>{branding.name}</title>
  <meta name="description" content={branding.description} />
</svelte:head>

{@render children()}
```

---

### 3.2 Login page: `src/routes/login/+page.svelte`

**Změny:**

1. Import branding:
```svelte
<script lang="ts">
  import { branding, pageTitle } from '$lib/config/branding';
  // ... zbytek importů
</script>
```

2. Page title:
```svelte
<svelte:head>
  <title>{pageTitle('Přihlášení')}</title>
</svelte:head>
```

3. Logo:
```svelte
<!-- Aktuální -->
<img src="/FUTUROL_logo F.jpg" alt="FUTUROL" class="h-14 w-14 mx-auto" />

<!-- Nové -->
<img src={branding.logoIcon} alt={branding.name} class="h-14 w-14 mx-auto" />
```

---

### 3.3 Dashboard layout: `src/routes/dashboard/+layout.svelte`

**Změny:**

1. Import:
```svelte
<script lang="ts">
  import { branding } from '$lib/config/branding';
  // ... ostatní importy
</script>
```

2. Sidebar logo sekce (cca řádek 130-145):
```svelte
<!-- Aktuální -->
<a href="/dashboard" class="flex items-center gap-3">
  <img src="/logo-icon.png" alt="Futurol" class="h-8 w-auto" />
  <span class="text-xl font-bold text-slate-800 tracking-tight">FUTUROL</span>
</a>

<!-- Nové -->
<a href="/dashboard" class="flex items-center gap-3">
  <img src={branding.logo} alt={branding.name} class="h-8 w-auto" />
  <span class="text-xl font-bold text-slate-800 tracking-tight">{branding.name}</span>
</a>
```

---

### 3.4 Landing page: `src/routes/+page.svelte`

**Změny:**

1. Import:
```svelte
<script lang="ts">
  import { branding, pageTitle } from '$lib/config/branding';
  // ... ostatní
</script>
```

2. Page title (pokud existuje):
```svelte
<svelte:head>
  <title>{branding.name}</title>
</svelte:head>
```

3. Header logo (hledat `FUTUROL_logo` nebo podobné):
```svelte
<!-- Nahradit všechny výskyty -->
<img src={branding.logoIcon} alt={branding.name} ... />
```

4. Texty obsahující "FUTUROL" nebo "Futurol" - nahradit `{branding.name}`

---

### 3.5 Rádce: `src/routes/radce/+page.svelte`

**Změny:**

1. Import:
```svelte
<script lang="ts">
  import { branding, pageTitle } from '$lib/config/branding';
  // ... ostatní
</script>
```

2. Page title:
```svelte
<svelte:head>
  <title>{pageTitle('Rádce')}</title>
  <!-- preload zůstává -->
</svelte:head>
```

3. Logo v levém rohu:
```svelte
<!-- Aktuální -->
<img src="/FUTUROL_logo F.jpg" alt="FUTUROL" class="h-10 w-10" />

<!-- Nové -->
<img src={branding.logoIcon} alt={branding.name} class="h-10 w-10" />
```

4. Header text (cca řádek 180):
```svelte
<!-- Aktuální -->
RÁDCE PRO VÝBĚR PERGOLY FUTUROL

<!-- Nové -->
RÁDCE PRO VÝBĚR PERGOLY
```

5. Produkty ve funkci `getRecommendation()` - generalizovat názvy:
```typescript
// Aktuální
return {
  title: "FUTUROL Premium",
  ...
}

// Nové
return {
  title: "Premium Line",
  ...
}

// Podobně pro ostatní:
// "FUTUROL Classic" -> "Classic Line"
// "FUTUROL Artesa" -> "Artesa Line" (nebo jiný generický název)
```

---

### 3.6 Dashboard stránky - page titles

Všechny soubory v `src/routes/dashboard/*/+page.svelte` obsahující `<svelte:head>`:

| Soubor | Aktuální title | Nový title |
|--------|----------------|------------|
| `inquiries/+page.svelte` | `Poptávky \| FUTUROL` | `{pageTitle('Poptávky')}` |
| `customers/+page.svelte` | (ověřit) | `{pageTitle('Zákazníci')}` |
| `orders/+page.svelte` | (ověřit) | `{pageTitle('Zakázky')}` |
| `measurements/+page.svelte` | (ověřit) | `{pageTitle('Zaměření')}` |
| `service/+page.svelte` | (ověřit) | `{pageTitle('Servis')}` |
| `+page.svelte` (dashboard home) | (ověřit) | `{pageTitle('Dashboard')}` |

**Vzor úpravy:**
```svelte
<script lang="ts">
  import { pageTitle } from '$lib/config/branding';
  // ... ostatní importy
</script>

<svelte:head>
  <title>{pageTitle('Poptávky')}</title>
</svelte:head>
```

---

## 4. Tailwind config (volitelné - NEDĚLAT TEĎ)

Přejmenování `futurol-*` na `brand-*` je **volitelné** - jsou to interní názvy, klient je nevidí.

**Doporučení:** Nechat na později, není to blokující pro demo.

---

## 5. Statické soubory pro demo

### Přidat do `/static/`:

1. `ascenta-lab-logo.svg` - plné logo Ascenta Lab
2. `ascenta-lab-icon.svg` - ikona (čtvercová) pro sidebar a login

### Struktura:
```
/static/
├── logo-icon.png          # Futurol icon (stávající)
├── Futurol-logo-slogan.svg # Futurol full (stávající)
├── FUTUROL_logo F.jpg      # Futurol F icon (stávající)
├── ascenta-lab-logo.svg    # NOVÉ - demo logo
├── ascenta-lab-icon.svg    # NOVÉ - demo icon
└── radce/
    └── strana_*.jpg        # Pozadí rádce (zůstává)
```

---

## 6. Demo deployment

### 6.1 Vytvořit `docker-compose.demo.yml`

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/tomash-ascenta/futurol-app-management:latest
    container_name: pergola-pms-demo
    restart: unless-stopped
    ports:
      - "8082:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://demo:${DB_PASSWORD}@db:5432/demo
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - LICENSE_TIER=full
      # Branding
      - PUBLIC_INSTANCE_NAME=Pergola PMS
      - PUBLIC_COMPANY_NAME=Ascenta Lab Demo
      - PUBLIC_BRANDING_LOGO=/ascenta-lab-logo.svg
      - PUBLIC_BRANDING_LOGO_FULL=/ascenta-lab-logo.svg
      - PUBLIC_BRANDING_LOGO_ICON=/ascenta-lab-icon.svg
      - PUBLIC_APP_URL=https://demo.ascentalab.cz
      - PUBLIC_META_DESCRIPTION=Pergola PMS - Demo systému pro správu zakázek
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    container_name: pergola-pms-demo-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=demo
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=demo
    volumes:
      - demo_db_data:/var/lib/postgresql/data

volumes:
  demo_db_data:
```

### 6.2 Nginx config pro demo

```nginx
# /etc/nginx/sites-available/demo.ascentalab.cz

server {
    listen 443 ssl http2;
    server_name demo.ascentalab.cz;

    ssl_certificate /etc/letsencrypt/live/demo.ascentalab.cz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/demo.ascentalab.cz/privkey.pem;

    location / {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 50M;
}

server {
    listen 80;
    server_name demo.ascentalab.cz;
    return 301 https://$server_name$request_uri;
}
```

---

## 7. Implementační checklist

### Fáze 1: Příprava (30 min)
- [ ] Vytvořit `src/lib/config/branding.ts`
- [ ] Aktualizovat `.env.example` s novými proměnnými
- [ ] Přidat demo loga do `/static/`

### Fáze 2: Úpravy kódu (2-3 hodiny)
- [ ] `src/routes/+layout.svelte` - root title a meta
- [ ] `src/routes/login/+page.svelte` - logo a title
- [ ] `src/routes/dashboard/+layout.svelte` - sidebar logo a text
- [ ] `src/routes/+page.svelte` - landing page (pokud používána)
- [ ] `src/routes/radce/+page.svelte` - logo, texty, produkty
- [ ] Všechny dashboard `+page.svelte` - page titles
- [ ] Grep pro zbývající "FUTUROL" a "Futurol" výskyty

### Fáze 3: Testování (30 min)
- [ ] Lokální test s FUTUROL konfigurací
- [ ] Lokální test s Demo konfigurací
- [ ] Ověřit všechny stránky

### Fáze 4: Deployment (1 hodina)
- [ ] Vytvořit `docker-compose.demo.yml`
- [ ] Nastavit DNS pro demo.ascentalab.cz
- [ ] Nginx konfigurace
- [ ] SSL certifikát
- [ ] Spustit demo instanci
- [ ] Seed demo data

---

## 8. Grep příkazy pro ověření

Po implementaci spustit pro kontrolu zbývajících hardcoded referencí:

```bash
# Hledat FUTUROL (case insensitive)
grep -ri "futurol" src/ --include="*.svelte" --include="*.ts" | grep -v node_modules

# Hledat FARDAL
grep -ri "fardal" src/ --include="*.svelte" --include="*.ts" | grep -v node_modules

# Hledat hardcoded logo cesty
grep -r "logo.*\.png\|logo.*\.svg\|logo.*\.jpg" src/ --include="*.svelte" | grep -v node_modules
```

---

## 9. Poznámky

### Co zůstává nezměněno:
- "Powered by Ascenta Lab" footer - zůstává vždy
- Tailwind color names (futurol-*) - interní, klient nevidí
- Dokumentace v repozitáři - aktualizovat až po stabilizaci
- Rádce URL `/radce` - skrytý, ale funkční (kdo nezná URL, nevidí)

### Budoucí rozšíření (mimo scope):
- Konfigurovatelné barvy přes ENV
- Multi-tenant databáze
- Licenční server pro více instancí

---

*Dokument vytvořen: 21. ledna 2026*
*Pro projekt: FUTUROL App Management → White-label*
