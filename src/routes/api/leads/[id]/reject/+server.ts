import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

// POST - Mark lead as lost/rejected
export const POST: RequestHandler = async ({ params, request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Nepřihlášen' }, { status: 401 });
    }

    // Check permission - only admin and sales can reject
    const canReject = locals.user.roles.some((role: string) => ['admin', 'sales'].includes(role));
    if (!canReject) {
        return json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }

    const { id } = params;

    try {
        const body = await request.json();
        const { reason, note } = body;

        if (!reason) {
            return json({ error: 'Důvod zamítnutí je povinný' }, { status: 400 });
        }

        // Valid reasons (must match LostReason enum in schema.prisma)
        const validReasons = ['price', 'timing', 'competitor', 'no_response', 'not_relevant', 'other'];
        if (!validReasons.includes(reason)) {
            return json({ error: 'Neplatný důvod zamítnutí' }, { status: 400 });
        }

        // Find the lead
        const lead = await db.lead.findUnique({
            where: { id }
        });

        if (!lead) {
            return json({ error: 'Lead nenalezen' }, { status: 404 });
        }

        if (lead.status === 'converted') {
            return json({ error: 'Lead již byl konvertován' }, { status: 400 });
        }

        if (lead.status === 'lost') {
            return json({ error: 'Lead již byl zamítnut' }, { status: 400 });
        }

        // Update lead status to lost
        await db.lead.update({
            where: { id },
            data: {
                status: 'lost',
                lostReason: reason,
                lostNote: note || null,
            }
        });

        return json({ 
            success: true, 
            message: 'Lead byl zamítnut'
        });

    } catch (error) {
        console.error('Lead rejection error:', error);
        return json({ error: 'Chyba při zamítání leadu' }, { status: 500 });
    }
};
