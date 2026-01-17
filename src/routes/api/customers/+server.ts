import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { z } from 'zod';

// Schema pro vytvoření zákazníka
const createCustomerSchema = z.object({
	fullName: z.string().min(2, 'Jméno musí mít alespoň 2 znaky'),
	email: z.string().email('Neplatný email').optional().or(z.literal('')),
	phone: z.string().min(9, 'Telefon musí mít alespoň 9 znaků'),
	companyName: z.string().optional().or(z.literal('')),
	note: z.string().optional().or(z.literal('')),
	// Lokace (volitelná)
	location: z.object({
		street: z.string().min(1, 'Ulice je povinná'),
		city: z.string().min(1, 'Město je povinné'),
		zip: z.string().min(5, 'PSČ musí mít alespoň 5 znaků'),
		country: z.string().default('CZ'),
		note: z.string().optional()
	}).optional()
});

// GET - Seznam zákazníků
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const search = url.searchParams.get('search') || '';
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const sortBy = url.searchParams.get('sortBy') || 'createdAt';
		const sortOrder = url.searchParams.get('sortOrder') || 'desc';

		const skip = (page - 1) * limit;

		// Build where clause
		const where = search
			? {
					OR: [
						{ fullName: { contains: search, mode: 'insensitive' as const } },
						{ email: { contains: search, mode: 'insensitive' as const } },
						{ phone: { contains: search, mode: 'insensitive' as const } },
						{ companyName: { contains: search, mode: 'insensitive' as const } }
					]
				}
			: {};

		// Get total count
		const total = await db.customer.count({ where });

		// Get customers with locations
		const customers = await db.customer.findMany({
			where,
			include: {
				locations: true,
				_count: {
					select: {
						orders: true,
						serviceTickets: true
					}
				}
			},
			orderBy: { [sortBy]: sortOrder },
			skip,
			take: limit
		});

		return json({
			customers,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
			}
		});
	} catch (error) {
		console.error('Error fetching customers:', error);
		return json({ error: 'Chyba při načítání zákazníků' }, { status: 500 });
	}
};

// POST - Vytvoření nového zákazníka
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check role permissions - only admin and sales can create customers
	const allowedRoles = ['admin', 'sales'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		return json({ error: 'Nedostatečná oprávnění' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const result = createCustomerSchema.safeParse(body);

		if (!result.success) {
			return json(
				{ error: 'Neplatná data', details: result.error.flatten() },
				{ status: 400 }
			);
		}

		const { location, email, companyName, note, ...customerData } = result.data;

		// Create customer with optional location
		const customer = await db.customer.create({
			data: {
				...customerData,
				email: email || null,
				companyName: companyName || null,
				note: note || null,
				source: 'manual',
				locations: location
					? {
							create: {
								street: location.street,
								city: location.city,
								zip: location.zip,
								country: location.country || 'CZ',
								note: location.note || null
							}
						}
					: undefined
			},
			include: {
				locations: true
			}
		});

		// Audit log
		await db.auditLog.create({
			data: {
				employeeId: locals.user.employeeId,
				action: 'CREATE',
				entityType: 'Customer',
				entityId: customer.id,
				newValue: customer
			}
		});

		return json({ customer }, { status: 201 });
	} catch (error) {
		console.error('Error creating customer:', error);
		return json({ error: 'Chyba při vytváření zákazníka' }, { status: 500 });
	}
};
