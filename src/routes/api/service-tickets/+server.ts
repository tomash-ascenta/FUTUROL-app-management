import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { requireFeature } from '$lib/server/features';

// GET - List all service tickets
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Feature flag check - Servis je pouze pro Full verzi
	requireFeature('service');

	const allowedRoles = ['admin', 'manager', 'sales', 'technician'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const tickets = await db.serviceTicket.findMany({
		include: {
			customer: true,
			order: {
				include: {
					location: true
				}
			},
			assignedTo: {
				select: {
					id: true,
					fullName: true
				}
			}
		},
		orderBy: { createdAt: 'desc' }
	});

	return json(tickets);
};

// POST - Create a new service ticket
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Feature flag check - Servis je pouze pro Full verzi
	requireFeature('service');

	const allowedRoles = ['admin', 'sales', 'technician'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { customerId, orderId, type, priority, description, assignedToId } = body;

		// Validation
		if (!customerId) {
			return json({ error: 'Zákazník je povinný' }, { status: 400 });
		}
		if (!type) {
			return json({ error: 'Typ tiketu je povinný' }, { status: 400 });
		}
		if (!description || description.trim() === '') {
			return json({ error: 'Popis problému je povinný' }, { status: 400 });
		}

		// Validate type enum
		const validTypes = ['warranty', 'paid', 'maintenance', 'complaint'];
		if (!validTypes.includes(type)) {
			return json({ error: 'Neplatný typ tiketu' }, { status: 400 });
		}

		// Validate priority enum
		const validPriorities = ['low', 'normal', 'high', 'urgent'];
		if (priority && !validPriorities.includes(priority)) {
			return json({ error: 'Neplatná priorita' }, { status: 400 });
		}

		// Generate ticket number
		const currentYear = new Date().getFullYear();
		const lastTicket = await db.serviceTicket.findFirst({
			where: {
				ticketNumber: {
					startsWith: `SRV-${currentYear}-`
				}
			},
			orderBy: { ticketNumber: 'desc' }
		});

		let nextNumber = 1;
		if (lastTicket) {
			const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[2]);
			nextNumber = lastNumber + 1;
		}
		const ticketNumber = `SRV-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;

		// Create the ticket
		const ticket = await db.serviceTicket.create({
			data: {
				ticketNumber,
				customer: { connect: { id: customerId } },
				order: orderId ? { connect: { id: orderId } } : undefined,
				type,
				priority: priority || 'normal',
				description: description.trim(),
				assignedTo: assignedToId ? { connect: { id: assignedToId } } : undefined,
				status: assignedToId ? 'assigned' : 'new_ticket'
			},
			include: {
				customer: true,
				order: true,
				assignedTo: {
					select: {
						id: true,
						fullName: true
					}
				}
			}
		});

		return json(ticket, { status: 201 });
	} catch (error) {
		console.error('Error creating service ticket:', error);
		return json({ error: 'Nepodařilo se vytvořit tiket' }, { status: 500 });
	}
};
