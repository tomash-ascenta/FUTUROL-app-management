/**
 * API: POST /api/installations/[id]/send-email - Odeslání emailu zákazníkovi
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { requireFeature } from '$lib/server/features';
import { sendInstallationEmail, sendInternalEmail } from '$lib/server/email';
import { z } from 'zod';

const SendEmailSchema = z.object({
	recipientEmail: z.string().email('Neplatný formát emailu'),
	customMessage: z.string().max(1000).optional(),
	pdfBase64: z.string().min(1, 'PDF je povinné'),
	sendInternal: z.boolean().optional().default(false),
	internalRecipients: z.array(z.string().email()).optional(),
});

export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Nepřihlášen' }, { status: 401 });
	}

	requireFeature('installation');

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Neplatný JSON' }, { status: 400 });
	}

	const validation = SendEmailSchema.safeParse(body);
	if (!validation.success) {
		return json({ error: 'Validační chyba', details: validation.error.flatten() }, { status: 400 });
	}

	const { recipientEmail, customMessage, pdfBase64, sendInternal, internalRecipients } = validation.data;

	// Načíst instalaci s order a customer
	const installation = await db.installation.findUnique({
		where: { id: params.id },
		include: {
			order: { include: { customer: true } },
			technician: { select: { fullName: true } }
		}
	});

	if (!installation) {
		return json({ error: 'Montáž nenalezena' }, { status: 404 });
	}

	const orderNumber = installation.order?.orderNumber || `I-${installation.id.slice(0, 8)}`;
	const pdfFilename = `montaz-${orderNumber}.pdf`;

	// Odeslat zákazníkovi
	const result = await sendInstallationEmail({
		to: recipientEmail,
		orderNumber,
		employeeName: locals.user.fullName,
		customMessage,
		pdfBase64,
		pdfFilename,
	});

	if (!result.success) {
		return json({ error: 'Nepodařilo se odeslat email', details: result.error }, { status: 500 });
	}

	// Připravit update data
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const updateData: any = {
		emailSentAt: new Date(),
		emailSentTo: recipientEmail,
		emailSentById: locals.user.employeeId,
	};

	// Odeslat interně (volitelně)
	if (sendInternal && internalRecipients && internalRecipients.length > 0) {
		const internalResult = await sendInternalEmail({
			to: internalRecipients,
			subject: `Montáž dokončena - ${orderNumber}`,
			orderNumber,
			employeeName: locals.user.fullName,
			type: 'installation',
			pdfBase64,
			pdfFilename,
		});

		if (internalResult.success) {
			updateData.internalEmailSentAt = new Date();
			updateData.internalEmailSentTo = internalRecipients;
		}
	}

	// Update installation
	await db.installation.update({
		where: { id: params.id },
		data: updateData,
	});

	return json({
		success: true,
		messageId: result.messageId,
		sentTo: recipientEmail,
		sentAt: new Date().toISOString(),
	});
};
