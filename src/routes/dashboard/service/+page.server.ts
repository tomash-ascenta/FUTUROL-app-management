import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check role permissions - sales can view and create service tickets
	const allowedRoles = ['admin', 'manager', 'sales', 'technician'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		throw redirect(302, '/dashboard');
	}

	// Get all service tickets
	const ticketsRaw = await db.serviceTicket.findMany({
		include: {
			customer: {
				include: {
					contacts: {
						where: { isPrimary: true },
						take: 1
					}
				}
			},
			contact: true,
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

	// Serialize data
	const tickets = ticketsRaw.map(ticket => ({
		...ticket,
		createdAt: ticket.createdAt.toISOString(),
		updatedAt: ticket.updatedAt.toISOString(),
		scheduledAt: ticket.scheduledAt?.toISOString() || null,
		resolvedAt: ticket.resolvedAt?.toISOString() || null,
		order: ticket.order ? {
			...ticket.order,
			createdAt: ticket.order.createdAt.toISOString(),
			updatedAt: ticket.order.updatedAt.toISOString()
		} : null
	}));

	// Check if user can create tickets (not just view)
	const canCreate = locals.user.roles.some((role: string) => 
		['admin', 'sales', 'technician'].includes(role)
	);

	return {
		tickets,
		canCreate
	};
};
