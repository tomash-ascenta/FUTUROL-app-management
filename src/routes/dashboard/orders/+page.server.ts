import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { requireFeatureOrRedirect } from '$lib/server/features';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Feature flag check - Zakázky jsou pouze pro Full verzi
	requireFeatureOrRedirect('orders');

	// Check role permissions
	const allowedRoles = ['admin', 'manager', 'sales', 'production_manager', 'technician'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		throw redirect(302, '/dashboard');
	}

	// Check if user can create/edit orders (only admin and sales)
	const canEdit = locals.user.roles.some((role: string) => ['admin', 'sales'].includes(role));

	const search = url.searchParams.get('search') || '';
	const status = url.searchParams.get('status') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const skip = (page - 1) * limit;

	// Build where clause
	const where: Record<string, unknown> = {};
	
	if (search) {
		where.OR = [
			{ orderNumber: { contains: search, mode: 'insensitive' } },
			{ customer: { companyName: { contains: search, mode: 'insensitive' } } },
			{ customer: { contacts: { some: { fullName: { contains: search, mode: 'insensitive' } } } } },
			{ customer: { contacts: { some: { phone: { contains: search, mode: 'insensitive' } } } } }
		];
	}

	if (status) {
		where.status = status;
	}

	// Get total count
	const total = await db.order.count({ where });

	// Get orders with relations
	const orders = await db.order.findMany({
		where,
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
			product: true,
			measurement: {
				select: {
					id: true,
					measuredAt: true
				}
			},
			quotes: {
				where: { status: 'approved' },
				take: 1,
				orderBy: { version: 'desc' }
			}
		},
		orderBy: { createdAt: 'desc' },
		skip,
		take: limit
	});

	return {
		orders: orders.map((o) => ({
			...o,
			quotes: o.quotes?.map(q => ({
				...q,
				amount: Number(q.amount),
				createdAt: q.createdAt.toISOString(),
				updatedAt: q.updatedAt.toISOString()
			})) || [],
			createdAt: o.createdAt.toISOString(),
			updatedAt: o.updatedAt.toISOString(),
			deadlineAt: o.deadlineAt?.toISOString() || null
		})),
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		},
		search,
		status,
		canEdit
	};
};
