/**
 * FUTUROL Permission System
 * 
 * Definice oprávnění pro jednotlivé role:
 * - admin: Správce systému - nastavení, uživatelé
 * - sales: Obchodník - leady, zákazníci, zakázky, servis
 * - manager: Manažer - vidí vše (read-only)
 * - production_manager: Vedoucí výroby - zákazníci, zakázky, zaměření (read)
 * - technician: Technik/Zaměřovač - zaměření, servis, vidí zákazníky/zakázky
 */

import type { Role } from '@prisma/client';

// Moduly systému
export type Module = 
  | 'settings'
  | 'users'
  | 'leads'
  | 'customers'
  | 'orders'
  | 'measurements'
  | 'service'
  | 'reports';

// Typy oprávnění
export type Permission = 'read' | 'write' | 'delete';

// Matice oprávnění
const permissionMatrix: Record<Role, Record<Module, Permission[]>> = {
  admin: {
    settings: ['read', 'write', 'delete'],
    users: ['read', 'write', 'delete'],
    leads: ['read', 'write', 'delete'],
    customers: ['read', 'write', 'delete'],
    orders: ['read', 'write', 'delete'],
    measurements: ['read', 'write', 'delete'],
    service: ['read', 'write', 'delete'],
    reports: ['read', 'write', 'delete'],
  },
  
  sales: {
    settings: [],
    users: [],
    leads: ['read', 'write', 'delete'],
    customers: ['read', 'write', 'delete'],
    orders: ['read', 'write', 'delete'],
    measurements: ['read'],
    service: ['read', 'write', 'delete'],
    reports: [],
  },
  
  manager: {
    settings: [],
    users: [],
    leads: ['read'],
    customers: ['read'],
    orders: ['read'],
    measurements: ['read'],
    service: ['read'],
    reports: ['read'],
  },
  
  production_manager: {
    settings: [],
    users: [],
    leads: [],
    customers: ['read'],
    orders: ['read'],
    measurements: ['read'],
    service: [],
    reports: [],
  },
  
  technician: {
    settings: [],
    users: [],
    leads: [],
    customers: ['read'],
    orders: ['read'],
    measurements: ['read', 'write', 'delete'],
    service: ['read', 'write', 'delete'],
    reports: [],
  },
};

/**
 * Kontrola, zda má uživatel oprávnění k modulu
 */
export function hasPermission(
  roles: Role[],
  module: Module,
  permission: Permission
): boolean {
  return roles.some(role => {
    const rolePermissions = permissionMatrix[role]?.[module] || [];
    return rolePermissions.includes(permission);
  });
}

/**
 * Kontrola, zda má uživatel přístup k modulu (jakékoliv oprávnění)
 */
export function canAccess(roles: Role[], module: Module): boolean {
  return roles.some(role => {
    const rolePermissions = permissionMatrix[role]?.[module] || [];
    return rolePermissions.length > 0;
  });
}

/**
 * Kontrola, zda může uživatel číst modul
 */
export function canRead(roles: Role[], module: Module): boolean {
  return hasPermission(roles, module, 'read');
}

/**
 * Kontrola, zda může uživatel zapisovat do modulu
 */
export function canWrite(roles: Role[], module: Module): boolean {
  return hasPermission(roles, module, 'write');
}

/**
 * Kontrola, zda může uživatel mazat v modulu
 */
export function canDelete(roles: Role[], module: Module): boolean {
  return hasPermission(roles, module, 'delete');
}

/**
 * Získání všech modulů, ke kterým má uživatel přístup
 */
export function getAccessibleModules(roles: Role[]): Module[] {
  const modules: Module[] = ['settings', 'users', 'leads', 'customers', 'orders', 'measurements', 'service', 'reports'];
  return modules.filter(module => canAccess(roles, module));
}

/**
 * Kontrola, zda je uživatel admin
 */
export function isAdmin(roles: Role[]): boolean {
  return roles.includes('admin');
}

/**
 * Kontrola, zda je uživatel manažer nebo vyšší
 */
export function isManagerOrAbove(roles: Role[]): boolean {
  return roles.some(role => ['admin', 'manager'].includes(role));
}

/**
 * Helper pro získání textu role
 */
export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    admin: 'Administrátor',
    sales: 'Obchodník',
    manager: 'Manažer',
    production_manager: 'Vedoucí výroby',
    technician: 'Technik',
  };
  return labels[role] || role;
}

/**
 * Helper pro získání barvy role (pro UI)
 */
export function getRoleColor(role: Role): string {
  const colors: Record<Role, string> = {
    admin: 'bg-red-100 text-red-800',
    sales: 'bg-blue-100 text-blue-800',
    manager: 'bg-purple-100 text-purple-800',
    production_manager: 'bg-amber-100 text-amber-800',
    technician: 'bg-green-100 text-green-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}
