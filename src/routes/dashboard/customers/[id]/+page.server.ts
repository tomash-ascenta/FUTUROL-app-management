import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const customer = await db.customer.findUnique({
		where: { id: params.id },
		include: {
			contacts: {
				orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }]
			},
			locations: {
				orderBy: { createdAt: 'desc' }
			},
			orders: {
				include: {
					product: true,
					measurement: true
				},
				orderBy: { createdAt: 'desc' },
				take: 10
			},
			serviceTickets: {
				orderBy: { createdAt: 'desc' },
				take: 5
			},
			activities: {
				include: {
					createdBy: {
						select: {
							id: true,
							fullName: true
						}
					},
					order: {
						select: {
							id: true,
							orderNumber: true
						}
					}
				},
				orderBy: { createdAt: 'desc' },
				take: 20
			}
		}
	});

	if (!customer) {
		throw error(404, 'Zákazník nenalezen');
	}

	return {
		customer: {
			...customer,
			createdAt: customer.createdAt.toISOString(),
			updatedAt: customer.updatedAt.toISOString(),
			contacts: customer.contacts.map((c) => ({
				...c,
				createdAt: c.createdAt.toISOString(),
				updatedAt: c.updatedAt.toISOString()
			})),
			locations: customer.locations.map((l) => ({
				...l,
				createdAt: l.createdAt.toISOString()
			})),
			orders: customer.orders.map((o) => ({
				...o,
				createdAt: o.createdAt.toISOString(),
				updatedAt: o.updatedAt.toISOString(),
				deadlineAt: o.deadlineAt?.toISOString() || null,
				measurement: o.measurement
					? {
							...o.measurement,
							measuredAt: o.measurement.measuredAt.toISOString(),
							createdAt: o.measurement.createdAt.toISOString()
						}
					: null
			})),
			serviceTickets: customer.serviceTickets.map((s) => ({
				...s,
				createdAt: s.createdAt.toISOString(),
				updatedAt: s.updatedAt.toISOString(),
				scheduledAt: s.scheduledAt?.toISOString() || null,
				resolvedAt: s.resolvedAt?.toISOString() || null
			})),
			activities: customer.activities.map((a) => ({
				...a,
				createdAt: a.createdAt.toISOString(),
				followUpDate: a.followUpDate?.toISOString() || null
			}))
		},
		// Pouze admin, manager a sales mohou upravovat zákazníky
		// technician a production_manager mají read-only přístup
		canEdit: locals.user.roles.some((role: string) => ['admin', 'manager', 'sales'].includes(role)),
		// Pouze admin může mazat zákazníky
		canDelete: locals.user.roles.includes('admin'),
		// Kdo může přidávat aktivity
		canAddActivity: locals.user.roles.some((role: string) => 
			['admin', 'sales', 'technician', 'production_manager'].includes(role)
		),
		currentUserId: locals.user.employeeId
	};
};
