/**
 * API Endpoint: Odeslání protokolu zaměření emailem
 * 
 * POST /api/measurements/[id]/send-email
 * 
 * @see FUTUROL_EMAIL_SPEC.md pro kompletní dokumentaci
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { verifyToken } from '$lib/server/auth';
import { sendMeasurementEmail } from '$lib/server/email';
import { hasFeature } from '$lib/server/features';
import { z } from 'zod';

// ---------------------------------------------
// Validace
// ---------------------------------------------
const SendEmailSchema = z.object({
	recipientEmail: z.string().email('Neplatný formát emailu'),
	customMessage: z.string().max(1000, 'Zpráva může mít max 1000 znaků').optional(),
	pdfBase64: z.string().min(1, 'PDF je povinné'),
});

// ---------------------------------------------
// POST Handler
// ---------------------------------------------
export const POST: RequestHandler = async ({ params, request, cookies }) => {
	// 0. Feature flag check - pouze Full verze
	if (!hasFeature('email_measurement')) {
		return json(
			{ error: 'Odesílání protokolů emailem není dostupné ve vaší licenci. Pro aktivaci přejděte na verzi Full.' },
			{ status: 403 }
		);
	}

	// 1. Auth check
	const token = cookies.get('auth_token');
	if (!token) {
		return json({ error: 'Nepřihlášen' }, { status: 401 });
	}

	const user = verifyToken(token);
	if (!user) {
		return json({ error: 'Neplatný token' }, { status: 401 });
	}

	// 2. Role check (pouze technician, admin)
	const allowedRoles = ['admin', 'technician'];
	const hasPermission = user.roles.some((r) => allowedRoles.includes(r));
	if (!hasPermission) {
		return json(
			{ error: 'Nemáte oprávnění odesílat emaily. Vyžadována role: admin nebo technician.' },
			{ status: 403 }
		);
	}

	// 3. Validate measurement ID
	const measurementId = params.id;
	if (!measurementId) {
		return json({ error: 'Chybí ID zaměření' }, { status: 400 });
	}

	// 4. Parse & validate body
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Neplatný JSON' }, { status: 400 });
	}

	const validation = SendEmailSchema.safeParse(body);
	if (!validation.success) {
		return json(
			{
				error: 'Validační chyba',
				details: validation.error.flatten(),
			},
			{ status: 400 }
		);
	}

	const { recipientEmail, customMessage, pdfBase64 } = validation.data;

	// 5. Load measurement with order
	const measurement = await db.measurement.findUnique({
		where: { id: measurementId },
		include: {
			order: {
				include: {
					customer: true,
				},
			},
			employee: true,
		},
	});

	if (!measurement) {
		return json({ error: 'Zaměření nenalezeno' }, { status: 404 });
	}

	// 6. Prepare email data
	const orderNumber = measurement.order?.orderNumber || `M-${measurement.id.slice(0, 8)}`;
	const pdfFilename = `protokol-${orderNumber}.pdf`;

	// 7. Send email via Resend
	const result = await sendMeasurementEmail({
		to: recipientEmail,
		orderNumber,
		employeeName: user.fullName,
		customMessage,
		pdfBase64,
		pdfFilename,
	});

	if (!result.success) {
		console.error(`[API] Email send failed for measurement ${measurementId}:`, result.error);
		return json(
			{
				error: 'Nepodařilo se odeslat email',
				details: result.error,
			},
			{ status: 500 }
		);
	}

	// 8. Update measurement with email tracking
	try {
		await db.measurement.update({
			where: { id: measurementId },
			data: {
				emailSentAt: new Date(),
				emailSentTo: recipientEmail,
				emailSentById: user.employeeId,
			},
		});
	} catch (dbError) {
		// Email byl odeslán, ale tracking se neuložil - logujeme, ale nevracíme error
		console.error(`[API] Failed to update email tracking for measurement ${measurementId}:`, dbError);
	}

	// 9. Return success
	return json({
		success: true,
		messageId: result.messageId,
		sentTo: recipientEmail,
		sentAt: new Date().toISOString(),
	});
};
