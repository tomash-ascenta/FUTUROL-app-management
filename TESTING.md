# Testing Guide

Strategie testování pro Futurol App.

> **Vlastník software:** Ascenta Lab | **Zákazník:** FARDAL s.r.o. (Futurol.cz)

---

## 📋 Obsah

- [Testing Strategy](#testing-strategy)
- [Test Pyramid](#test-pyramid)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [API Testing](#api-testing)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)

---

## Testing Strategy

### Cíle

- ✅ **Rychlá feedback loop** - unit testy běží < 5s
- ✅ **Vysoká confidence** - kritické flows pokryty E2E testy
- ✅ **Maintainability** - testy jako living dokumentace
- ✅ **Regression prevention** - každý bug = nový test

### Pokrytí

| Typ testu | Target Coverage | Aktuální | Priorita |
|-----------|----------------|----------|----------|
| Unit | 80% | 0% | 🔴 P0 |
| Integration | 60% | 0% | 🟡 P1 |
| E2E | Kritické flows | 0% | 🟡 P1 |
| API | Všechny endpointy | 0% | 🔴 P0 |

**⚠️ Poznámka:** Projekt momentálně nemá implementované automatické testy. Tento dokument slouží jako roadmap pro budoucí implementaci.

---

## Test Pyramid

```
        /\
       /  \  E2E Tests (5%)
      /    \  - Happy paths
     /      \ - Critical user journeys
    /________\
   /          \ Integration Tests (25%)
  /            \ - API endpoints
 /              \ - Database queries
/______________\ Unit Tests (70%)
                 - Business logic
                 - Utilities
                 - Components
```

---

## Unit Testing

### Framework: Vitest

**Instalace:**
```bash
npm install -D vitest @vitest/ui @testing-library/svelte jsdom
```

**Konfigurace (`vite.config.ts`):**
```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '*.config.ts'
      ]
    }
  }
});
```

### Příklady Unit Testů

#### Utility funkce (`src/lib/utils/index.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { formatShortDate, formatLongDate, getRoleLabel } from './index';

describe('formatShortDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2026-01-13T15:30:00');
    expect(formatShortDate(date)).toBe('13. 1. 2026');
  });

  it('handles invalid date', () => {
    expect(formatShortDate(null)).toBe('-');
  });
});

describe('getRoleLabel', () => {
  it('returns correct label for role', () => {
    expect(getRoleLabel('admin')).toBe('Administrátor');
    expect(getRoleLabel('sales')).toBe('Obchodník');
  });

  it('handles unknown role', () => {
    expect(getRoleLabel('unknown')).toBe('unknown');
  });
});
```

#### Server utilities (`src/lib/server/auth.test.ts`)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { hashPin, verifyPin, generateToken, verifyToken } from './auth';

describe('auth utilities', () => {
  describe('hashPin', () => {
    it('hashes PIN correctly', async () => {
      const pin = '123456';
      const hash = await hashPin(pin);
      
      expect(hash).not.toBe(pin);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('generates different hash for same PIN', async () => {
      const pin = '123456';
      const hash1 = await hashPin(pin);
      const hash2 = await hashPin(pin);
      
      expect(hash1).not.toBe(hash2); // bcrypt salt
    });
  });

  describe('verifyPin', () => {
    it('verifies correct PIN', async () => {
      const pin = '123456';
      const hash = await hashPin(pin);
      
      const isValid = await verifyPin(pin, hash);
      expect(isValid).toBe(true);
    });

    it('rejects incorrect PIN', async () => {
      const pin = '123456';
      const hash = await hashPin(pin);
      
      const isValid = await verifyPin('wrong', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT tokens', () => {
    it('generates and verifies token', () => {
      const payload = {
        employeeId: 'uuid-123',
        personalNumber: '0001',
        roles: ['admin']
      };

      const token = generateToken(payload);
      const verified = verifyToken(token);

      expect(verified).toBeDefined();
      expect(verified.employeeId).toBe('uuid-123');
    });

    it('rejects invalid token', () => {
      const verified = verifyToken('invalid-token');
      expect(verified).toBeNull();
    });
  });
});
```

#### Svelte komponenta (`src/lib/components/ui/Button.test.ts`)

