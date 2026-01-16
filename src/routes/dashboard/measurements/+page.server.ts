import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check role permissions - vedoucí výroby vidí zaměření (read-only)
	const allowedRoles = ['admin', 'manager', 'production_manager', 'technician', 'sales'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		throw redirect(302, '/dashboard');
	}

	const search = url.searchParams.get('search') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const skip = (page - 1) * limit;

	// Build where clause
	const where: Record<string, unknown> = {};

	if (search) {
		where.OR = [
			{ order: { orderNumber: { contains: search, mode: 'insensitive' } } },
			{ order: { customer: { fullName: { contains: search, mode: 'insensitive' } } } },
			{ pergolaType: { contains: search, mode: 'insensitive' } }
		];
	}

	// Filter for surveyor - only show their measurements
	if (
		locals.user.roles.includes('technician') &&
		!locals.user.roles.includes('manager') &&
		!locals.user.roles.includes('admin')
	) {
		where.employeeId = locals.user.employeeId;
	}

	// Get total count
	const total = await db.measurement.count({ where });

	// Get measurements
	const measurements = await db.measurement.findMany({
		where,
		include: {
			order: {
				include: {
					customer: true,
					location: true,
					product: true
				}
			},
			employee: {
				select: {
					id: true,
					fullName: true,
					personalNumber: true
				}
			}
		},
		orderBy: { measuredAt: 'desc' },
		skip,
		take: limit
	});

	// Only technician (zaměřovač) can create measurements
	// admin, production_manager, manager, sales can only VIEW measurements
	const canCreate = locals.user.roles.includes('technician');

	return {
		measurements: measurements.map(m => ({
			...m,
			order: m.order ? {
				...m.order,
				estimatedValue: m.order.estimatedValue ? Number(m.order.estimatedValue) : null
			} : null
		})),
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		},
		search,
		canCreate
	};
};
