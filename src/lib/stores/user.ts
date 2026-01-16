import { writable, get } from 'svelte/store';

/**
 * Client-side user store
 * Note: Primary authentication is handled server-side via hooks.server.ts and locals
 * This store can be used for client-side UI state if needed
 */
interface User {
	id: string;
	personalNumber: string;
	fullName: string;
	roles: string[];
}

function createUserStore() {
	const { subscribe, set } = writable<User | null>(null);

	return {
		subscribe,
		set,
		login: (user: User) => set(user),
		logout: () => set(null),
		hasRole: (role: string): boolean => {
			const user = get({ subscribe });
			return user?.roles.includes(role) ?? false;
		}
	};
}

export const user = createUserStore();
