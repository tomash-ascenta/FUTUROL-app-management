import { JWT_SECRET } from '$env/static/private';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { Role } from '@prisma/client';

// Bcrypt cost factor - 10 is good balance of security and speed
const BCRYPT_ROUNDS = 10;

export interface JWTPayload {
	employeeId: string;
	personalNumber: string;
	fullName: string;
	roles: Role[];
}

export interface SessionUser extends JWTPayload {
	iat: number;
	exp: number;
}

const TOKEN_EXPIRY = '8h';

export function createToken(payload: JWTPayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): SessionUser | null {
	try {
		return jwt.verify(token, JWT_SECRET) as SessionUser;
	} catch {
		return null;
	}
}

/**
 * Hash a PIN using bcrypt
 * Note: This is async because bcrypt hashing is CPU-intensive
 */
export async function hashPin(pin: string): Promise<string> {
	return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

/**
 * Verify a PIN against its bcrypt hash
 * Note: This is async because bcrypt comparison is CPU-intensive
 */
export async function verifyPin(pin: string, hashedPin: string): Promise<boolean> {
	return bcrypt.compare(pin, hashedPin);
}
