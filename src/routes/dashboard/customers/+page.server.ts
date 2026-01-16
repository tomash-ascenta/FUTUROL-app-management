import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check role permissions - všichni kromě admina musí mít povolenou roli
	const allowedRoles = ['admin', 'manager', 'sales', 'production_manager', 'technician'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		throw redirect(302, '/dashboard');
	}

	// Check if user can create/edit customers (only admin and sales)
	const canEdit = locals.user.roles.some((role: string) => ['admin', 'sales'].includes(role));

	const search = url.searchParams.get('search') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const skip = (page - 1) * limit;

	// Build where clause
	const where = search
		? {
				OR: [
					{ fullName: { contains: search, mode: 'insensitive' as const } },
					{ email: { contains: search, mode: 'insensitive' as const } },
					{ phone: { contains: search, mode: 'insensitive' as const } },
					{ company: { contains: search, mode: 'insensitive' as const } }
				]
			}
		: {};

	// Get total count
	const total = await db.customer.count({ where });

	// Get customers with locations and counts
	const customers = await db.customer.findMany({
		where,
		include: {
			locations: {
				take: 1,
				orderBy: { createdAt: 'desc' }
			},
			_count: {
				select: {
					orders: true,
					serviceTickets: true
				}
			}
		},
		orderBy: { createdAt: 'desc' },
		skip,
		take: limit
	});

	return {
		customers: customers.map((c) => ({
			...c,
			createdAt: c.createdAt.toISOString(),
			updatedAt: c.updatedAt.toISOString(),
			locations: c.locations.map((l) => ({
				...l,
				createdAt: l.createdAt.toISOString()
			}))
		})),
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		},
		search,
		canEdit,
		canDelete: locals.user.roles.includes('admin')
	};
};
