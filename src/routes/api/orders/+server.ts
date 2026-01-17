import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { requireFeature } from '$lib/server/features';
import { z } from 'zod';

// Schema pro vytvoření zakázky
const createOrderSchema = z.object({
	customerId: z.string().uuid('Neplatné ID zákazníka'),
	locationId: z.string().uuid('Neplatné ID lokace').optional(),
	productId: z.string().uuid('Neplatné ID produktu').optional(),
	priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
	estimatedValue: z.number().positive().optional(),
	deadlineAt: z.string().datetime().optional()
});

// GET - Seznam zakázek
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Feature flag check - Zakázky jsou pouze pro Full verzi
	requireFeature('orders');

	try {
		const search = url.searchParams.get('search') || '';
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const status = url.searchParams.get('status');
		const sortBy = url.searchParams.get('sortBy') || 'createdAt';
		const sortOrder = url.searchParams.get('sortOrder') || 'desc';
		const hasMeasurement = url.searchParams.get('hasMeasurement'); // 'true', 'false', or null
		const needsMeasurement = url.searchParams.get('needsMeasurement') === 'true';

		const skip = (page - 1) * limit;

		// Build where clause
		const where: Record<string, unknown> = {};
		
		if (search) {
			where.OR = [
				{ orderNumber: { contains: search, mode: 'insensitive' } },
				{ customer: { fullName: { contains: search, mode: 'insensitive' } } },
				{ customer: { phone: { contains: search, mode: 'insensitive' } } }
			];
		}

		if (status) {
			where.status = status;
		}

		// Filter for orders that need measurement (for surveyor dropdown)
		if (needsMeasurement) {
			where.measurement = null;
			where.status = {
				in: ['measurement_scheduled', 'quote_approved', 'lead', 'contacted']
			};
		}

		if (hasMeasurement === 'true') {
			where.measurement = { isNot: null };
		} else if (hasMeasurement === 'false') {
			where.measurement = null;
		}

		// Get total count
		const total = await db.order.count({ where });

		// Get orders with relations
		const orders = await db.order.findMany({
			where,
			include: {
				customer: true,
				location: true,
				product: true,
				measurement: {
					select: {
						id: true,
						measuredAt: true,
						pergolaType: true
					}
				},
				_count: {
					select: {
						serviceTickets: true
					}
				}
			},
			orderBy: { [sortBy]: sortOrder },
			skip,
			take: limit
		});

		return json({
			orders,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
			}
		});
	} catch (error) {
		console.error('Error fetching orders:', error);
		return json({ error: 'Chyba při načítání zakázek' }, { status: 500 });
	}
};

// POST - Vytvoření nové zakázky
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Feature flag check - Zakázky jsou pouze pro Full verzi
	requireFeature('orders');

	// Check role permissions - only admin and sales can create orders
	const allowedRoles = ['admin', 'sales'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		return json({ error: 'Nedostatečná oprávnění' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const result = createOrderSchema.safeParse(body);

		if (!result.success) {
			return json(
				{ error: 'Neplatná data', details: result.error.flatten() },
				{ status: 400 }
			);
		}

		const data = result.data;

		// Generate order number
		const year = new Date().getFullYear();
		const lastOrder = await db.order.findFirst({
			where: {
				orderNumber: { startsWith: `FUT-${year}-` }
			},
			orderBy: { orderNumber: 'desc' }
		});

		let nextNumber = 1;
		if (lastOrder) {
			const parts = lastOrder.orderNumber.split('-');
			nextNumber = parseInt(parts[2]) + 1;
		}
		const orderNumber = `FUT-${year}-${nextNumber.toString().padStart(4, '0')}`;

		// Create order
		const order = await db.order.create({
			data: {
				orderNumber,
				customer: { connect: { id: data.customerId } },
				owner: { connect: { id: locals.user.employeeId } },
				...(data.locationId && { location: { connect: { id: data.locationId } } }),
				...(data.productId && { product: { connect: { id: data.productId } } }),
				priority: data.priority,
				deadlineAt: data.deadlineAt ? new Date(data.deadlineAt) : undefined,
				status: 'lead'
			},
			include: {
				customer: true,
				location: true,
				product: true
			}
		});

		// Create status history
		await db.orderStatusHistory.create({
			data: {
				orderId: order.id,
				toStatus: 'lead',
				changedById: locals.user.employeeId,
				note: 'Zakázka vytvořena'
			}
		});

		return json({ order }, { status: 201 });
	} catch (error) {
		console.error('Error creating order:', error);
		return json({ error: 'Chyba při vytváření zakázky' }, { status: 500 });
	}
};
