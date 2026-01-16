import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

// GET - Seznam zaměření
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const search = url.searchParams.get('search') || '';
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const sortBy = url.searchParams.get('sortBy') || 'measuredAt';
		const sortOrder = url.searchParams.get('sortOrder') || 'desc';
		const employeeId = url.searchParams.get('employeeId');
		const pergolaType = url.searchParams.get('pergolaType');

		const skip = (page - 1) * limit;

		// Build where clause
		const where: Record<string, unknown> = {};
		
		if (search) {
			where.OR = [
				{ order: { orderNumber: { contains: search, mode: 'insensitive' } } },
				{ order: { customer: { fullName: { contains: search, mode: 'insensitive' } } } },
				{ pergolaType: { contains: search, mode: 'insensitive' } }
			];
		}

		if (employeeId) {
			where.employeeId = employeeId;
		}

		if (pergolaType) {
			where.pergolaType = pergolaType;
		}

		// Filter for surveyor - only show their measurements
		if (locals.user.roles.includes('technician') && !locals.user.roles.includes('manager') && !locals.user.roles.includes('admin')) {
			where.employeeId = locals.user.employeeId;
		}

		// Get total count
		const total = await db.measurement.count({ where });

		// Get measurements with relations
		const measurements = await db.measurement.findMany({
			where,
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
			},
			orderBy: { [sortBy]: sortOrder },
			skip,
			take: limit
		});

		return json({
			measurements,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
			}
		});
	} catch (error) {
		console.error('Error fetching measurements:', error);
		return json({ error: 'Chyba při načítání zaměření' }, { status: 500 });
	}
};
