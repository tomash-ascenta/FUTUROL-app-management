import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

// GET - Get location details
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const location = await db.location.findUnique({
		where: { id: params.id },
		include: { customer: true }
	});

	if (!location) {
		return json({ error: 'Lokace nenalezena' }, { status: 404 });
	}

	return json(location);
};

// PUT - Update location
export const PUT: RequestHandler = async ({ request, locals, params }) => {
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

		// Check if location exists
		const existingLocation = await db.location.findUnique({
			where: { id: params.id }
		});

		if (!existingLocation) {
			return json({ error: 'Lokace nenalezena' }, { status: 404 });
		}

		// Update the location
		const location = await db.location.update({
			where: { id: params.id },
			data: {
				street: street.trim(),
				city: city.trim(),
				zip: zip.trim(),
				country: country?.trim() || 'Česká republika',
				note: note?.trim() || null
			}
		});

		return json(location);
	} catch (error) {
		console.error('Error updating location:', error);
		return json({ error: 'Nepodařilo se upravit lokaci' }, { status: 500 });
	}
};

// DELETE - Delete location
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const allowedRoles = ['admin', 'sales'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		// Check if location exists
		const existingLocation = await db.location.findUnique({
			where: { id: params.id },
			include: { orders: true }
		});

		if (!existingLocation) {
			return json({ error: 'Lokace nenalezena' }, { status: 404 });
		}

		// Check if location is used by any orders
		if (existingLocation.orders.length > 0) {
			return json({ error: 'Nelze smazat lokaci, která je použita v zakázkách' }, { status: 400 });
		}

		await db.location.delete({
			where: { id: params.id }
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting location:', error);
		return json({ error: 'Nepodařilo se smazat lokaci' }, { status: 500 });
	}
};
