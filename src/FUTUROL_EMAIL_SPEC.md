# Futurol App - Email protokolu zaměření

**Datum:** 18. ledna 2026  
**Verze:** 1.0  
**Status:** ✅ Implementováno

---

## 1. Přehled

### Účel
Zaměřovač v terénu vytvoří zaměření a může přímo z aplikace odeslat PDF protokol na email zákazníka.

### Rozhodnutí

| Položka | Rozhodnutí |
|---------|------------|
| PDF generování | Klient (stávající jsPDF) → upload base64 |
| UI | Modal s předvyplněným emailem |
| From adresa | `noreply@futurol.ascentalab.cz` |
| Email šablona | Plain HTML |
| Patička | Bez loga/kontaktu (zatím) |
| Logování | Pole v `Measurement` tabulce |
| Email provider | Resend (free tier) |

---

## 2. Architektura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLOW                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Zaměřovač v terénu]                                              │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐  │
│  │ Detail zaměření │────▶│ Modal: Odeslat  │────▶│ POST /api/   │  │
│  │ (tlačítko)      │     │ - předvyplněný  │     │ measurements/│  │
│  └─────────────────┘     │   email zákazn. │     │ [id]/send    │  │
│                          │ - volitelná msg │     └──────┬───────┘  │
│                          └─────────────────┘            │          │
│                                                         ▼          │
│                          ┌─────────────────┐     ┌──────────────┐  │
│                          │ Resend API      │◀────│ Email Service│  │
│                          │ (cloud)         │     │ (server)     │  │
│                          └────────┬────────┘     └──────────────┘  │
│                                   │                                 │
│                                   ▼                                 │
│                          ┌─────────────────┐                       │
│                          │ Zákazník inbox  │                       │
│                          │ (PDF příloha)   │                       │
│                          └─────────────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Prisma Schema změna

**Soubor:** `prisma/schema.prisma`

```prisma
model Measurement {
  // ... existující pole ...

  // Email tracking
  emailSentAt    DateTime?
  emailSentTo    String?
  emailSentById  String?
  emailSentBy    Employee? @relation("MeasurementEmailSender", fields: [emailSentById], references: [id])
}
```

**Migrace:**
```bash
npx prisma migrate dev --name add_measurement_email_tracking
```

---

## 4. Environment variables

**Soubor:** `.env.example` (přidat)

```bash
# ==============================================
# RESEND (Email service)
# ==============================================
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="Futurol <noreply@futurol.ascentalab.cz>"
```

---

## 5. Email Service

**Soubor:** `src/lib/server/email.ts` (nový)

```typescript
import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM } from '$env/static/private';

const resend = new Resend(RESEND_API_KEY);

interface SendMeasurementEmailParams {
  to: string;
  orderNumber: string;
  employeeName: string;
  customMessage?: string;
  pdfBase64: string;
  pdfFilename: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendMeasurementEmail(params: SendMeasurementEmailParams): Promise<SendEmailResult> {
  const { to, orderNumber, employeeName, customMessage, pdfBase64, pdfFilename } = params;

  // HTML template
  const html = `
    <p>Dobrý den,</p>
    <p>v příloze zasíláme protokol zaměření pro Vaši zakázku <strong>${orderNumber}</strong>.</p>
    ${customMessage ? `<p>${customMessage}</p>` : ''}
    <p>S pozdravem,<br>
    <strong>${employeeName}</strong><br>
    Futurol.cz</p>
    <hr>
    <small style="color: #666;">Tato zpráva byla odeslána automaticky ze systému Futurol.</small>
  `;

  // Plain text fallback
  const text = `
Dobrý den,

v příloze zasíláme protokol zaměření pro Vaši zakázku ${orderNumber}.

