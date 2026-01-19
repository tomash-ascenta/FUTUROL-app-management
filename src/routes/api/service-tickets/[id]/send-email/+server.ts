/**
 * API: POST /api/service-tickets/[id]/send-email - Odeslání emailu zákazníkovi
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { requireFeature } from '$lib/server/features';
import { sendServiceEmail, sendInternalEmail } from '$lib/server/email';
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

	requireFeature('service');

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

	// Načíst service ticket
	const ticket = await db.serviceTicket.findUnique({
		where: { id: params.id },
		include: {
			customer: true,
			order: true,
			assignedTo: { select: { fullName: true } }
		}
	});

	if (!ticket) {
		return json({ error: 'Servisní tiket nenalezen' }, { status: 404 });
	}

	const pdfFilename = `servis-${ticket.ticketNumber}.pdf`;

	// Odeslat zákazníkovi
	const result = await sendServiceEmail({
		to: recipientEmail,
		ticketNumber: ticket.ticketNumber,
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
		const orderNumber = ticket.order?.orderNumber || ticket.ticketNumber;
		const internalResult = await sendInternalEmail({
			to: internalRecipients,
			subject: `Servis dokončen - ${orderNumber}`,
			orderNumber,
			employeeName: locals.user.fullName,
			type: 'service',
			pdfBase64,
			pdfFilename,
		});

		if (internalResult.success) {
			updateData.internalEmailSentAt = new Date();
			updateData.internalEmailSentTo = internalRecipients;
		}
	}

	// Update service ticket
	await db.serviceTicket.update({
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
