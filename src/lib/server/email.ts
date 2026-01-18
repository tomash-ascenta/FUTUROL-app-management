/**
 * Email Service - Odesílání emailů přes Resend
 * 
 * @see FUTUROL_EMAIL_SPEC.md pro kompletní dokumentaci
 */

import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

// Lazy initialization - Resend instance se vytvoří až při prvním použití
let resendInstance: Resend | null = null;

function getResend(): Resend {
	if (!resendInstance) {
		const apiKey = env.RESEND_API_KEY;
		if (!apiKey) {
			throw new Error('RESEND_API_KEY is not configured');
		}
		resendInstance = new Resend(apiKey);
	}
	return resendInstance;
}

// ---------------------------------------------
// Typy
// ---------------------------------------------
export interface SendMeasurementEmailParams {
	to: string;
	orderNumber: string;
	employeeName: string;
	customMessage?: string;
	pdfBase64: string;
	pdfFilename: string;
}

export interface SendEmailResult {
	success: boolean;
	messageId?: string;
	error?: string;
}

// ---------------------------------------------
// Email šablony
// ---------------------------------------------
function getMeasurementEmailHtml(
	orderNumber: string,
	employeeName: string,
	customMessage?: string
): string {
	return `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Dobrý den,</p>
  <p>v příloze zasíláme protokol zaměření pro Vaši zakázku <strong>${orderNumber}</strong>.</p>
  ${customMessage ? `<p>${customMessage.replace(/\n/g, '<br>')}</p>` : ''}
  <p>S pozdravem,<br>
  <strong>${employeeName}</strong><br>
  Futurol.cz</p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">
  <p style="color: #666; font-size: 12px;">
    Tato zpráva byla odeslána automaticky ze systému Futurol.
  </p>
</body>
</html>
`.trim();
}

function getMeasurementEmailText(
	orderNumber: string,
	employeeName: string,
	customMessage?: string
): string {
	return `
Dobrý den,

v příloze zasíláme protokol zaměření pro Vaši zakázku ${orderNumber}.

${customMessage ? customMessage + '\n\n' : ''}S pozdravem,
${employeeName}
Futurol.cz

---
Tato zpráva byla odeslána automaticky ze systému Futurol.
`.trim();
}

// ---------------------------------------------
// Hlavní funkce pro odesílání
// ---------------------------------------------
export async function sendMeasurementEmail(
	params: SendMeasurementEmailParams
): Promise<SendEmailResult> {
	const { to, orderNumber, employeeName, customMessage, pdfBase64, pdfFilename } = params;

	const fromAddress = env.EMAIL_FROM || 'Futurol <noreply@futurol.ascentalab.cz>';

	try {
		const resend = getResend();

		const { data, error } = await resend.emails.send({
			from: fromAddress,
			to: [to],
			subject: `Protokol zaměření pergoly - ${orderNumber}`,
			html: getMeasurementEmailHtml(orderNumber, employeeName, customMessage),
			text: getMeasurementEmailText(orderNumber, employeeName, customMessage),
			attachments: [
				{
					filename: pdfFilename,
					content: pdfBase64,
				},
			],
		});

		if (error) {
			console.error('[Email] Resend error:', error);
			return { success: false, error: error.message };
		}

		console.log(`[Email] Sent successfully to ${to}, messageId: ${data?.id}`);
		return { success: true, messageId: data?.id };
	} catch (err) {
		console.error('[Email] Send failed:', err);
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Unknown error',
		};
	}
}
