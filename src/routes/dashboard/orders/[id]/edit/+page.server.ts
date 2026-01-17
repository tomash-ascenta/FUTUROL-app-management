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
					contacts: {
						orderBy: { isPrimary: 'desc' }
					},
					locations: true
				}
			},
			contact: true,
			location: true,
			product: true,
			quotes: {
				orderBy: { version: 'desc' }
			}
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
			createdAt: order.createdAt.toISOString(),
			updatedAt: order.updatedAt.toISOString(),
			deadlineAt: order.deadlineAt?.toISOString() || null,
			customer: order.customer ? {
				...order.customer,
				createdAt: order.customer.createdAt.toISOString(),
				updatedAt: order.customer.updatedAt.toISOString(),
				contacts: order.customer.contacts.map((c) => ({
					...c,
					createdAt: c.createdAt.toISOString(),
					updatedAt: c.updatedAt.toISOString()
				})),
				locations: order.customer.locations.map((l) => ({
					...l,
					createdAt: l.createdAt.toISOString()
				}))
			} : null,
			contact: order.contact ? {
				...order.contact,
				createdAt: order.contact.createdAt.toISOString(),
				updatedAt: order.contact.updatedAt.toISOString()
			} : null,
			location: order.location ? {
				...order.location,
				createdAt: order.location.createdAt.toISOString()
			} : null,
			quotes: order.quotes.map((q) => ({
				...q,
				amount: Number(q.amount),
				createdAt: q.createdAt.toISOString(),
				updatedAt: q.updatedAt.toISOString()
			}))
		},
		products,
		locations: order.customer.locations.map((l) => ({
			...l,
			createdAt: l.createdAt.toISOString()
		}))
	};
};
