import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check role permissions - only admin and sales can create orders
	const allowedRoles = ['admin', 'sales'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		throw redirect(302, '/dashboard/orders');
	}

	// Get customerId from URL if provided
	const preselectedCustomerId = url.searchParams.get('customerId') || null;

	// Get customers for selection
	const customers = await db.customer.findMany({
		include: {
			contacts: {
				orderBy: { isPrimary: 'desc' }
			},
			locations: true
		},
		orderBy: { createdAt: 'desc' }
	});

	// Get products
	const products = await db.product.findMany({
		where: { isActive: true },
		orderBy: { name: 'asc' }
	});

	return {
		customers,
		products,
		preselectedCustomerId
	};
};
