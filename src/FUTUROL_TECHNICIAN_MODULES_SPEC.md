# Futurol App - Technician Modules Specification

**Verze:** 1.0  
**Datum:** 18. ledna 2026  
**Autor:** Claude (Anthropic) + Tomáš Havelka (ASCENTA)  
**Status:** Schváleno k implementaci

---

## Obsah

1. [Kontext a cíle](#1-kontext-a-cíle)
2. [Architektura](#2-architektura)
3. [Installation modul (nový)](#3-installation-modul-nový)
4. [ServiceTicket rozšíření](#4-serviceticket-rozšíření)
5. [Technician Permissions](#5-technician-permissions)
6. [Sdílené komponenty](#6-sdílené-komponenty)
7. [Implementační checklist](#7-implementační-checklist)

---

## 1. Kontext a cíle

### 1.1 Situace

Futurol App je systém pro správu zakázek pergol. Technici v terénu potřebují:
- **Zaměření** - změřit prostor u zákazníka (✅ existuje, včetně PDF a emailu)
- **Montáž** - namontovat a předat dílo (🆕 nový modul)
- **Servis** - řešit závady a údržbu (⚠️ existuje základní, rozšířit)

### 1.2 Cíle tohoto updatu

1. Vytvořit kompletní modul **Installation** (montáže)
2. Rozšířit **ServiceTicket** o dokumentaci a protokoly
3. Přidat granulární **oprávnění pro techniky**

### 1.3 Principy

- **Nelineární workflow** - zakázka nemusí mít všechny aktivity, lze přeskočit
- **Volitelnost** - zaměření, montáž i servis jsou nezávislé
- **Konzistence** - všechny moduly mají stejný vzor (PDF, email, tracking)
- **Jednoduchost** - MVP bez zbytečné komplexity

### 1.4 Co NENÍ součástí (backlog)

| Funkce | Důvod odložení |
|--------|----------------|
| Check-in/check-out s GPS | Nice to have |
| Push notifikace | Infrastruktura |
| Podpis zákazníka (touch) | Komplexita |
| Účtování servisu | Není priorita |
| Tým na montáži | Zatím stačí jeden technik |
| Konfigurovatelný checklist | Pevný stačí |

---

## 2. Architektura

### 2.1 Datový model - přehled

```
Customer
    │
    └── Order
            │
            ├── Measurement (0..1)     ✅ existuje
            │   └── PDF + Email
            │
            ├── Installation (0..1)    🆕 nový
            │   └── PDF + Email
            │
            └── ServiceTicket (0..N)   ⚠️ rozšířit
                └── PDF + Email
```

### 2.2 Sdílený vzor pro aktivity

Všechny tři entity sdílejí stejnou strukturu:

```typescript
interface ActivityCommon {
  // Vazba
  orderId: string;
  
  // Kdo a kdy
  performedById: string;
  performedAt: DateTime;
  
  // Status
  status: string;
  
  // Dokumentace
  notes: string | null;
  photos: string[] | null;  // URLs
  
  // PDF protokol
  pdfUrl: string | null;
  pdfGeneratedAt: DateTime | null;
  
  // Email - zákazník
  emailSentAt: DateTime | null;
  emailSentTo: string | null;
  emailSentById: string | null;
  
  // Email - interní
  internalEmailSentAt: DateTime | null;
  internalEmailSentTo: string[] | null;  // Array emailů
  
  // Timestamps
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

---

## 3. Installation modul (nový)

### 3.1 Prisma Schema

**Soubor:** `prisma/schema.prisma`

```prisma
model Installation {
  id              String    @id @default(uuid())
  orderId         String    @unique
  order           Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  // Status (zjednodušený)
  status          String    @default("planned")  // planned | completed
  
  // Plánování
  scheduledAt     DateTime?
  technicianId    String
  technician      Employee  @relation("InstallationTechnician", fields: [technicianId], references: [id])
  
  // Realizace
  completedAt     DateTime?
  checklist       Json?     // { [itemId]: boolean }
  workNotes       String?   @db.Text
  photos          Json?     // string[]
  
  // Předání
  handoverNotes   String?   @db.Text  // Poznámky od zákazníka
  
  // PDF protokol
  pdfUrl          String?
  pdfGeneratedAt  DateTime?
  
  // Email - zákazník
  emailSentAt     DateTime?
  emailSentTo     String?
  emailSentById   String?
  emailSentBy     Employee? @relation("InstallationEmailSender", fields: [emailSentById], references: [id])
  
  // Email - interní
  internalEmailSentAt  DateTime?
  internalEmailSentTo  Json?     // string[]
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

**Přidat do modelu Order:**

```prisma
model Order {
  // ... existující pole ...
  
  installation    Installation?
}
```

**Přidat do modelu Employee:**

```prisma
model Employee {
  // ... existující pole ...
  
  installations           Installation[] @relation("InstallationTechnician")
  installationEmailsSent  Installation[] @relation("InstallationEmailSender")
}
```

### 3.2 Migrace

```bash
npx prisma migrate dev --name add_installation_module
```

### 3.3 Checklist - konfigurace

**Soubor:** `src/lib/config/installationChecklist.ts` (nový)

```typescript
export interface ChecklistItem {
  id: string;
  label: string;
}

export interface ChecklistSection {
  id: string;
  label: string;
  items: ChecklistItem[];
}

export const INSTALLATION_CHECKLIST: ChecklistSection[] = [
  {
    id: "preparation",
    label: "Příprava",
    items: [
      { id: "material_check", label: "Kontrola kompletnosti materiálu" },
      { id: "site_ready", label: "Pracoviště připraveno" },
    ]
  },
  {
    id: "construction",
    label: "Konstrukce",
    items: [
      { id: "anchoring", label: "Kotvení" },
      { id: "frame", label: "Nosný rám" },
      { id: "roof_panels", label: "Střešní lamely" },
      { id: "drainage", label: "Odvodnění" },
    ]
  },
  {
    id: "electrical",
    label: "Elektro",
    items: [
      { id: "wiring", label: "Elektroinstalace" },
      { id: "motor", label: "Motor a ovládání" },
      { id: "lighting", label: "LED osvětlení" },
      { id: "sensors", label: "Senzory (vítr/déšť)" },
    ]
  },
  {
    id: "accessories",
    label: "Příslušenství",
    items: [
      { id: "screens", label: "Screenové rolety" },
      { id: "remote", label: "Dálkové ovládání spárováno" },
    ]
  },
  {
    id: "finishing",
    label: "Dokončení",
    items: [
      { id: "function_test", label: "Funkční test všech prvků" },
      { id: "cleaning", label: "Úklid pracoviště" },
      { id: "customer_training", label: "Zaškolení zákazníka" },
    ]
  }
];

/**
 * Vrací prázdný checklist state (všechny položky false)
 */
export function getEmptyChecklistState(): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  INSTALLATION_CHECKLIST.forEach(section => {
    section.items.forEach(item => {
      state[item.id] = false;
    });
  });
  return state;
}

/**
 * Spočítá progress checklistu (0-100)
 */
export function getChecklistProgress(state: Record<string, boolean> | null): number {
  if (!state) return 0;
  const items = Object.values(state);
  if (items.length === 0) return 0;
  const checked = items.filter(Boolean).length;
  return Math.round((checked / items.length) * 100);
}

/**
 * Vrací true pokud je checklist kompletní
 */
export function isChecklistComplete(state: Record<string, boolean> | null): boolean {
  if (!state) return false;
  return Object.values(state).every(Boolean);
}
```

### 3.4 API Endpoints

#### 3.4.1 GET /api/installations

**Soubor:** `src/routes/api/installations/+server.ts`

```typescript
import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { canAccessModule } from '$lib/server/permissions';

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) {
    return json({ error: 'Nepřihlášen' }, { status: 401 });
  }

  if (!canAccessModule(locals.user, 'installation')) {
    return json({ error: 'Nemáte oprávnění' }, { status: 403 });
  }

  const status = url.searchParams.get('status');
  const technicianId = url.searchParams.get('technicianId');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  // Filtr dle statusu
  if (status) {
    where.status = status;
  }

  // Filtr dle technika
  if (technicianId) {
    where.technicianId = technicianId;
  }

  // Technik vidí pouze svoje (pokud není admin/manager)
  if (
    locals.user.roles.includes('technician') &&
    !locals.user.roles.includes('admin') &&
    !locals.user.roles.includes('manager')
  ) {
    where.technicianId = locals.user.id;
  }

  const [installations, total] = await Promise.all([
    db.installation.findMany({
      where,
      include: {
        order: {
          include: {
            customer: {
              include: {
                contacts: { where: { isPrimary: true }, take: 1 }
              }
            },
            location: true,
            product: true,
          }
        },
        technician: {
          select: { id: true, fullName: true, personalNumber: true }
        }
      },
      orderBy: { scheduledAt: 'asc' },
      skip,
      take: limit,
    }),
    db.installation.count({ where })
  ]);

  return json({
    installations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
};
```

#### 3.4.2 POST /api/orders/[orderId]/installation

**Soubor:** `src/routes/api/orders/[orderId]/installation/+server.ts`

```typescript
import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { canAccessModule } from '$lib/server/permissions';
import { getEmptyChecklistState } from '$lib/config/installationChecklist';
import { z } from 'zod';

const CreateInstallationSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  technicianId: z.string().uuid(),
});

export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Nepřihlášen' }, { status: 401 });
  }

  if (!canAccessModule(locals.user, 'installation', 'write')) {
    return json({ error: 'Nemáte oprávnění vytvářet montáže' }, { status: 403 });
  }

  // Ověřit že zakázka existuje
  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: { installation: true }
  });

  if (!order) {
    return json({ error: 'Zakázka nenalezena' }, { status: 404 });
  }

  if (order.installation) {
    return json({ error: 'Zakázka již má montáž' }, { status: 400 });
  }

  // Validace body
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Neplatný JSON' }, { status: 400 });
  }

  const validation = CreateInstallationSchema.safeParse(body);
  if (!validation.success) {
    return json({ error: 'Validační chyba', details: validation.error.flatten() }, { status: 400 });
  }

  const { scheduledAt, technicianId } = validation.data;

  // Ověřit že technik existuje a má oprávnění
  const technician = await db.employee.findUnique({
    where: { id: technicianId }
  });

  if (!technician) {
    return json({ error: 'Technik nenalezen' }, { status: 400 });
  }

  if (!technician.canInstallation) {
    return json({ error: 'Vybraný uživatel nemá oprávnění k montážím' }, { status: 400 });
  }

  // Vytvořit instalaci
  const installation = await db.installation.create({
    data: {
      orderId: params.orderId,
      technicianId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      checklist: getEmptyChecklistState(),
      status: 'planned',
    },
    include: {
      order: { include: { customer: true } },
      technician: { select: { id: true, fullName: true } }
    }
  });

  return json({ installation }, { status: 201 });
};
```

#### 3.4.3 GET /api/installations/[id]

**Soubor:** `src/routes/api/installations/[id]/+server.ts`

```typescript
import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { canAccessModule } from '$lib/server/permissions';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Nepřihlášen' }, { status: 401 });
  }

  if (!canAccessModule(locals.user, 'installation')) {
    return json({ error: 'Nemáte oprávnění' }, { status: 403 });
  }

  const installation = await db.installation.findUnique({
    where: { id: params.id },
    include: {
      order: {
        include: {
          customer: {
            include: {
              contacts: { orderBy: { isPrimary: 'desc' } }
            }
          },
          location: true,
          product: true,
        }
      },
      technician: {
        select: { id: true, fullName: true, personalNumber: true, phone: true }
      },
      emailSentBy: {
        select: { id: true, fullName: true }
      }
    }
  });

  if (!installation) {
    return json({ error: 'Montáž nenalezena' }, { status: 404 });
  }

  // Technik může vidět pouze svoje montáže (pokud není admin/manager)
  if (
    locals.user.roles.includes('technician') &&
    !locals.user.roles.includes('admin') &&
    !locals.user.roles.includes('manager') &&
    installation.technicianId !== locals.user.id
  ) {
    return json({ error: 'Nemáte oprávnění k této montáži' }, { status: 403 });
  }

  return json({ installation });
};
```

#### 3.4.4 PATCH /api/installations/[id]

```typescript
import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { canAccessModule } from '$lib/server/permissions';
import { z } from 'zod';

const UpdateInstallationSchema = z.object({
  status: z.enum(['planned', 'completed']).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  technicianId: z.string().uuid().optional(),
  checklist: z.record(z.boolean()).optional(),
  workNotes: z.string().max(5000).nullable().optional(),
  photos: z.array(z.string().url()).nullable().optional(),
  handoverNotes: z.string().max(2000).nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
});

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Nepřihlášen' }, { status: 401 });
  }

  if (!canAccessModule(locals.user, 'installation', 'write')) {
    return json({ error: 'Nemáte oprávnění upravovat montáže' }, { status: 403 });
  }

  const installation = await db.installation.findUnique({
    where: { id: params.id }
  });

  if (!installation) {
    return json({ error: 'Montáž nenalezena' }, { status: 404 });
  }

  // Technik může upravovat pouze svoje montáže
  if (
    locals.user.roles.includes('technician') &&
    !locals.user.roles.includes('admin') &&
    !locals.user.roles.includes('manager') &&
    installation.technicianId !== locals.user.id
  ) {
    return json({ error: 'Nemáte oprávnění k této montáži' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Neplatný JSON' }, { status: 400 });
  }

  const validation = UpdateInstallationSchema.safeParse(body);
  if (!validation.success) {
    return json({ error: 'Validační chyba', details: validation.error.flatten() }, { status: 400 });
  }

  const data = validation.data;

  // Pokud se mění status na completed, nastavit completedAt
  if (data.status === 'completed' && !data.completedAt) {
    data.completedAt = new Date().toISOString();
  }

  const updated = await db.installation.update({
    where: { id: params.id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.scheduledAt !== undefined && { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null }),
      ...(data.technicianId && { technicianId: data.technicianId }),
      ...(data.checklist && { checklist: data.checklist }),
      ...(data.workNotes !== undefined && { workNotes: data.workNotes }),
      ...(data.photos !== undefined && { photos: data.photos }),
      ...(data.handoverNotes !== undefined && { handoverNotes: data.handoverNotes }),
      ...(data.completedAt !== undefined && { completedAt: data.completedAt ? new Date(data.completedAt) : null }),
    },
    include: {
      order: { include: { customer: true } },
      technician: { select: { id: true, fullName: true } }
    }
  });

  return json({ installation: updated });
};
```

#### 3.4.5 POST /api/installations/[id]/send-email

**Soubor:** `src/routes/api/installations/[id]/send-email/+server.ts`

```typescript
import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { canAccessModule } from '$lib/server/permissions';
import { sendInstallationEmail, sendInternalEmail } from '$lib/server/email';
import { z } from 'zod';

const SendEmailSchema = z.object({
  recipientEmail: z.string().email('Neplatný formát emailu'),
  customMessage: z.string().max(1000).optional(),
  pdfBase64: z.string().min(1, 'PDF je povinné'),
  sendInternal: z.boolean().optional().default(false),
  internalRecipients: z.array(z.string().email()).optional(),
});

export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Nepřihlášen' }, { status: 401 });
  }

  if (!canAccessModule(locals.user, 'installation', 'write')) {
    return json({ error: 'Nemáte oprávnění' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Neplatný JSON' }, { status: 400 });
  }

  const validation = SendEmailSchema.safeParse(body);
  if (!validation.success) {
    return json({ error: 'Validační chyba', details: validation.error.flatten() }, { status: 400 });
  }

  const { recipientEmail, customMessage, pdfBase64, sendInternal, internalRecipients } = validation.data;

  // Načíst instalaci s order a customer
  const installation = await db.installation.findUnique({
    where: { id: params.id },
    include: {
      order: { include: { customer: true } },
      technician: { select: { fullName: true } }
    }
  });

  if (!installation) {
    return json({ error: 'Montáž nenalezena' }, { status: 404 });
  }

  const orderNumber = installation.order?.orderNumber || `I-${installation.id.slice(0, 8)}`;
  const pdfFilename = `montaz-${orderNumber}.pdf`;

  // Odeslat zákazníkovi
  const result = await sendInstallationEmail({
    to: recipientEmail,
    orderNumber,
    employeeName: locals.user.fullName,
    customMessage,
    pdfBase64,
    pdfFilename,
  });

  if (!result.success) {
    return json({ error: 'Nepodařilo se odeslat email', details: result.error }, { status: 500 });
  }

  // Update - zákaznický email
  const updateData: Record<string, unknown> = {
    emailSentAt: new Date(),
    emailSentTo: recipientEmail,
    emailSentById: locals.user.id,
  };

  // Odeslat interně (volitelně)
  if (sendInternal && internalRecipients && internalRecipients.length > 0) {
    const internalResult = await sendInternalEmail({
      to: internalRecipients,
      subject: `Montáž dokončena - ${orderNumber}`,
      orderNumber,
      employeeName: locals.user.fullName,
      type: 'installation',
      pdfBase64,
      pdfFilename,
    });

    if (internalResult.success) {
      updateData.internalEmailSentAt = new Date();
      updateData.internalEmailSentTo = internalRecipients;
    }
  }

  await db.installation.update({
    where: { id: params.id },
    data: updateData,
  });

  return json({
    success: true,
    messageId: result.messageId,
    sentTo: recipientEmail,
    sentAt: new Date().toISOString(),
  });
};
```

### 3.5 PDF Generování

**Soubor:** `src/lib/utils/installationPdf.ts` (nový)

```typescript
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { INSTALLATION_CHECKLIST, getChecklistProgress } from '$lib/config/installationChecklist';

interface InstallationData {
  id: string;
  status: string;
  scheduledAt: string | null;
  completedAt: string | null;
  checklist: Record<string, boolean> | null;
  workNotes: string | null;
  handoverNotes: string | null;
  order: {
    orderNumber: string;
    customer: {
      companyName: string | null;
      contacts: Array<{ fullName: string; phone: string | null; email: string | null }>;
    };
    location: {
      street: string;
      city: string;
      zip: string;
    } | null;
    product: {
      name: string;
    } | null;
  } | null;
  technician: {
    fullName: string;
    personalNumber: string;
  };
}

export function generateInstallationPdf(installation: InstallationData): void {
  const doc = buildInstallationPdf(installation);
  const fileName = `montaz-${installation.order?.orderNumber ?? installation.id}.pdf`;
  doc.save(fileName);
}

export function generateInstallationPdfBase64(installation: InstallationData): string {
  const doc = buildInstallationPdf(installation);
  return doc.output('datauristring').split(',')[1];
}

function buildInstallationPdf(installation: InstallationData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // Načíst fonty (předpokládáme že jsou již nastaveny v projektu)
  doc.setFont('Roboto', 'normal');

  // === HEADER ===
  doc.setFontSize(20);
  doc.setFont('Roboto', 'bold');
  doc.setTextColor(114, 47, 55); // Futurol wine
  doc.text('PROTOKOL O MONTÁŽI A PŘEDÁNÍ', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Zakázka: ${installation.order?.orderNumber || 'N/A'}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // === ZÁKLADNÍ INFO ===
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('Roboto', 'bold');
  doc.text('Základní informace', margin, y);
  y += 8;

  const primaryContact = installation.order?.customer?.contacts?.[0];
  const customerName = installation.order?.customer?.companyName || primaryContact?.fullName || 'N/A';
  const location = installation.order?.location;
  const address = location ? `${location.street}, ${location.city} ${location.zip}` : 'N/A';

  const infoData = [
    ['Zákazník', customerName],
    ['Adresa realizace', address],
    ['Produkt', installation.order?.product?.name || 'Pergola'],
    ['Technik', `${installation.technician.fullName} (${installation.technician.personalNumber})`],
    ['Plánovaný termín', installation.scheduledAt ? new Date(installation.scheduledAt).toLocaleDateString('cs-CZ') : 'N/A'],
    ['Datum dokončení', installation.completedAt ? new Date(installation.completedAt).toLocaleDateString('cs-CZ') : 'N/A'],
  ];

  (doc as any).autoTable({
    startY: y,
    body: infoData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3, font: 'Roboto' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // === CHECKLIST ===
  doc.setFontSize(14);
  doc.setFont('Roboto', 'bold');
  doc.text('Checklist montáže', margin, y);
  
  const progress = getChecklistProgress(installation.checklist);
  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  doc.text(`(${progress}% dokončeno)`, margin + 45, y);
  y += 8;

  const checklistData: string[][] = [];
  INSTALLATION_CHECKLIST.forEach(section => {
    // Sekce header
    checklistData.push([section.label, '']);
    section.items.forEach(item => {
      const checked = installation.checklist?.[item.id] ?? false;
      checklistData.push([`    ${item.label}`, checked ? '✓' : '✗']);
    });
  });

  (doc as any).autoTable({
    startY: y,
    body: checklistData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2, font: 'Roboto' },
    columnStyles: { 
      0: { cellWidth: 140 },
      1: { cellWidth: 20, halign: 'center' }
    },
    didParseCell: (data: any) => {
      // Bold pro sekce (řádky bez odsazení)
      if (data.column.index === 0 && !data.cell.text[0]?.startsWith('    ')) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
      // Zelená pro ✓, červená pro ✗
      if (data.column.index === 1) {
        if (data.cell.text[0] === '✓') {
          data.cell.styles.textColor = [0, 150, 0];
        } else if (data.cell.text[0] === '✗') {
          data.cell.styles.textColor = [200, 0, 0];
        }
      }
    },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // === POZNÁMKY Z MONTÁŽE ===
  if (installation.workNotes) {
    if (y > 220) { doc.addPage(); y = 20; }
    
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text('Poznámky z montáže', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    const splitNotes = doc.splitTextToSize(installation.workNotes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, y);
    y += splitNotes.length * 5 + 10;
  }

  // === POZNÁMKY Z PŘEDÁNÍ ===
  if (installation.handoverNotes) {
    if (y > 220) { doc.addPage(); y = 20; }
    
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text('Poznámky z předání', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    const splitNotes = doc.splitTextToSize(installation.handoverNotes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, y);
    y += splitNotes.length * 5 + 10;
  }

  // === PODPISY ===
  if (y > 230) { doc.addPage(); y = 20; }
  y = Math.max(y, 240);

  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  
  // Technik
  doc.text('Technik:', margin, y);
  doc.line(margin + 20, y + 2, margin + 80, y + 2);
  doc.text(installation.technician.fullName, margin + 20, y + 8);

  // Zákazník
  doc.text('Zákazník:', pageWidth / 2 + 10, y);
  doc.line(pageWidth / 2 + 30, y + 2, pageWidth - margin, y + 2);

  // === FOOTER ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Vygenerováno: ${new Date().toLocaleDateString('cs-CZ')} | Strana ${i} z ${pageCount} | Futurol.cz`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
}
```

### 3.6 Email Service rozšíření

**Soubor:** `src/lib/server/email.ts` (přidat)

```typescript
// ... existující kód pro sendMeasurementEmail ...

interface SendInstallationEmailParams {
  to: string;
  orderNumber: string;
  employeeName: string;
  customMessage?: string;
  pdfBase64: string;
  pdfFilename: string;
}

export async function sendInstallationEmail(params: SendInstallationEmailParams): Promise<SendEmailResult> {
  const { to, orderNumber, employeeName, customMessage, pdfBase64, pdfFilename } = params;

  const html = `
    <p>Dobrý den,</p>
    <p>v příloze zasíláme protokol o montáži a předání pro Vaši zakázku <strong>${orderNumber}</strong>.</p>
    ${customMessage ? `<p>${customMessage}</p>` : ''}
    <p>Děkujeme za Vaši důvěru a přejeme mnoho radosti s Vaší novou pergolou!</p>
    <p>S pozdravem,<br>
    <strong>${employeeName}</strong><br>
    Futurol.cz</p>
    <hr>
    <small style="color: #666;">Tato zpráva byla odeslána automaticky ze systému Futurol.</small>
  `;

  const text = `
Dobrý den,

v příloze zasíláme protokol o montáži a předání pro Vaši zakázku ${orderNumber}.

${customMessage ? customMessage + '\n' : ''}
Děkujeme za Vaši důvěru a přejeme mnoho radosti s Vaší novou pergolou!

S pozdravem,
${employeeName}
Futurol.cz
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM || 'Futurol <noreply@futurol.ascentalab.cz>',
      to: [to],
      subject: `Protokol o montáži a předání - ${orderNumber}`,
      html,
      text,
      attachments: [{ filename: pdfFilename, content: pdfBase64 }],
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

interface SendInternalEmailParams {
  to: string[];
  subject: string;
  orderNumber: string;
  employeeName: string;
  type: 'installation' | 'service';
  pdfBase64: string;
  pdfFilename: string;
}

export async function sendInternalEmail(params: SendInternalEmailParams): Promise<SendEmailResult> {
  const { to, subject, orderNumber, employeeName, type, pdfBase64, pdfFilename } = params;

  const typeLabel = type === 'installation' ? 'montáži' : 'servisu';

  const html = `
    <p>Dobrý den,</p>
    <p>informujeme Vás o dokončení ${typeLabel} pro zakázku <strong>${orderNumber}</strong>.</p>
    <p>Protokol je v příloze.</p>
    <p>Technik: <strong>${employeeName}</strong></p>
    <hr>
    <small style="color: #666;">Interní notifikace ze systému Futurol.</small>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM || 'Futurol <noreply@futurol.ascentalab.cz>',
      to,
      subject,
      html,
      attachments: [{ filename: pdfFilename, content: pdfBase64 }],
    });

    if (error) {
      console.error('Resend internal email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('Internal email send failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
```

### 3.7 UI Komponenty

#### 3.7.1 Seznam montáží

**Soubor:** `src/routes/dashboard/installations/+page.svelte`

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Plus, Calendar, CheckCircle, Clock } from 'lucide-svelte';
  import { getChecklistProgress } from '$lib/config/installationChecklist';

  export let data;

  $: installations = data.installations;
  $: pagination = data.pagination;

  function getStatusBadge(status: string) {
    switch (status) {
      case 'planned':
        return { label: 'Naplánováno', class: 'bg-blue-100 text-blue-800' };
      case 'completed':
        return { label: 'Dokončeno', class: 'bg-green-100 text-green-800' };
      default:
        return { label: status, class: 'bg-gray-100 text-gray-800' };
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Montáže</h1>
      <p class="text-slate-500 mt-1">Přehled montáží a předávání</p>
    </div>
  </div>

  <!-- Filtry -->
  <div class="flex gap-4">
    <select 
      class="px-3 py-2 border rounded-md"
      onchange={(e) => goto(`?status=${e.target.value}`)}
    >
      <option value="">Všechny stavy</option>
      <option value="planned">Naplánováno</option>
      <option value="completed">Dokončeno</option>
    </select>
  </div>

  <!-- Seznam -->
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="min-w-full divide-y divide-slate-200">
      <thead class="bg-slate-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Zakázka</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Zákazník</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Termín</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Technik</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Progress</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stav</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-slate-200">
        {#each installations as installation}
          {@const status = getStatusBadge(installation.status)}
          {@const progress = getChecklistProgress(installation.checklist)}
          {@const contact = installation.order?.customer?.contacts?.[0]}
          <tr 
            class="hover:bg-slate-50 cursor-pointer"
            onclick={() => goto(`/dashboard/installations/${installation.id}`)}
          >
            <td class="px-6 py-4 whitespace-nowrap font-medium">
              {installation.order?.orderNumber || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              {installation.order?.customer?.companyName || contact?.fullName || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              {#if installation.scheduledAt}
                <span class="flex items-center gap-1">
                  <Calendar class="w-4 h-4 text-slate-400" />
                  {new Date(installation.scheduledAt).toLocaleDateString('cs-CZ')}
                </span>
              {:else}
                <span class="text-slate-400">Neplánováno</span>
              {/if}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              {installation.technician?.fullName || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <div class="w-24 bg-slate-200 rounded-full h-2">
                  <div 
                    class="bg-futurol-green h-2 rounded-full transition-all"
                    style="width: {progress}%"
                  ></div>
                </div>
                <span class="text-xs text-slate-500">{progress}%</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 py-1 text-xs font-medium rounded-full {status.class}">
                {status.label}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  {#if pagination.totalPages > 1}
    <div class="flex justify-center gap-2">
      {#each Array(pagination.totalPages) as _, i}
        <button
          class="px-3 py-1 rounded {pagination.page === i + 1 ? 'bg-futurol-wine text-white' : 'bg-slate-200'}"
          onclick={() => goto(`?page=${i + 1}`)}
        >
          {i + 1}
        </button>
      {/each}
    </div>
  {/if}
</div>
```

#### 3.7.2 Detail montáže

**Soubor:** `src/routes/dashboard/installations/[id]/+page.svelte`

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { 
    ArrowLeft, Calendar, User, FileText, Mail, CheckCircle, 
    Save, Download, Send, Building, MapPin 
  } from 'lucide-svelte';
  import { INSTALLATION_CHECKLIST, getChecklistProgress, isChecklistComplete } from '$lib/config/installationChecklist';
  import { generateInstallationPdfBase64 } from '$lib/utils/installationPdf';
  import SendEmailModal from '$lib/components/SendEmailModal.svelte';

  export let data;

  let installation = $state(data.installation);
  let isSaving = $state(false);
  let saveSuccess = $state(false);
  let showEmailModal = $state(false);

  // Lokální stav pro editaci
  let checklist = $state(installation.checklist || {});
  let workNotes = $state(installation.workNotes || '');
  let handoverNotes = $state(installation.handoverNotes || '');
  let status = $state(installation.status);

  $: progress = getChecklistProgress(checklist);
  $: canComplete = isChecklistComplete(checklist);
  $: contact = installation.order?.customer?.contacts?.[0];
  $: customerEmail = contact?.email || null;

  async function save() {
    isSaving = true;
    saveSuccess = false;

    try {
      const response = await fetch(`/api/installations/${installation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklist,
          workNotes: workNotes || null,
          handoverNotes: handoverNotes || null,
          status,
          ...(status === 'completed' && { completedAt: new Date().toISOString() }),
        }),
      });

      if (!response.ok) {
        throw new Error('Uložení selhalo');
      }

      const result = await response.json();
      installation = result.installation;
      saveSuccess = true;
      setTimeout(() => saveSuccess = false, 3000);
    } catch (err) {
      alert('Nepodařilo se uložit: ' + (err as Error).message);
    } finally {
      isSaving = false;
    }
  }

  async function downloadPdf() {
    const { generateInstallationPdf } = await import('$lib/utils/installationPdf');
    generateInstallationPdf(installation);
  }

  async function handleSendEmail(recipientEmail: string, customMessage: string) {
    const pdfBase64 = await generateInstallationPdfBase64(installation);

    const response = await fetch(`/api/installations/${installation.id}/send-email`, {
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

    installation.emailSentAt = new Date().toISOString();
    installation.emailSentTo = recipientEmail;
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <button onclick={() => goto('/dashboard/installations')} class="p-2 hover:bg-slate-100 rounded">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-slate-800">
          Montáž - {installation.order?.orderNumber || 'N/A'}
        </h1>
        <p class="text-slate-500">
          {installation.order?.customer?.companyName || contact?.fullName || 'Zákazník'}
        </p>
      </div>
    </div>
    <div class="flex gap-2">
      <button onclick={downloadPdf} class="btn-secondary flex items-center gap-2">
        <Download class="w-4 h-4" />
        Stáhnout PDF
      </button>
      <button onclick={() => showEmailModal = true} class="btn-primary flex items-center gap-2">
        <Send class="w-4 h-4" />
        Odeslat zákazníkovi
      </button>
    </div>
  </div>

  <!-- Email status -->
  {#if installation.emailSentAt}
    <div class="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded">
      <CheckCircle class="w-4 h-4" />
      Odesláno {new Date(installation.emailSentAt).toLocaleDateString('cs-CZ')} na {installation.emailSentTo}
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Levý sloupec - Info -->
    <div class="space-y-6">
      <!-- Základní info -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">Základní informace</h2>
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between">
            <dt class="text-slate-500">Stav</dt>
            <dd>
              <select bind:value={status} class="px-2 py-1 border rounded text-sm">
                <option value="planned">Naplánováno</option>
                <option value="completed" disabled={!canComplete}>Dokončeno</option>
              </select>
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Termín</dt>
            <dd>{installation.scheduledAt ? new Date(installation.scheduledAt).toLocaleDateString('cs-CZ') : '-'}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Technik</dt>
            <dd>{installation.technician?.fullName}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Dokončeno</dt>
            <dd>{installation.completedAt ? new Date(installation.completedAt).toLocaleDateString('cs-CZ') : '-'}</dd>
          </div>
        </dl>
      </div>

      <!-- Zákazník -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building class="w-5 h-5" />
          Zákazník
        </h2>
        <dl class="space-y-2 text-sm">
          <dd class="font-medium">{installation.order?.customer?.companyName || contact?.fullName}</dd>
          {#if contact?.phone}
            <dd class="text-slate-600">{contact.phone}</dd>
          {/if}
          {#if contact?.email}
            <dd class="text-slate-600">{contact.email}</dd>
          {/if}
        </dl>
        {#if installation.order?.location}
          <div class="mt-4 pt-4 border-t">
            <div class="flex items-start gap-2 text-sm">
              <MapPin class="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div>{installation.order.location.street}</div>
                <div>{installation.order.location.city} {installation.order.location.zip}</div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Pravý sloupec - Checklist a poznámky -->
    <div class="lg:col-span-2 space-y-6">
      <!-- Checklist -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Checklist montáže</h2>
          <div class="flex items-center gap-2">
            <div class="w-32 bg-slate-200 rounded-full h-3">
              <div 
                class="bg-futurol-green h-3 rounded-full transition-all"
                style="width: {progress}%"
              ></div>
            </div>
            <span class="text-sm font-medium">{progress}%</span>
          </div>
        </div>

        <div class="space-y-6">
          {#each INSTALLATION_CHECKLIST as section}
            <div>
              <h3 class="font-medium text-slate-700 mb-2">{section.label}</h3>
              <div class="space-y-2">
                {#each section.items as item}
                  <label class="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      bind:checked={checklist[item.id]}
                      class="w-5 h-5 rounded border-slate-300 text-futurol-green focus:ring-futurol-green"
                    />
                    <span class="text-sm">{item.label}</span>
                  </label>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Poznámky z montáže -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">Poznámky z montáže</h2>
        <textarea
          bind:value={workNotes}
          rows={4}
          class="w-full px-3 py-2 border border-slate-300 rounded-md resize-none focus:ring-2 focus:ring-futurol-wine/20 focus:border-futurol-wine outline-none"
          placeholder="Průběh montáže, případné komplikace, poznámky pro záznam..."
        ></textarea>
      </div>

      <!-- Poznámky z předání -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">Poznámky z předání</h2>
        <textarea
          bind:value={handoverNotes}
          rows={4}
          class="w-full px-3 py-2 border border-slate-300 rounded-md resize-none focus:ring-2 focus:ring-futurol-wine/20 focus:border-futurol-wine outline-none"
          placeholder="Připomínky zákazníka, dohodnuté úpravy, poznámky z předání..."
        ></textarea>
      </div>

      <!-- Akce -->
      <div class="flex items-center justify-between">
        <div>
          {#if saveSuccess}
            <span class="text-green-600 flex items-center gap-1">
              <CheckCircle class="w-4 h-4" />
              Uloženo
            </span>
          {/if}
        </div>
        <button 
          onclick={save}
          disabled={isSaving}
          class="btn-primary flex items-center gap-2"
        >
          <Save class="w-4 h-4" />
          {isSaving ? 'Ukládám...' : 'Uložit změny'}
        </button>
      </div>
    </div>
  </div>
</div>

<SendEmailModal
  isOpen={showEmailModal}
  customerEmail={customerEmail}
  orderNumber={installation.order?.orderNumber || ''}
  measurementId={installation.id}
  onClose={() => showEmailModal = false}
  onSend={handleSendEmail}
/>
```

---

## 4. ServiceTicket rozšíření

### 4.1 Prisma Schema změny

**Soubor:** `prisma/schema.prisma` (upravit existující model)

```prisma
model ServiceTicket {
  id              String    @id @default(uuid())
  orderId         String?
  order           Order?    @relation(fields: [orderId], references: [id])
  customerId      String
  customer        Customer  @relation(fields: [customerId], references: [id])
  
  // Požadavek
  source          String    @default("internal")  // customer | internal  🆕
  type            String    // warranty | paid | maintenance | complaint
  category        String?   // mechanical | electrical | roof | screen | other  🆕
  priority        String    @default("normal")  // low | normal | high | urgent
  description     String    @db.Text
  
  // Plánování
  status          String    @default("new")  // new | assigned | scheduled | in_progress | resolved | closed
  assignedToId    String?
  assignedTo      Employee? @relation("ServiceAssignee", fields: [assignedToId], references: [id])
  scheduledAt     DateTime?
  
  // Realizace  🆕
  diagnosis       String?   @db.Text
  workPerformed   String?   @db.Text
  materialsUsed   Json?     // [{ name: string, quantity: number, price?: number }]
  photos          Json?     // { before: string[], after: string[] }
  
  // Řešení
  resolution      String?   @db.Text
  resolvedAt      DateTime?
  resolvedById    String?
  resolvedBy      Employee? @relation("ServiceResolver", fields: [resolvedById], references: [id])
  
  // PDF protokol  🆕
  pdfUrl          String?
  pdfGeneratedAt  DateTime?
  
  // Email - zákazník  🆕
  emailSentAt     DateTime?
  emailSentTo     String?
  emailSentById   String?
  emailSentBy     Employee? @relation("ServiceEmailSender", fields: [emailSentById], references: [id])
  
  // Email - interní  🆕
  internalEmailSentAt  DateTime?
  internalEmailSentTo  Json?
  
  // Uzavření  🆕
  customerFeedback     String?
  closedAt             DateTime?
  closedById           String?
  closedBy             Employee? @relation("ServiceCloser", fields: [closedById], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### 4.2 Migrace

```bash
npx prisma migrate dev --name extend_service_ticket
```

### 4.3 Kategorie servisu

**Soubor:** `src/lib/config/serviceCategories.ts` (nový)

```typescript
export const SERVICE_CATEGORIES = [
  { id: 'mechanical', label: 'Mechanická závada' },
  { id: 'electrical', label: 'Elektro / motor' },
  { id: 'roof', label: 'Střecha / lamely' },
  { id: 'screen', label: 'Screenové rolety' },
  { id: 'remote', label: 'Ovládání / dálkový ovladač' },
  { id: 'water', label: 'Odvodnění / zatékání' },
  { id: 'other', label: 'Jiné' },
];

export const SERVICE_TYPES = [
  { id: 'warranty', label: 'Záruční oprava' },
  { id: 'paid', label: 'Placený servis' },
  { id: 'maintenance', label: 'Pravidelná údržba' },
  { id: 'complaint', label: 'Reklamace' },
];

export const SERVICE_PRIORITIES = [
  { id: 'low', label: 'Nízká', color: 'bg-slate-100 text-slate-800' },
  { id: 'normal', label: 'Normální', color: 'bg-blue-100 text-blue-800' },
  { id: 'high', label: 'Vysoká', color: 'bg-orange-100 text-orange-800' },
  { id: 'urgent', label: 'Urgentní', color: 'bg-red-100 text-red-800' },
];

export const SERVICE_STATUSES = [
  { id: 'new', label: 'Nový', color: 'bg-slate-100 text-slate-800' },
  { id: 'assigned', label: 'Přiřazeno', color: 'bg-blue-100 text-blue-800' },
  { id: 'scheduled', label: 'Naplánováno', color: 'bg-purple-100 text-purple-800' },
  { id: 'in_progress', label: 'V řešení', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'resolved', label: 'Vyřešeno', color: 'bg-green-100 text-green-800' },
  { id: 'closed', label: 'Uzavřeno', color: 'bg-slate-200 text-slate-600' },
];
```

### 4.4 PDF Generování pro servis

**Soubor:** `src/lib/utils/servicePdf.ts` (nový)

```typescript
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SERVICE_CATEGORIES, SERVICE_TYPES, SERVICE_PRIORITIES } from '$lib/config/serviceCategories';

interface ServiceTicketData {
  id: string;
  type: string;
  category: string | null;
  priority: string;
  description: string;
  diagnosis: string | null;
  workPerformed: string | null;
  materialsUsed: Array<{ name: string; quantity: number; price?: number }> | null;
  resolution: string | null;
  resolvedAt: string | null;
  scheduledAt: string | null;
  customer: {
    companyName: string | null;
    contacts: Array<{ fullName: string; phone: string | null }>;
  };
  order: {
    orderNumber: string;
    location: { street: string; city: string; zip: string } | null;
  } | null;
  assignedTo: { fullName: string } | null;
}

export function generateServicePdf(ticket: ServiceTicketData): void {
  const doc = buildServicePdf(ticket);
  const fileName = `servis-${ticket.order?.orderNumber || ticket.id.slice(0, 8)}.pdf`;
  doc.save(fileName);
}

export function generateServicePdfBase64(ticket: ServiceTicketData): string {
  const doc = buildServicePdf(ticket);
  return doc.output('datauristring').split(',')[1];
}

function buildServicePdf(ticket: ServiceTicketData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  doc.setFont('Roboto', 'normal');

  // === HEADER ===
  doc.setFontSize(20);
  doc.setFont('Roboto', 'bold');
  doc.setTextColor(114, 47, 55);
  doc.text('SERVISNÍ PROTOKOL', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // === ZÁKLADNÍ INFO ===
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('Roboto', 'bold');
  doc.text('Informace o servisu', margin, y);
  y += 8;

  const typeLabel = SERVICE_TYPES.find(t => t.id === ticket.type)?.label || ticket.type;
  const categoryLabel = SERVICE_CATEGORIES.find(c => c.id === ticket.category)?.label || ticket.category || '-';
  const priorityLabel = SERVICE_PRIORITIES.find(p => p.id === ticket.priority)?.label || ticket.priority;
  const contact = ticket.customer?.contacts?.[0];

  const infoData = [
    ['Zakázka', ticket.order?.orderNumber || '-'],
    ['Zákazník', ticket.customer?.companyName || contact?.fullName || '-'],
    ['Adresa', ticket.order?.location ? `${ticket.order.location.street}, ${ticket.order.location.city}` : '-'],
    ['Typ servisu', typeLabel],
    ['Kategorie', categoryLabel],
    ['Priorita', priorityLabel],
    ['Technik', ticket.assignedTo?.fullName || '-'],
    ['Datum řešení', ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString('cs-CZ') : '-'],
  ];

  (doc as any).autoTable({
    startY: y,
    body: infoData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3, font: 'Roboto' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // === POPIS PROBLÉMU ===
  doc.setFontSize(14);
  doc.setFont('Roboto', 'bold');
  doc.text('Popis problému', margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  const descLines = doc.splitTextToSize(ticket.description, pageWidth - 2 * margin);
  doc.text(descLines, margin, y);
  y += descLines.length * 5 + 10;

  // === DIAGNOSTIKA ===
  if (ticket.diagnosis) {
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text('Diagnostika', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    const diagLines = doc.splitTextToSize(ticket.diagnosis, pageWidth - 2 * margin);
    doc.text(diagLines, margin, y);
    y += diagLines.length * 5 + 10;
  }

  // === PROVEDENÁ PRÁCE ===
  if (ticket.workPerformed) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text('Provedená práce', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    const workLines = doc.splitTextToSize(ticket.workPerformed, pageWidth - 2 * margin);
    doc.text(workLines, margin, y);
    y += workLines.length * 5 + 10;
  }

  // === POUŽITÝ MATERIÁL ===
  if (ticket.materialsUsed && ticket.materialsUsed.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text('Použitý materiál', margin, y);
    y += 8;

    const materialData = ticket.materialsUsed.map(m => [
      m.name,
      m.quantity.toString(),
      m.price ? `${m.price} Kč` : '-'
    ]);

    (doc as any).autoTable({
      startY: y,
      head: [['Položka', 'Množství', 'Cena']],
      body: materialData,
      theme: 'grid',
      headStyles: { fillColor: [114, 47, 55], font: 'Roboto' },
      styles: { fontSize: 10, cellPadding: 3, font: 'Roboto' },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // === ZÁVĚR / ŘEŠENÍ ===
  if (ticket.resolution) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text('Závěr', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    const resLines = doc.splitTextToSize(ticket.resolution, pageWidth - 2 * margin);
    doc.text(resLines, margin, y);
  }

  // === FOOTER ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Vygenerováno: ${new Date().toLocaleDateString('cs-CZ')} | Strana ${i} z ${pageCount} | Futurol.cz`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
}
```

### 4.5 API rozšíření pro email

**Soubor:** `src/routes/api/service-tickets/[id]/send-email/+server.ts` (nový)

Implementace analogická k `installations/[id]/send-email` - použít `sendServiceEmail` a `generateServicePdfBase64`.

---

## 5. Technician Permissions

### 5.1 Prisma Schema změny

**Soubor:** `prisma/schema.prisma` (upravit Employee)

```prisma
model Employee {
  // ... existující pole ...
  
  // Granulární oprávnění pro techniky  🆕
  canMeasurement    Boolean @default(false)
  canInstallation   Boolean @default(false)
  canService        Boolean @default(false)
}
```

### 5.2 Migrace

```bash
npx prisma migrate dev --name add_technician_permissions
```

### 5.3 Permission helper

**Soubor:** `src/lib/server/permissions.ts` (upravit/přidat)

```typescript
import type { Employee, Role } from '@prisma/client';

type Module = 'measurement' | 'installation' | 'service';
type Permission = 'read' | 'write';

interface UserWithPermissions {
  id: string;
  roles: Role[];
  canMeasurement?: boolean;
  canInstallation?: boolean;
  canService?: boolean;
}

/**
 * Kontrola přístupu k modulu
 */
export function canAccessModule(
  user: UserWithPermissions,
  module: Module,
  permission: Permission = 'read'
): boolean {
  // Admin a manager mají vše
  if (user.roles.includes('admin') || user.roles.includes('manager')) {
    return true;
  }

  // Sales má read přístup k measurement
  if (user.roles.includes('sales') && module === 'measurement' && permission === 'read') {
    return true;
  }

  // Production manager má read přístup k measurement a installation
  if (user.roles.includes('production_manager')) {
    if ((module === 'measurement' || module === 'installation') && permission === 'read') {
      return true;
    }
  }

  // Technik - dle granulárních oprávnění
  if (user.roles.includes('technician')) {
    switch (module) {
      case 'measurement':
        return user.canMeasurement === true;
      case 'installation':
        return user.canInstallation === true;
      case 'service':
        return user.canService === true;
    }
  }

  return false;
}

/**
 * Vrací moduly dostupné pro uživatele (pro sidebar)
 */
export function getAccessibleModules(user: UserWithPermissions): Module[] {
  const modules: Module[] = ['measurement', 'installation', 'service'];
  return modules.filter(module => canAccessModule(user, module));
}

/**
 * Kontrola, zda může technik zapisovat do modulu
 */
export function canWriteModule(user: UserWithPermissions, module: Module): boolean {
  return canAccessModule(user, module, 'write');
}
```

### 5.4 Admin UI pro správu oprávnění

**Soubor:** `src/routes/dashboard/admin/users/[id]/+page.svelte` (upravit)

Přidat sekci pro oprávnění techniků:

```svelte
<!-- Pouze pokud má uživatel roli technician -->
{#if user.roles.includes('technician')}
  <div class="bg-white rounded-lg shadow p-6 mt-6">
    <h2 class="text-lg font-semibold mb-4">Oprávnění technika</h2>
    <p class="text-sm text-slate-500 mb-4">
      Vyberte, které činnosti může tento technik vykonávat.
    </p>
    
    <div class="space-y-3">
      <label class="flex items-center gap-3">
        <input 
          type="checkbox" 
          bind:checked={user.canMeasurement}
          class="w-5 h-5 rounded border-slate-300 text-futurol-wine focus:ring-futurol-wine"
        />
        <div>
          <div class="font-medium">Zaměření</div>
          <div class="text-sm text-slate-500">Může vytvářet a editovat zaměření</div>
        </div>
      </label>
      
      <label class="flex items-center gap-3">
        <input 
          type="checkbox" 
          bind:checked={user.canInstallation}
          class="w-5 h-5 rounded border-slate-300 text-futurol-wine focus:ring-futurol-wine"
        />
        <div>
          <div class="font-medium">Montáž</div>
          <div class="text-sm text-slate-500">Může vytvářet a editovat montáže</div>
        </div>
      </label>
      
      <label class="flex items-center gap-3">
        <input 
          type="checkbox" 
          bind:checked={user.canService}
          class="w-5 h-5 rounded border-slate-300 text-futurol-wine focus:ring-futurol-wine"
        />
        <div>
          <div class="font-medium">Servis</div>
          <div class="text-sm text-slate-500">Může vytvářet a editovat servisní tikety</div>
        </div>
      </label>
    </div>
  </div>
{/if}
```

### 5.5 Sidebar filtrování

**Soubor:** `src/routes/dashboard/+layout.svelte` (upravit)

```svelte
<script lang="ts">
  import { getAccessibleModules } from '$lib/server/permissions';
  
  // ... existující kód ...
  
  // Filtrovat navigaci dle oprávnění
  $: technicianModules = getAccessibleModules(data.user);
  
  $: filteredNavigation = mainNavigation.filter(item => {
    // Pro techniky filtrovat dle oprávnění
    if (data.user.roles.includes('technician') && !data.user.roles.includes('admin')) {
      if (item.href.includes('measurements') && !technicianModules.includes('measurement')) return false;
      if (item.href.includes('installations') && !technicianModules.includes('installation')) return false;
      if (item.href.includes('service') && !technicianModules.includes('service')) return false;
    }
    return true;
  });
</script>
```

---

## 6. Sdílené komponenty

### 6.1 SendEmailModal (rozšíření)

**Soubor:** `src/lib/components/SendEmailModal.svelte`

Upravit pro podporu interních příjemců:

```svelte
<script lang="ts">
  // ... existující props ...
  
  interface Props {
    isOpen: boolean;
    customerEmail: string | null;
    orderNumber: string;
    entityId: string;
    entityType: 'measurement' | 'installation' | 'service';
    onClose: () => void;
    onSend: (email: string, message: string, sendInternal: boolean, internalRecipients: string[]) => Promise<void>;
  }
  
  let sendInternal = $state(false);
  let internalRecipients = $state<string[]>([]);
  
  // Přednastavení interních příjemců (obchodník, vedoucí výroby)
  const defaultInternalRecipients = [
    { email: 'obchod@futurol.cz', label: 'Obchodní oddělení' },
    { email: 'vyroba@futurol.cz', label: 'Vedoucí výroby' },
  ];
</script>

<!-- V modalu přidat sekci pro interní odeslání -->
<div class="border-t pt-4 mt-4">
  <label class="flex items-center gap-2">
    <input type="checkbox" bind:checked={sendInternal} class="rounded" />
    <span class="text-sm">Odeslat kopii interně</span>
  </label>
  
  {#if sendInternal}
    <div class="mt-3 space-y-2">
      {#each defaultInternalRecipients as recipient}
        <label class="flex items-center gap-2 text-sm">
          <input 
            type="checkbox" 
            checked={internalRecipients.includes(recipient.email)}
            onchange={(e) => {
              if (e.target.checked) {
                internalRecipients = [...internalRecipients, recipient.email];
              } else {
                internalRecipients = internalRecipients.filter(r => r !== recipient.email);
              }
            }}
            class="rounded"
          />
          {recipient.label} ({recipient.email})
        </label>
      {/each}
    </div>
  {/if}
</div>
```

---

## 7. Implementační checklist

### 7.1 Příprava

- [ ] Přečíst celou specifikaci
- [ ] Ověřit aktuální stav kódu v repozitáři
- [ ] Zkontrolovat závislosti (`package.json`)

### 7.2 Databáze

- [ ] Přidat `Installation` model do Prisma schema
- [ ] Rozšířit `ServiceTicket` model
- [ ] Přidat permissions pole do `Employee`
- [ ] Vytvořit a spustit migrace
- [ ] Ověřit schéma v Prisma Studio

### 7.3 Backend - Installation

- [ ] Vytvořit `installationChecklist.ts` config
- [ ] API: `GET /api/installations`
- [ ] API: `POST /api/orders/[orderId]/installation`
- [ ] API: `GET /api/installations/[id]`
- [ ] API: `PATCH /api/installations/[id]`
- [ ] API: `POST /api/installations/[id]/send-email`
- [ ] Přidat `sendInstallationEmail` do email service
- [ ] Vytvořit `installationPdf.ts` utility

### 7.4 Backend - Service rozšíření

- [ ] Vytvořit `serviceCategories.ts` config
- [ ] Upravit existující API pro nová pole
- [ ] API: `POST /api/service-tickets/[id]/send-email`
- [ ] Přidat `sendServiceEmail` do email service
- [ ] Vytvořit `servicePdf.ts` utility

### 7.5 Backend - Permissions

- [ ] Rozšířit `permissions.ts` o nové funkce
- [ ] Upravit všechny relevantní API pro kontrolu oprávnění
- [ ] Upravit page load funkce pro kontrolu oprávnění

### 7.6 Frontend - Installation

- [ ] Page: `/dashboard/installations` (seznam)
- [ ] Page: `/dashboard/installations/[id]` (detail)
- [ ] Page server load funkce
- [ ] Přidat do sidebar navigace

### 7.7 Frontend - Service rozšíření

- [ ] Upravit formulář pro nová pole
- [ ] Přidat PDF tlačítko
- [ ] Přidat email tlačítko
- [ ] Rozšířit detail view

### 7.8 Frontend - Permissions

- [ ] Upravit Admin UI pro správu uživatelů
- [ ] Filtrování sidebar dle oprávnění
- [ ] Skrývání tlačítek dle oprávnění

### 7.9 Integrace

- [ ] Rozšířit `SendEmailModal` o interní příjemce
- [ ] Přidat Installation sekci do detailu zakázky
- [ ] Test kompletního flow

### 7.10 Testování

- [ ] Test vytvoření montáže
- [ ] Test checklistu
- [ ] Test PDF generování
- [ ] Test emailu zákazníkovi
- [ ] Test interního emailu
- [ ] Test servisního protokolu
- [ ] Test oprávnění techniků
- [ ] Test na různých rolích

### 7.11 Nasazení

- [ ] Build lokálně
- [ ] Deploy na stage
- [ ] Smoke test na stage
- [ ] Deploy na produkci
- [ ] Verifikace na produkci

---

## Přílohy

### A. Soubory k vytvoření

| Soubor | Typ |
|--------|-----|
| `src/lib/config/installationChecklist.ts` | Nový |
| `src/lib/config/serviceCategories.ts` | Nový |
| `src/lib/utils/installationPdf.ts` | Nový |
| `src/lib/utils/servicePdf.ts` | Nový |
| `src/routes/api/installations/+server.ts` | Nový |
| `src/routes/api/installations/[id]/+server.ts` | Nový |
| `src/routes/api/installations/[id]/send-email/+server.ts` | Nový |
| `src/routes/api/orders/[orderId]/installation/+server.ts` | Nový |
| `src/routes/api/service-tickets/[id]/send-email/+server.ts` | Nový |
| `src/routes/dashboard/installations/+page.svelte` | Nový |
| `src/routes/dashboard/installations/+page.server.ts` | Nový |
| `src/routes/dashboard/installations/[id]/+page.svelte` | Nový |
| `src/routes/dashboard/installations/[id]/+page.server.ts` | Nový |

### B. Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `prisma/schema.prisma` | +Installation, +ServiceTicket pole, +Employee permissions |
| `src/lib/server/email.ts` | +sendInstallationEmail, +sendServiceEmail, +sendInternalEmail |
| `src/lib/server/permissions.ts` | +canAccessModule, +getAccessibleModules |
| `src/lib/components/SendEmailModal.svelte` | +interní příjemci |
| `src/routes/dashboard/+layout.svelte` | +filtrování navigace |
| `src/routes/dashboard/admin/users/[id]/+page.svelte` | +technician permissions UI |
| `src/routes/dashboard/orders/[id]/+page.svelte` | +Installation sekce |

---

**Konec specifikace**

*Vytvořeno: 18. ledna 2026*
*Pro: Futurol App (FARDAL s.r.o.)*
*Autor: Claude + Tomáš Havelka (ASCENTA)*
