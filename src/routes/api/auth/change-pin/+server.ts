import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hashPin, verifyPin } from '$lib/server/auth';
import { z } from 'zod';

const changePinSchema = z.object({
	currentPin: z.string().length(6).regex(/^\d+$/),
	newPin: z.string().length(6).regex(/^\d+$/)
});

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Nepřihlášen' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const result = changePinSchema.safeParse(body);

		if (!result.success) {
			return json({ error: 'Neplatný formát PIN' }, { status: 400 });
		}

		const { currentPin, newPin } = result.data;

		// Get current employee
		const employee = await db.employee.findUnique({
			where: { id: locals.user.employeeId }
		});

		if (!employee) {
			return json({ error: 'Uživatel nenalezen' }, { status: 404 });
		}

		// Verify current PIN (bcrypt is async)
		const pinValid = await verifyPin(currentPin, employee.pin);
		if (!pinValid) {
			return json({ error: 'Nesprávný aktuální PIN' }, { status: 401 });
		}

		// Update PIN (bcrypt is async)
		const hashedNewPin = await hashPin(newPin);
		await db.employee.update({
			where: { id: employee.id },
			data: { pin: hashedNewPin }
		});

		// Log the change
		await db.auditLog.create({
			data: {
				employeeId: employee.id,
				action: 'PIN_CHANGE',
				entityType: 'Employee',
				entityId: employee.id
			}
		});

		return json({ success: true });
	} catch (error) {
		console.error('Change PIN error:', error);
		return json({ error: 'Chyba při změně PIN' }, { status: 500 });
	}
};
