<script lang="ts">
    import {
        Search,
        Wrench,
        MapPin,
        Calendar,
        CheckCircle2,
        Clock,
        Play,
    } from "lucide-svelte";
    import type { PageData } from "./$types";
    import { goto } from "$app/navigation";
    import { getCustomerDisplayName } from "$lib/utils";
    import { getChecklistProgress } from "$lib/config/installationChecklist";

    let { data }: { data: PageData } = $props();

    let searchQuery = $state("");
    let statusFilter = $state("");

    // Initialize filters on mount
    $effect(() => {
        searchQuery = data.search || "";
        statusFilter = data.status || "";
    });

    function formatDate(date: string | Date | null) {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "numeric",
            year: "numeric",
        });
    }

    function handleSearch() {
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        if (statusFilter) params.set("status", statusFilter);
        goto(`/dashboard/installations?${params.toString()}`);
    }

    function handleStatusFilter(status: string) {
        statusFilter = status;
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        if (status) params.set("status", status);
        goto(`/dashboard/installations?${params.toString()}`);
    }

    function getStatusConfig(status: string) {
        const configs: Record<
            string,
            { label: string; color: string; icon: typeof Clock }
        > = {
            planned: {
                label: "Naplánováno",
                color: "bg-blue-100 text-blue-700",
                icon: Calendar,
            },
            in_progress: {
                label: "Probíhá",
                color: "bg-amber-100 text-amber-700",
                icon: Play,
            },
            completed: {
                label: "Dokončeno",
                color: "bg-green-100 text-green-700",
                icon: CheckCircle2,
            },
        };
        return (
            configs[status] || {
                label: status,
                color: "bg-slate-100 text-slate-700",
                icon: Clock,
            }
        );
    }

    const statuses = [
        { value: "", label: "Vše", count: data.pagination.total },
        {
            value: "planned",
            label: "Naplánováno",
            count: data.statusCounts.planned || 0,
        },
        {
            value: "in_progress",
            label: "Probíhá",
            count: data.statusCounts.in_progress || 0,
        },
        {
            value: "completed",
            label: "Dokončeno",
            count: data.statusCounts.completed || 0,
        },
    ];
</script>

