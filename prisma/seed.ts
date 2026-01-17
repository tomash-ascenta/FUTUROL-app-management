import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('🌱 FUTUROL Database Seed v2.0');
  console.log('═══════════════════════════════════════');
  console.log('');

  // Hash PIN (všichni mají 123456)
  const hashedPin = await bcrypt.hash('123456', 10);

  // ========================================
  // EMPLOYEES
  // ========================================
  console.log('👤 Creating employees...');

  const admin = await prisma.employee.create({
    data: {
      personalNumber: '0001',
      pin: hashedPin,
      fullName: 'Admin Systému',
      email: 'admin@futurol.cz',
      phone: '+420777000001',
      roles: ['admin'],
    },
  });

  const sales1 = await prisma.employee.create({
    data: {
      personalNumber: '0010',
      pin: hashedPin,
      fullName: 'Jan Novák',
      email: 'novak@futurol.cz',
      phone: '+420777000010',
      roles: ['sales'],
    },
  });

  const sales2 = await prisma.employee.create({
    data: {
      personalNumber: '0011',
      pin: hashedPin,
      fullName: 'Petra Svobodová',
      email: 'svobodova@futurol.cz',
      phone: '+420777000011',
      roles: ['sales'],
    },
  });

  const production = await prisma.employee.create({
    data: {
      personalNumber: '0020',
      pin: hashedPin,
      fullName: 'Martin Výroba',
      email: 'vyroba@futurol.cz',
      phone: '+420777000020',
      roles: ['production_manager'],
    },
  });

  const technician = await prisma.employee.create({
    data: {
      personalNumber: '0030',
      pin: hashedPin,
      fullName: 'Pavel Technik',
      email: 'technik@futurol.cz',
      phone: '+420777000030',
      roles: ['technician'],
    },
  });

  const manager = await prisma.employee.create({
    data: {
      personalNumber: '0040',
      pin: hashedPin,
      fullName: 'Eva Manažerová',
      email: 'manager@futurol.cz',
      phone: '+420777000040',
      roles: ['manager'],
    },
  });

  console.log('   ✓ 6 employees\n');

  // ========================================
  // PRODUCTS
  // ========================================
  console.log('📦 Creating products...');

  const klimo = await prisma.product.create({
    data: {
      code: 'KLIMO',
      name: 'Pergola KLIMO',
      description: 'Bioklimatická pergola s otočnými lamelami',
    },
  });

  const klasik = await prisma.product.create({
    data: {
      code: 'KLASIK',
      name: 'Pergola KLASIK',
      description: 'Klasická pergola s pevnou střechou',
    },
  });

  const horizontal = await prisma.product.create({
    data: {
      code: 'HORIZONTAL',
      name: 'Pergola HORIZONTAL',
      description: 'Pergola s horizontálními lamelami',
    },
  });

  const artio = await prisma.product.create({
    data: {
      code: 'ARTIO',
      name: 'Pergola ARTIO',
      description: 'Designová pergola',
    },
  });

  console.log('   ✓ 4 products\n');

  // ========================================
  // LEADS
  // ========================================
  console.log('🎯 Creating leads...');

  // Leady z rádce (advisor)
  await prisma.lead.create({
    data: {
      originalName: 'Karel Zájemce',
      originalPhone: '+420602111222',
      originalEmail: 'karel@email.cz',
      source: 'advisor',
      answers: { q1: [1, 3], q2: [2], q3: [1] },
      scores: { KLIMO: 12, HORIZONTAL: 8, KLASIK: 5 },
      recommendedProduct: 'KLIMO',
      status: 'new',
    },
  });

  await prisma.lead.create({
    data: {
      originalName: 'Ing. Pavel Dvořák',
      originalPhone: '+420777123456',
      originalEmail: 'dvorak.pavel@gmail.com',
      source: 'advisor',
      answers: { q1: [2], q2: [1, 3], q3: [2] },
      scores: { KLIMO: 8, HORIZONTAL: 15, KLASIK: 6 },
      recommendedProduct: 'HORIZONTAL',
      status: 'new',
    },
  });

  await prisma.lead.create({
    data: {
      originalName: 'Martina Svobodová',
      originalPhone: '+420605987654',
      originalEmail: 'martina.svobodova@seznam.cz',
      source: 'advisor',
      answers: { q1: [1], q2: [2], q3: [1, 2] },
      scores: { KLIMO: 5, HORIZONTAL: 7, KLASIK: 14 },
      recommendedProduct: 'KLASIK',
      status: 'new',
    },
  });

  // Leady z webu
  await prisma.lead.create({
    data: {
      originalName: 'Marie Nová',
      originalPhone: '+420603222333',
      originalEmail: 'marie@email.cz',
      source: 'web',
      channel: 'kontaktní formulář',
      status: 'new',
    },
  });

  await prisma.lead.create({
    data: {
      originalName: 'Josef Krátký',
      originalPhone: '+420608111222',
      originalEmail: 'josef.kratky@email.cz',
      source: 'web',
      channel: 'poptávkový formulář',
      customerNote: 'Mám zájem o pergolu na terasu, cca 4x3m',
      status: 'new',
    },
  });

  await prisma.lead.create({
    data: {
      originalName: 'Anna Veselá',
      originalPhone: '+420702333444',
      originalEmail: 'anna.vesela@outlook.com',
      source: 'web',
      channel: 'chat',
      customerNote: 'Dotaz na cenu KLIMO 5x4m',
      status: 'new',
    },
  });

  // Firemní leady
  await prisma.lead.create({
    data: {
      originalName: 'Jan Ředitel',
      originalPhone: '+420605444555',
      originalEmail: 'reditel@restauraceukocoura.cz',
      originalCompany: 'Restaurace U Kocoura s.r.o.',
      source: 'referral',
      customerNote: 'Doporučení od Hotel Panorama - potřebují zastřešení terasy',
      status: 'new',
    },
  });

  await prisma.lead.create({
    data: {
      originalName: 'Mgr. Petra Horáková',
      originalPhone: '+420606555666',
      originalEmail: 'horakova@skolka-slunicko.cz',
      originalCompany: 'MŠ Sluníčko',
      source: 'phone',
      channel: 'telefonát',
      customerNote: 'Poptávka na zastřešení pískoviště',
      status: 'new',
    },
  });

  // Ztracený lead
  await prisma.lead.create({
    data: {
      originalName: 'Petr Starý',
      originalPhone: '+420604333444',
      source: 'phone',
      channel: 'telefonát',
      status: 'lost',
      lostReason: 'price',
      lostNote: 'Příliš drahé, vybral konkurenci',
    },
  });

  // Další firemní lead
  await prisma.lead.create({
    data: {
      originalName: 'Firma ABC s.r.o.',
      originalPhone: '+420605444555',
      originalEmail: 'info@abc.cz',
      originalCompany: 'ABC s.r.o.',
      source: 'referral',
      status: 'new',
    },
  });

  console.log('   ✓ 10 leads\n');

  // ========================================
  // CUSTOMERS
  // ========================================
  console.log('👥 Creating customers...');

  // B2C zákazník - kontaktní údaje přímo na Customer
  const customer1 = await prisma.customer.create({
    data: {
      type: 'B2C',
      fullName: 'Jan Novotný',
      phone: '+420601100100',
      email: 'novotny@email.cz',
      source: 'manual',
      ownerId: sales1.id,
      locations: {
        create: {
          name: 'Rodinný dům',
          street: 'Zahradní 123',
          city: 'Praha 4',
          zip: '14000',
          gpsLat: 50.0405,
          gpsLng: 14.4513,
        },
      },
    },
    include: { locations: true },
  });

  // B2C zákazník 2 - s IČO (OSVČ)
  const customer2 = await prisma.customer.create({
    data: {
      type: 'B2C',
      fullName: 'Eva Malá',
      phone: '+420602200200',
      email: 'mala@email.cz',
      ico: '87654321', // OSVČ
      source: 'advisor',
      ownerId: sales1.id,
      locations: {
        create: {
          name: 'Chata',
          street: 'U lesa 45',
          city: 'Brno',
          zip: '60200',
        },
      },
    },
    include: { locations: true },
  });

  // B2B zákazník s více kontakty
  const customer3 = await prisma.customer.create({
    data: {
      type: 'B2B',
      companyName: 'Hotel Panorama s.r.o.',
      ico: '12345678',
      dic: 'CZ12345678',
      source: 'manual',
      ownerId: sales2.id,
      contacts: {
        createMany: {
          data: [
            {
              fullName: 'Ing. Tomáš Ředitel',
              phone: '+420603300300',
              email: 'reditel@hotelpanorama.cz',
              position: 'jednatel',
              isPrimary: true,
            },
            {
              fullName: 'Jana Provozní',
              phone: '+420603300301',
              email: 'provoz@hotelpanorama.cz',
              position: 'provozní',
              isPrimary: false,
            },
          ],
        },
      },
      locations: {
        createMany: {
          data: [
            {
              name: 'Hlavní budova',
              street: 'Horská 789',
              city: 'Špindlerův Mlýn',
              zip: '54351',
              gpsLat: 50.7269,
              gpsLng: 15.6094,
            },
            {
              name: 'Wellness centrum',
              street: 'Horská 791',
              city: 'Špindlerův Mlýn',
              zip: '54351',
            },
          ],
        },
      },
    },
    include: { contacts: true, locations: true },
  });

  console.log('   ✓ 3 customers (1 B2B with 2 contacts)\n');

  // ========================================
  // ORDERS
  // ========================================
  console.log('📋 Creating orders...');

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'FUT-2026-0001',
      customerId: customer1.id,
      // B2C - kontakt je přímo na customer, nepotřebujeme contactId
      locationId: customer1.locations[0].id,
      productId: klimo.id,
      ownerId: sales1.id,
      status: 'measurement',
      priority: 'normal',
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'FUT-2026-0002',
      customerId: customer2.id,
      // B2C - kontakt je přímo na customer
      locationId: customer2.locations[0].id,
      productId: klasik.id,
      ownerId: sales1.id,
      status: 'quote_sent',
      priority: 'high',
      deadlineAt: new Date('2026-03-01'),
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'FUT-2026-0003',
      customerId: customer3.id,
      contactId: customer3.contacts[1].id, // B2B - konkrétní kontaktní osoba (Provozní)
      locationId: customer3.locations[0].id,
      productId: klimo.id,
      ownerId: sales2.id,
      status: 'production',
      priority: 'urgent',
      deadlineAt: new Date('2026-02-15'),
    },
  });

  console.log('   ✓ 3 orders\n');

  // ========================================
  // QUOTES
  // ========================================
  console.log('💰 Creating quotes...');

  await prisma.quote.create({
    data: {
      quoteNumber: 'NAB-2026-0001-v1',
      orderId: order1.id,
      version: 1,
      amount: 250000,
      status: 'draft',
      note: 'První kalkulace',
      createdById: sales1.id,
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: 'NAB-2026-0002-v1',
      orderId: order2.id,
      version: 1,
      amount: 180000,
      status: 'sent',
      note: 'Standardní nabídka',
      createdById: sales1.id,
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: 'NAB-2026-0002-v2',
      orderId: order2.id,
      version: 2,
      amount: 165000,
      status: 'sent',
      note: 'Sleva 8%',
      createdById: sales1.id,
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: 'NAB-2026-0003-v1',
      orderId: order3.id,
      version: 1,
      amount: 320000,
      status: 'approved',
      note: 'Premium varianta, schváleno',
      createdById: sales2.id,
    },
  });

  console.log('   ✓ 4 quotes\n');

  // ========================================
  // MEASUREMENT
  // ========================================
  console.log('📐 Creating measurements...');

  await prisma.measurement.create({
    data: {
      orderId: order1.id,
      employeeId: technician.id,
      pergolaType: 'KLIMO',
      width: 4500,
      depth: 3200,
      height: 2800,
      clearanceHeight: 2400,
      details: {
        roofPanels: 4,
        legCount: 2,
        colorFrame: 'RAL 7016',
        colorRoof: 'RAL 9003',
        wallType: 'cihla',
        accessories: { led: { type: 'COB 4000K', count: 2 }, motor: 'IO' },
        screens: { front: { width: 4500, fabric: 'SE6-007007' } },
      },
      photos: [],
      gpsLat: 50.0755,
      gpsLng: 14.4378,
    },
  });

  console.log('   ✓ 1 measurement\n');

  // ========================================
  // SERVICE TICKETS
  // ========================================
  console.log('🔧 Creating service tickets...');

  await prisma.serviceTicket.create({
    data: {
      ticketNumber: 'SRV-2026-0001',
      customerId: customer1.id,
      // B2C - kontakt je přímo na customer, nepotřebujeme contactId
      orderId: order1.id,
      assignedToId: technician.id,
      type: 'warranty',
      category: 'motor',
      priority: 'high',
      status: 'scheduled',
      description: 'Motor střechy hlučí',
      scheduledAt: new Date('2026-01-20T09:00:00'),
    },
  });

  await prisma.serviceTicket.create({
    data: {
      ticketNumber: 'SRV-2026-0002',
      customerId: customer3.id,
      contactId: customer3.contacts[1].id, // B2B - konkrétní kontaktní osoba
      type: 'maintenance',
      category: 'textile',
      priority: 'normal',
      status: 'new_ticket',
      description: 'Údržba screenů před sezónou',
    },
  });

  console.log('   ✓ 2 service tickets\n');

  // ========================================
  // ORDER STATUS HISTORY
  // ========================================
  console.log('📜 Creating order history...');

  await prisma.orderStatusHistory.createMany({
    data: [
      { orderId: order1.id, fromStatus: null, toStatus: 'lead', changedById: sales1.id },
      { orderId: order1.id, fromStatus: 'lead', toStatus: 'customer', changedById: sales1.id },
      { orderId: order1.id, fromStatus: 'customer', toStatus: 'quote_sent', changedById: sales1.id },
      { orderId: order1.id, fromStatus: 'quote_sent', toStatus: 'measurement', changedById: technician.id },
    ],
  });

  console.log('   ✓ 4 status history records\n');

  // ========================================
  // DONE
  // ========================================
  console.log('═══════════════════════════════════════');
  console.log('✅ Seed completed!');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('📊 Summary:');
  console.log('   Employees:       6');
  console.log('   Products:        4');
  console.log('   Leads:           10');
  console.log('   Customers:       3');
  console.log('   Contacts:        4');
  console.log('   Locations:       4');
  console.log('   Orders:          3');
  console.log('   Quotes:          4');
  console.log('   Measurements:    1');
  console.log('   Service Tickets: 2');
  console.log('');
  console.log('🔐 PIN pro všechny: 123456');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
