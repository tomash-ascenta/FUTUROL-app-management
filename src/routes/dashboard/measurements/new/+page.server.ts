import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check role permissions
	const allowedRoles = ['admin', 'manager', 'technician'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		throw redirect(302, '/dashboard');
	}

	// Get orders that need measurement (status = quote_sent or customer)
	const ordersRaw = await db.order.findMany({
		where: {
			status: {
				in: ['customer', 'quote_sent']
			},
			measurement: null // No measurement yet
		},
		include: {
			customer: {
				include: {
					contacts: {
						where: { isPrimary: true },
						take: 1
					}
				}
			},
			location: true,
			product: true
		},
		orderBy: { createdAt: 'desc' }
	});

	// Convert orders for serialization
	const orders = ordersRaw.map(order => ({
		...order
	}));

	return {
		orders
	};
};
