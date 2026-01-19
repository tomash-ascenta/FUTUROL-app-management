/**
 * API: GET/PATCH /api/installations/[id] - Detail a úprava montáže
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { requireFeature } from '$lib/server/features';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// GET - Detail montáže
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Nepřihlášen' }, { status: 401 });
	}

	requireFeature('installation');

	try {
		const installation = await db.installation.findUnique({
			where: { id: params.id },
			include: {
				order: {
					include: {
						customer: {
							include: {
								contacts: { orderBy: { isPrimary: 'desc' } }
							}
						},
						location: true,
						product: true,
					}
				},
				technician: {
					select: { id: true, fullName: true, personalNumber: true, phone: true }
				},
				emailSentBy: {
					select: { id: true, fullName: true }
				}
			}
		});

		if (!installation) {
			return json({ error: 'Montáž nenalezena' }, { status: 404 });
		}

		// Technik může vidět pouze svoje montáže (pokud není admin/manager)
		const userRoles = locals.user.roles;
		const isAdmin = userRoles.includes('admin');
		const isManager = userRoles.includes('manager');
		const isTechnician = userRoles.includes('technician');

		if (isTechnician && !isAdmin && !isManager && installation.technicianId !== locals.user.employeeId) {
			return json({ error: 'Nemáte oprávnění k této montáži' }, { status: 403 });
		}

		return json({ installation });
	} catch (err) {
		console.error('Error fetching installation:', err);
		return json({ error: 'Chyba při načítání montáže' }, { status: 500 });
	}
};

// PATCH - Úprava montáže
const UpdateInstallationSchema = z.object({
	status: z.enum(['planned', 'completed']).optional(),
	scheduledAt: z.string().datetime().nullable().optional(),
	technicianId: z.string().uuid().optional(),
	checklist: z.record(z.boolean()).optional(),
	workNotes: z.string().max(5000).nullable().optional(),
	photos: z.array(z.string()).nullable().optional(),
	handoverNotes: z.string().max(2000).nullable().optional(),
	completedAt: z.string().datetime().nullable().optional(),
});

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Nepřihlášen' }, { status: 401 });
	}

	requireFeature('installation');

	const installation = await db.installation.findUnique({
		where: { id: params.id }
	});

	if (!installation) {
		return json({ error: 'Montáž nenalezena' }, { status: 404 });
	}

	// Technik může upravovat pouze svoje montáže
	const userRoles = locals.user.roles;
	const isAdmin = userRoles.includes('admin');
	const isManager = userRoles.includes('manager');
	const isTechnician = userRoles.includes('technician');

	if (isTechnician && !isAdmin && !isManager && installation.technicianId !== locals.user.employeeId) {
		return json({ error: 'Nemáte oprávnění k této montáži' }, { status: 403 });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Neplatný JSON' }, { status: 400 });
	}

	const validation = UpdateInstallationSchema.safeParse(body);
	if (!validation.success) {
		return json({ error: 'Validační chyba', details: validation.error.flatten() }, { status: 400 });
	}

	const data = validation.data;

	// Pokud se mění status na completed, nastavit completedAt
	let completedAt = data.completedAt ? new Date(data.completedAt) : undefined;
	if (data.status === 'completed' && !completedAt) {
		completedAt = new Date();
	}

	try {
		const updated = await db.installation.update({
			where: { id: params.id },
			data: {
				...(data.status && { status: data.status }),
				...(data.scheduledAt !== undefined && { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null }),
				...(data.technicianId && { technician: { connect: { id: data.technicianId } } }),
				...(data.checklist && { checklist: data.checklist }),
				...(data.workNotes !== undefined && { workNotes: data.workNotes }),
				...(data.photos !== undefined && { photos: data.photos === null ? Prisma.JsonNull : data.photos }),
				...(data.handoverNotes !== undefined && { handoverNotes: data.handoverNotes }),
				...(completedAt && { completedAt }),
			},
			include: {
				order: { include: { customer: true } },
				technician: { select: { id: true, fullName: true } }
			}
		});

		return json({ installation: updated });
	} catch (err) {
		console.error('Error updating installation:', err);
		return json({ error: 'Chyba při ukládání montáže' }, { status: 500 });
	}
};
