import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Bcrypt hash function - same as in auth.ts
const BCRYPT_ROUNDS = 10;
async function hashPin(pin: string): Promise<string> {
	return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

async function main() {
	console.log('🌱 Seeding database...');
	
	// Pre-hash the default PIN
	const defaultPinHash = await hashPin('123456');

	// Create admin user (only system admin, no business access)
	const admin = await prisma.employee.upsert({
		where: { personalNumber: '0001' },
		update: {
			pin: defaultPinHash,
			roles: ['admin'],
			fullName: 'Systém Admin'
		},
		create: {
			personalNumber: '0001',
			pin: defaultPinHash,
			fullName: 'Systém Admin',
			email: 'admin@futurol.cz',
			roles: ['admin'],
			isActive: true
		}
	});
	console.log('✅ Admin created:', admin.personalNumber, '(pouze správa systému)');

	// Create manager (full read access to everything)
	const manager = await prisma.employee.upsert({
		where: { personalNumber: '0010' },
		update: {
			pin: defaultPinHash,
			roles: ['manager'],
			fullName: 'Jan Manažer'
		},
		create: {
			personalNumber: '0010',
			pin: defaultPinHash,
			fullName: 'Jan Manažer',
			email: 'manazer@futurol.cz',
			phone: '+420 777 000 001',
			roles: ['manager'],
			isActive: true
		}
	});
	console.log('✅ Manager created:', manager.personalNumber, '(vidí vše)');

	// Create sample employees
	const technician = await prisma.employee.upsert({
		where: { personalNumber: '0002' },
		update: { pin: defaultPinHash, roles: ['technician'], fullName: 'Jan Technik' },
		create: {
			personalNumber: '0002',
			pin: defaultPinHash,
			fullName: 'Jan Technik',
			email: 'technik@futurol.cz',
			phone: '+420 777 111 222',
			roles: ['technician'],
			isActive: true
		}
	});
	console.log('✅ Technician created:', technician.personalNumber);

	const sales = await prisma.employee.upsert({
		where: { personalNumber: '0003' },
		update: { pin: defaultPinHash },
		create: {
			personalNumber: '0003',
			pin: defaultPinHash,
			fullName: 'Petr Obchodník',
			email: 'obchodnik@futurol.cz',
			phone: '+420 777 333 444',
			roles: ['sales'],
			isActive: true
		}
	});
	console.log('✅ Sales created:', sales.personalNumber);

	// Create products
	const products = [
		{ code: 'KLIMO', name: 'Klimo', description: 'Bioklimatická pergola s otočnými lamelami' },
		{ code: 'HORIZONTAL', name: 'Horizontal', description: 'Horizontální stínění s rolovacím mechanismem' },
		{ code: 'KLASIK', name: 'Klasik', description: 'Klasická pergola s pevnou střechou' },
		{ code: 'SCREEN', name: 'Screen', description: 'Vertikální screenové stínění' },
		{ code: 'ZIP', name: 'Zip Screen', description: 'ZIP screenové stínění' }
	];

	for (const product of products) {
		await prisma.product.upsert({
			where: { code: product.code },
			update: {},
			create: product
		});
	}
	console.log('✅ Products created:', products.length);

	// Create sample customers
	const customersData = [
		{
			id: 'customer-1',
			fullName: 'Karel Novák',
			email: 'karel.novak@email.cz',
			phone: '+420 602 123 456',
			company: null,
			note: 'Dobrý zákazník, rychle platí',
			source: 'manual' as const,
			location: { street: 'Zahradní 15', city: 'Praha', zip: '14000' }
		},
		{
			id: 'customer-2',
			fullName: 'Marie Svobodová',
			email: 'marie.svobodova@gmail.com',
			phone: '+420 731 456 789',
			company: null,
			note: null,
			source: 'advisor' as const,
			location: { street: 'Lesní 42', city: 'Brno', zip: '60200' }
		},
		{
			id: 'customer-3',
			fullName: 'Jakub Dvořák',
			email: 'j.dvorak@firma.cz',
			phone: '+420 777 888 999',
			company: 'Dvořák & syn s.r.o.',
			note: 'B2B zákazník - sleva 10%',
			source: 'manual' as const,
			location: { street: 'Průmyslová 8', city: 'Ostrava', zip: '70200' }
		},
		{
			id: 'customer-4',
			fullName: 'Eva Černá',
			email: null,
			phone: '+420 608 111 222',
			company: null,
			note: 'Preferuje komunikaci přes telefon',
			source: 'web' as const,
			location: { street: 'Na Kopci 3', city: 'Plzeň', zip: '30100' }
		},
		{
			id: 'customer-5',
			fullName: 'Tomáš Veselý',
			email: 'vesely.tomas@centrum.cz',
			phone: '+420 604 333 444',
			company: 'Hotel Veselý',
			note: 'Velký projekt - 4 pergoly',
			source: 'manual' as const,
			location: { street: 'Hlavní náměstí 1', city: 'Liberec', zip: '46001' }
		},
		{
			id: 'customer-6',
			fullName: 'Jana Procházková',
			email: 'jana.p@email.cz',
			phone: '+420 721 555 666',
			company: null,
			note: null,
			source: 'advisor' as const,
			location: { street: 'Polní 28', city: 'Olomouc', zip: '77900' }
		},
		{
			id: 'customer-7',
			fullName: 'Petr Horák',
			email: 'petr.horak@seznam.cz',
			phone: '+420 606 777 888',
			company: 'Restaurace U Horáků',
			note: 'Zájem o bioklimatickou pergolu na terasu',
			source: 'web' as const,
			location: { street: 'U Potoka 55', city: 'České Budějovice', zip: '37001' }
		},
		{
			id: 'customer-8',
			fullName: 'Lucie Malá',
			email: 'lucie.mala@gmail.com',
			phone: '+420 739 999 000',
			company: null,
			note: null,
			source: 'import' as const,
			location: { street: 'Krátká 7', city: 'Hradec Králové', zip: '50002' }
		}
	];

	for (const c of customersData) {
		await prisma.customer.upsert({
			where: { id: c.id },
			update: {},
			create: {
				id: c.id,
				fullName: c.fullName,
				email: c.email,
				phone: c.phone,
				company: c.company,
				note: c.note,
				source: c.source,
				locations: {
					create: {
						street: c.location.street,
						city: c.location.city,
						zip: c.location.zip,
						country: 'CZ'
					}
				}
			}
		});
	}
	console.log('✅ Sample customers created:', customersData.length);

	// Create sample inquiries
	const inquiriesData = [
		{
			fullName: 'Martin Nový',
			email: 'martin.novy@email.cz',
			phone: '+420777888999',
			note: 'Mám zájem o pergolu na terasu, cca 4x5m',
			purpose: 'dining',
			size: 'medium',
			roofType: 'bioclimatic',
			extras: ['led', 'heating'],
			budget: 'premium',
			recommendedProduct: 'FUTUROL Premium Bioclimatic',
			status: 'new' as const
		},
		{
			fullName: 'Eva Svobodová',
			email: 'eva.svobodova@seznam.cz',
			phone: '+420666777888',
			note: null,
			purpose: 'relax',
			size: 'small',
			roofType: 'retractable',
			extras: ['led'],
			budget: 'standard',
			recommendedProduct: 'FUTUROL Classic',
			status: 'contacted' as const
		},
		{
			fullName: 'Jakub Černý',
			email: 'jakub@firma.cz',
			phone: '+420555666777',
			note: 'Potřebuji zastřešit bazén 6x10m',
			purpose: 'pool',
			size: 'xl',
			roofType: 'fixed',
			extras: ['heating', 'blinds', 'sensors'],
			budget: 'luxury',
			recommendedProduct: 'FUTUROL Solid Roof',
			status: 'new' as const
		}
	];

	for (const inquiry of inquiriesData) {
		await prisma.inquiry.create({
			data: inquiry
		});
	}
	console.log('✅ Sample inquiries created:', inquiriesData.length);

	// Get locations for orders
	const locations = await prisma.location.findMany();
	const horizontalProduct = await prisma.product.findFirst({ where: { code: 'HORIZONTAL' } });
	const klasikProduct = await prisma.product.findFirst({ where: { code: 'KLASIK' } });

	// Create sample orders ready for measurement
	if (locations.length >= 3 && horizontalProduct && klasikProduct) {
		const ordersData = [
			{
				orderNumber: 'FUT-2026-0001',
				customerId: 'customer-1',
				locationId: locations[0].id,
				productId: horizontalProduct.id,
				status: 'measurement_scheduled' as const,
				priority: 'normal' as const,
				estimatedValue: 285000
			},
			{
				orderNumber: 'FUT-2026-0002',
				customerId: 'customer-2',
				locationId: locations[1].id,
				productId: klasikProduct.id,
				status: 'contacted' as const,
				priority: 'high' as const,
				estimatedValue: 195000
			},
			{
				orderNumber: 'FUT-2026-0003',
				customerId: 'customer-3',
				locationId: locations[2].id,
				productId: horizontalProduct.id,
				status: 'measurement_scheduled' as const,
				priority: 'urgent' as const,
				estimatedValue: 520000
			}
		];

		for (const order of ordersData) {
			await prisma.order.upsert({
				where: { orderNumber: order.orderNumber },
				update: {},
				create: order
			});
		}
		console.log('✅ Sample orders created:', ordersData.length);
	}

	console.log('\n🎉 Seed completed!');
	console.log('\n📝 Test credentials (všichni PIN: 123456):');
	console.log('   0001 - Systém Admin (správa uživatelů, logy)');
	console.log('   0010 - Ředitel (všechny dashboardy a reporty)');
	console.log('   0002 - Zaměřovač + Technik');
	console.log('   0003 - Obchodník');
}

main()
	.catch((e) => {
		console.error('❌ Seed failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
