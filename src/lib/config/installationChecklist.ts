/**
 * Installation Checklist - Konfigurace checklistu pro montáž
 * 
 * Definuje položky, které musí technik zkontrolovat při montáži
 */

export interface ChecklistItem {
	id: string;
	label: string;
}

export interface ChecklistSection {
	id: string;
	label: string;
	items: ChecklistItem[];
}

export const INSTALLATION_CHECKLIST: ChecklistSection[] = [
	{
		id: 'preparation',
		label: 'Příprava',
		items: [
			{ id: 'material_check', label: 'Kontrola kompletnosti materiálu' },
			{ id: 'site_ready', label: 'Pracoviště připraveno' },
		]
	},
	{
		id: 'construction',
		label: 'Konstrukce',
		items: [
			{ id: 'anchoring', label: 'Kotvení' },
			{ id: 'frame', label: 'Nosný rám' },
			{ id: 'roof_panels', label: 'Střešní lamely' },
			{ id: 'drainage', label: 'Odvodnění' },
		]
	},
	{
		id: 'electrical',
		label: 'Elektro',
		items: [
			{ id: 'wiring', label: 'Elektroinstalace' },
			{ id: 'motor', label: 'Motor a ovládání' },
			{ id: 'lighting', label: 'LED osvětlení' },
			{ id: 'sensors', label: 'Senzory (vítr/déšť)' },
		]
	},
	{
		id: 'accessories',
		label: 'Příslušenství',
		items: [
			{ id: 'screens', label: 'Screenové rolety' },
			{ id: 'remote', label: 'Dálkové ovládání spárováno' },
		]
	},
	{
		id: 'finishing',
		label: 'Dokončení',
		items: [
			{ id: 'function_test', label: 'Funkční test všech prvků' },
			{ id: 'cleaning', label: 'Úklid pracoviště' },
			{ id: 'customer_training', label: 'Zaškolení zákazníka' },
		]
	}
];

/**
 * Vrací prázdný checklist state (všechny položky false)
 */
export function getEmptyChecklistState(): Record<string, boolean> {
	const state: Record<string, boolean> = {};
	INSTALLATION_CHECKLIST.forEach(section => {
		section.items.forEach(item => {
			state[item.id] = false;
		});
	});
	return state;
}

/**
 * Spočítá progress checklistu (0-100)
 */
export function getChecklistProgress(state: Record<string, boolean> | null): number {
	if (!state) return 0;
	const items = Object.values(state);
	if (items.length === 0) return 0;
	const checked = items.filter(Boolean).length;
	return Math.round((checked / items.length) * 100);
}

/**
 * Vrací true pokud je checklist kompletní
 */
export function isChecklistComplete(state: Record<string, boolean> | null): boolean {
	if (!state) return false;
	return Object.values(state).every(Boolean);
}

/**
 * Vrací počet položek celkem
 */
export function getTotalChecklistItems(): number {
	return INSTALLATION_CHECKLIST.reduce((sum, section) => sum + section.items.length, 0);
}
