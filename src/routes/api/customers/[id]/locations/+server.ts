import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

// GET - List all locations for a customer
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const locations = await db.location.findMany({
		where: { customerId: params.id },
		orderBy: { createdAt: 'desc' }
	});

	return json(locations);
};

// POST - Add a new location to a customer
export const POST: RequestHandler = async ({ request, locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const allowedRoles = ['admin', 'sales'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { street, city, zip, country, note } = body;

		// Validation
		if (!street || street.trim() === '') {
			return json({ error: 'Ulice je povinná' }, { status: 400 });
		}
		if (!city || city.trim() === '') {
			return json({ error: 'Město je povinné' }, { status: 400 });
		}
		if (!zip || zip.trim() === '') {
			return json({ error: 'PSČ je povinné' }, { status: 400 });
		}

		// Check if customer exists
		const customer = await db.customer.findUnique({
			where: { id: params.id }
		});

		if (!customer) {
			return json({ error: 'Zákazník nenalezen' }, { status: 404 });
		}

		// Create the location
		const location = await db.location.create({
			data: {
				street: street.trim(),
				city: city.trim(),
				zip: zip.trim(),
				country: country?.trim() || 'Česká republika',
				note: note?.trim() || null,
				customer: { connect: { id: params.id } }
			}
		});

		return json(location, { status: 201 });
	} catch (error) {
		console.error('Error creating location:', error);
		return json({ error: 'Nepodařilo se vytvořit lokaci' }, { status: 500 });
	}
};
