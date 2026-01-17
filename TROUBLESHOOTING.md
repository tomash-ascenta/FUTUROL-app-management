# Troubleshooting Guide

Řešení běžných problémů při vývoji a provozu Futurol App.

> **Vlastník software:** Ascenta Lab | **Zákazník:** FARDAL s.r.o. (Futurol.cz)

---

## 📋 Obsah

- [Lokální vývoj](#lokální-vývoj)
- [Docker problémy](#docker-problémy)
- [Databáze](#databáze)
- [Autentizace](#autentizace)
- [Build & Deploy](#build--deploy)
- [API chyby](#api-chyby)
- [Frontend problémy](#frontend-problémy)

---

## Lokální vývoj

### ❌ `npm install` selhává

**Symptom:** Chyby při instalaci závislostí

**Řešení:**
```bash
# Vyčistit cache a node_modules
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Pokud přetrvává, zkontroluj Node verzi
node --version  # Měla by být 20+
nvm use 20      # Pokud používáš nvm
```

---

### ❌ `npm run dev` spadne s "Cannot find module"

**Symptom:** 
```
Error: Cannot find module '@sveltejs/kit'
```

**Řešení:**
```bash
# Reinstaluj závislosti
npm install

# Vygeneruj Prisma client
npm run db:generate

# Sync SvelteKit
npm run prepare
```

---

### ❌ Port 5173 už je obsazený

**Symptom:**
```
Port 5173 is in use, trying another port
```

**Řešení:**
```bash
# Najdi proces na portu 5173
lsof -ti:5173

# Zastav proces
kill -9 $(lsof -ti:5173)

# Nebo změň port v package.json
# "dev": "vite dev --port 5174"
```

---

### ❌ Hot reload nefunguje

**Symptom:** Změny v kódu se neprojevují

**Řešení:**
```bash
# Restartuj dev server
# Ctrl+C a pak:
npm run dev

# Zkontroluj, jestli Vite správně sleduje soubory
# V terminálu by mělo být "watching for file changes"

# Na macOS může pomoci zvýšit limit file watchers
# Přidej do ~/.zshrc:
# ulimit -n 10240
```

---

## Docker problémy

### ❌ `docker compose up` selhává

**Symptom:**
```
Error: container name already in use
```

**Řešení:**
```bash
# Zastav a odstraň existující kontejnery
docker compose down

# Pokud přetrvává
docker rm -f futurol-app futurol-db

# Spusť znovu
docker compose up -d
```

---

### ❌ Database container neběží

**Symptom:**
```
Error: connect ECONNREFUSED 127.0.0.1:5433
```

**Řešení:**
```bash
# Zkontroluj stav kontejnerů
docker compose ps

# Zkontroluj logy databáze
docker compose logs db

# Restartuj databázový kontejner
docker compose restart db

# Pokud se nenastartuje, zkus rebuild
docker compose up db -d --force-recreate
```

---

### ❌ App container spadne po startu

**Symptom:**
```
futurol-app exited with code 1
```

**Řešení:**
```bash
# Zobraz logy aplikace
docker compose logs app

# Nejčastější příčiny:
# 1. Chybí DATABASE_URL - zkontroluj .env
# 2. DB není ready - kontejner čeká na healthcheck

# Rebuild bez cache
docker compose build --no-cache app
docker compose up app -d
```

---

### ❌ Volumes permission denied

**Symptom:**
```
Error: EACCES: permission denied, mkdir '/app/uploads'
```

**Řešení:**
```bash
# Vytvoř uploads složku s správnými právy
mkdir -p uploads
chmod 777 uploads  # Nebo specifičtější práva

# V Dockerfile zkontroluj USER directive
# Měl by být non-root user s přístupem k /app/uploads
```

---

## Databáze

### ❌ Prisma migrace selhává

**Symptom:**
```
Error: P3009 - Migrate failed
```

**Řešení:**
```bash
# Reset databáze (POZOR: smaže všechna data!)
npm run db:push -- --force-reset

# Nebo manuálně:
npx prisma migrate reset

# Pro produkci - rollback na předchozí migraci
# Není nativní Prisma příkaz, musíš použít raw SQL
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npx prisma migrate deploy
```

---

### ❌ Cannot connect to database

**Symptom:**
```
Error: P1001 - Can't reach database server
```

**Řešení:**
```bash
# Zkontroluj DATABASE_URL v .env
cat .env | grep DATABASE_URL

# Pro Docker: použij host 'db' místo 'localhost'
# DATABASE_URL=postgresql://futurol:password@db:5432/futurol

# Pro lokální dev: použij localhost:5433
# DATABASE_URL=postgresql://futurol:password@localhost:5433/futurol

# Test připojení
psql $DATABASE_URL -c "SELECT 1;"
```

---

### ❌ Prisma Client není vygenerovaný

**Symptom:**
```
Error: @prisma/client did not initialize yet
```

**Řešení:**
```bash
# Vygeneruj Prisma Client
npm run db:generate

# Pokud přetrvává
rm -rf node_modules/.prisma
npm run db:generate
```

---

### ❌ Database schema out of sync

**Symptom:**
```
Error: Schema has changed, please run migrations
```

**Řešení:**
```bash
# Development - push schema
npm run db:push

# Production - použij migrace
npm run db:migrate
```

---

## Autentizace

### ❌ Nelze se přihlásit (401 Unauthorized)

**Symptom:** Login formulář vrací chybu

**Možné příčiny:**
1. **Špatný PIN nebo osobní číslo**
   ```bash
   # Zkontroluj seed data
   npx prisma studio
   # Nebo resetuj databázi a seedni znovu
   npm run db:push -- --force-reset
   npm run db:seed
   ```

2. **JWT_SECRET není nastavený**
   ```bash
   # Zkontroluj .env
   cat .env | grep JWT_SECRET
   
   # Pokud chybí, zkopíruj z .env.example
   cp .env.example .env
   ```

3. **Rate limiting**
   ```
   Zkus počkat 15 minut nebo restartuj server (rate limit je in-memory)
   ```

---

### ❌ Session vyprší okamžitě

**Symptom:** Po přihlášení se uživatel hned odhlásí

**Řešení:**
```bash
# Zkontroluj JWT expiry v src/lib/server/auth.ts
# Mělo by být: expiresIn: '8h'

# Zkontroluj cookie settings v hooks.server.ts
# secure: false pro dev, true pro production
# sameSite: 'lax'
```

---

### ❌ CORS chyby při API volání

**Symptom:**
```
Access to fetch blocked by CORS policy
```

**Řešení:**
```typescript
// V src/hooks.server.ts přidej CORS headers
if (event.request.method === 'OPTIONS') {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
```

---

## Build & Deploy

### ❌ Build selhává (TypeScript errors)

**Symptom:**
```
Type error: Property 'x' does not exist
```

**Řešení:**
```bash
# Spusť type checking
npm run check

# Oprav chyby ručně nebo:
# Zkontroluj tsconfig.json - měl by mít "strict": true

# Pokud chceš dočasně ignorovat
# "skipLibCheck": true v tsconfig.json (nedoporučeno)
```

---

### ❌ Build je příliš velký

**Symptom:** Bundle size > 500 kB

**Řešení:**
```bash
# Analyzuj bundle
npm run build
npx vite-bundle-visualizer

# Optimalizace:
# 1. Lazy load routes
# 2. Tree-shake unused code
# 3. Optimalizuj images (WebP)
```

---

### ❌ Deploy skript selhává

**Symptom:**
```bash
./deploy.sh
# Container removal failed
```

**Řešení:**
```bash
# SSH na VPS
ssh vpsuser@37.46.208.167

# Manuálně zastav kontejner
docker stop futurol-app
docker rm futurol-app

# Spusť deploy znovu
./deploy.sh
```

---

### ❌ Nginx 502 Bad Gateway

**Symptom:** Po deployi aplikace neběží

**Řešení:**
```bash
# Zkontroluj, jestli app container běží
docker ps | grep futurol-app

# Zkontroluj logy
docker logs futurol-app --tail 100

# Zkontroluj Nginx config
sudo nginx -t

# Restartuj Nginx
sudo systemctl restart nginx
```

---

### ❌ Docker build selhává s OOM (Out of Memory) / SIGKILL

**Symptom:** Build na VPS padá s `SIGKILL`, `signal killed`, nebo server přestane odpovídat

**Příčina:** VPS nemá dostatek RAM pro Docker build (SvelteKit + Vite potřebuje ~3GB RAM)

**Řešení:** Nestavět na VPS! Použij GitHub Actions:

```bash
# 1. Pushni změny do main - spustí se automatický build na GitHub
git push origin main

# 2. Po dokončení GitHub Actions se image stáhne na VPS automaticky

# 3. Ruční pull (pokud je potřeba):
ssh vpsuser@37.46.208.167 "docker pull ghcr.io/tomash-ascenta/futurol-app-management:latest && \
  docker tag ghcr.io/tomash-ascenta/futurol-app-management:latest futurol-app:latest && \
  docker compose up -d"
```

---

### ❌ GHCR unauthorized - nelze stáhnout image

**Symptom:** `unauthorized` při `docker pull ghcr.io/...`

**Příčina:** GHCR package není veřejný

**Řešení:**
1. Jdi na https://github.com/tomash-ascenta?tab=packages
2. Klikni na `futurol-app-management`
3. **Package settings** → **Change visibility** → **Public**

Alternativa (private package):
```bash
# Na VPS: přihlaš se pomocí Personal Access Token
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u tomash-ascenta --password-stdin
```

---

## API chyby

### ❌ 404 Not Found na API endpoint

**Symptom:**
```
GET /api/customers -> 404
```

**Řešení:**
```bash
# Zkontroluj routing
# Soubor: src/routes/api/customers/+server.ts

# Ujisti se, že exportuješ správné metody
# export async function GET() { ... }

# Zkontroluj path v browser network tab
# Mělo by být /api/customers ne /api/customers/
```

---

### ❌ 500 Internal Server Error

**Symptom:** API vrací 500

**Řešení:**
```bash
# Zkontroluj server logy
# V dev: přímo v terminálu
# V produkci: docker logs futurol-app

# Běžné příčiny:
# 1. Prisma query error - zkontroluj schema
# 2. Missing env variable
# 3. Unhandled exception - přidej try/catch
```

---

### ❌ Zod validation errors

**Symptom:**
```json
{
  "error": "Validation error",
  "details": { "phone": "Invalid phone format" }
}
```

**Řešení:**
```typescript
// Zkontroluj Zod schema
const schema = z.object({
  phone: z.string().regex(/^\+?[0-9]{9,14}$/),
  // Ujisti se, že formát odpovídá vstupu
});

// Pro debug
try {
  schema.parse(data);
} catch (e) {
  console.error(e.errors); // Detailní info
}
```

---

## Frontend problémy

### ❌ Svelte komponenta se neaktualizuje

**Symptom:** UI se nemění po změně dat

**Řešení:**
```svelte
<script lang="ts">
  // Svelte 5 - použij $state
  let count = $state(0);
  
  // NE: let count = 0;
  
  function increment() {
    count++; // Toto triggeruje reaktivitu
  }
</script>
```

---

### ❌ Form data se neodesílá

**Symptom:** `form.formData()` vrací prázdné

**Řešení:**
```svelte
<form method="POST" use:enhance>
  <!-- Ujisti se, že inputs mají 'name' atribut -->
  <input name="fullName" required />
  <button type="submit">Submit</button>
</form>
```

---

### ❌ Tailwind třídy nefungují

**Symptom:** CSS se neaplikuje

**Řešení:**
```bash
# Zkontroluj tailwind.config.js
# content: ['./src/**/*.{html,js,svelte,ts}']

# Restartuj dev server
npm run dev

# Pokud přetrvává, vyčisti cache
rm -rf .svelte-kit
```

---

### ❌ Icons se nezobrazují (Lucide)

**Symptom:** Ikony jsou prázdné

**Řešení:**
```svelte
<script>
  // Správně
  import { User } from 'lucide-svelte';
  
  // NE: import User from 'lucide-svelte/User';
</script>

<User size={24} />
```

---

## Rychlý checklist při problémech

```bash
# 1. Restartuješ dev server?
npm run dev

# 2. Máš aktuální dependencies?
npm install

# 3. Je Prisma client vygenerovaný?
npm run db:generate

# 4. Běží databáze?
docker compose ps

# 5. Jsou správně env variables?
cat .env

# 6. Nejsou TypeScript chyby?
npm run check

# 7. Jsou aktuální logy?
docker compose logs -f

# 8. Zkusil jsi už vypnout a zapnout? 😄
docker compose restart
```

---

## Potřebuješ další pomoc?

1. **Zkontroluj logy** - většina problémů je tam
2. **Google error message** - často už někdo řešil
3. **GitHub Issues** - zkontroluj repo issue tracker
4. **Kontaktuj tým** - Tomáš Havelka (tomash@ascenta.cz)

---

**Naposledy aktualizováno:** 13. ledna 2026  
**Verze:** 1.0
