import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check role permissions - production_manager může prohlížet
	const allowedRoles = ['admin', 'manager', 'technician', 'production_manager'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		throw redirect(302, '/dashboard');
	}

	const measurement = await db.measurement.findUnique({
		where: { id: params.id },
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
		}
	});

	if (!measurement) {
		throw error(404, 'Zaměření nenalezeno');
	}

	// Check if surveyor can access this measurement
	if (
		locals.user.roles.includes('technician') &&
		!locals.user.roles.includes('manager') &&
		!locals.user.roles.includes('admin') &&
		measurement.employeeId !== locals.user.employeeId
	) {
		throw error(403, 'Nedostatečná oprávnění');
	}

	// Serialize Decimal values to numbers for JSON compatibility
	// production_manager může pouze prohlížet
	const canEdit = !locals.user.roles.includes('production_manager') && 
		locals.user.roles.some((role: string) => ['admin', 'technician'].includes(role));

	return {
		measurement: {
			...measurement,
			order: measurement.order ? {
				...measurement.order,
				estimatedValue: measurement.order.estimatedValue ? Number(measurement.order.estimatedValue) : null
			} : null
		},
		canEdit
	};
};
