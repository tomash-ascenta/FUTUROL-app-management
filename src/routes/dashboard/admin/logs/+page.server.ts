import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Check admin access
	if (!locals.user?.roles.includes('admin')) {
		throw redirect(303, '/dashboard');
	}

	const logs = await db.auditLog.findMany({
		take: 100,
		orderBy: { createdAt: 'desc' },
		include: {
			employee: {
				select: {
					fullName: true,
					personalNumber: true
				}
			}
		}
	});

	return {
		logs: logs.map(l => ({
			...l,
			createdAt: l.createdAt.toISOString()
		}))
	};
};
