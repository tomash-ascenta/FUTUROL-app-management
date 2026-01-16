<script lang="ts">
    import {
        ScrollText,
        Search,
        Filter,
        User,
        Calendar,
        ArrowRight,
    } from "lucide-svelte";

    interface Props {
        data: {
            logs: Array<{
                id: string;
                action: string;
                entityType: string;
                entityId: string | null;
                employee: { fullName: string; personalNumber: string } | null;
                createdAt: string;
            }>;
        };
    }

    let { data }: Props = $props();

    function getActionLabel(action: string): string {
        const labels: Record<string, string> = {
            LOGIN: "Přihlášení",
            LOGOUT: "Odhlášení",
            CREATE: "Vytvoření",
            UPDATE: "Úprava",
            DELETE: "Smazání",
            EXPORT: "Export",
            PIN_CHANGE: "Změna PIN",
        };
        return labels[action] || action;
    }

    function getActionColor(action: string): string {
        const colors: Record<string, string> = {
            LOGIN: "bg-futurol-green/10 text-futurol-green",
            LOGOUT: "bg-slate-100 text-slate-600",
            CREATE: "bg-blue-100 text-blue-700",
            UPDATE: "bg-yellow-100 text-yellow-700",
            DELETE: "bg-red-100 text-red-700",
            EXPORT: "bg-purple-100 text-purple-700",
            PIN_CHANGE: "bg-orange-100 text-orange-700",
        };
        return colors[action] || "bg-slate-100 text-slate-600";
    }

    function formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleString("cs-CZ", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<div class="space-y-6">
    <div>
        <h1 class="text-2xl font-bold text-slate-800">Audit logy</h1>
        <p class="text-slate-500 mt-1">Historie všech akcí v systému</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1 max-w-md">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            />
            <input
                type="text"
                placeholder="Hledat v logu..."
                class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
            />
        </div>
        <button
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
            <Filter class="w-5 h-5 text-slate-500" />
            Filtry
        </button>
    </div>

    <!-- Logs list -->
    <div
        class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
    >
        <div class="divide-y divide-slate-100">
            {#each data.logs as log}
                <div class="p-4 hover:bg-slate-50 transition-colors">
                    <div class="flex items-start gap-4">
                        <div
                            class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0"
                        >
                            <ScrollText class="w-5 h-5 text-slate-600" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span
                                    class="px-2 py-0.5 text-xs font-medium rounded-full {getActionColor(
                                        log.action,
                                    )}"
                                >
                                    {getActionLabel(log.action)}
                                </span>
                                <span
                                    class="text-sm text-slate-800 font-medium"
                                >
                                    {log.entityType}
                                    {#if log.entityId}
                                        <span class="text-slate-500"
                                            >#{log.entityId.slice(0, 8)}</span
                                        >
                                    {/if}
                                </span>
                            </div>
                            <div
                                class="flex items-center gap-4 mt-1 text-sm text-slate-500"
                            >
                                {#if log.employee}
                                    <span class="flex items-center gap-1">
                                        <User class="w-3.5 h-3.5" />
                                        {log.employee.fullName} ({log.employee
                                            .personalNumber})
                                    </span>
                                {:else}
                                    <span class="flex items-center gap-1">
                                        <User class="w-3.5 h-3.5" />
                                        Systém
                                    </span>
                                {/if}
                                <span class="flex items-center gap-1">
                                    <Calendar class="w-3.5 h-3.5" />
                                    {formatDate(log.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        {#if data.logs.length === 0}
            <div class="p-12 text-center">
                <div
                    class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    <ScrollText class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-medium text-slate-800 mb-2">
                    Žádné záznamy
                </h3>
                <p class="text-slate-500">Zatím nejsou žádné záznamy v logu</p>
            </div>
        {/if}
    </div>
</div>
