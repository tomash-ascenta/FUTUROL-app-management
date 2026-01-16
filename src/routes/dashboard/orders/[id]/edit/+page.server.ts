import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check permissions
	const canEdit = locals.user.roles.some((role: string) => ['admin', 'sales'].includes(role));
	if (!canEdit) {
		throw error(403, 'Nemáte oprávnění upravovat zakázky');
	}

	const order = await db.order.findUnique({
		where: { id: params.id },
		include: {
			customer: {
				include: {
					locations: true
				}
			},
			location: true,
			product: true
		}
	});

	if (!order) {
		throw error(404, 'Zakázka nenalezena');
	}

	// Load products for dropdown
	const products = await db.product.findMany({
		where: { isActive: true },
		orderBy: { name: 'asc' }
	});

	return {
		order: {
			...order,
			estimatedValue: order.estimatedValue ? Number(order.estimatedValue) : null,
			finalValue: order.finalValue ? Number(order.finalValue) : null,
			createdAt: order.createdAt.toISOString(),
			updatedAt: order.updatedAt.toISOString(),
			deadlineAt: order.deadlineAt?.toISOString() || null
		},
		products,
		locations: order.customer.locations.map((l) => ({
			...l,
			createdAt: l.createdAt.toISOString()
		}))
	};
};
