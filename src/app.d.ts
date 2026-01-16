// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Role } from '@prisma/client';

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {
			user: {
				employeeId: string;
				personalNumber: string;
				fullName: string;
				roles: Role[];
				iat: number;
				exp: number;
			} | null;
		}
		interface PageData {
			user?: {
				employeeId: string;
				personalNumber: string;
				fullName: string;
				roles: Role[];
			} | null;
		}
		interface PageState {}
		interface Platform {}
	}
}

export {};
