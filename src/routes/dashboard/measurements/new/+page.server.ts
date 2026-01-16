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

	// Get orders that need measurement (status = measurement_scheduled or contacted)
	const ordersRaw = await db.order.findMany({
		where: {
			status: {
				in: ['contacted', 'measurement_scheduled']
			},
			measurement: null // No measurement yet
		},
		include: {
			customer: true,
			location: true,
			product: true
		},
		orderBy: { createdAt: 'desc' }
	});

	// Convert Decimal to number for serialization
	const orders = ordersRaw.map(order => ({
		...order,
		estimatedValue: order.estimatedValue ? Number(order.estimatedValue) : null
	}));

	return {
		orders
	};
};
