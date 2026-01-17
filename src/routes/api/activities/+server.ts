import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

// GET - List activities (with optional filters)
export const GET: RequestHandler = async ({ url, locals }) => {
    if (!locals.user) {
        return json({ error: 'Nepřihlášen' }, { status: 401 });
    }

    const customerId = url.searchParams.get('customerId');
    const orderId = url.searchParams.get('orderId');
    const followUpOnly = url.searchParams.get('followUp') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (customerId) {
        where.customerId = customerId;
    }
    if (orderId) {
        where.orderId = orderId;
    }
    if (followUpOnly) {
        where.followUpDate = { not: null };
        where.followUpDone = false;
    }

    try {
        const activities = await db.activity.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        fullName: true,
                    }
                },
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                    }
                }
            }
        });

        // Serialize dates
        const serialized = activities.map(a => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
            followUpDate: a.followUpDate?.toISOString() || null,
        }));

        return json(serialized);
    } catch (error) {
        console.error('Error fetching activities:', error);
        return json({ error: 'Chyba při načítání aktivit' }, { status: 500 });
    }
};

// POST - Create new activity
export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Nepřihlášen' }, { status: 401 });
    }

    // Check permission - all roles except manager can create activities
    const canCreate = locals.user.roles.some((role: string) => 
        ['admin', 'sales', 'technician', 'production_manager'].includes(role)
    );
    if (!canCreate) {
        return json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { customerId, orderId, type, content, followUpDate } = body;

        if (!customerId) {
            return json({ error: 'customerId je povinné' }, { status: 400 });
        }

        if (!content || content.trim() === '') {
            return json({ error: 'Obsah je povinný' }, { status: 400 });
        }

        // Validate type
        const validTypes = ['note', 'call', 'email', 'meeting', 'status_change', 'system'];
        const activityType = type || 'note';
        if (!validTypes.includes(activityType)) {
            return json({ error: 'Neplatný typ aktivity' }, { status: 400 });
        }

        // Verify customer exists
        const customer = await db.customer.findUnique({
            where: { id: customerId }
        });
        if (!customer) {
            return json({ error: 'Zákazník nenalezen' }, { status: 404 });
        }

        // If orderId provided, verify it exists and belongs to customer
        if (orderId) {
            const order = await db.order.findUnique({
                where: { id: orderId }
            });
            if (!order) {
                return json({ error: 'Zakázka nenalezena' }, { status: 404 });
            }
            if (order.customerId !== customerId) {
                return json({ error: 'Zakázka nepatří tomuto zákazníkovi' }, { status: 400 });
            }
        }

        const activity = await db.activity.create({
            data: {
                customerId,
                orderId: orderId || null,
                type: activityType,
                content: content.trim(),
                followUpDate: followUpDate ? new Date(followUpDate) : null,
                createdById: locals.user.employeeId,
            },
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
            ...activity,
            createdAt: activity.createdAt.toISOString(),
            followUpDate: activity.followUpDate?.toISOString() || null,
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating activity:', error);
        return json({ error: 'Chyba při vytváření aktivity' }, { status: 500 });
    }
};
