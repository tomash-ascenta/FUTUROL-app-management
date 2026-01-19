/**
 * Server load: Seznam montáží
 * Filtrace dle oprávnění a role
 */

import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { requireFeature } from '$lib/server/features';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Feature flag check
	requireFeature('installation');

	// Allowed roles for viewing installations
	const allowedRoles = ['admin', 'manager', 'production_manager', 'technician'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		throw redirect(302, '/dashboard');
	}

	const search = url.searchParams.get('search') || '';
	const status = url.searchParams.get('status') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const skip = (page - 1) * limit;

	// Build where clause
	const where: Record<string, unknown> = {};

	if (search) {
		where.OR = [
			{ order: { orderNumber: { contains: search, mode: 'insensitive' } } },
			{ order: { customer: { companyName: { contains: search, mode: 'insensitive' } } } },
			{ order: { customer: { contacts: { some: { fullName: { contains: search, mode: 'insensitive' } } } } } },
			{ technician: { fullName: { contains: search, mode: 'insensitive' } } }
		];
	}

	if (status) {
		where.status = status;
	}

	// Filter for technician - only show their installations
	if (
		locals.user.roles.includes('technician') &&
		!locals.user.roles.includes('manager') &&
		!locals.user.roles.includes('admin')
	) {
		where.technicianId = locals.user.employeeId;
	}

	// Get total count
	const total = await db.installation.count({ where });

	// Get installations
	const installations = await db.installation.findMany({
		where,
		include: {
			order: {
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
				}
			},
			technician: {
				select: {
					id: true,
					fullName: true,
					personalNumber: true
				}
			}
		},
		orderBy: [
			{ status: 'asc' }, // planned first, then in_progress, then completed
			{ scheduledAt: 'asc' }
		],
		skip,
		take: limit
	});

	// Status counts for filter badges
	const statusCounts = await db.installation.groupBy({
		by: ['status'],
		_count: { status: true },
		where: locals.user.roles.includes('technician') && 
			!locals.user.roles.includes('manager') && 
			!locals.user.roles.includes('admin')
			? { technicianId: locals.user.employeeId }
			: {}
	});

	// Only technician with canInstallation can manage
	const canManage = locals.user.roles.includes('technician') || 
		locals.user.roles.includes('admin') || 
		locals.user.roles.includes('manager');

	return {
		installations,
		search,
		status,
		statusCounts: statusCounts.reduce((acc, item) => {
			acc[item.status] = item._count.status;
			return acc;
		}, {} as Record<string, number>),
		canManage,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		}
	};
};
