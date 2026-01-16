import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { createToken, verifyPin } from '$lib/server/auth';
import { checkRateLimit, recordFailedAttempt, clearRateLimit, getRemainingAttempts } from '$lib/server/rateLimit';
import { z } from 'zod';

const loginSchema = z.object({
	personalNumber: z.string().length(4).regex(/^\d+$/),
	pin: z.string().length(6).regex(/^\d+$/)
});

// Helper to get client IP
function getClientIP(request: Request): string {
	return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
		|| request.headers.get('x-real-ip') 
		|| 'unknown';
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const clientIP = getClientIP(request);
		const body = await request.json();
		const result = loginSchema.safeParse(body);

		if (!result.success) {
			return json(
				{ error: 'Neplatný formát údajů', details: result.error.flatten() },
				{ status: 400 }
			);
		}

		const { personalNumber, pin } = result.data;

		// Rate limit check - by IP and personal number
		const ipBlocked = checkRateLimit(`ip:${clientIP}`);
		const userBlocked = checkRateLimit(`user:${personalNumber}`);
		
		if (ipBlocked) {
			return json({ 
				error: `Příliš mnoho pokusů. Zkuste to za ${Math.ceil(ipBlocked / 60)} minut.` 
			}, { status: 429 });
		}
		
		if (userBlocked) {
			return json({ 
				error: `Příliš mnoho pokusů. Zkuste to za ${Math.ceil(userBlocked / 60)} minut.` 
			}, { status: 429 });
		}

		// Find employee
		const employee = await db.employee.findUnique({
			where: { personalNumber }
		});

		if (!employee) {
			// Record failed attempt
			recordFailedAttempt(`ip:${clientIP}`);
			recordFailedAttempt(`user:${personalNumber}`);
			const remaining = getRemainingAttempts(`user:${personalNumber}`);
			return json({ 
				error: 'Neplatné osobní číslo nebo PIN',
				remainingAttempts: remaining
			}, { status: 401 });
		}

		if (!employee.isActive) {
			return json({ error: 'Účet je deaktivován' }, { status: 401 });
		}

		// Verify PIN (bcrypt is async)
		const pinValid = await verifyPin(pin, employee.pin);
		if (!pinValid) {
			// Record failed attempt
			recordFailedAttempt(`ip:${clientIP}`);
			recordFailedAttempt(`user:${personalNumber}`);
			const remaining = getRemainingAttempts(`user:${personalNumber}`);
			return json({ 
				error: 'Neplatné osobní číslo nebo PIN',
				remainingAttempts: remaining
			}, { status: 401 });
		}
		
		// Successful login - clear rate limits
		clearRateLimit(`ip:${clientIP}`);
		clearRateLimit(`user:${personalNumber}`);

		// Create JWT token
		const token = createToken({
			employeeId: employee.id,
			personalNumber: employee.personalNumber,
			fullName: employee.fullName,
			roles: employee.roles
		});

		// Set httpOnly cookie
		cookies.set('auth_token', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 8 // 8 hours
		});

		// Log login
		await db.auditLog.create({
			data: {
				employeeId: employee.id,
				action: 'LOGIN',
				entityType: 'Employee',
				entityId: employee.id
			}
		});

		return json({
			success: true,
			user: {
				id: employee.id,
				personalNumber: employee.personalNumber,
				fullName: employee.fullName,
				roles: employee.roles
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		return json({ error: 'Chyba při přihlášení' }, { status: 500 });
	}
};
