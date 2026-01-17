# Feature Flags Specifikace

*Verze: 1.1 | Datum: 17. ledna 2026*

> **Vlastník software:** Ascenta Lab | **Zákazník:** FARDAL s.r.o. (Futurol.cz)

> **Zadání pro vývojáře: Implementace licenčního tiering systému pro Futurol App**

---

## ✅ Status implementace

| Komponenta | Stav | Soubor |
|------------|------|--------|
| **Core konfigurace** | ✅ Implementováno | `src/lib/server/features.ts` |
| **Sidebar filtering** | ✅ Implementováno | `src/routes/dashboard/+layout.svelte` |
| **Layout data** | ✅ Implementováno | `src/routes/dashboard/+layout.server.ts` |
| **API guards - Orders** | ✅ Implementováno | `src/routes/api/orders/+server.ts` |
| **API guards - Service** | ✅ Implementováno | `src/routes/api/service-tickets/+server.ts` |
| **Page guards - Orders** | ✅ Implementováno | `src/routes/dashboard/orders/+page.server.ts` |
| **Page guards - Service** | ✅ Implementováno | `src/routes/dashboard/service/+page.server.ts` |
| **Page guards - Reports** | ✅ Implementováno | `src/routes/dashboard/reports/+page.server.ts` |
| **ENV variable** | ✅ V provozu | Stage + Production |

**Testováno:** Stage server s LICENSE_TIER=basic ověřen 17.1.2026

---

## 1. Přehled

### Cíl
Umožnit přepínání aplikace mezi dvěma licenčními úrovněmi (Basic/Full) pomocí ENV variable bez nutnosti změny kódu.

### Kontext
- Futurol App běží jako samostatná instance pro každého zákazníka
- Zákazník začíná na Full (trial), po měsíci se rozhodne pro Basic nebo Full
- Přepnutí provádí administrátor změnou ENV variable a restartem aplikace

### Klíčové požadavky
1. **Jednoduchost** - přepnutí = změna ENV + restart
2. **Downgrade politika** - data z Full funkcí zůstanou read-only v Basic
3. **Čistý kód** - centralizovaná logika, žádné hardcoded podmínky

---

## 2. Matice funkcí

### Tabulka licenčních úrovní

| Modul | BASIC | FULL | Poznámka |
|-------|:-----:|:----:|----------|
| **Positioning** | Lead gen + zaměření | Kompletní digitalizace | |
| **Rádce** | ✅ Komplet | ✅ Komplet | B2C wizard, lead capture |
| **Zákazníci** | ✅ Komplet | ✅ Komplet | CRUD, lokace, historie |
| **Zaměření** | ✅ Komplet | ✅ Komplet | Formulář, PDF, fotky |
| **Zakázky** | ❌ | ✅ Komplet | 12-stavový workflow |
| **Servis** | ❌ | ✅ Komplet | Tikety, plánování |
| **Dashboard** | Základní přehled | KPI, statistiky | Basic = počty, Full = grafy |
| **Reporty** | ❌ | ✅ Export | PDF, Excel export |
| **Max. uživatelů** | 3 | 6 | Počet aktivních Employee |
| **Max. rolí** | 3 | 6 | admin, sales, technician vs všechny |
| **Podpora** | Email | Prioritní + onboarding | Mimo scope aplikace |

### Mapování na kód

```typescript
// Feature identifikátory
type Feature = 
  | 'radce'           // B2C Rádce
  | 'customers'       // Zákazníci
  | 'measurements'    // Zaměření
  | 'orders'          // Zakázky
  | 'service'         // Servis
  | 'dashboard_basic' // Základní dashboard
  | 'dashboard_full'  // KPI dashboard
  | 'reports'         // Reporty a export
  | 'audit_logs';     // Audit logy
```

---

## 3. Technická specifikace

### 3.1 ENV variable

```bash
# .env
LICENSE_TIER=full   # hodnoty: "basic" | "full"
```

**Validace:** Pokud není nastaveno nebo má neplatnou hodnotu → default `full` (bezpečný fallback pro existující instalace).

### 3.2 Centrální konfigurace

**Soubor:** `src/lib/server/features.ts`

