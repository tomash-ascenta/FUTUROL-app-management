import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { redirect, fail, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	// Check admin access
	if (!locals.user?.roles.includes('admin')) {
		throw redirect(303, '/dashboard');
	}

	const user = await db.employee.findUnique({
		where: { id: params.id },
		select: {
			id: true,
			personalNumber: true,
			fullName: true,
			email: true,
			phone: true,
			roles: true,
			isActive: true,
			createdAt: true,
			updatedAt: true
		}
	});

	if (!user) {
		throw error(404, 'Uživatel nenalezen');
	}

	return {
		user: {
			...user,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString()
		},
		roles: [
			{ value: 'admin', label: 'Administrátor', description: 'Správa systému, uživatelů' },
			{ value: 'sales', label: 'Obchodník', description: 'Leady, zákazníci, zakázky, servis' },
			{ value: 'manager', label: 'Manažer', description: 'Vidí vše (read-only)' },
			{ value: 'production_manager', label: 'Vedoucí výroby', description: 'Zákazníci, zakázky, zaměření (read)' },
			{ value: 'technician', label: 'Technik', description: 'Zaměření, servis' },
		]
	};
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		// Check admin access
		if (!locals.user?.roles.includes('admin')) {
			return fail(403, { error: 'Nedostatečná oprávnění' });
		}

		const formData = await request.formData();
		const fullName = formData.get('fullName') as string;
		const email = formData.get('email') as string || null;
		const phone = formData.get('phone') as string || null;
		const roles = formData.getAll('roles') as string[];
		const isActive = formData.get('isActive') === 'on';

		// Validation
		if (!fullName || fullName.length < 2) {
			return fail(400, { error: 'Jméno je povinné' });
		}

		if (roles.length === 0) {
			return fail(400, { error: 'Vyberte alespoň jednu roli' });
		}

		// Get current user data for audit log
		const currentUser = await db.employee.findUnique({
			where: { id: params.id },
			select: { fullName: true, roles: true, isActive: true }
		});

		if (!currentUser) {
			return fail(404, { error: 'Uživatel nenalezen' });
		}

		// Update user
		try {
			await db.employee.update({
				where: { id: params.id },
				data: {
					fullName,
					email,
					phone,
					roles: roles as any,
					isActive
				}
			});

			// Log action
			await db.auditLog.create({
				data: {
					action: 'UPDATE_USER',
					entityType: 'employee',
					entityId: params.id,
					employeeId: locals.user.employeeId,
					oldValue: {
						fullName: currentUser.fullName,
						roles: currentUser.roles,
						isActive: currentUser.isActive
					},
					newValue: {
						fullName,
						roles,
						isActive
					}
				}
			});

			return { success: true };
		} catch (error) {
			console.error('Error updating user:', error);
			return fail(500, { error: 'Chyba při aktualizaci uživatele' });
		}
	},

	delete: async ({ locals, params }) => {
		// Check admin access
		if (!locals.user?.roles.includes('admin')) {
			return fail(403, { error: 'Nedostatečná oprávnění' });
		}

		// Prevent self-deletion
		if (locals.user.employeeId === params.id) {
			return fail(400, { error: 'Nemůžete smazat sami sebe' });
		}

		try {
			// Soft delete - just deactivate
			await db.employee.update({
				where: { id: params.id },
				data: { isActive: false }
			});

			// Log action
			await db.auditLog.create({
				data: {
					action: 'DEACTIVATE_USER',
					entityType: 'employee',
					entityId: params.id,
					employeeId: locals.user.employeeId
				}
			});

		} catch (error) {
			console.error('Error deleting user:', error);
			return fail(500, { error: 'Chyba při mazání uživatele' });
		}

		throw redirect(303, '/dashboard/admin/users');
	}
};