```typescript
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Button from './Button.svelte';

describe('Button', () => {
  it('renders with text', () => {
    render(Button, { props: { children: 'Click me' } });
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('applies variant classes', () => {
    const { container } = render(Button, { 
      props: { variant: 'primary' } 
    });
    
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-primary');
  });

  it('is disabled when disabled prop is true', () => {
    const { container } = render(Button, { 
      props: { disabled: true } 
    });
    
    const button = container.querySelector('button');
    expect(button?.disabled).toBe(true);
  });
});
```

---

## Integration Testing

### Database Tests

**Setup (`src/tests/db.test.ts`):**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Customer CRUD', () => {
  let customerId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.customer.deleteMany({
      where: { phone: { contains: 'test-' } }
    });
  });

  afterEach(async () => {
    if (customerId) {
      await prisma.customer.delete({ where: { id: customerId } });
    }
  });

  it('creates customer with location', async () => {
    const customer = await prisma.customer.create({
      data: {
        fullName: 'Test User',
        phone: 'test-777888999',
        email: 'test@example.com',
        source: 'manual',
        locations: {
          create: {
            street: 'Test Street 123',
            city: 'Praha',
            zip: '10000',
            country: 'CZ'
          }
        }
      },
      include: { locations: true }
    });

    customerId = customer.id;

    expect(customer.fullName).toBe('Test User');
    expect(customer.locations).toHaveLength(1);
    expect(customer.locations[0].city).toBe('Praha');
  });

  it('finds customer by phone', async () => {
    const created = await prisma.customer.create({
      data: {
        fullName: 'Test User 2',
        phone: 'test-666777888',
        source: 'manual'
      }
    });

    customerId = created.id;

    const found = await prisma.customer.findFirst({
      where: { phone: 'test-666777888' }
    });

    expect(found).toBeDefined();
    expect(found?.id).toBe(created.id);
  });
});
```

---

## E2E Testing

### Framework: Playwright

**Instalace:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Konfigurace (`playwright.config.ts`):**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test příklady

#### Login flow (`tests/e2e/auth.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('successful login', async ({ page }) => {
    await page.goto('/login');

    // Enter personal number
    await page.fill('input[name="personalNumber"]', '0001');
    
    // Enter PIN
    await page.fill('input[name="pin"]', '123456');
    
    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show user name
    await expect(page.getByText('Admin User')).toBeVisible();
  });

  test('failed login - wrong PIN', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="personalNumber"]', '0001');
    await page.fill('input[name="pin"]', 'wrong');
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.getByText('Neplatné osobní číslo nebo PIN')).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('rate limiting', async ({ page }) => {
    await page.goto('/login');

    // Try 6 times
    for (let i = 0; i < 6; i++) {
      await page.fill('input[name="personalNumber"]', '0001');
      await page.fill('input[name="pin"]', 'wrong');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(100);
    }

    // Should be blocked
    await expect(page.getByText(/Počkejte.*minut/)).toBeVisible();
  });
});
```

#### Customer management (`tests/e2e/customers.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Customer Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="personalNumber"]', '0001');
    await page.fill('input[name="pin"]', '123456');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('create new customer', async ({ page }) => {
    await page.goto('/dashboard/customers');
    await page.click('text=Nový zákazník');

    // Fill form
    await page.fill('input[name="fullName"]', 'E2E Test Customer');
    await page.fill('input[name="phone"]', '+420999888777');
    await page.fill('input[name="email"]', 'e2e@test.cz');
    
    // Location
    await page.fill('input[name="street"]', 'Test Street 456');
    await page.fill('input[name="city"]', 'Brno');
    await page.fill('input[name="zip"]', '60200');

    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.getByText('Zákazník byl vytvořen')).toBeVisible();
    
    // Should appear in list
    await expect(page.getByText('E2E Test Customer')).toBeVisible();
  });

  test('search customers', async ({ page }) => {
    await page.goto('/dashboard/customers');
    
    await page.fill('input[placeholder*="Hledat"]', 'Novák');
    
    // Should filter results
    await expect(page.getByText(/Novák/)).toBeVisible();
  });
});
```

#### B2C Rádce (`tests/e2e/advisor.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('B2C Advisor', () => {
  test('complete wizard flow', async ({ page }) => {
    await page.goto('/radce');

    // Start quiz
    await page.click('text=Začít');

    // Question 1
    await page.click('text=Pravidelně od jara do podzimu');
    await page.click('text=Pokračovat');

    // Question 2
    await page.click('text=Stínění proti slunci');
    await page.click('text=Ochranu proti dešti');
    await page.click('text=Pokračovat');

    // ... další otázky ...

    // Question 5
    await page.click('text=Odeslat');

    // Should show recommendation
    await expect(page.getByText(/Vaše ideální pergola/)).toBeVisible();
    await expect(page.getByText(/KLIMO|HORIZONTAL|KLASIK/)).toBeVisible();
  });

  test('lead capture', async ({ page }) => {
    await page.goto('/radce');
    
    // Complete quiz (zkráceno)
    // ...

    // Fill contact form
    await page.fill('input[name="name"]', 'E2E Lead');
    await page.fill('input[name="phone"]', '+420777666555');
    await page.fill('input[name="email"]', 'lead@e2e.test');
    
    await page.click('text=Odeslat poptávku');

    // Should show thank you message
    await expect(page.getByText(/Děkujeme/)).toBeVisible();
  });
});
```

---

## API Testing

### Framework: Vitest + supertest

**Setup (`tests/api/setup.ts`):**

```typescript
import { build } from '$lib/server/app'; // Hypothetical Fastify app
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

