/**
 * Service Categories - Konfigurace kategorií a typů servisu
 */

export interface ServiceOption {
	id: string;
	label: string;
	color?: string;
}

export const SERVICE_CATEGORIES: ServiceOption[] = [
	{ id: 'motor', label: 'Motor / pohon' },
	{ id: 'construction', label: 'Konstrukce' },
	{ id: 'electrical', label: 'Elektroinstalace' },
	{ id: 'textile', label: 'Textilie / screen' },
	{ id: 'roof', label: 'Střecha / lamely' },
	{ id: 'remote', label: 'Ovládání / dálkový ovladač' },
	{ id: 'water', label: 'Odvodnění / zatékání' },
	{ id: 'other', label: 'Jiné' },
];

export const SERVICE_TYPES: ServiceOption[] = [
	{ id: 'warranty', label: 'Záruční oprava' },
	{ id: 'paid', label: 'Placený servis' },
	{ id: 'maintenance', label: 'Pravidelná údržba' },
	{ id: 'complaint', label: 'Reklamace' },
];

export const SERVICE_PRIORITIES: ServiceOption[] = [
	{ id: 'low', label: 'Nízká', color: 'bg-slate-100 text-slate-800' },
	{ id: 'normal', label: 'Normální', color: 'bg-blue-100 text-blue-800' },
	{ id: 'high', label: 'Vysoká', color: 'bg-orange-100 text-orange-800' },
	{ id: 'urgent', label: 'Urgentní', color: 'bg-red-100 text-red-800' },
];

export const SERVICE_STATUSES: ServiceOption[] = [
	{ id: 'new_ticket', label: 'Nový', color: 'bg-slate-100 text-slate-800' },
	{ id: 'assigned', label: 'Přiřazeno', color: 'bg-blue-100 text-blue-800' },
	{ id: 'scheduled', label: 'Naplánováno', color: 'bg-purple-100 text-purple-800' },
	{ id: 'in_progress', label: 'V řešení', color: 'bg-yellow-100 text-yellow-800' },
	{ id: 'resolved', label: 'Vyřešeno', color: 'bg-green-100 text-green-800' },
	{ id: 'closed', label: 'Uzavřeno', color: 'bg-slate-200 text-slate-600' },
];

export const SERVICE_SOURCES: ServiceOption[] = [
	{ id: 'internal', label: 'Interní' },
	{ id: 'customer', label: 'Od zákazníka' },
];

/**
 * Získá label podle ID
 */
export function getCategoryLabel(id: string | null | undefined): string {
	return SERVICE_CATEGORIES.find(c => c.id === id)?.label || id || '-';
}

export function getTypeLabel(id: string | null | undefined): string {
	return SERVICE_TYPES.find(t => t.id === id)?.label || id || '-';
}

export function getPriorityLabel(id: string | null | undefined): string {
	return SERVICE_PRIORITIES.find(p => p.id === id)?.label || id || '-';
}

export function getStatusLabel(id: string | null | undefined): string {
	return SERVICE_STATUSES.find(s => s.id === id)?.label || id || '-';
}

export function getPriorityColor(id: string | null | undefined): string {
	return SERVICE_PRIORITIES.find(p => p.id === id)?.color || 'bg-slate-100 text-slate-800';
}

export function getStatusColor(id: string | null | undefined): string {
	return SERVICE_STATUSES.find(s => s.id === id)?.color || 'bg-slate-100 text-slate-800';
}
