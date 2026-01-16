import { json, type RequestHandler } from '@sveltejs/kit';
import { verifyToken } from '$lib/server/auth';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('auth_token');

	if (!token) {
		return json({ user: null });
	}

	const payload = verifyToken(token);

	if (!payload) {
		cookies.delete('auth_token', { path: '/' });
		return json({ user: null });
	}

	// Get fresh user data
	const employee = await db.employee.findUnique({
		where: { id: payload.employeeId },
		select: {
			id: true,
			personalNumber: true,
			fullName: true,
			roles: true,
			isActive: true
		}
	});

	if (!employee || !employee.isActive) {
		cookies.delete('auth_token', { path: '/' });
		return json({ user: null });
	}

	return json({
		user: {
			id: employee.id,
			personalNumber: employee.personalNumber,
			fullName: employee.fullName,
			roles: employee.roles
		}
	});
};
