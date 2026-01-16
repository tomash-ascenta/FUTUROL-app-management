// Utility functions for the app

/**
 * Conditional class name builder (similar to clsx/classnames)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
	return classes.filter(Boolean).join(' ');
}

// =============================================================================
// DATE FORMATTING
// =============================================================================

export function formatDate(date: Date | string): string {
	return new Date(date).toLocaleDateString('cs-CZ');
}

export function formatDateTime(date: Date | string): string {
	return new Date(date).toLocaleString('cs-CZ');
}

export function formatShortDate(date: Date | string): string {
	return new Date(date).toLocaleDateString('cs-CZ', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

export function formatLongDate(date: Date | string): string {
	return new Date(date).toLocaleDateString('cs-CZ', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

export function getRelativeTime(date: Date | string): string {
	const now = new Date();
	const then = new Date(date);
	const diffMs = now.getTime() - then.getTime();
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffHours / 24);

	if (diffHours < 1) return 'Právě teď';
	if (diffHours < 24) return `Před ${diffHours}h`;
	if (diffDays < 7) return `Před ${diffDays}d`;
	return formatShortDate(date);
}

// =============================================================================
// CURRENCY FORMATTING
// =============================================================================

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('cs-CZ', {
		style: 'currency',
		currency: 'CZK',
		minimumFractionDigits: 0
	}).format(amount);
}

// =============================================================================
// ID GENERATORS
// =============================================================================

export function generateOrderNumber(): string {
	const year = new Date().getFullYear();
	const random = Math.floor(Math.random() * 9999)
		.toString()
		.padStart(4, '0');
	return `FUT-${year}-${random}`;
}

export function generateTicketNumber(): string {
	const year = new Date().getFullYear();
	const random = Math.floor(Math.random() * 9999)
		.toString()
		.padStart(4, '0');
	return `SRV-${year}-${random}`;
}

// =============================================================================
// ROLE LABELS (centralized)
// =============================================================================

const ROLE_LABELS: Record<string, string> = {
	admin: 'Admin',
	director: 'Ředitel',
	sales: 'Obchodník',
	production_manager: 'Vedoucí výroby',
	surveyor: 'Zaměřovač',
	technician: 'Technik'
};

export function getRoleLabel(role: string): string {
	return ROLE_LABELS[role] || role;
}

// =============================================================================
// SOURCE LABELS (for customers, leads)
// =============================================================================

const SOURCE_LABELS: Record<string, string> = {
	manual: 'Ruční zadání',
	advisor: 'Rádce',
	import: 'Import',
	web: 'Web'
};

export function getSourceLabel(source: string): string {
	return SOURCE_LABELS[source] || source;
}

// =============================================================================
// STATUS HELPERS
// =============================================================================

const ORDER_STATUS_LABELS: Record<string, string> = {
	lead: 'Lead',
	quoted: 'Nabídka',
	confirmed: 'Potvrzeno',
	measured: 'Zaměřeno',
	in_production: 'Ve výrobě',
	ready: 'Připraveno',
	installed: 'Instalováno',
	completed: 'Dokončeno',
	cancelled: 'Zrušeno'
};

export function getOrderStatusLabel(status: string): string {
	return ORDER_STATUS_LABELS[status] || status;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
	warranty: 'Záruční',
	paid: 'Placený',
	inspection: 'Kontrola'
};

export function getServiceTypeLabel(type: string): string {
	return SERVICE_TYPE_LABELS[type] || type;
}
