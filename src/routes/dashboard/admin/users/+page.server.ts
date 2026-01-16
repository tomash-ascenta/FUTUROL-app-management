import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Check admin access
	if (!locals.user?.roles.includes('admin')) {
		throw redirect(303, '/dashboard');
	}

	const users = await db.employee.findMany({
		orderBy: { personalNumber: 'asc' },
		select: {
			id: true,
			personalNumber: true,
			fullName: true,
			email: true,
			phone: true,
			roles: true,
			isActive: true,
			createdAt: true
		}
	});

	return {
		users: users.map(u => ({
			...u,
			createdAt: u.createdAt.toISOString()
		}))
	};
};
