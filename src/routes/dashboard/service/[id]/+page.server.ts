import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check role permissions
	const allowedRoles = ['admin', 'manager', 'sales', 'technician'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		throw redirect(302, '/dashboard');
	}

	const ticket = await db.serviceTicket.findUnique({
		where: { id: params.id },
		include: {
			customer: true,
			order: {
				include: {
					location: true,
					product: true
				}
			},
			assignedTo: {
				select: {
					id: true,
					fullName: true,
					personalNumber: true,
					phone: true
				}
			}
		}
	});

	if (!ticket) {
		throw error(404, 'Tiket nenalezen');
	}

	// Check if user can edit (not just view)
	const canEdit = locals.user.roles.some((role: string) => 
		['admin', 'sales', 'technician'].includes(role)
	);

	return {
		ticket: {
			...ticket,
			createdAt: ticket.createdAt.toISOString(),
			updatedAt: ticket.updatedAt.toISOString(),
			scheduledAt: ticket.scheduledAt?.toISOString() || null,
			resolvedAt: ticket.resolvedAt?.toISOString() || null,
			order: ticket.order ? {
				...ticket.order,
				estimatedValue: ticket.order.estimatedValue ? Number(ticket.order.estimatedValue) : null,
				createdAt: ticket.order.createdAt.toISOString(),
				updatedAt: ticket.order.updatedAt.toISOString()
			} : null
		},
		canEdit
	};
};