${customMessage ? customMessage + '\n' : ''}
S pozdravem,
${employeeName}
Futurol.cz
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM || 'Futurol <noreply@futurol.ascentalab.cz>',
      to: [to],
      subject: `Protokol zaměření pergoly - ${orderNumber}`,
      html,
      text,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBase64, // Resend accepts base64 directly
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('Email send failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
```

---

## 6. API Endpoint

**Soubor:** `src/routes/api/measurements/[id]/send-email/+server.ts` (nový)

```typescript
import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';
import { sendMeasurementEmail } from '$lib/server/email';
import { z } from 'zod';

const SendEmailSchema = z.object({
  recipientEmail: z.string().email('Neplatný formát emailu'),
  customMessage: z.string().max(1000).optional(),
  pdfBase64: z.string().min(1, 'PDF je povinné'),
});

export const POST: RequestHandler = async ({ params, request, cookies }) => {
  // 1. Auth check
  const user = await requireAuth(cookies);
  if (!user) {
    return json({ error: 'Nepřihlášen' }, { status: 401 });
  }

  // 2. Role check (pouze technician, admin)
  const allowedRoles = ['admin', 'technician'];
  const hasPermission = user.roles.some((r: string) => allowedRoles.includes(r));
  if (!hasPermission) {
    return json({ error: 'Nemáte oprávnění odesílat emaily' }, { status: 403 });
  }

  // 3. Parse & validate body
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Neplatný JSON' }, { status: 400 });
  }

  const validation = SendEmailSchema.safeParse(body);
  if (!validation.success) {
    return json({ 
      error: 'Validační chyba', 
      details: validation.error.flatten() 
    }, { status: 400 });
  }

  const { recipientEmail, customMessage, pdfBase64 } = validation.data;

  // 4. Load measurement with order and customer
  const measurement = await db.measurement.findUnique({
    where: { id: params.id },
    include: {
      order: {
        include: {
          customer: true,
        },
      },
      employee: true,
    },
  });

  if (!measurement) {
    return json({ error: 'Zaměření nenalezeno' }, { status: 404 });
  }

  const orderNumber = measurement.order?.orderNumber || `M-${measurement.id.slice(0, 8)}`;
  const pdfFilename = `protokol-${orderNumber}.pdf`;

  // 5. Send email via Resend
  const result = await sendMeasurementEmail({
    to: recipientEmail,
    orderNumber,
    employeeName: user.fullName,
    customMessage,
    pdfBase64,
    pdfFilename,
  });

  if (!result.success) {
    return json({ 
      error: 'Nepodařilo se odeslat email', 
      details: result.error 
    }, { status: 500 });
  }

  // 6. Update measurement with email tracking
  await db.measurement.update({
    where: { id: params.id },
    data: {
      emailSentAt: new Date(),
      emailSentTo: recipientEmail,
      emailSentById: user.id,
    },
  });

  // 7. Return success
  return json({
    success: true,
    messageId: result.messageId,
    sentTo: recipientEmail,
    sentAt: new Date().toISOString(),
  });
};
```

---

## 7. UI Komponenta - Modal

**Soubor:** `src/lib/components/SendEmailModal.svelte` (nový)

```svelte
<script lang="ts">
  import { X, Send, Loader2 } from 'lucide-svelte';

  interface Props {
    isOpen: boolean;
    customerEmail: string | null;
    orderNumber: string;
    measurementId: string;
    onClose: () => void;
    onSend: (email: string, message: string) => Promise<void>;
  }

  let { isOpen, customerEmail, orderNumber, measurementId, onClose, onSend }: Props = $props();

  let email = $state(customerEmail || '');
  let customMessage = $state('');
  let isLoading = $state(false);
  let error = $state('');

  // Reset při otevření
  $effect(() => {
    if (isOpen) {
      email = customerEmail || '';
      customMessage = '';
      error = '';
    }
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = '';

    if (!email) {
      error = 'Email je povinný';
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      error = 'Neplatný formát emailu';
      return;
    }

    isLoading = true;
    try {
      await onSend(email, customMessage);
      onClose();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Nepodařilo se odeslat';
    } finally {
      isLoading = false;
    }
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black/50 z-40"
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
    role="button"
    tabindex="-1"
  ></div>

  <!-- Modal -->
  <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b">
        <h2 class="text-lg font-semibold">Odeslat protokol emailem</h2>
        <button 
          onclick={onClose}
          class="p-1 hover:bg-slate-100 rounded"
          aria-label="Zavřít"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <form onsubmit={handleSubmit} class="p-4 space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-slate-700 mb-1">
            Email příjemce *
          </label>
          <input
            type="email"
            id="email"
            bind:value={email}
            class="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-futurol-wine/20 focus:border-futurol-wine outline-none"
            placeholder="zakaznik@email.cz"
            required
          />
        </div>

        <div>
          <label for="message" class="block text-sm font-medium text-slate-700 mb-1">
            Zpráva (volitelná)
          </label>
          <textarea
            id="message"
            bind:value={customMessage}
            rows={3}
            class="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-futurol-wine/20 focus:border-futurol-wine outline-none resize-none"
            placeholder="Dobrý den, v příloze zasíláme protokol..."
          ></textarea>
        </div>

        <div class="text-sm text-slate-500">
          Příloha: <span class="font-medium">protokol-{orderNumber}.pdf</span>
        </div>

        {#if error}
          <div class="text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        {/if}

        <!-- Footer -->
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onclick={onClose}
            class="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            disabled={isLoading}
          >
            Zrušit
          </button>
          <button
            type="submit"
            class="flex items-center gap-2 px-4 py-2 bg-futurol-wine text-white rounded-md hover:bg-futurol-wine/90 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {#if isLoading}
              <Loader2 class="w-4 h-4 animate-spin" />
              Odesílám...
            {:else}
              <Send class="w-4 h-4" />
              Odeslat
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
```

---

## 8. Integrace do detailu zaměření

**Soubor:** `src/routes/dashboard/measurements/[id]/+page.svelte` (úprava)

### Přidat importy

```svelte
<script lang="ts">
  // ... existující importy ...
  import { Mail, CheckCircle } from 'lucide-svelte';
  import SendEmailModal from '$lib/components/SendEmailModal.svelte';
  import { generateMeasurementPdfBase64 } from '$lib/utils/measurementPdf';
```

### Přidat state a handler

```svelte
  // ... existující kód ...

  let showEmailModal = $state(false);

  // Funkce pro odeslání emailu
  async function handleSendEmail(recipientEmail: string, customMessage: string) {
    // 1. Vygenerovat PDF jako base64
    const pdfBase64 = await generateMeasurementPdfBase64(measurement);

    // 2. Odeslat na API
    const response = await fetch(`/api/measurements/${measurement.id}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientEmail,
        customMessage: customMessage || undefined,
        pdfBase64,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Nepodařilo se odeslat');
    }

    // 3. Aktualizovat lokální stav
    measurement.emailSentAt = new Date().toISOString();
    measurement.emailSentTo = recipientEmail;
  }
</script>
```

### Přidat UI elementy

```svelte
<!-- Někde v UI detailu zaměření, vedle tlačítka "Stáhnout PDF" -->
<div class="flex gap-2">
  <button onclick={() => downloadPdf()} class="btn-secondary">
    Stáhnout PDF
  </button>
  
  <button 
    onclick={() => showEmailModal = true} 
    class="btn-primary flex items-center gap-2"
  >
    <Mail class="w-4 h-4" />
    Odeslat zákazníkovi
  </button>
</div>

<!-- Info o posledním odeslání -->
{#if measurement.emailSentAt}
  <div class="flex items-center gap-2 text-sm text-green-600 mt-2">
    <CheckCircle class="w-4 h-4" />
    Odesláno {new Date(measurement.emailSentAt).toLocaleDateString('cs-CZ')} 
    na {measurement.emailSentTo}
  </div>
{/if}

<!-- Modal (na konec souboru) -->
<SendEmailModal
  isOpen={showEmailModal}
  customerEmail={measurement.order?.customer?.email}
  orderNumber={measurement.order?.orderNumber || ''}
  measurementId={measurement.id}
  onClose={() => showEmailModal = false}
  onSend={handleSendEmail}
/>
```

---

## 9. Úprava PDF utility

**Soubor:** `src/lib/utils/measurementPdf.ts` (přidat funkci)

```typescript
// ... existující kód ...

/**
 * Generuje PDF a vrací jako base64 string (pro email přílohu)
 */
export async function generateMeasurementPdfBase64(measurement: MeasurementData): Promise<string> {
  const doc = new jsPDF();
  
  // === Použít stejnou logiku jako v generateMeasurementPdf() ===
  // Rozdíl: místo doc.save() vrátíme base64
  
  // ... (zkopírovat obsah generateMeasurementPdf až po část před doc.save()) ...

  // Vrátit jako base64 (bez data URI prefixu)
  return doc.output('datauristring').split(',')[1];
}
```

**Poznámka:** Pro zamezení duplikace kódu lze refaktorovat na:

```typescript
function buildMeasurementPdf(measurement: MeasurementData): jsPDF {
  const doc = new jsPDF();
  // ... všechna logika generování ...
  return doc;
}

export function generateMeasurementPdf(measurement: MeasurementData): void {
  const doc = buildMeasurementPdf(measurement);
  const fileName = `zamereni_${measurement.order?.orderNumber ?? measurement.id}.pdf`;
  doc.save(fileName);
}

export function generateMeasurementPdfBase64(measurement: MeasurementData): string {
  const doc = buildMeasurementPdf(measurement);
  return doc.output('datauristring').split(',')[1];
}
```

---

## 10. Závislosti

```bash
npm install resend
```

---

## 11. Resend Setup Checklist

| Krok | Akce | Status |
|------|------|--------|
| ✅ 1 | Vytvořit účet na [resend.com](https://resend.com) | Hotovo |
| ✅ 2 | Přidat doménu `futurol.ascentalab.cz` | Hotovo |
| ✅ 3 | Nastavit DNS záznamy (SPF, DKIM) | Hotovo |
| ✅ 4 | Ověřit doménu v Resend | Hotovo |
| ✅ 5 | Vygenerovat API key | Hotovo |
| ⬜ 6 | Přidat do `.env` na serveru | Viz níže |

---

## 12. Nasazení na VPS (Production)

### 12.1 Připojení k serveru

```bash
ssh vpsuser@37.46.208.167
```

### 12.2 Úprava environment variables

```bash
cd /home/vpsuser/app/FUTUROL-app-management
nano .env
```

Přidat na konec souboru:

```bash
# ==============================================
# RESEND (Email service)
# ==============================================
RESEND_API_KEY="re_xxxxxxxxxxxxx"  # Použij svůj API klíč z Resend dashboardu
EMAIL_FROM="Futurol <noreply@futurol.ascentalab.cz>"
```

Uložit: `Ctrl+O`, `Enter`, `Ctrl+X`

### 12.3 Instalace závislosti

```bash
npm install resend
```

### 12.4 Prisma migrace

```bash
npx prisma migrate dev --name add_measurement_email_tracking
```

### 12.5 Rebuild a restart aplikace

```bash
# Pokud používáte Docker
docker compose down
docker compose up -d --build

# Nebo pokud běží přímo Node
npm run build
pm2 restart futurol-app  # nebo jiný process manager
```

### 12.6 Ověření funkčnosti

```bash
# Zkontrolovat logy
docker compose logs -f app

# Nebo
pm2 logs futurol-app
```

### 12.7 Test odeslání (volitelné)

Po nasazení kódu otestovat:
1. Přihlásit se jako zaměřovač/admin
2. Otevřít detail zaměření
3. Kliknout "Odeslat zákazníkovi"
4. Zadat testovací email
5. Ověřit doručení

---

## 13. Stage Environment (volitelné)

Pro testování na stage serveru:

```bash
ssh vpsuser@37.46.209.39
cd /home/vpsuser/app/FUTUROL-app-management

# Stejné kroky jako produkce
nano .env
# Přidat RESEND_API_KEY a EMAIL_FROM
```

**Poznámka:** Resend free tier (3000 emailů/měsíc) je sdílený mezi stage a produkcí. Pro vývoj používat stejný API klíč.

---

## 14. Troubleshooting

### Email se neodeslal

```bash
# Zkontrolovat logy
docker compose logs app | grep -i resend
docker compose logs app | grep -i email
```

### Chyba "Invalid API Key"

1. Ověřit, že `RESEND_API_KEY` je správně v `.env`
2. Ověřit, že kontejner byl restartován po změně `.env`
3. Zkontrolovat v Resend dashboardu, že klíč není revokovaný

### Chyba "Domain not verified"

1. Zkontrolovat DNS záznamy: `dig TXT futurol.ascentalab.cz`
2. Ověřit status domény v Resend Dashboard → Domains

### Email končí ve spamu

1. Ověřit DKIM: `dig TXT resend._domainkey.futurol.ascentalab.cz`
2. Ověřit SPF: `dig TXT futurol.ascentalab.cz`
3. Zvážit přidání DMARC záznamu

---

## 15. Monitoring (Resend Dashboard)

Po nasazení sledovat v [Resend Dashboard](https://resend.com/emails):

| Metrika | Kde najít |
|---------|-----------|
| Odeslané emaily | Emails → Activity |
| Bounce rate | Emails → Analytics |
| Delivery rate | Emails → Analytics |
| API usage | Settings → Usage |

**Limity free tier:**
- 3 000 emailů / měsíc
- 100 emailů / den

Při překročení Resend vrátí chybu 429 (rate limit).

---

## 16. API Specifikace

### Endpoint

```
POST /api/measurements/[id]/send-email
```

### Request

```typescript
interface SendEmailRequest {
  recipientEmail: string;      // Validovaný email
  customMessage?: string;      // Max 1000 znaků
  pdfBase64: string;           // PDF jako base64 (bez data URI prefixu)
}
```

### Response (200 OK)

```typescript
interface SendEmailResponse {
  success: true;
  messageId: string;           // Resend message ID
  sentTo: string;
  sentAt: string;              // ISO datetime
}
```

### Response (4xx/5xx)

```typescript
interface SendEmailError {
  error: string;
  code?: 'INVALID_EMAIL' | 'MISSING_PDF' | 'MEASUREMENT_NOT_FOUND' | 'EMAIL_SEND_FAILED';
  details?: string;
}
```

### Oprávnění

- Vyžaduje autentizaci
- Povolené role: `admin`, `technician`

---

## 17. Bezpečnost

| Aspekt | Řešení |
|--------|--------|
| API key | Pouze server-side (`$env/static/private`) |
| Rate limiting | Zvážit max 5 emailů/min na uživatele |
| Validace emailu | Zod schema + Resend validace |
| Oprávnění | Role check v API |
| Audit | Logování v `Measurement` tabulce |

---

## 18. Testování

| Test | Popis |
|------|-------|
| Unit | Email service s mock Resend |
| Integration | API endpoint |
| E2E | Celý flow: UI → API → Resend → inbox |
| Edge cases | Neplatný email, prázdné PDF, network timeout |

### Testovací emaily

Resend v development módu umožňuje posílat pouze na ověřené emaily nebo použít test mode.

---

## 19. Časový odhad

| Úkol | Čas |
|------|-----|
| Resend setup (účet, DNS, API key) | 30 min |
| `email.ts` service | 1 hod |
| API endpoint | 1.5 hod |
| UI modal + integrace | 2 hod |
| Prisma schema + migrace | 30 min |
| Testování | 1 hod |
| **Celkem** | **~6.5 hod** |

---

## 20. Budoucí rozšíření

- [ ] Logo Futurol v emailu
- [ ] Kontaktní údaje v patičce
- [ ] Webhook tracking (delivered, opened, clicked)
- [ ] `EmailLog` tabulka pro centrální přehled
- [ ] Hromadné odesílání
- [ ] Email šablony v admin panelu

---

## 21. Soubory k vytvoření/úpravě

| Soubor | Akce |
|--------|------|
| `prisma/schema.prisma` | Úprava - přidat email tracking pole |
| `.env.example` | Úprava - přidat RESEND_API_KEY |
| `.env` (produkce) | Úprava - přidat reálný API key |
| `src/lib/server/email.ts` | **Nový** |
| `src/routes/api/measurements/[id]/send-email/+server.ts` | **Nový** |
| `src/lib/components/SendEmailModal.svelte` | **Nový** |
| `src/lib/utils/measurementPdf.ts` | Úprava - přidat base64 export |
| `src/routes/dashboard/measurements/[id]/+page.svelte` | Úprava - integrace |

---

*Dokument vytvořen: 18. ledna 2026*  
*Autor: Claude (Anthropic) + Tomáš Havelka (ASCENTA)*
