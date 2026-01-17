import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

// POST - Convert lead to customer
export const POST: RequestHandler = async ({ params, request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Nepřihlášen' }, { status: 401 });
    }

    // Check permission - only admin and sales can convert
    const canConvert = locals.user.roles.some((role: string) => ['admin', 'sales'].includes(role));
    if (!canConvert) {
        return json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }

    const { id } = params;

    try {
        // Get body with optional customer type specification
        let customerType: 'B2C' | 'B2B' = 'B2C';
        let companyName: string | null = null;
        let ico: string | null = null;
        let dic: string | null = null;

        try {
            const body = await request.json();
            if (body.type === 'B2B') {
                customerType = 'B2B';
                companyName = body.companyName || null;
                ico = body.ico || null;
                dic = body.dic || null;
            }
        } catch {
            // No body or invalid JSON - default to B2C
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

        // Create customer from lead data
        const customerData: {
            type: 'B2C' | 'B2B';
            fullName: string | null;
            phone: string | null;
            email: string | null;
            companyName: string | null;
            ico: string | null;
            dic: string | null;
            source: 'advisor' | 'manual';
            note: string | null;
            ownerId: string;
            originLeadId: string;
        } = {
            type: customerType,
            // B2C fields
            fullName: lead.originalName,
            phone: lead.originalPhone,
            email: lead.originalEmail,
            // B2B fields
            companyName: customerType === 'B2B' ? (companyName || lead.originalCompany) : null,
            ico: customerType === 'B2B' ? ico : null,
            dic: customerType === 'B2B' ? dic : null,
            // Metadata
            source: lead.source === 'advisor' ? 'advisor' : 'manual',
            note: lead.customerNote,
            ownerId: locals.user.employeeId,
            originLeadId: lead.id,
        };

        const customer = await db.customer.create({
            data: customerData
        });

        // Update lead status
        await db.lead.update({
            where: { id },
            data: {
                status: 'converted',
                convertedById: locals.user.employeeId,
                convertedAt: new Date(),
            }
        });

        return json({ 
            success: true, 
            customerId: customer.id,
            message: 'Zákazník úspěšně vytvořen'
        });

    } catch (error) {
        console.error('Lead conversion error:', error);
        return json({ error: 'Chyba při konverzi leadu' }, { status: 500 });
    }
};
