/**
 * API: GET /api/installations - Seznam montáží
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { requireFeature } from '$lib/server/features';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Nepřihlášen' }, { status: 401 });
	}

	// Feature flag check
	requireFeature('installation');

	const status = url.searchParams.get('status');
	const technicianId = url.searchParams.get('technicianId');
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '20');
	const skip = (page - 1) * limit;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const where: any = {};

	// Filtr dle statusu
	if (status) {
		where.status = status;
	}

	// Filtr dle technika
	if (technicianId) {
		where.technicianId = technicianId;
	}

	// Technik vidí pouze svoje (pokud není admin/manager)
	const userRoles = locals.user.roles;
	const isAdmin = userRoles.includes('admin');
	const isManager = userRoles.includes('manager');
	const isTechnician = userRoles.includes('technician');

	if (isTechnician && !isAdmin && !isManager) {
		where.technicianId = locals.user.employeeId;
	}

	try {
		const [installations, total] = await Promise.all([
			db.installation.findMany({
				where,
				include: {
					order: {
						include: {
							customer: {
								include: {
									contacts: { where: { isPrimary: true }, take: 1 }
								}
							},
							location: true,
							product: true,
						}
					},
					technician: {
						select: { id: true, fullName: true, personalNumber: true }
					}
				},
				orderBy: { scheduledAt: 'asc' },
				skip,
				take: limit,
			}),
			db.installation.count({ where })
		]);

		return json({
			installations,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
			}
		});
	} catch (err) {
		console.error('Error fetching installations:', err);
		return json({ error: 'Chyba při načítání montáží' }, { status: 500 });
	}
};
