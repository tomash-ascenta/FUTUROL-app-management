import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

// POST - Create new lead (for PDF download etc.)
export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { email, source } = body;

        if (!email) {
            return json({ error: 'Email je povinný' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return json({ error: 'Neplatný formát emailu' }, { status: 400 });
        }

        // Create lead with minimal required data
        const lead = await db.lead.create({
            data: {
                email,
                answers: {},
                scores: {},
                recommendedProduct: source || 'pdf_guide',
                utmSource: source,
            },
        });

        return json({ success: true, id: lead.id }, { status: 201 });
    } catch (error) {
        console.error('Lead creation error:', error);
        return json({ error: 'Nepodařilo se uložit' }, { status: 500 });
    }
};
