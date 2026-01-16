import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    // Only admin, manager, and sales can view inquiries
    const allowedRoles = ['admin', 'manager', 'sales'];
    const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
    if (!hasPermission) {
        throw redirect(302, '/dashboard');
    }

    // Check if user can convert (only admin and sales)
    const canConvert = locals.user.roles.some((role: string) => ['admin', 'sales'].includes(role));

    const inquiries = await db.inquiry.findMany({
        include: {
            customer: {
                select: {
                    id: true,
                    fullName: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return { 
        inquiries,
        canConvert
    };
};
