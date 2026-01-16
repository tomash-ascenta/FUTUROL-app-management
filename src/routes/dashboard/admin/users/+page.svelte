<script lang="ts">
    import {
        Search,
        Plus,
        Edit,
        Trash2,
        Shield,
        MoreVertical,
    } from "lucide-svelte";

    interface Props {
        data: {
            users: Array<{
                id: string;
                personalNumber: string;
                fullName: string;
                email: string | null;
                phone: string | null;
                roles: string[];
                isActive: boolean;
                createdAt: string;
            }>;
        };
    }

    let { data }: Props = $props();

    let searchQuery = $state("");
    let showAddModal = $state(false);

    function getRoleBadgeColor(role: string): string {
        const colors: Record<string, string> = {
            admin: "bg-red-100 text-red-700",
            manager: "bg-purple-100 text-purple-700",
            sales: "bg-blue-100 text-blue-700",
            production_manager: "bg-yellow-100 text-yellow-700",
            technician: "bg-green-100 text-green-700",
        };
        return colors[role] || "bg-slate-100 text-slate-600";
    }

    function getRoleLabel(role: string): string {
        const labels: Record<string, string> = {
            admin: "Administrátor",
            manager: "Manažer",
            sales: "Obchodník",
            production_manager: "Vedoucí výroby",
            technician: "Technik",
        };
        return labels[role] || role;
    }
</script>

<div class="space-y-6">
    <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Správa uživatelů</h1>
            <p class="text-slate-500 mt-1">
                Přidávání a správa zaměstnanců systému
            </p>
        </div>
        <a
            href="/dashboard/admin/users/new"
            class="inline-flex items-center gap-2 bg-futurol-green text-white px-4 py-2.5 rounded-lg font-medium hover:bg-futurol-green/90 transition-colors shadow-sm"
        >
            <Plus class="w-5 h-5" />
            Nový uživatel
        </a>
    </div>

    <!-- Search -->
    <div class="relative max-w-md">
        <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
        />
        <input
            type="text"
            placeholder="Hledat uživatele..."
            bind:value={searchQuery}
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
        />
    </div>

    <!-- Users table -->
    <div
        class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
    >
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th
                            class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                        >
                            Uživatel
                        </th>
                        <th
                            class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                        >
                            Osobní číslo
                        </th>
                        <th
                            class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                        >
                            Role
                        </th>
                        <th
                            class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                        >
                            Stav
                        </th>
                        <th
                            class="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                        >
                            Akce
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    {#each data.users as user}
                        <tr class="hover:bg-slate-50 transition-colors">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-10 h-10 bg-futurol-green/10 rounded-full flex items-center justify-center border border-futurol-green/20"
                                    >
                                        <span
                                            class="text-sm font-medium text-futurol-green"
                                        >
                                            {user.fullName
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .slice(0, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <div class="font-medium text-slate-800">
                                            {user.fullName}
                                        </div>
                                        <div class="text-sm text-slate-500">
                                            {user.email || "Bez emailu"}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <code
                                    class="px-2 py-1 bg-slate-100 rounded text-sm font-mono text-slate-600"
                                >
                                    {user.personalNumber}
                                </code>
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex flex-wrap gap-1">
                                    {#each user.roles as role}
                                        <span
                                            class="px-2 py-0.5 text-xs font-medium rounded-full {getRoleBadgeColor(
                                                role,
                                            )}"
                                        >
                                            {getRoleLabel(role)}
                                        </span>
                                    {/each}
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                {#if user.isActive}
                                    <span
                                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-futurol-green/10 text-futurol-green"
                                    >
                                        <span
                                            class="w-1.5 h-1.5 bg-futurol-green rounded-full"
                                        ></span>
                                        Aktivní
                                    </span>
                                {:else}
                                    <span
                                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-500"
                                    >
                                        <span
                                            class="w-1.5 h-1.5 bg-slate-400 rounded-full"
                                        ></span>
                                        Neaktivní
                                    </span>
                                {/if}
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div
                                    class="flex items-center justify-end gap-2"
                                >
                                    <a
                                        href="/dashboard/admin/users/{user.id}"
                                        class="p-2 text-slate-400 hover:text-futurol-green hover:bg-futurol-green/10 rounded-lg transition-colors"
                                        title="Upravit"
                                    >
                                        <Edit class="w-4 h-4" />
                                    </a>
                                    <a
                                        href="/dashboard/admin/users/{user.id}/reset-pin"
                                        class="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                        title="Reset PIN"
                                    >
                                        <Shield class="w-4 h-4" />
                                    </a>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        {#if data.users.length === 0}
            <div class="p-12 text-center">
                <div
                    class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    <Search class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-medium text-slate-800 mb-2">
                    Žádní uživatelé
                </h3>
                <p class="text-slate-500">Přidejte prvního uživatele systému</p>
            </div>
        {/if}
    </div>
</div>
