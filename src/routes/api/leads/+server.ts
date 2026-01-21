import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

// POST - Create new lead (from radce or PDF download)
export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { email, source, name, phone, channel, answers, recommendedProduct, customerNote } = body;

        if (!email) {
            return json({ error: 'Email je povinný' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return json({ error: 'Neplatný formát emailu' }, { status: 400 });
        }

        // Clean phone number if provided
        let cleanPhone = '';
        if (phone && phone.trim()) {
            cleanPhone = phone.replace(/\s/g, '');
        }

        // Create lead with full radce data
        const lead = await db.lead.create({
            data: {
                originalName: name || 'Neznámý',
                originalPhone: cleanPhone,
                originalEmail: email,
                source: source || 'advisor',
                channel: channel || null,
                answers: answers || {},
                scores: {},
                recommendedProduct: recommendedProduct || null,
                customerNote: customerNote || null,
            },
        });

        return json({ success: true, id: lead.id }, { status: 201 });
    } catch (error) {
        console.error('Lead creation error:', error);
        return json({ error: 'Nepodařilo se uložit' }, { status: 500 });
    }
};
