import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { z } from 'zod';

// Schema pro vytvoření zaměření
const createMeasurementSchema = z.object({
	// Core fields
	pergolaType: z.string().min(1, 'Typ pergoly je povinný'),
	width: z.number().int().positive('Šířka musí být kladné číslo'),
	depth: z.number().int().positive('Hloubka musí být kladné číslo'),
	height: z.number().int().positive('Výška musí být kladné číslo'),
	clearanceHeight: z.number().int().positive().nullable().optional(),
	
	// Flexible details
	details: z.object({
		// 2.6 Počet nosných profilů střechy
		roofPanels: z.number().int().min(2).max(9).nullable().optional(),
		// 2.7 Délka nohou
		legLength: z.number().int().nullable().optional(),
		// 2.8 Počet nohou
		legCount: z.number().int().min(1).max(6).nullable().optional(),
		// 2.9 Nerezové konzole pro kotvení
		bracketInfo: z.string().optional(),
		// 2.10 Barva konstrukce
		colorFrame: z.string().optional(),
		// 2.11 Barva střešního PVC + profilů
		colorRoof: z.string().optional(),
		
		// 3. Informace k montáži
		wallType: z.string().optional(),
		insulation: z.object({
			type: z.string().optional(),
			thickness: z.number().nullable().optional()
		}).optional(),
		anchoring: z.object({
			type: z.string().optional(),
			details: z.string().optional()
		}).optional(),
		concreteFootings: z.object({
			needed: z.boolean(),
			type: z.string().optional(),
			count: z.number().nullable().optional()
		}).optional(),
		drainOutput: z.string().optional(),
		electricalInlet: z.string().optional(),
		electricalPreparation: z.array(z.string()).optional(),
		
		// 4. Příslušenství a doplňková výbava
		accessories: z.object({
			remote: z.string().optional(),
			motor: z.string().optional(),
			windSensor: z.object({
				enabled: z.boolean(),
				position: z.string().optional()
			}).optional(),
			led: z.object({
				type: z.string().optional(),
				count: z.number().nullable().optional()
			}).optional(),
			trapezoidCover: z.string().optional(),
			anchoringProfile: z.string().optional(),
			reinforcementProfile: z.boolean().optional(),
			outlets: z.number().nullable().optional(),
			izymoReceiver: z.boolean().optional(),
			tahoma: z.string().optional()
		}).optional(),
		
		// 5. Screenové rolety
		screens: z.object({
			front: z.object({
				width: z.number().nullable().optional(),
				fabric: z.string().optional()
			}).optional(),
			frontLeft: z.object({
				width: z.number().nullable().optional(),
				fabric: z.string().optional()
			}).optional(),
			frontRight: z.object({
				width: z.number().nullable().optional(),
				fabric: z.string().optional()
			}).optional(),
			left: z.object({
				width: z.number().nullable().optional(),
				fabric: z.string().optional()
			}).optional(),
			right: z.object({
				width: z.number().nullable().optional(),
				fabric: z.string().optional()
			}).optional()
		}).optional(),
		
		// 6. Informace pro zákaznický servis
		installationNotes: z.object({
			parking: z.string().optional(),
			storageSpace: z.string().optional(),
			duration: z.string().optional(),
			terrain: z.string().optional(),
			access: z.string().optional()
		}).optional(),
		
		// Doplňující informace
		additionalNotes: z.string().optional()
	}).optional(),
	
	// Photos (URLs)
	photos: z.array(z.string()).optional(),
	
	// Metadata
	deviceInfo: z.object({
		os: z.string().optional(),
		browser: z.string().optional(),
		appVersion: z.string().optional()
	}).optional(),
	gpsLat: z.number().optional(),
	gpsLng: z.number().optional()
});

// POST - Vytvoření zaměření pro zakázku
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check role permissions
	const allowedRoles = ['admin', 'manager', 'technician'];
	const hasPermission = locals.user.roles.some((role: string) => allowedRoles.includes(role));
	if (!hasPermission) {
		return json({ error: 'Nedostatečná oprávnění' }, { status: 403 });
	}

	try {
		const orderId = params.orderId;

		// Check if order exists
		const order = await db.order.findUnique({
			where: { id: orderId },
			include: { measurement: true }
		});

		if (!order) {
			return json({ error: 'Zakázka nenalezena' }, { status: 404 });
		}

		// Check if measurement already exists
		if (order.measurement) {
			return json({ error: 'Zaměření pro tuto zakázku již existuje' }, { status: 400 });
		}

		const body = await request.json();
		console.log('Received measurement data:', JSON.stringify(body, null, 2));
		
		const result = createMeasurementSchema.safeParse(body);

		if (!result.success) {
			console.log('Validation errors:', JSON.stringify(result.error.flatten(), null, 2));
			return json(
				{ error: 'Neplatná data', details: result.error.flatten() },
				{ status: 400 }
			);
		}

		const data = result.data;

		// Create measurement
		const measurement = await db.measurement.create({
			data: {
				order: { connect: { id: orderId! } },
				employee: { connect: { id: locals.user.employeeId } },
				pergolaType: data.pergolaType,
				width: data.width,
				depth: data.depth,
				height: data.height,
				clearanceHeight: data.clearanceHeight,
				details: data.details || {},
				photos: data.photos || [],
				deviceInfo: data.deviceInfo,
				gpsLat: data.gpsLat,
				gpsLng: data.gpsLng
			},
			include: {
				order: {
					include: {
						customer: true,
						location: true
					}
				},
				employee: {
					select: {
						id: true,
						fullName: true
					}
				}
			}
		});

		// Update order status to measurement
		await db.order.update({
			where: { id: orderId },
			data: { status: 'measurement' }
		});

		// Create status history
		await db.orderStatusHistory.create({
			data: {
				order: { connect: { id: orderId! } },
				fromStatus: order.status,
				toStatus: 'measurement',
				changedBy: { connect: { id: locals.user.employeeId } },
				note: 'Zaměření dokončeno'
			}
		});

		return json({ measurement }, { status: 201 });
	} catch (error) {
		console.error('Error creating measurement:', error);
		return json({ error: 'Chyba při vytváření zaměření' }, { status: 500 });
	}
};
