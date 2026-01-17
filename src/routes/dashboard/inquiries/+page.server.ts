import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    // Only admin, manager, and sales can view leads
    const allowedRoles = ['admin', 'manager', 'sales'];
    const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
    if (!hasPermission) {
        throw redirect(302, '/dashboard');
    }

    // Check if user can convert (only admin and sales)
    const canConvert = locals.user.roles.some((role: string) => ['admin', 'sales'].includes(role));

    const leads = await db.lead.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            customer: {
                select: {
                    id: true,
                    fullName: true,
                    companyName: true,
                    type: true
                }
            },
            convertedBy: {
                select: {
                    id: true,
                    fullName: true
                }
            }
        }
    });

    // Serialize dates
    const serializedLeads = leads.map(lead => ({
        ...lead,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
        convertedAt: lead.convertedAt?.toISOString() || null,
    }));

    return { 
        leads: serializedLeads,
        canConvert
    };
};