export async function setupAPI() {
  app = await build();
  await app.ready();
  return app;
}

export async function teardownAPI() {
  await app.close();
}

export { app };
```

### API Test příklady

#### Auth endpoints (`tests/api/auth.test.ts`)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupAPI, teardownAPI } from './setup';

describe('/api/auth', () => {
  beforeAll(async () => {
    await setupAPI();
  });

  afterAll(async () => {
    await teardownAPI();
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const response = await fetch('http://localhost:5173/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalNumber: '0001',
          pin: '123456'
        })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.personalNumber).toBe('0001');
      
      // Should set cookie
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('auth_token');
    });

    it('rejects invalid credentials', async () => {
      const response = await fetch('http://localhost:5173/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalNumber: '0001',
          pin: 'wrong'
        })
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
```

#### Customer endpoints (`tests/api/customers.test.ts`)

```typescript
describe('/api/customers', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login to get token
    const response = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalNumber: '0001',
        pin: '123456'
      })
    });

    const cookies = response.headers.get('set-cookie');
    authToken = cookies?.match(/auth_token=([^;]+)/)?.[1] || '';
  });

  it('creates customer', async () => {
    const response = await fetch('http://localhost:5173/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${authToken}`
      },
      body: JSON.stringify({
        fullName: 'API Test Customer',
        phone: '+420123456789',
        email: 'api@test.cz',
        location: {
          street: 'API Street 1',
          city: 'Praha',
          zip: '11000'
        }
      })
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.customer.fullName).toBe('API Test Customer');
  });

  it('requires authentication', async () => {
    const response = await fetch('http://localhost:5173/api/customers');
    expect(response.status).toBe(401);
  });
});
```

---

## Running Tests

### Package.json scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:api": "vitest run tests/api"
  }
}
```

### Running locally

```bash
# Unit tests (watch mode)
npm test

# Unit tests (single run)
npm test -- --run

# With coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# API tests only
npm run test:api
```

---

## CI/CD Integration

### GitHub Actions (`.github/workflows/test.yml`)

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          
      - run: npm ci
      - run: npm run test -- --run
      - run: npm run test:coverage
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          
      - run: npm ci
      - run: npx playwright install --with-deps
      
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Data Management

### Fixtures

```typescript
// tests/fixtures/customers.ts
export const testCustomers = {
  valid: {
    fullName: 'Test Customer',
    phone: '+420777888999',
    email: 'test@example.cz',
    location: {
      street: 'Test Street 1',
      city: 'Praha',
      zip: '10000'
    }
  },
  minimal: {
    fullName: 'Minimal Customer',
    phone: '+420666777888'
  }
};
```

### Database seeding for tests

```typescript
// tests/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedTestData() {
  await prisma.employee.createMany({
    data: [
      {
        personalNumber: 'TEST01',
        pin: await hashPin('123456'),
        fullName: 'Test Admin',
        roles: ['admin'],
        isActive: true
      }
    ]
  });
}
```

---

## Best Practices

### ✅ DO
- Testuj chování, ne implementaci
- Používej descriptive test names
- Mockuj external dependencies (API calls, file system)
- Izoluj testy (každý test je samostatný)
- Používej beforeEach/afterEach pro cleanup

### ❌ DON'T
- Netestuj library kód (Prisma, SvelteKit)
- Neduplicituj testy
- Nepsat flaky testy (random failures)
- Necommituj test data do production DB

---

**Naposledy aktualizováno:** 13. ledna 2026  
**Verze:** 1.0