```typescript
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

// ---------------------------------------------
// Typy
// ---------------------------------------------
export type LicenseTier = 'basic' | 'full';
export type Feature = 
  | 'radce' 
  | 'customers' 
  | 'measurements' 
  | 'orders' 
  | 'service' 
  | 'dashboard_basic'
  | 'dashboard_full' 
  | 'reports'
  | 'audit_logs';

// ---------------------------------------------
// Konfigurace
// ---------------------------------------------
const TIER_CONFIG = {
  basic: {
    features: ['radce', 'customers', 'measurements', 'dashboard_basic'],
    maxUsers: 3,
    maxRoles: 3,
    allowedRoles: ['admin', 'sales', 'technician']
  },
  full: {
    features: ['radce', 'customers', 'measurements', 'orders', 'service', 'dashboard_basic', 'dashboard_full', 'reports', 'audit_logs'],
    maxUsers: 6,
    maxRoles: 6,
    allowedRoles: ['admin', 'sales', 'manager', 'production_manager', 'technician']
  }
} as const;

// ---------------------------------------------
// Aktuální tier
// ---------------------------------------------
export function getCurrentTier(): LicenseTier {
  const tier = env.LICENSE_TIER?.toLowerCase();
  if (tier === 'basic' || tier === 'full') {
    return tier;
  }
  // Default fallback
  return 'full';
}

// ---------------------------------------------
// Feature checks
// ---------------------------------------------
export function hasFeature(feature: Feature): boolean {
  const tier = getCurrentTier();
  return TIER_CONFIG[tier].features.includes(feature);
}

export function requireFeature(feature: Feature): void {
  if (!hasFeature(feature)) {
    throw error(403, {
      message: 'Funkce není dostupná ve vaší licenci',
      feature
    });
  }
}

// ---------------------------------------------
// Write permissions (pro downgrade politiku)
// ---------------------------------------------
export function canWrite(feature: Feature): boolean {
  // Pokud má tier feature, může zapisovat
  return hasFeature(feature);
}

export function requireWrite(feature: Feature): void {
  if (!canWrite(feature)) {
    throw error(403, {
      message: 'V Basic verzi je tato funkce pouze pro čtení',
      feature
    });
  }
}

// ---------------------------------------------
// User limits
// ---------------------------------------------
export function getMaxUsers(): number {
  return TIER_CONFIG[getCurrentTier()].maxUsers;
}

export function getAllowedRoles(): string[] {
  return [...TIER_CONFIG[getCurrentTier()].allowedRoles];
}

// ---------------------------------------------
// Helper pro UI
// ---------------------------------------------
export function getTierInfo() {
  const tier = getCurrentTier();
  return {
    tier,
    features: TIER_CONFIG[tier].features,
    maxUsers: TIER_CONFIG[tier].maxUsers,
    maxRoles: TIER_CONFIG[tier].maxRoles,
    allowedRoles: TIER_CONFIG[tier].allowedRoles
  };
}
```

### 3.3 Použití v API endpoints

**Příklad - Zakázky (Full only):**

```typescript
// src/routes/api/orders/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { requireFeature, requireWrite } from '$lib/server/features';
import { db } from '$lib/server/db';

// GET - seznam zakázek
export const GET: RequestHandler = async ({ locals }) => {
  requireFeature('orders');
  
  const orders = await db.order.findMany({
    // ...
  });
  
  return json({ orders });
};

// POST - vytvoření zakázky
export const POST: RequestHandler = async ({ request, locals }) => {
  requireFeature('orders');
  requireWrite('orders');  // Pro jistotu, i když orders není v Basic
  
  // ... vytvoření zakázky
};
```

**Příklad - Zaměření (Basic = read-only po downgrade):**

```typescript
// src/routes/api/measurements/+server.ts
import { requireFeature, canWrite } from '$lib/server/features';

// POST - vytvoření zaměření
export const POST: RequestHandler = async ({ request, locals }) => {
  requireFeature('measurements');
  
  // Zaměření je v Basic, ale pro budoucí flexibilitu:
  if (!canWrite('measurements')) {
    return json({ error: 'Pouze pro čtení' }, { status: 403 });
  }
  
  // ... vytvoření
};
```

