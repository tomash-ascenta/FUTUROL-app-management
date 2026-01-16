import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

// POST - Konverze poptávky na zákazníka
export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Only admin and sales can convert inquiries
	const allowedRoles = ['admin', 'sales'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		return json({ error: 'Nedostatečná oprávnění' }, { status: 403 });
	}

	try {
		// Get the inquiry
		const inquiry = await db.inquiry.findUnique({
			where: { id: params.id }
		});

		if (!inquiry) {
			return json({ error: 'Poptávka nenalezena' }, { status: 404 });
		}

		// Check if already converted
		if (inquiry.customerId) {
			return json({ error: 'Poptávka již byla zpracována' }, { status: 400 });
		}

		// Build note from inquiry data
		const purposeLabels: Record<string, string> = {
			relax: 'Relaxace',
			dining: 'Jídelna',
			pool: 'Bazén',
			parking: 'Parkování'
		};

		const sizeLabels: Record<string, string> = {
			small: 'Do 12 m²',
			medium: '12-20 m²',
			large: '20-30 m²',
			xl: '30+ m²'
		};

		const roofLabels: Record<string, string> = {
			bioclimatic: 'Bioklimatická (lamelová)',
			fixed: 'Pevná střecha',
			retractable: 'Stahovací',
			glass: 'Skleněná'
		};

		const budgetLabels: Record<string, string> = {
			economy: 'Do 150 000 Kč',
			standard: '150 - 300 000 Kč',
			premium: '300 - 500 000 Kč',
			luxury: '500 000+ Kč'
		};

		const extrasLabels: Record<string, string> = {
			led: 'LED osvětlení',
			heating: 'Topení',
			blinds: 'Rolety/Zasklení',
			sensors: 'Senzory'
		};

		const noteLines = [
			'--- Data z rádce ---',
			`Doporučený produkt: ${inquiry.recommendedProduct}`,
			`Účel: ${purposeLabels[inquiry.purpose] || inquiry.purpose}`,
			`Velikost: ${sizeLabels[inquiry.size] || inquiry.size}`,
			`Typ střechy: ${roofLabels[inquiry.roofType] || inquiry.roofType}`,
			`Rozpočet: ${budgetLabels[inquiry.budget] || inquiry.budget}`,
		];

		if (inquiry.extras && inquiry.extras.length > 0) {
			const extrasFormatted = inquiry.extras
				.map(e => extrasLabels[e] || e)
				.join(', ');
			noteLines.push(`Doplňky: ${extrasFormatted}`);
		}

		if (inquiry.note) {
			noteLines.push(`Poznámka zákazníka: ${inquiry.note}`);
		}

		noteLines.push(`Poptávka z: ${inquiry.createdAt.toLocaleDateString('cs-CZ')}`);

		const customerNote = noteLines.join('\n');

		// Create customer
		const customer = await db.customer.create({
			data: {
				fullName: inquiry.fullName,
				email: inquiry.email,
				phone: inquiry.phone || '',
				source: 'advisor',
				note: customerNote
			}
		});

		// Update inquiry - mark as converted
		await db.inquiry.update({
			where: { id: params.id },
			data: {
				customerId: customer.id,
				status: 'converted',
				convertedAt: new Date()
			}
		});

		// Audit log
		await db.auditLog.create({
			data: {
				employeeId: locals.user.employeeId,
				action: 'CONVERT',
				entityType: 'Inquiry',
				entityId: params.id,
				newValue: {
					inquiryId: params.id,
					customerId: customer.id
				}
			}
		});

		return json({ 
			success: true, 
			customer,
			message: 'Zákazník byl úspěšně vytvořen z poptávky'
		}, { status: 201 });

	} catch (error) {
		console.error('Error converting inquiry:', error);
		return json({ error: 'Chyba při konverzi poptávky' }, { status: 500 });
	}
};
