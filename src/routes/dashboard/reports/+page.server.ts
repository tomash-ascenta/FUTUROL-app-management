import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { requireFeature } from '$lib/server/features';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Feature flag check - Reporty jsou pouze pro Full verzi
	requireFeature('reports');

	// Check role permissions - only manager and admin can access reports
	const allowedRoles = ['admin', 'manager'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		throw redirect(302, '/dashboard');
	}

	return {};
};