### 3.4 Použití v page load functions

```typescript
// src/routes/dashboard/orders/+page.server.ts
import type { PageServerLoad } from './$types';
import { requireFeature } from '$lib/server/features';

export const load: PageServerLoad = async ({ locals }) => {
  requireFeature('orders');
  
  // ... načtení dat
};
```

### 3.5 Použití v UI (Svelte komponenty)

**Předání tier info do layoutu:**

```typescript
// src/routes/dashboard/+layout.server.ts
import { getTierInfo } from '$lib/server/features';

export const load = async ({ locals }) => {
  return {
    user: locals.user,
    license: getTierInfo()
  };
};
```

**Podmíněné zobrazení v sidebar:**

```svelte
<!-- src/lib/components/Sidebar.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  
  // Z layout data
  $: license = $page.data.license;
  
  function hasFeature(feature: string): boolean {
    return license?.features?.includes(feature) ?? false;
  }
</script>

<nav>
  <!-- Vždy viditelné -->
  <NavItem href="/dashboard/customers">Zákazníci</NavItem>
  <NavItem href="/dashboard/measurements">Zaměření</NavItem>
  
  <!-- Pouze Full -->
  {#if hasFeature('orders')}
    <NavItem href="/dashboard/orders">Zakázky</NavItem>
  {/if}
  
  {#if hasFeature('service')}
    <NavItem href="/dashboard/service">Servis</NavItem>
  {/if}
  
  {#if hasFeature('reports')}
    <NavItem href="/dashboard/reports">Reporty</NavItem>
  {/if}
</nav>
```

**Skrytí/disable tlačítek:**

```svelte
<!-- Příklad: tlačítko pro export -->
{#if hasFeature('reports')}
  <Button on:click={exportPDF}>Exportovat PDF</Button>
{/if}

<!-- Nebo disabled s vysvětlením -->
<Button 
  disabled={!hasFeature('reports')}
  title={!hasFeature('reports') ? 'Dostupné ve Full verzi' : ''}
>
  Exportovat PDF
</Button>
```

---

## 4. Downgrade politika

### Pravidla

Když zákazník přejde z Full → Basic:

| Modul | Chování | Implementace |
|-------|---------|--------------|
| **Zakázky** | Existující data = read-only, nové nelze vytvořit | `requireFeature` na GET, `requireWrite` na POST/PUT/DELETE |
| **Servis** | Existující tikety = read-only | Stejně jako zakázky |
| **Reporty** | Nedostupné | `requireFeature` |
| **Dashboard KPI** | Zobrazí se basic verze | Podmínka v komponentě |
| **Uživatelé nad limit** | Zůstanou, ale nemohou se přihlásit | Check při loginu |

### Implementace pro read-only data

```typescript
// src/routes/dashboard/orders/+page.server.ts
import { hasFeature, canWrite } from '$lib/server/features';

export const load: PageServerLoad = async ({ locals }) => {
  // Zakázky - může zobrazit i v Basic (existující data)
  // ale nesmí editovat
  
  const orders = await db.order.findMany({
    where: { /* ... */ }
  });
  
  return {
    orders,
    canEdit: canWrite('orders')  // false v Basic
  };
};
```

```svelte
<!-- src/routes/dashboard/orders/+page.svelte -->
<script>
  export let data;
</script>

{#if data.canEdit}
  <Button href="/dashboard/orders/new">Nová zakázka</Button>
{:else}
  <Alert variant="info">
    Zobrazujete historická data. Pro editaci přejděte na Full verzi.
  </Alert>
{/if}

{#each data.orders as order}
  <OrderCard {order} readonly={!data.canEdit} />
{/each}
```

---

## 5. Omezení počtu uživatelů

### Při vytváření uživatele

```typescript
// src/routes/api/employees/+server.ts
import { getMaxUsers } from '$lib/server/features';

export const POST: RequestHandler = async ({ request }) => {
  const activeUsers = await db.employee.count({
    where: { isActive: true }
  });
  
  if (activeUsers >= getMaxUsers()) {
    return json({
      error: `Dosažen limit uživatelů (${getMaxUsers()}). Pro více uživatelů přejděte na vyšší verzi.`
    }, { status: 403 });
  }
  
  // ... vytvoření
};
```

