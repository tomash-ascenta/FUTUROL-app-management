import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check role permissions - sales může také prohlížet zaměření
	const allowedRoles = ['admin', 'manager', 'technician', 'production_manager', 'sales'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		throw redirect(302, '/dashboard');
	}

	const measurement = await db.measurement.findUnique({
		where: { id: params.id },
		include: {
			order: {
				include: {
					customer: {
						include: {
							contacts: {
								orderBy: { isPrimary: 'desc' }
							}
						}
					},
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
			width: measurement.width ? Number(measurement.width) : null,
			height: measurement.height ? Number(measurement.height) : null,
			depth: measurement.depth ? Number(measurement.depth) : null,
			measuredAt: measurement.measuredAt.toISOString(),
			createdAt: measurement.createdAt.toISOString(),
			updatedAt: measurement.updatedAt.toISOString(),
			order: measurement.order ? {
				...measurement.order,
				estimatedValue: measurement.order.estimatedValue ? Number(measurement.order.estimatedValue) : null,
				finalValue: measurement.order.finalValue ? Number(measurement.order.finalValue) : null,
				createdAt: measurement.order.createdAt.toISOString(),
				updatedAt: measurement.order.updatedAt.toISOString(),
				deadlineAt: measurement.order.deadlineAt?.toISOString() || null,
				customer: measurement.order.customer ? {
					...measurement.order.customer,
					createdAt: measurement.order.customer.createdAt.toISOString(),
					updatedAt: measurement.order.customer.updatedAt.toISOString(),
					contacts: measurement.order.customer.contacts.map((c) => ({
						...c,
						createdAt: c.createdAt.toISOString(),
						updatedAt: c.updatedAt.toISOString()
					}))
				} : null,
				location: measurement.order.location ? {
					...measurement.order.location,
					createdAt: measurement.order.location.createdAt.toISOString()
				} : null
			} : null
		},
		canEdit
	};
};
