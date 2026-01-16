import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

// POST - Vytvořit novou poptávku (veřejné, bez auth)
export const POST: RequestHandler = async ({ request }) => {
    try {
        const data = await request.json();

        // Validace povinných polí
        const required = ['fullName', 'email', 'purpose', 'size', 'roofType', 'budget', 'recommendedProduct'];
        for (const field of required) {
            if (!data[field]) {
                return json({ error: `Pole ${field} je povinné` }, { status: 400 });
            }
        }

        // Validace emailu
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return json({ error: 'Neplatný formát emailu' }, { status: 400 });
        }

        // Validace telefonu (české číslo) - pouze pokud je vyplněn
        let cleanPhone = null;
        if (data.phone && data.phone.trim()) {
            const phoneRegex = /^(\+420)?[0-9]{9}$/;
            cleanPhone = data.phone.replace(/\s/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                return json({ error: 'Neplatný formát telefonu' }, { status: 400 });
            }
        }

        // Vytvoření poptávky
        const inquiry = await db.inquiry.create({
            data: {
                fullName: data.fullName.trim(),
                email: data.email.trim().toLowerCase(),
                phone: cleanPhone || null,
                note: data.note?.trim() || null,
                purpose: data.purpose,
                size: data.size,
                roofType: data.roofType,
                extras: data.extras || [],
                budget: data.budget,
                recommendedProduct: data.recommendedProduct,
                status: 'new'
            }
        });

        return json({ 
            success: true, 
            id: inquiry.id,
            message: 'Poptávka byla úspěšně odeslána'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating inquiry:', error);
        return json({ error: 'Nepodařilo se odeslat poptávku' }, { status: 500 });
    }
};

// GET - Seznam poptávek (vyžaduje auth)
export const GET: RequestHandler = async ({ locals }) => {
    // Kontrola autentizace
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const inquiries = await db.inquiry.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return json(inquiries);
    } catch (error) {
        console.error('Error fetching inquiries:', error);
        return json({ error: 'Nepodařilo se načíst poptávky' }, { status: 500 });
    }
};
