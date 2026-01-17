import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

// GET - Detail zaměření
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
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
			return json({ error: 'Zaměření nenalezeno' }, { status: 404 });
		}

		// Check if surveyor can access this measurement
		if (
			locals.user.roles.includes('technician') && 
			!locals.user.roles.includes('manager') && 
			!locals.user.roles.includes('admin') &&
			measurement.employeeId !== locals.user.employeeId
		) {
			return json({ error: 'Nedostatečná oprávnění' }, { status: 403 });
		}

		return json({ measurement });
	} catch (error) {
		console.error('Error fetching measurement:', error);
		return json({ error: 'Chyba při načítání zaměření' }, { status: 500 });
	}
};

// PATCH - Aktualizace zaměření
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const allowedRoles = ['admin', 'manager', 'technician'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		return json({ error: 'Nedostatečná oprávnění' }, { status: 403 });
	}

	try {
		// Get current measurement
		const currentMeasurement = await db.measurement.findUnique({
			where: { id: params.id }
		});

		if (!currentMeasurement) {
			return json({ error: 'Zaměření nenalezeno' }, { status: 404 });
		}

		// Check if surveyor can edit this measurement
		if (
			locals.user.roles.includes('technician') && 
			!locals.user.roles.includes('manager') && 
			!locals.user.roles.includes('admin') &&
			currentMeasurement.employeeId !== locals.user.employeeId
		) {
			return json({ error: 'Můžete upravovat pouze vlastní zaměření' }, { status: 403 });
		}

		const body = await request.json();
		const { pergolaType, width, depth, height, clearanceHeight, details, photos } = body;

		// Update measurement
		const measurement = await db.measurement.update({
			where: { id: params.id },
			data: {
				...(pergolaType && { pergolaType }),
				...(width !== undefined && { width }),
				...(depth !== undefined && { depth }),
				...(height !== undefined && { height }),
				...(clearanceHeight !== undefined && { clearanceHeight }),
				...(details !== undefined && { details }),
				...(photos !== undefined && { photos })
			},
			include: {
				order: {
					include: {
						customer: true,
						location: true
					}
				},
				employee: {
					select: {
						id: true,
						fullName: true
					}
				}
			}
		});

		return json({ measurement });
	} catch (error) {
		console.error('Error updating measurement:', error);
		return json({ error: 'Chyba při aktualizaci zaměření' }, { status: 500 });
	}
};

// DELETE - Smazání zaměření
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
		const measurement = await db.measurement.findUnique({
			where: { id: params.id },
			include: { order: true }
		});

		if (!measurement) {
			return json({ error: 'Zaměření nenalezeno' }, { status: 404 });
		}

		// Delete measurement
		await db.measurement.delete({
			where: { id: params.id }
		});

		// Update order status back to quote_sent if it was in measurement phase
		if (measurement.order.status === 'measurement') {
			await db.order.update({
				where: { id: measurement.orderId },
				data: { status: 'quote_sent' }
			});
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting measurement:', error);
		return json({ error: 'Chyba při mazání zaměření' }, { status: 500 });
	}
};