<div class="space-y-6">
    <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Montáže</h1>
            <p class="text-slate-500 mt-1">
                {#if data.pagination.total > 0}
                    Celkem {data.pagination.total} montáží
                {:else}
                    Správa montáží pergol
                {/if}
            </p>
        </div>
    </div>

    <!-- Status filter tabs -->
    <div class="flex gap-2 overflow-x-auto pb-2">
        {#each statuses as status}
            <button
                onclick={() => handleStatusFilter(status.value)}
                class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors {statusFilter ===
                status.value
                    ? 'bg-futurol-wine text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}"
            >
                {status.label}
                <span
                    class="ml-1.5 px-1.5 py-0.5 rounded text-xs {statusFilter ===
                    status.value
                        ? 'bg-white/20'
                        : 'bg-slate-100'}">{status.count}</span
                >
            </button>
        {/each}
    </div>

    <!-- Search -->
    {#if data.pagination.total > 0 || data.search}
        <form
            onsubmit={(e) => {
                e.preventDefault();
                handleSearch();
            }}
            class="flex gap-3"
        >
            <div class="relative flex-1">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Hledat podle zákazníka, čísla zakázky, technika..."
                    class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-futurol-wine/30 focus:border-futurol-wine"
                />
            </div>
            <button
                type="submit"
                class="px-4 py-2.5 bg-futurol-wine text-white rounded hover:bg-futurol-wine/90 transition-colors"
            >
                Hledat
            </button>
        </form>
    {/if}

    <!-- List -->
    {#if data.installations.length === 0}
        <div
            class="bg-white rounded shadow-sm border border-slate-200 p-12 text-center"
        >
            <div
                class="w-16 h-16 bg-futurol-wine/10 rounded-full flex items-center justify-center mx-auto mb-4"
            >
                <Wrench class="w-8 h-8 text-futurol-wine" />
            </div>
            <h3 class="text-lg font-medium text-slate-800 mb-2">
                {#if data.search || data.status}
                    Žádné výsledky
                {:else}
                    Zatím žádné montáže
                {/if}
            </h3>
            <p class="text-slate-500 mb-6">
                {#if data.search}
                    Pro hledaný výraz "{data.search}" nebyly nalezeny žádné
                    záznamy.
                {:else if data.status}
                    Žádné montáže ve stavu "{getStatusConfig(data.status)
                        .label}".
                {:else}
                    Montáže se vytváří z detailu zakázky po dokončení zaměření.
                {/if}
            </p>
        </div>
    {:else}
        <div
            class="bg-white rounded shadow-sm border border-slate-200 overflow-hidden"
        >
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th
                                class="text-left px-4 py-3 text-sm font-medium text-slate-600"
                                >Zakázka</th
                            >
                            <th
                                class="text-left px-4 py-3 text-sm font-medium text-slate-600"
                                >Zákazník</th
                            >
                            <th
                                class="text-left px-4 py-3 text-sm font-medium text-slate-600"
                                >Produkt</th
                            >
                            <th
                                class="text-left px-4 py-3 text-sm font-medium text-slate-600"
                                >Stav</th
                            >
                            <th
                                class="text-left px-4 py-3 text-sm font-medium text-slate-600"
                                >Checklist</th
                            >
                            <th
                                class="text-left px-4 py-3 text-sm font-medium text-slate-600"
                                >Technik</th
                            >
                            <th
                                class="text-left px-4 py-3 text-sm font-medium text-slate-600"
                                >Termín</th
                            >
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each data.installations as installation}
                            {#if installation.order}
                                {@const statusConfig = getStatusConfig(
                                    installation.status,
                                )}
                                {@const progress = getChecklistProgress(
                                    (installation.checklist as Record<
                                        string,
                                        boolean
                                    >) || {},
                                )}
                                <tr
                                    class="hover:bg-slate-50 transition-colors cursor-pointer"
                                    onclick={() =>
                                        (window.location.href = `/dashboard/installations/${installation.id}`)}
                                >
                                    <td class="px-4 py-3">
                                        <span
                                            class="font-mono text-sm text-slate-600"
                                        >
                                            {installation.order.orderNumber}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <div class="flex flex-col">
                                            <span
                                                class="font-medium text-slate-800"
                                            >
                                                {getCustomerDisplayName(
                                                    installation.order.customer,
                                                )}
                                            </span>
                                            {#if installation.order.location}
                                                <span
                                                    class="text-sm text-slate-500 flex items-center gap-1"
                                                >
                                                    <MapPin class="w-3 h-3" />
                                                    {installation.order.location
                                                        .city}
                                                </span>
                                            {/if}
                                        </div>
                                    </td>
                                    <td class="px-4 py-3">
                                        {#if installation.order.product}
                                            <span
                                                class="text-sm text-slate-600"
                                            >
                                                {installation.order.product
                                                    .name}
                                            </span>
                                        {:else}
                                            <span class="text-sm text-slate-400"
                                                >—</span
                                            >
                                        {/if}
                                    </td>
                                    <td class="px-4 py-3">
                                        <span
                                            class="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded {statusConfig.color}"
                                        >
                                            <svelte:component
                                                this={statusConfig.icon}
                                                class="w-3.5 h-3.5"
                                            />
                                            {statusConfig.label}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="w-20 h-2 bg-slate-200 rounded-full overflow-hidden"
                                            >
                                                <div
                                                    class="h-full bg-futurol-green rounded-full transition-all"
                                                    style="width: {progress}%"
                                                ></div>
                                            </div>
                                            <span class="text-xs text-slate-500"
                                                >{progress}%</span
                                            >
                                        </div>
                                    </td>
                                    <td class="px-4 py-3">
                                        {#if installation.technician}
                                            <span
                                                class="text-sm text-slate-600"
                                            >
                                                {installation.technician
                                                    .fullName}
                                            </span>
                                        {:else}
                                            <span class="text-sm text-slate-400"
                                                >—</span
                                            >
                                        {/if}
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="text-sm text-slate-600">
                                            {formatDate(
                                                installation.scheduledAt,
                                            )}
                                        </span>
                                    </td>
                                </tr>
                            {/if}
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            {#if data.pagination.totalPages > 1}
                <div
                    class="flex items-center justify-between px-4 py-3 border-t border-slate-200"
                >
                    <span class="text-sm text-slate-500">
                        Stránka {data.pagination.page} z {data.pagination
                            .totalPages}
                    </span>
                    <div class="flex gap-2">
                        {#if data.pagination.page > 1}
                            <a
                                href="/dashboard/installations?page={data
                                    .pagination.page - 1}{data.search
                                    ? `&search=${data.search}`
                                    : ''}{data.status
                                    ? `&status=${data.status}`
                                    : ''}"
                                class="px-3 py-1.5 text-sm border border-slate-200 rounded hover:bg-slate-50"
                            >
                                Předchozí
                            </a>
                        {/if}
                        {#if data.pagination.page < data.pagination.totalPages}
                            <a
                                href="/dashboard/installations?page={data
                                    .pagination.page + 1}{data.search
                                    ? `&search=${data.search}`
                                    : ''}{data.status
                                    ? `&status=${data.status}`
                                    : ''}"
                                class="px-3 py-1.5 text-sm border border-slate-200 rounded hover:bg-slate-50"
                            >
                                Další
                            </a>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>
