import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

// GET - Detail poptávky
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Only admin, manager, and sales can view inquiries
	const allowedRoles = ['admin', 'manager', 'sales'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		return json({ error: 'Nedostatečná oprávnění' }, { status: 403 });
	}

	try {
		const inquiry = await db.inquiry.findUnique({
			where: { id: params.id },
			include: {
				customer: true
			}
		});

		if (!inquiry) {
			return json({ error: 'Poptávka nenalezena' }, { status: 404 });
		}

		return json({ inquiry });
	} catch (error) {
		console.error('Error fetching inquiry:', error);
		return json({ error: 'Chyba při načítání poptávky' }, { status: 500 });
	}
};

// PATCH - Aktualizace stavu poptávky
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Only admin and sales can update inquiries
	const allowedRoles = ['admin', 'sales'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		return json({ error: 'Nedostatečná oprávnění' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { status } = body;

		// Validate status
		const validStatuses = ['new', 'contacted', 'converted', 'lost'];
		if (status && !validStatuses.includes(status)) {
			return json({ error: 'Neplatný stav' }, { status: 400 });
		}

		const inquiry = await db.inquiry.update({
			where: { id: params.id },
			data: {
				status: status || undefined,
				assignedTo: body.assignedTo || undefined
			}
		});

		return json({ inquiry });
	} catch (error) {
		console.error('Error updating inquiry:', error);
		return json({ error: 'Chyba při aktualizaci poptávky' }, { status: 500 });
	}
};
