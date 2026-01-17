import type { LayoutServerLoad } from './$types';
import { getTierInfo } from '$lib/server/features';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ? {
			employeeId: locals.user.employeeId,
			personalNumber: locals.user.personalNumber,
			fullName: locals.user.fullName,
			roles: locals.user.roles
		} : null,
		license: getTierInfo()
	};
};
