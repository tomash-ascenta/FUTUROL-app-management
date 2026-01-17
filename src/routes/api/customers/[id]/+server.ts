import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { z } from 'zod';

// Schema pro update zákazníka
const updateCustomerSchema = z.object({
	fullName: z.string().min(2, 'Jméno musí mít alespoň 2 znaky').optional(),
	email: z.string().email('Neplatný email').optional().or(z.literal('')).nullable(),
	phone: z.string().min(9, 'Telefon musí mít alespoň 9 znaků').optional(),
	companyName: z.string().optional().or(z.literal('')).nullable(),
	note: z.string().optional().or(z.literal('')).nullable()
});

// GET - Detail zákazníka
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const customer = await db.customer.findUnique({
			where: { id: params.id },
			include: {
				locations: true,
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
				originLead: true
			}
		});

		if (!customer) {
			return json({ error: 'Zákazník nenalezen' }, { status: 404 });
		}

		return json({ customer });
	} catch (error) {
		console.error('Error fetching customer:', error);
		return json({ error: 'Chyba při načítání zákazníka' }, { status: 500 });
	}
};

// PUT - Aktualizace zákazníka
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check role permissions - only admin and sales can update customers
	const allowedRoles = ['admin', 'sales'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		return json({ error: 'Nedostatečná oprávnění' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const result = updateCustomerSchema.safeParse(body);

		if (!result.success) {
			return json(
				{ error: 'Neplatná data', details: result.error.flatten() },
				{ status: 400 }
			);
		}

		// Check if customer exists
		const existing = await db.customer.findUnique({
			where: { id: params.id }
		});

		if (!existing) {
			return json({ error: 'Zákazník nenalezen' }, { status: 404 });
		}

		// Update customer
		const customer = await db.customer.update({
			where: { id: params.id },
			data: {
				...result.data,
				email: result.data.email || null,
				companyName: result.data.companyName || null,
				note: result.data.note || null
			},
			include: {
				locations: true
			}
		});

		// Audit log
		await db.auditLog.create({
			data: {
				employeeId: locals.user.employeeId,
				action: 'UPDATE',
				entityType: 'Customer',
				entityId: customer.id,
				oldValue: existing,
				newValue: customer
			}
		});

		return json({ customer });
	} catch (error) {
		console.error('Error updating customer:', error);
		return json({ error: 'Chyba při aktualizaci zákazníka' }, { status: 500 });
	}
};

// DELETE - Smazání zákazníka (soft delete - deaktivace)
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Only admin can delete
	const hasPermission = locals.user.roles.includes('admin');
	if (!hasPermission) {
		return json({ error: 'Pouze admin může mazat zákazníky' }, { status: 403 });
	}

	try {
		// Check if customer exists
		const existing = await db.customer.findUnique({
			where: { id: params.id },
			include: {
				_count: {
					select: { orders: true }
				}
			}
		});

		if (!existing) {
			return json({ error: 'Zákazník nenalezen' }, { status: 404 });
		}

		// Prevent deletion if customer has orders
		if (existing._count.orders > 0) {
			return json(
				{ error: 'Nelze smazat zákazníka s existujícími zakázkami' },
				{ status: 400 }
			);
		}

		// Hard delete (since no orders)
		await db.customer.delete({
			where: { id: params.id }
		});

		// Audit log
		await db.auditLog.create({
			data: {
				employeeId: locals.user.employeeId,
				action: 'DELETE',
				entityType: 'Customer',
				entityId: params.id,
				oldValue: existing
			}
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting customer:', error);
		return json({ error: 'Chyba při mazání zákazníka' }, { status: 500 });
	}
};
