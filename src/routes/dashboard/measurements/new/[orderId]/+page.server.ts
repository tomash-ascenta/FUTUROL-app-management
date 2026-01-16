import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check role permissions
	const allowedRoles = ['admin', 'manager', 'technician'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		throw redirect(302, '/dashboard');
	}

	// Get order with details
	const orderRaw = await db.order.findUnique({
		where: { id: params.orderId },
		include: {
			customer: true,
			location: true,
			product: true,
			measurement: true
		}
	});

	if (!orderRaw) {
		throw error(404, 'Zakázka nenalezena');
	}

	if (orderRaw.measurement) {
		throw redirect(302, `/dashboard/measurements/${orderRaw.measurement.id}`);
	}

	// Convert Decimal to number for serialization
	const order = {
		...orderRaw,
		estimatedValue: orderRaw.estimatedValue ? Number(orderRaw.estimatedValue) : null
	};

	return {
		order
	};
};
