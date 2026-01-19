/**
 * Feature Flags - Licenční tiering systém
 * 
 * Přepínání mezi Basic a Full verzí pomocí ENV variable LICENSE_TIER
 * 
 * @see FEATURE_FLAGS_SPEC.md pro kompletní dokumentaci
 */

import { env } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';

// ---------------------------------------------
// Typy
// ---------------------------------------------
export type LicenseTier = 'basic' | 'full';

export type Feature = 
	| 'radce'           // B2C Rádce - vždy dostupné
	| 'customers'       // Zákazníci - vždy dostupné
	| 'measurements'    // Zaměření - vždy dostupné
	| 'inquiries'       // Poptávky - vždy dostupné
	| 'orders'          // Zakázky - pouze Business
	| 'installation'    // Montáž - pouze Business
	| 'service'         // Servis - pouze Business
	| 'dashboard_basic' // Základní dashboard - vždy dostupné
	| 'dashboard_full'  // KPI dashboard - pouze Business
	| 'reports'         // Reporty a export - pouze Business
	| 'email_measurement' // Odeslání protokolu emailem - pouze Business
	| 'email_installation' // Odeslání montážního protokolu - pouze Business
	| 'email_service'   // Odeslání servisního protokolu - pouze Business
	| 'audit_logs';     // Audit logy - pouze Business

// ---------------------------------------------
// Konfigurace tier úrovní
// ---------------------------------------------
const TIER_CONFIG: Record<LicenseTier, {
	features: Feature[];
	maxUsers: number;
	maxRoles: number;
	allowedRoles: string[];
}> = {
	basic: {
		features: ['radce', 'customers', 'measurements', 'inquiries', 'dashboard_basic'],
		maxUsers: 3,
		maxRoles: 3,
		allowedRoles: ['admin', 'sales', 'technician']
	},
	full: {
		features: [
			'radce', 
			'customers', 
			'measurements', 
			'inquiries',
			'orders', 
			'installation',
			'service', 
			'dashboard_basic', 
			'dashboard_full', 
			'reports',
			'email_measurement',
			'email_installation',
			'email_service',
			'audit_logs'
		],
		maxUsers: 6,
		maxRoles: 6,
		allowedRoles: ['admin', 'sales', 'manager', 'production_manager', 'technician']
	}
};

// ---------------------------------------------
// Aktuální tier
// ---------------------------------------------
export function getCurrentTier(): LicenseTier {
	const tier = env.LICENSE_TIER?.toLowerCase();
	if (tier === 'basic' || tier === 'full') {
		return tier;
	}
	// Default fallback - full pro existující instalace
	return 'full';
}

// ---------------------------------------------
// Feature checks
// ---------------------------------------------
export function hasFeature(feature: Feature): boolean {
	const tier = getCurrentTier();
	return TIER_CONFIG[tier].features.includes(feature);
}

/**
 * Vyhodí 403 error pokud feature není dostupná (pro API)
 */
export function requireFeature(feature: Feature): void {
	if (!hasFeature(feature)) {
		error(403, {
			message: `Funkce "${getFeatureLabel(feature)}" není dostupná ve vaší licenci. Pro aktivaci přejděte na verzi Full.`
		});
	}
}

/**
 * Přesměruje na dashboard pokud feature není dostupná (pro pages)
 */
export function requireFeatureOrRedirect(feature: Feature): void {
	if (!hasFeature(feature)) {
		redirect(302, '/dashboard?license_error=' + feature);
	}
}

// ---------------------------------------------
// Write permissions (pro downgrade politiku)
// ---------------------------------------------
export function canWrite(feature: Feature): boolean {
	return hasFeature(feature);
}

export function requireWrite(feature: Feature): void {
	if (!canWrite(feature)) {
		error(403, {
			message: `V Basic verzi je funkce "${getFeatureLabel(feature)}" pouze pro čtení.`
		});
	}
}

// ---------------------------------------------
// User limits
// ---------------------------------------------
export function getMaxUsers(): number {
	return TIER_CONFIG[getCurrentTier()].maxUsers;
}

export function getAllowedRoles(): string[] {
	return [...TIER_CONFIG[getCurrentTier()].allowedRoles];
}

export function isRoleAllowed(role: string): boolean {
	return getAllowedRoles().includes(role);
}

// ---------------------------------------------
// Helper pro UI
// ---------------------------------------------
export function getTierInfo() {
	const tier = getCurrentTier();
	return {
		tier,
		tierLabel: tier === 'full' ? 'Business' : 'Basic',
		features: TIER_CONFIG[tier].features,
		maxUsers: TIER_CONFIG[tier].maxUsers,
		maxRoles: TIER_CONFIG[tier].maxRoles,
		allowedRoles: TIER_CONFIG[tier].allowedRoles,
		isBasic: tier === 'basic',
		isFull: tier === 'full'
	};
}

// ---------------------------------------------
// Feature labels pro UI
// ---------------------------------------------
function getFeatureLabel(feature: Feature): string {
	const labels: Record<Feature, string> = {
		radce: 'Rádce',
		customers: 'Zákazníci',
		measurements: 'Zaměření',
		inquiries: 'Poptávky',
		orders: 'Zakázky',
		installation: 'Montáž',
		service: 'Servis',
		dashboard_basic: 'Dashboard',
		dashboard_full: 'Dashboard KPI',
		reports: 'Reporty',
		audit_logs: 'Audit logy',
		email_measurement: 'Email protokolů zaměření',
		email_installation: 'Email protokolů montáže',
		email_service: 'Email servisních protokolů'
	};
	return labels[feature] || feature;
}
