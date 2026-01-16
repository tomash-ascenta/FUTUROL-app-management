import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { redirect, fail, error } from '@sveltejs/kit';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;

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
			fullName: true
		}
	});

	if (!user) {
		throw error(404, 'Uživatel nenalezen');
	}

	return { user };
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		// Check admin access
		if (!locals.user?.roles.includes('admin')) {
			return fail(403, { error: 'Nedostatečná oprávnění' });
		}

		const formData = await request.formData();
		const newPin = formData.get('newPin') as string;
		const confirmPin = formData.get('confirmPin') as string;

		// Validation
		if (!newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
			return fail(400, { error: 'PIN musí být 6 číslic' });
		}

		if (newPin !== confirmPin) {
			return fail(400, { error: 'PINy se neshodují' });
		}

		// Hash new PIN
		const hashedPin = await bcrypt.hash(newPin, BCRYPT_ROUNDS);

		try {
			await db.employee.update({
				where: { id: params.id },
				data: { pin: hashedPin }
			});

			// Log action
			await db.auditLog.create({
				data: {
					action: 'RESET_PIN',
					entityType: 'employee',
					entityId: params.id,
					employeeId: locals.user.employeeId,
					newValue: { note: 'PIN was reset by admin' }
				}
			});

		} catch (error) {
			console.error('Error resetting PIN:', error);
			return fail(500, { error: 'Chyba při resetování PINu' });
		}

		throw redirect(303, `/dashboard/admin/users/${params.id}?pinReset=true`);
	}
};
