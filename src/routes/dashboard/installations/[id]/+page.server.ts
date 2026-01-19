/**
 * Server load: Detail montáže
 */

import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect, error } from '@sveltejs/kit';
import { requireFeature, hasFeature } from '$lib/server/features';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Feature flag check
	requireFeature('installation');

	// Check role permissions
	const allowedRoles = ['admin', 'manager', 'production_manager', 'technician'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		throw redirect(302, '/dashboard');
	}

	const installation = await db.installation.findUnique({
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
					product: true,
					measurement: {
						select: {
							id: true,
							width: true,
							height: true,
							depth: true,
							pergolaType: true,
							details: true
						}
					}
				}
			},
			technician: {
				select: {
					id: true,
					fullName: true,
					personalNumber: true,
					phone: true
				}
			}
		}
	});

	if (!installation) {
		throw error(404, 'Montáž nenalezena');
	}

	// Check if technician can access this installation
	if (
		locals.user.roles.includes('technician') &&
		!locals.user.roles.includes('manager') &&
		!locals.user.roles.includes('admin') &&
		installation.technicianId !== locals.user.employeeId
	) {
		throw error(403, 'Nedostatečná oprávnění');
	}

	// production_manager může pouze prohlížet
	const canEdit = !locals.user.roles.includes('production_manager') && 
		locals.user.roles.some((role: string) => ['admin', 'technician', 'manager'].includes(role));

	// Get list of available technicians for reassignment
	const technicians = await db.employee.findMany({
		where: {
			isActive: true,
			canInstallation: true
		},
		select: {
			id: true,
			fullName: true,
			personalNumber: true
		},
		orderBy: { fullName: 'asc' }
	});

	return {
		installation: {
			...installation,
			scheduledAt: installation.scheduledAt?.toISOString() || null,
			completedAt: installation.completedAt?.toISOString() || null,
			createdAt: installation.createdAt.toISOString(),
			updatedAt: installation.updatedAt.toISOString(),
			emailSentAt: installation.emailSentAt?.toISOString() || null,
			order: installation.order ? {
				...installation.order,
				createdAt: installation.order.createdAt.toISOString(),
				updatedAt: installation.order.updatedAt.toISOString(),
				deadlineAt: installation.order.deadlineAt?.toISOString() || null,
				customer: installation.order.customer ? {
					...installation.order.customer,
					createdAt: installation.order.customer.createdAt.toISOString(),
					updatedAt: installation.order.customer.updatedAt.toISOString(),
					contacts: installation.order.customer.contacts.map((c) => ({
						...c,
						createdAt: c.createdAt.toISOString(),
						updatedAt: c.updatedAt.toISOString()
					}))
				} : null,
				location: installation.order.location ? {
					...installation.order.location,
					createdAt: installation.order.location.createdAt.toISOString()
				} : null,
				measurement: installation.order.measurement ? {
					...installation.order.measurement,
					width: installation.order.measurement.width ? Number(installation.order.measurement.width) : null,
					height: installation.order.measurement.height ? Number(installation.order.measurement.height) : null,
					depth: installation.order.measurement.depth ? Number(installation.order.measurement.depth) : null
				} : null
			} : null
		},
		technicians,
		canEdit,
		canSendEmail: hasFeature('email_installation') && 
			locals.user.roles.some((role: string) => ['admin', 'technician', 'manager'].includes(role))
	};
};
