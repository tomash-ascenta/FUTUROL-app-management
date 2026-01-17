<script lang="ts">
    import {
        Search,
        Plus,
        Filter,
        MapPin,
        Calendar,
        Package,
    } from "lucide-svelte";
    import type { PageData } from "./$types";
    import { goto } from "$app/navigation";
    import { getCustomerDisplayName } from "$lib/utils";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    // Status labels
    const statusLabels: Record<string, string> = {
        lead: "Lead",
        customer: "Zákazník",
        quote_sent: "Nabídka",
        measurement: "Zaměření",
        contract: "Smlouva",
        production: "Výroba",
        installation: "Montáž",
        handover: "Předání",
        cancelled: "Zrušeno",
    };

    const statusColors: Record<string, string> = {
        lead: "bg-slate-100 text-slate-700",
        customer: "bg-blue-100 text-blue-700",
        quote_sent: "bg-amber-100 text-amber-700",
        measurement: "bg-purple-100 text-purple-700",
        contract: "bg-green-100 text-green-700",
        production: "bg-orange-100 text-orange-700",
        installation: "bg-teal-100 text-teal-700",
        handover: "bg-emerald-100 text-emerald-700",
        cancelled: "bg-red-100 text-red-700",
    };

    const priorityLabels: Record<string, string> = {
        low: "Nízká",
        normal: "Normální",
        high: "Vysoká",
        urgent: "Urgentní",
    };

    const priorityColors: Record<string, string> = {
        low: "bg-slate-100 text-slate-600",
        normal: "bg-blue-100 text-blue-700",
        high: "bg-orange-100 text-orange-700",
        urgent: "bg-red-100 text-red-700",
    };

    function formatCurrency(value: number | null): string {
        if (!value) return "-";
        return new Intl.NumberFormat("cs-CZ", {
            style: "currency",
            currency: "CZK",
            minimumFractionDigits: 0,
        }).format(value);
    }

    function formatDate(dateString: string | null): string {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("cs-CZ");
    }
</script>

<div class="space-y-6">
    <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Zakázky</h1>
            <p class="text-slate-500 mt-1">Přehled všech zakázek</p>
        </div>
        {#if data.canEdit}
            <a
                href="/dashboard/orders/new"
                class="inline-flex items-center gap-2 bg-futurol-green text-white px-4 py-2.5 rounded font-medium hover:bg-futurol-green/90 transition-colors shadow-sm"
            >
                <Plus class="w-5 h-5" />
                Nová zakázka
            </a>
        {/if}
    </div>

    <!-- Search and filters -->
    <form method="get" class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            />
            <input
                type="text"
                name="search"
                value={data.search}
                placeholder="Hledat zakázky..."
                class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
            />
        </div>
        <button
            type="submit"
            class="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded bg-white hover:bg-slate-50 transition-colors"
        >
            <Filter class="w-5 h-5 text-slate-500" />
            Filtry
        </button>
    </form>

    {#if data.orders.length === 0}
        <!-- Empty state -->
        <div
            class="bg-white rounded shadow-sm border border-slate-200 p-12 text-center"
        >
            <div
                class="w-16 h-16 bg-futurol-green/10 rounded-full flex items-center justify-center mx-auto mb-4"
            >
                <Search class="w-8 h-8 text-futurol-green" />
            </div>
            <h3 class="text-lg font-medium text-slate-800 mb-2">
                Zatím žádné zakázky
            </h3>
            <p class="text-slate-500 mb-6">Začněte vytvořením první zakázky</p>
            {#if data.canEdit}
                <a
                    href="/dashboard/orders/new"
                    class="inline-flex items-center gap-2 bg-futurol-green text-white px-4 py-2.5 rounded font-medium hover:bg-futurol-green/90 transition-colors shadow-sm"
                >
                    <Plus class="w-5 h-5" />
                    Vytvořit zakázku
                </a>
            {/if}
        </div>
    {:else}
        <!-- Orders list -->
        <div
            class="bg-white rounded shadow-sm border border-slate-200 overflow-hidden"
        >
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th
                                class="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider"
                            >
                                Zakázka
                            </th>
                            <th
                                class="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider"
                            >
                                Zákazník
                            </th>
                            <th
                                class="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider"
                            >
                                Status
                            </th>
                            <th
                                class="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider"
                            >
                                Priorita
                            </th>
                            <th
                                class="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider"
                            >
                                Hodnota
                            </th>
                            <th
                                class="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider"
                            >
                                Vytvořeno
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each data.orders as order}
                            <tr
                                class="hover:bg-slate-50 transition-colors cursor-pointer"
                                onclick={() =>
                                    goto(`/dashboard/orders/${order.id}`)}
                            >
                                <td class="px-6 py-4">
                                    <span
                                        class="font-medium text-futurol-green hover:underline"
                                    >
                                        {order.orderNumber}
                                    </span>
                                    {#if order.product}
                                        <p
                                            class="text-sm text-slate-500 flex items-center gap-1 mt-1"
                                        >
                                            <Package class="w-3 h-3" />
                                            {order.product.name}
                                        </p>
                                    {/if}
                                </td>
                                <td class="px-6 py-4">
                                    <div class="font-medium text-slate-900">
                                        {getCustomerDisplayName(order.customer)}
                                    </div>
                                    {#if order.location}
                                        <p
                                            class="text-sm text-slate-500 flex items-center gap-1 mt-1"
                                        >
                                            <MapPin class="w-3 h-3" />
                                            {order.location.city}
                                        </p>
                                    {:else}
                                        <p class="text-sm text-amber-600 mt-1">
                                            Bez lokace
                                        </p>
                                    {/if}
                                </td>
                                <td class="px-6 py-4">
                                    <span
                                        class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium {statusColors[
                                            order.status
                                        ] || 'bg-slate-100 text-slate-700'}"
                                    >
                                        {statusLabels[order.status] ||
                                            order.status}
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                    <span
                                        class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium {priorityColors[
                                            order.priority
                                        ] || 'bg-slate-100 text-slate-600'}"
                                    >
                                        {priorityLabels[order.priority] ||
                                            order.priority}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-slate-700">
                                    {formatCurrency(
                                        order.quotes.reduce(
                                            (sum, q) => sum + q.amount,
                                            0,
                                        ),
                                    )}
                                </td>
                                <td class="px-6 py-4 text-slate-500 text-sm">
                                    <div class="flex items-center gap-1">
                                        <Calendar class="w-3 h-3" />
                                        {formatDate(order.createdAt)}
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            {#if data.pagination.totalPages > 1}
                <div
                    class="px-6 py-4 border-t border-slate-200 flex items-center justify-between"
                >
                    <p class="text-sm text-slate-500">
                        Zobrazeno {(data.pagination.page - 1) *
                            data.pagination.limit +
                            1} -
                        {Math.min(
                            data.pagination.page * data.pagination.limit,
                            data.pagination.total,
                        )}
                        z {data.pagination.total} zakázek
                    </p>
                    <div class="flex gap-2">
                        {#if data.pagination.page > 1}
                            <a
                                href="?page={data.pagination.page -
                                    1}&search={data.search}"
                                class="px-3 py-1.5 text-sm border border-slate-200 rounded hover:bg-slate-50"
                            >
                                Předchozí
                            </a>
                        {/if}
                        {#if data.pagination.page < data.pagination.totalPages}
                            <a
                                href="?page={data.pagination.page +
                                    1}&search={data.search}"
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
