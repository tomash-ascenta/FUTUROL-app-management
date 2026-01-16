<script lang="ts">
    import { Search, Plus, Ruler, MapPin, Eye } from "lucide-svelte";
    import type { PageData } from "./$types";
    import { goto } from "$app/navigation";

    let { data }: { data: PageData } = $props();

    let searchQuery = $state("");

    // Initialize search on mount
    $effect(() => {
        searchQuery = data.search || "";
    });

    function formatDate(date: string | Date) {
        return new Date(date).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "numeric",
            year: "numeric",
        });
    }

    function formatDimensions(m: {
        width: number;
        depth: number;
        height: number;
    }) {
        return `${m.width} × ${m.depth} × ${m.height} mm`;
    }

    function handleSearch() {
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        goto(`/dashboard/measurements?${params.toString()}`);
    }
</script>

<div class="space-y-6">
    <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Zaměření</h1>
            <p class="text-slate-500 mt-1">
                {#if data.pagination.total > 0}
                    Celkem {data.pagination.total} zaměření
                {:else}
                    Správa zaměření v terénu
                {/if}
            </p>
        </div>
        {#if data.canCreate}
            <a
                href="/dashboard/measurements/new"
                class="inline-flex items-center gap-2 bg-futurol-green text-white px-4 py-2.5 rounded-lg font-medium hover:bg-futurol-green/90 transition-colors shadow-sm"
            >
                <Plus class="w-5 h-5" />
                Nové zaměření
            </a>
        {/if}
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
                    placeholder="Hledat podle zákazníka, čísla zakázky..."
                    class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                />
            </div>
            <button
                type="submit"
                class="px-4 py-2.5 bg-futurol-green text-white rounded-lg hover:bg-futurol-green/90 transition-colors"
            >
                Hledat
            </button>
        </form>
    {/if}

    <!-- List -->
    {#if data.measurements.length === 0}
        <div
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center"
        >
            <div
                class="w-16 h-16 bg-futurol-green/10 rounded-full flex items-center justify-center mx-auto mb-4"
            >
                <Ruler class="w-8 h-8 text-futurol-green" />
            </div>
            <h3 class="text-lg font-medium text-slate-800 mb-2">
                {#if data.search}
                    Žádné výsledky
                {:else}
                    Zatím žádná zaměření
                {/if}
            </h3>
            <p class="text-slate-500 mb-6">
                {#if data.search}
                    Pro hledaný výraz "{data.search}" nebyly nalezeny žádné
                    záznamy.
                {:else}
                    Zaměření se vytváří z mobilního telefonu v terénu
                {/if}
            </p>
            {#if data.canCreate}
                <a
                    href="/dashboard/measurements/new"
                    class="inline-flex items-center gap-2 bg-futurol-green text-white px-4 py-2.5 rounded-lg font-medium hover:bg-futurol-green/90 transition-colors shadow-sm"
                >
                    <Plus class="w-5 h-5" />
                    Nové zaměření
                </a>
            {/if}
        </div>
    {:else}
        <div
            class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
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
                                >Typ</th
                            >
                            <th
                                class="text-left px-4 py-3 text-sm font-medium text-slate-600"
                                >Rozměry</th
                            >
                            <th
                                class="text-left px-4 py-3 text-sm font-medium text-slate-600"
                                >Zaměřil</th
                            >
                            <th
                                class="text-left px-4 py-3 text-sm font-medium text-slate-600"
                                >Datum</th
                            >
                            <th
                                class="text-right px-4 py-3 text-sm font-medium text-slate-600"
                                >Akce</th
                            >
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each data.measurements as measurement}
                            {#if measurement.order}
                                <tr class="hover:bg-slate-50 transition-colors">
                                    <td class="px-4 py-3">
                                        <span
                                            class="font-mono text-sm text-slate-600"
                                            >{measurement.order
                                                .orderNumber}</span
                                        >
                                    </td>
                                    <td class="px-4 py-3">
                                        <div class="flex flex-col">
                                            <span
                                                class="font-medium text-slate-800"
                                                >{measurement.order.customer
                                                    .fullName}</span
                                            >
                                            {#if measurement.order.location}
                                                <span
                                                    class="text-sm text-slate-500 flex items-center gap-1"
                                                >
                                                    <MapPin class="w-3 h-3" />
                                                    {measurement.order.location
                                                        .city}
                                                </span>
                                            {/if}
                                        </div>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span
                                            class="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700"
                                        >
                                            {measurement.pergolaType}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="text-sm text-slate-600"
                                            >{formatDimensions(
                                                measurement,
                                            )}</span
                                        >
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="text-sm text-slate-600"
                                            >{measurement.employee
                                                .fullName}</span
                                        >
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="text-sm text-slate-600"
                                            >{formatDate(
                                                measurement.measuredAt,
                                            )}</span
                                        >
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <a
                                            href="/dashboard/measurements/{measurement.id}"
                                            class="inline-flex items-center gap-1.5 text-sm text-futurol-green hover:underline"
                                        >
                                            <Eye class="w-4 h-4" />
                                            Detail
                                        </a>
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
                                href="/dashboard/measurements?page={data
                                    .pagination.page - 1}{data.search
                                    ? `&search=${data.search}`
                                    : ''}"
                                class="px-3 py-1.5 text-sm border border-slate-200 rounded hover:bg-slate-50"
                            >
                                Předchozí
                            </a>
                        {/if}
                        {#if data.pagination.page < data.pagination.totalPages}
                            <a
                                href="/dashboard/measurements?page={data
                                    .pagination.page + 1}{data.search
                                    ? `&search=${data.search}`
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
