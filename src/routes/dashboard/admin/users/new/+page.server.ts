import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { redirect, fail } from '@sveltejs/kit';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;

export const load: PageServerLoad = async ({ locals }) => {
	// Check admin access
	if (!locals.user?.roles.includes('admin')) {
		throw redirect(303, '/dashboard');
	}

	return {
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
	default: async ({ request, locals }) => {
		// Check admin access
		if (!locals.user?.roles.includes('admin')) {
			return fail(403, { error: 'Nedostatečná oprávnění' });
		}

		const formData = await request.formData();
		const personalNumber = formData.get('personalNumber') as string;
		const fullName = formData.get('fullName') as string;
		const email = formData.get('email') as string || null;
		const phone = formData.get('phone') as string || null;
		const pin = formData.get('pin') as string;
		const roles = formData.getAll('roles') as string[];
		const isActive = formData.get('isActive') === 'on';

		// Validation
		if (!personalNumber || personalNumber.length !== 4 || !/^\d{4}$/.test(personalNumber)) {
			return fail(400, { error: 'Osobní číslo musí být 4 číslice' });
		}

		if (!fullName || fullName.length < 2) {
			return fail(400, { error: 'Jméno je povinné' });
		}

		if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
			return fail(400, { error: 'PIN musí být 6 číslic' });
		}

		if (roles.length === 0) {
			return fail(400, { error: 'Vyberte alespoň jednu roli' });
		}

		// Check if personal number already exists
		const existing = await db.employee.findUnique({
			where: { personalNumber }
		});

		if (existing) {
			return fail(400, { error: 'Osobní číslo již existuje' });
		}

		// Hash PIN
		const hashedPin = await bcrypt.hash(pin, BCRYPT_ROUNDS);

		// Create user
		try {
			await db.employee.create({
				data: {
					personalNumber,
					fullName,
					email,
					phone,
					pin: hashedPin,
					roles: roles as any,
					isActive
				}
			});

			// Log action
			await db.auditLog.create({
				data: {
					action: 'CREATE_USER',
					entityType: 'employee',
					entityId: personalNumber,
					employeeId: locals.user.employeeId,
					newValue: { fullName, roles }
				}
			});

		} catch (error) {
			console.error('Error creating user:', error);
			return fail(500, { error: 'Chyba při vytváření uživatele' });
		}

		throw redirect(303, '/dashboard/admin/users');
	}
};
