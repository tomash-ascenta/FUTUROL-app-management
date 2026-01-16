# Contributing Guide

Průvodce pro přispěvatele do projektu FUTUROL.

## Rychlý start

### Požadavky

- **Node.js** 18+ 
- **Docker** & Docker Compose
- **Git**
- IDE s TypeScript podporou (VS Code doporučeno)

### Lokální setup

```bash
# 1. Klonování
git clone git@github.com:tomash-ascenta/FUTUROL-app-management.git
cd FUTUROL-app-management

# 2. Instalace závislostí
npm install

# 3. Nastavení prostředí
cp .env.example .env
# Upravit .env podle potřeby

# 4. Spuštění databáze
docker compose up -d db

# 5. Migrace a seed
npx prisma migrate dev
npx prisma db seed

# 6. Spuštění dev serveru
npm run dev
```

Aplikace běží na `http://localhost:5173`

## Struktura projektu

```
├── src/
│   ├── lib/
│   │   ├── components/    # Svelte komponenty
│   │   ├── server/        # Server-only kód (Prisma, auth)
│   │   ├── stores/        # Svelte stores
│   │   └── utils/         # Utility funkce
│   ├── routes/            # SvelteKit routes
│   │   ├── api/           # API endpoints
│   │   ├── dashboard/     # Admin dashboard
│   │   ├── radce/         # B2C Rádce
│   │   └── login/         # Autentizace
│   └── app.html           # HTML template
├── prisma/
│   ├── schema.prisma      # DB schéma
│   └── migrations/        # Migrace
├── static/                # Statické soubory
└── uploads/               # Nahrané soubory (gitignore)
```

## Vývojový workflow

### 1. Vytvoření větve

```bash
# Feature
git checkout -b feature/nazev-funkce

# Bugfix
git checkout -b fix/popis-problemu

# Hotfix (urgentní)
git checkout -b hotfix/kriticka-oprava
```

### 2. Konvence pojmenování

**Větve:**
- `feature/` - nové funkce
- `fix/` - opravy bugů
- `refactor/` - refaktoring bez změny chování
- `docs/` - dokumentace
- `hotfix/` - urgentní opravy v produkci

**Commity:**
```
feat: přidána nová funkce
fix: opravena chyba v XY
refactor: refaktoring komponenty
docs: aktualizace README
style: formátování kódu
test: přidány testy
chore: údržba, deps update
```

### 3. Code review

- Vytvořit Pull Request do `main`
- Popis co a proč se mění
- Počkat na review
- Po schválení merge

## Coding Standards

### TypeScript

```typescript
// ✅ Správně - explicitní typy pro public API
export function calculatePrice(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Správně - interface pro komplexní objekty
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// ❌ Špatně - any
function process(data: any) { ... }
```

### Svelte komponenty

```svelte
<script lang="ts">
  // 1. Importy
  import { onMount } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  
  // 2. Props (Svelte 5 runes)
  let { title, items = [] }: { title: string; items?: string[] } = $props();
  
  // 3. Stav
  let isLoading = $state(false);
  
  // 4. Derived
  let itemCount = $derived(items.length);
  
  // 5. Funkce
  function handleClick() {
    // ...
  }
  
  // 6. Lifecycle
  onMount(() => {
    // ...
  });
</script>

<!-- Template -->
<div class="container">
  <h1>{title}</h1>
  <!-- ... -->
</div>

<!-- Scoped styles -->
<style>
  .container {
    /* ... */
  }
</style>
```

### Tailwind CSS

```svelte
<!-- ✅ Správně - logické seskupení -->
<div class="
  flex items-center gap-4
  p-4 rounded-lg
  bg-white shadow-md
  hover:shadow-lg transition-shadow
">

<!-- ❌ Špatně - chaotické pořadí -->
<div class="shadow-md p-4 flex hover:shadow-lg bg-white gap-4 rounded-lg">
```

### API Routes

```typescript
// src/routes/api/orders/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';

export const GET: RequestHandler = async ({ locals, url }) => {
  // 1. Auth check
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }
  
  // 2. Parametry
  const page = Number(url.searchParams.get('page')) || 1;
  
  // 3. Data
  const orders = await prisma.order.findMany({
    where: { userId: locals.user.id },
    skip: (page - 1) * 20,
    take: 20
  });
  
  // 4. Response
  return json({ orders, page });
};
```

## Databáze

### Změny schématu

```bash
# 1. Upravit schema.prisma

# 2. Vytvořit migraci
npx prisma migrate dev --name popis_zmeny

# 3. Regenerovat klienta
npx prisma generate
```

### Konvence

- Tabulky v PascalCase: `User`, `Order`, `PergolaModel`
- Sloupce v camelCase: `createdAt`, `userId`
- Relace pojmenovat jasně: `orders`, `createdBy`

## Testování

### Před commitem

```bash
# Type check
npm run check

# Lint
npm run lint

# Build test
npm run build
```

### Manuální testování

1. Otestovat happy path
2. Otestovat edge cases
3. Otestovat různé role (admin, manager, technician)
4. Otestovat na různých zařízeních (responzivita)

## Deployment

### Staging (automaticky)

Push do `main` automaticky deployuje na staging.

### Produkce

```bash
# 1. Vytvořit tag
git tag v0.X.Y -m "Popis verze"
git push origin v0.X.Y

# 2. Deploy
ssh vpsuser@37.46.208.167 "cd /home/vpsuser/app/FUTUROL-app-management && ./deploy.sh"
```

Detaily viz `VPS_CREDENTIALS.md`.

## Troubleshooting

### Prisma problémy

```bash
# Reset databáze (POZOR - smaže data!)
npx prisma migrate reset

# Regenerovat klienta
npx prisma generate
```

### Port obsazen

```bash
# Najít proces
lsof -i :5173

# Nebo použít jiný port
npm run dev -- --port 3000
```

### Docker problémy

```bash
# Vyčistit
docker compose down -v
docker system prune -f

# Znovu spustit
docker compose up -d db
```

## Užitečné příkazy

```bash
# Prisma Studio (GUI pro DB)
npx prisma studio

# Generovat typy
npx prisma generate

# Kontrola TypeScript
npm run check

# Build pro produkci
npm run build

# Preview produkčního buildu
npm run preview
```

## Kontakty

- **Maintainer:** Tomáš Havelka (tomas@ascentalab.cz)
- **Issues:** GitHub Issues
- **Urgent:** Viz SECURITY.md

---

*Děkujeme za příspěvky! 🚀*
