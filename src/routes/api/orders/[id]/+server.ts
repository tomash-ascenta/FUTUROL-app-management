import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

// GET - Detail zakázky
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const order = await db.order.findUnique({
			where: { id: params.id },
			include: {
				customer: true,
				location: true,
				product: true,
				measurement: {
					include: {
						employee: {
							select: {
								id: true,
								fullName: true
							}
						}
					}
				},
				serviceTickets: {
					orderBy: { createdAt: 'desc' },
					take: 5
				},
				statusHistory: {
					orderBy: { createdAt: 'desc' },
					include: {
						changedBy: {
							select: {
								id: true,
								fullName: true
							}
						}
					}
				}
			}
		});

		if (!order) {
			return json({ error: 'Zakázka nenalezena' }, { status: 404 });
		}

		return json({ order });
	} catch (error) {
		console.error('Error fetching order:', error);
		return json({ error: 'Chyba při načítání zakázky' }, { status: 500 });
	}
};

// PATCH - Aktualizace zakázky
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const allowedRoles = ['admin', 'manager', 'sales'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		return json({ error: 'Nedostatečná oprávnění' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { status, priority, estimatedValue, finalValue, deadlineAt, note, locationId, productId } = body;

		// Get current order for status history
		const currentOrder = await db.order.findUnique({
			where: { id: params.id }
		});

		if (!currentOrder) {
			return json({ error: 'Zakázka nenalezena' }, { status: 404 });
		}

		// Update order
		const order = await db.order.update({
			where: { id: params.id },
			data: {
				...(status && { status }),
				...(priority && { priority }),
				...(estimatedValue !== undefined && { estimatedValue }),
				...(finalValue !== undefined && { finalValue }),
				...(deadlineAt !== undefined && { deadlineAt: deadlineAt ? new Date(deadlineAt) : null }),
				...(locationId !== undefined && { locationId: locationId || null }),
				...(productId !== undefined && { productId: productId || null })
			},
			include: {
				customer: true,
				location: true,
				product: true
			}
		});

		// Create status history if status changed
		if (status && status !== currentOrder.status) {
			await db.orderStatusHistory.create({
				data: {
					orderId: params.id!,
					fromStatus: currentOrder.status,
					toStatus: status,
					changedById: locals.user.employeeId,
					note: note || undefined
				}
			});
		}

		return json({ order });
	} catch (error) {
		console.error('Error updating order:', error);
		return json({ error: 'Chyba při aktualizaci zakázky' }, { status: 500 });
	}
};

// DELETE - Smazání zakázky
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const allowedRoles = ['admin', 'manager'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		return json({ error: 'Nedostatečná oprávnění' }, { status: 403 });
	}

	try {
		// Check if order exists
		const order = await db.order.findUnique({
			where: { id: params.id },
			include: {
				measurement: true,
				serviceTickets: true
			}
		});

		if (!order) {
			return json({ error: 'Zakázka nenalezena' }, { status: 404 });
		}

		// Check for related data
		if (order.measurement) {
			return json({ error: 'Nelze smazat zakázku s existujícím zaměřením' }, { status: 400 });
		}

		if (order.serviceTickets.length > 0) {
			return json({ error: 'Nelze smazat zakázku se servisními tikety' }, { status: 400 });
		}

		// Delete status history first
		await db.orderStatusHistory.deleteMany({
			where: { orderId: params.id }
		});

		// Delete order
		await db.order.delete({
			where: { id: params.id }
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting order:', error);
		return json({ error: 'Chyba při mazání zakázky' }, { status: 500 });
	}
};
