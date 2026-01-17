import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    // Pipeline zakázek - počty a hodnoty podle statusu
    // Lead → Zákazník → Nabídka → Zaměření → Smlouva → Výroba → Montáž → Předání
    const pipelineStages = [
        { status: 'lead', label: 'Lead', color: 'slate' },
        { status: 'customer', label: 'Zákazník', color: 'blue' },
        { status: 'quote_sent', label: 'Nabídka', color: 'amber' },
        { status: 'measurement', label: 'Zaměření', color: 'purple' },
        { status: 'contract', label: 'Smlouva', color: 'green' },
        { status: 'production', label: 'Výroba', color: 'orange' },
        { status: 'installation', label: 'Montáž', color: 'teal' },
        { status: 'handover', label: 'Předání', color: 'emerald' },
    ] as const;

    // Získat počty zakázek v každé fázi
    const orderCounts = await db.order.groupBy({
        by: ['status'],
        _count: { id: true },
        where: {
            status: {
                notIn: ['handover', 'cancelled']
            }
        }
    });

    // Získat hodnoty z cenových nabídek pro každou fázi
    const ordersWithQuotes = await db.order.findMany({
        where: {
            status: {
                notIn: ['handover', 'cancelled']
            }
        },
        select: {
            status: true,
            quotes: {
                where: { status: 'approved' },
                select: { amount: true },
                take: 1
            }
        }
    });

    // Spočítat hodnoty podle statusu
    const valuesByStatus: Record<string, number> = {};
    for (const order of ordersWithQuotes) {
        const value = order.quotes[0]?.amount ? Number(order.quotes[0].amount) : 0;
        valuesByStatus[order.status] = (valuesByStatus[order.status] || 0) + value;
    }

    const pipeline = pipelineStages.map(stage => ({
        ...stage,
        count: orderCounts.find(c => c.status === stage.status)?._count.id || 0,
        value: valuesByStatus[stage.status] || 0
    }));

    // Follow-upy - aktivity s followUpDate které nejsou splněné
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const followUps = await db.activity.findMany({
        where: {
            followUpDate: {
                lte: endOfWeek
            },
            followUpDone: false
        },
        include: {
            customer: {
                select: {
                    id: true,
                    fullName: true,
                    companyName: true,
                    type: true
                }
            },
            createdBy: {
                select: {
                    fullName: true
                }
            }
        },
        orderBy: {
            followUpDate: 'asc'
        },
        take: 10
    });

    // Statistiky
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const [
        conversionsThisMonth,
        pendingFollowUpsCount,
        openServicesCount,
        contractsCount
    ] = await Promise.all([
        // Konverze lead → zákazník tento měsíc
        db.lead.count({
            where: {
                convertedAt: {
                    gte: startOfMonth
                },
                status: 'converted'
            }
        }),
        // Čekající follow-upy (nesplňené, s datem do dneška včetně)
        db.activity.count({
            where: {
                followUpDate: {
                    lte: today
                },
                followUpDone: false
            }
        }),
        // Otevřené servisy
        db.serviceTicket.count({
            where: {
                status: { in: ['new_ticket', 'in_progress', 'scheduled', 'assigned'] }
            }
        }),
        // Podepsané smlouvy (zakázky ve fázi contract)
        db.order.count({
            where: {
                status: 'contract'
            }
        })
    ]);

    return {
        pipeline,
        followUps: followUps.map(f => ({
            id: f.id,
            content: f.content,
            type: f.type,
            followUpDate: f.followUpDate?.toISOString() || null,
            customerId: f.customer.id,
            customerName: f.customer.companyName || f.customer.fullName || 'Neznámý',
            customerType: f.customer.type,
            createdByName: f.createdBy.fullName
        })),
        stats: {
            conversionsThisMonth,
            pendingFollowUps: pendingFollowUpsCount,
            openServices: openServicesCount,
            contracts: contractsCount
        },
        today: today.toISOString()
    };
};