### Při přihlášení (po downgrade)

```typescript
// src/routes/api/auth/login/+server.ts
import { getMaxUsers } from '$lib/server/features';

export const POST: RequestHandler = async ({ request }) => {
  // ... ověření credentials
  
  // Check user limit
  const activeUsers = await db.employee.count({
    where: { isActive: true }
  });
  
  // Pokud je uživatel "nad limitem", odmítnout login
  // (řazení podle createdAt - nejstarší mají přednost)
  const allowedUsers = await db.employee.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    take: getMaxUsers(),
    select: { id: true }
  });
  
  const allowedIds = allowedUsers.map(u => u.id);
  
  if (!allowedIds.includes(employee.id)) {
    return json({
      error: 'Váš účet překračuje limit uživatelů. Kontaktujte administrátora.'
    }, { status: 403 });
  }
  
  // ... pokračovat v loginu
};
```

---

## 6. Testování

### Manuální testy

| Test | Kroky | Očekávaný výsledek |
|------|-------|-------------------|
| Basic - skryté moduly | Nastav `LICENSE_TIER=basic`, jdi na `/dashboard/orders` | 403 nebo redirect |
| Basic - sidebar | Nastav Basic, zkontroluj sidebar | Zakázky, Servis, Reporty nejsou vidět |
| Downgrade - read only | Vytvoř zakázku ve Full, přepni na Basic, otevři zakázku | Vidíš data, nemůžeš editovat |
| User limit | Basic, vytvoř 4. uživatele | Chyba "Dosažen limit" |
| Přepnutí | Změň ENV, restartuj, ověř změnu | Okamžitá změna chování |

### ENV pro testování

```bash
# Lokální vývoj - testování Basic
LICENSE_TIER=basic npm run dev

# Lokální vývoj - testování Full
LICENSE_TIER=full npm run dev
```

---

## 7. Deployment checklist

### Při nasazení nové instance

- [ ] Nastavit `LICENSE_TIER` v `.env` (default: `full` pro trial)
- [ ] Vytvořit max 3/6 uživatelů podle tieru
- [ ] Ověřit viditelnost modulů v sidebar
- [ ] Dokumentovat datum začátku trial

### Při přepnutí Full → Basic

- [ ] Informovat zákazníka o změně
- [ ] Změnit `LICENSE_TIER=basic` v `.env`
- [ ] `docker compose restart`
- [ ] Ověřit, že Full moduly jsou read-only
- [ ] Zkontrolovat, že uživatelé nad limit se nemohou přihlásit

---

## 8. Soubory k úpravě

| Soubor | Akce |
|--------|------|
| `src/lib/server/features.ts` | **Nový** - centrální logika |
| `src/routes/dashboard/+layout.server.ts` | Přidat `license: getTierInfo()` |
| `src/lib/components/Sidebar.svelte` | Podmíněné zobrazení položek |
| `src/routes/api/orders/+server.ts` | Přidat `requireFeature('orders')` |
| `src/routes/api/service-tickets/+server.ts` | Přidat `requireFeature('service')` |
| `src/routes/dashboard/orders/+page.server.ts` | Přidat `requireFeature('orders')` |
| `src/routes/dashboard/service/+page.server.ts` | Přidat `requireFeature('service')` |
| `src/routes/dashboard/reports/+page.server.ts` | Přidat `requireFeature('reports')` |
| `src/routes/api/employees/+server.ts` | User limit check |
| `src/routes/api/auth/login/+server.ts` | User limit check při loginu |
| `.env.example` | Přidat `LICENSE_TIER=full` |

---

## 9. Časový odhad

| Úkol | Effort |
|------|--------|
| `features.ts` + typy | 2 hodiny |
| Layout + sidebar úpravy | 2 hodiny |
| API guards (orders, service, reports) | 3 hodiny |
| User limit logika | 2 hodiny |
| Downgrade UI (read-only stavy) | 3 hodiny |
| Testování | 2 hodiny |
| **Celkem** | **~14 hodin (2 dny)** |

---

*Dokument vytvořen: 17. ledna 2026*
*Autor: Claude (ASCENTA projekt)*
