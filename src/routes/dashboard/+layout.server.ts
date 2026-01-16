import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ? {
			employeeId: locals.user.employeeId,
			personalNumber: locals.user.personalNumber,
			fullName: locals.user.fullName,
			roles: locals.user.roles
		} : null
	};
};
