/**
 * In-memory rate limiter for login attempts
 * Protects against brute-force attacks
 */

interface AttemptRecord {
	count: number;
	firstAttempt: number;
	blockedUntil: number | null;
}

// Configuration
const MAX_ATTEMPTS = 5;           // Max failed attempts before block
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes block

// In-memory store (resets on server restart)
// For production at scale, consider Redis
const attempts = new Map<string, AttemptRecord>();

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
	const now = Date.now();
	for (const [key, record] of attempts.entries()) {
		// Remove if window expired and not blocked
		if (now - record.firstAttempt > WINDOW_MS && !record.blockedUntil) {
			attempts.delete(key);
		}
		// Remove if block expired
		if (record.blockedUntil && now > record.blockedUntil) {
			attempts.delete(key);
		}
	}
}, 5 * 60 * 1000);

/**
 * Check if an identifier (IP or personal number) is rate limited
 * @returns null if allowed, or seconds until unblock if rate limited
 */
export function checkRateLimit(identifier: string): number | null {
	const record = attempts.get(identifier);
	
	if (!record) {
		return null; // No previous attempts
	}
	
	const now = Date.now();
	
	// Check if blocked
	if (record.blockedUntil) {
		if (now < record.blockedUntil) {
			return Math.ceil((record.blockedUntil - now) / 1000);
		}
		// Block expired, reset
		attempts.delete(identifier);
		return null;
	}
	
	// Check if window expired
	if (now - record.firstAttempt > WINDOW_MS) {
		attempts.delete(identifier);
		return null;
	}
	
	// Check if max attempts reached
	if (record.count >= MAX_ATTEMPTS) {
		record.blockedUntil = now + BLOCK_DURATION_MS;
		return Math.ceil(BLOCK_DURATION_MS / 1000);
	}
	
	return null;
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(identifier: string): void {
	const now = Date.now();
	const record = attempts.get(identifier);
	
	if (!record) {
		attempts.set(identifier, {
			count: 1,
			firstAttempt: now,
			blockedUntil: null
		});
		return;
	}
	
	// Check if window expired
	if (now - record.firstAttempt > WINDOW_MS) {
		attempts.set(identifier, {
			count: 1,
			firstAttempt: now,
			blockedUntil: null
		});
		return;
	}
	
	// Increment count
	record.count++;
	
	// Block if max reached
	if (record.count >= MAX_ATTEMPTS) {
		record.blockedUntil = now + BLOCK_DURATION_MS;
	}
}

/**
 * Clear rate limit for an identifier (e.g., after successful login)
 */
export function clearRateLimit(identifier: string): void {
	attempts.delete(identifier);
}

/**
 * Get remaining attempts for an identifier
 */
export function getRemainingAttempts(identifier: string): number {
	const record = attempts.get(identifier);
	if (!record) return MAX_ATTEMPTS;
	
	const now = Date.now();
	if (now - record.firstAttempt > WINDOW_MS) return MAX_ATTEMPTS;
	
	return Math.max(0, MAX_ATTEMPTS - record.count);
}
