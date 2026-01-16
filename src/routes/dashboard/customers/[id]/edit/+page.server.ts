import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const customer = await db.customer.findUnique({
		where: { id: params.id },
		include: {
			locations: true
		}
	});

	if (!customer) {
		throw error(404, 'Zákazník nenalezen');
	}

	return {
		customer: {
			...customer,
			createdAt: customer.createdAt.toISOString(),
			updatedAt: customer.updatedAt.toISOString(),
			locations: customer.locations.map((l) => ({
				...l,
				createdAt: l.createdAt.toISOString()
			}))
		}
	};
};
