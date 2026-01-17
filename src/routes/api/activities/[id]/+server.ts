import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

// PATCH - Update activity (mainly for marking follow-up as done)
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Nepřihlášen' }, { status: 401 });
    }

    const { id } = params;

    try {
        const activity = await db.activity.findUnique({
            where: { id }
        });

        if (!activity) {
            return json({ error: 'Aktivita nenalezena' }, { status: 404 });
        }

        // Only creator or admin can edit
        const isAdmin = locals.user.roles.includes('admin');
        const isCreator = activity.createdById === locals.user.employeeId;
        
        if (!isAdmin && !isCreator) {
            return json({ error: 'Nemáte oprávnění upravit tuto aktivitu' }, { status: 403 });
        }

        const body = await request.json();
        const { content, followUpDate, followUpDone } = body;

        const updateData: Record<string, unknown> = {};
        
        if (content !== undefined) {
            updateData.content = content.trim();
        }
        if (followUpDate !== undefined) {
            updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;
        }
        if (followUpDone !== undefined) {
            updateData.followUpDone = followUpDone;
        }

        const updated = await db.activity.update({
            where: { id },
            data: updateData,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        fullName: true,
                    }
                }
            }
        });

        return json({
            ...updated,
            createdAt: updated.createdAt.toISOString(),
            followUpDate: updated.followUpDate?.toISOString() || null,
        });

    } catch (error) {
        console.error('Error updating activity:', error);
        return json({ error: 'Chyba při úpravě aktivity' }, { status: 500 });
    }
};

// DELETE - Delete activity
export const DELETE: RequestHandler = async ({ params, locals }) => {
    if (!locals.user) {
        return json({ error: 'Nepřihlášen' }, { status: 401 });
    }

    const { id } = params;

    try {
        const activity = await db.activity.findUnique({
            where: { id }
        });

        if (!activity) {
            return json({ error: 'Aktivita nenalezena' }, { status: 404 });
        }

        // Only creator or admin can delete
        const isAdmin = locals.user.roles.includes('admin');
        const isCreator = activity.createdById === locals.user.employeeId;
        
        if (!isAdmin && !isCreator) {
            return json({ error: 'Nemáte oprávnění smazat tuto aktivitu' }, { status: 403 });
        }

        await db.activity.delete({
            where: { id }
        });

        return json({ success: true });

    } catch (error) {
        console.error('Error deleting activity:', error);
        return json({ error: 'Chyba při mazání aktivity' }, { status: 500 });
    }
};
