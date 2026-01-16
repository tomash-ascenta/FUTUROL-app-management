import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const order = await db.order.findUnique({
		where: { id: params.id },
		include: {
			customer: true,
			location: true,
			product: true,
			measurement: {
				include: {
					employee: true
				}
			},
			statusHistory: {
				include: {
					changedBy: true
				},
				orderBy: { createdAt: 'desc' }
			},
			serviceTickets: {
				orderBy: { createdAt: 'desc' },
				take: 5
			}
		}
	});

	if (!order) {
		throw error(404, 'Zakázka nenalezena');
	}

	// Check if user can edit - production_manager může pouze prohlížet
	const canEdit = !locals.user.roles.includes('production_manager') && 
		locals.user.roles.some((role: string) => ['admin', 'sales', 'manager'].includes(role));

	// Check if user can create measurements - only technician
	const canCreateMeasurement = locals.user.roles.includes('technician');

	return {
		order: {
			...order,
			estimatedValue: order.estimatedValue ? Number(order.estimatedValue) : null,
			finalValue: order.finalValue ? Number(order.finalValue) : null,
			createdAt: order.createdAt.toISOString(),
			updatedAt: order.updatedAt.toISOString(),
			deadlineAt: order.deadlineAt?.toISOString() || null,
			measurement: order.measurement
				? {
						...order.measurement,
						width: order.measurement.width ? Number(order.measurement.width) : null,
						height: order.measurement.height ? Number(order.measurement.height) : null,
						depth: order.measurement.depth ? Number(order.measurement.depth) : null,
						measuredAt: order.measurement.measuredAt.toISOString(),
						createdAt: order.measurement.createdAt.toISOString(),
						updatedAt: order.measurement.updatedAt.toISOString()
					}
				: null,
			statusHistory: order.statusHistory.map((h) => ({
				...h,
				createdAt: h.createdAt.toISOString()
			})),
			serviceTickets: order.serviceTickets.map((s) => ({
				...s,
				createdAt: s.createdAt.toISOString(),
				updatedAt: s.updatedAt.toISOString(),
				scheduledAt: s.scheduledAt?.toISOString() || null,
				resolvedAt: s.resolvedAt?.toISOString() || null
			}))
		},
		canEdit,
		canCreateMeasurement
	};
};
