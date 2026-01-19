/**
 * API: POST /api/orders/[orderId]/installation - Vytvoření montáže pro zakázku
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { requireFeature } from '$lib/server/features';
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

	requireFeature('installation');

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

	// Ověřit že technik existuje a je aktivní
	const technician = await db.employee.findUnique({
		where: { id: technicianId }
	});

	if (!technician) {
		return json({ error: 'Technik nenalezen' }, { status: 400 });
	}

	if (!technician.isActive) {
		return json({ error: 'Vybraný uživatel není aktivní' }, { status: 400 });
	}

	// Ověřit že má oprávnění k montážím (pokud je technician role)
	if (technician.roles.includes('technician') && !technician.canInstallation) {
		return json({ error: 'Vybraný uživatel nemá oprávnění k montážím' }, { status: 400 });
	}

	try {
		// Vytvořit instalaci
		const installation = await db.installation.create({
			data: {
				order: { connect: { id: params.orderId } },
				technician: { connect: { id: technicianId } },
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
	} catch (err) {
		console.error('Error creating installation:', err);
		return json({ error: 'Chyba při vytváření montáže' }, { status: 500 });
	}
};
