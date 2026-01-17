import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check role permissions - only admin, sales, technician can create tickets
	const allowedRoles = ['admin', 'sales', 'technician'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		throw redirect(302, '/dashboard/service');
	}

	// Get customerId and orderId from URL params (for pre-selection)
	const preselectedCustomerId = url.searchParams.get('customerId') || null;
	const preselectedOrderId = url.searchParams.get('orderId') || null;

	// Get customers for dropdown
	const customers = await db.customer.findMany({
		select: {
			id: true,
			type: true,
			companyName: true,
			contacts: {
				orderBy: { isPrimary: 'desc' },
				select: {
					id: true,
					fullName: true,
					phone: true,
					isPrimary: true
				}
			},
			orders: {
				select: {
					id: true,
					orderNumber: true,
					location: {
						select: {
							city: true
						}
					}
				},
				orderBy: { createdAt: 'desc' }
			}
		},
		orderBy: { createdAt: 'desc' }
	});

	// Get technicians for assignment (only technicians, not admins)
	const technicians = await db.employee.findMany({
		where: {
			isActive: true,
			roles: {
				has: 'technician'
			}
		},
		select: {
			id: true,
			fullName: true,
			personalNumber: true
		},
		orderBy: { fullName: 'asc' }
	});

	return {
		customers,
		technicians,
		preselectedCustomerId,
		preselectedOrderId
	};
};
