import { redirect, type Handle } from '@sveltejs/kit';
import { verifyToken, type SessionUser } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { canAccess, type Module } from '$lib/server/permissions';
import type { Role } from '@prisma/client';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/radce', '/api/auth/login', '/api/inquiries', '/api/leads'];

// Routes that start with these prefixes are public
const publicPrefixes = ['/radce/', '/api/radce/'];

// Static file extensions that should be public
const staticExtensions = ['.webp', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.css', '.js', '.woff', '.woff2', '.ttf', '.pdf'];

// Mapování URL segmentů na moduly
const routeModuleMap: Record<string, Module> = {
	'settings': 'settings',
	'admin': 'users',
	'inquiries': 'leads',
	'customers': 'customers',
	'orders': 'orders',
	'measurements': 'measurements',
	'service': 'service',
	'reports': 'reports',
};

function isPublicRoute(pathname: string): boolean {
	// Static files are always public
	if (staticExtensions.some(ext => pathname.endsWith(ext))) return true;
	if (publicRoutes.includes(pathname)) return true;
	return publicPrefixes.some(prefix => pathname.startsWith(prefix));
}

function getModuleFromPath(pathname: string): Module | null {
	// Extract the first segment after /dashboard/
	const match = pathname.match(/^\/dashboard\/([^\/]+)/);
	if (!match) return null;
	
	const segment = match[1];
	return routeModuleMap[segment] || null;
}

export const handle: Handle = async ({ event, resolve }) => {
	const { cookies, url } = event;
	const token = cookies.get('auth_token');

	// Initialize locals
	event.locals.user = null;

	if (token) {
		const payload = verifyToken(token);
		
		if (payload) {
			// Verify user still exists and is active
			const employee = await db.employee.findUnique({
				where: { id: payload.employeeId },
				select: { id: true, isActive: true, roles: true, personalNumber: true, fullName: true }
			});

			if (employee && employee.isActive) {
				event.locals.user = {
					employeeId: employee.id,
					personalNumber: employee.personalNumber,
					fullName: employee.fullName,
					roles: employee.roles,
					iat: payload.iat,
					exp: payload.exp
				};
			} else {
				// Invalid user, clear cookie
				cookies.delete('auth_token', { path: '/' });
			}
		} else {
			// Invalid token, clear cookie
			cookies.delete('auth_token', { path: '/' });
		}
	}

	// Protect non-public routes
	if (!isPublicRoute(url.pathname)) {
		if (!event.locals.user) {
			throw redirect(303, '/login');
		}
		
		// Check module-level permissions for dashboard routes
		const module = getModuleFromPath(url.pathname);
		if (module) {
			const userRoles = event.locals.user.roles as Role[];
			if (!canAccess(userRoles, module)) {
				// User doesn't have access to this module - redirect to dashboard
				throw redirect(303, '/dashboard');
			}
		}
	}

	// Redirect logged-in users away from login page
	if (url.pathname === '/login' && event.locals.user) {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};
