<script lang="ts">
    import {
        ArrowLeft,
        MapPin,
        User,
        Calendar,
        ArrowRight,
    } from "lucide-svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    function formatDate(date: string | Date) {
        return new Date(date).toLocaleDateString("cs-CZ");
    }
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
        <a
            href="/dashboard/measurements"
            class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
            <ArrowLeft class="w-5 h-5 text-slate-600" />
        </a>
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Nové zaměření</h1>
            <p class="text-slate-500 mt-1">Vyberte zakázku k zaměření</p>
        </div>
    </div>

    <!-- Orders list -->
    {#if data.orders.length === 0}
        <div
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center"
        >
            <div
                class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
                <Calendar class="w-8 h-8 text-amber-600" />
            </div>
            <h3 class="text-lg font-medium text-slate-800 mb-2">
                Žádné zakázky k zaměření
            </h3>
            <p class="text-slate-500 mb-6">
                Nejsou k dispozici žádné zakázky ve stavu "Kontaktováno" nebo
                "Zaměření naplánováno"
            </p>
            <a
                href="/dashboard/orders"
                class="inline-flex items-center gap-2 text-futurol-green hover:underline"
            >
                Přejít na zakázky
                <ArrowRight class="w-4 h-4" />
            </a>
        </div>
    {:else}
        <div class="grid gap-4">
            {#each data.orders as order}
                <a
                    href="/dashboard/measurements/new/{order.id}"
                    class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-futurol-green hover:shadow-md transition-all group"
                >
                    <div class="flex items-start justify-between">
                        <div class="space-y-2">
                            <div class="flex items-center gap-3">
                                <span class="font-mono text-sm text-slate-500"
                                    >{order.orderNumber}</span
                                >
                                <span
                                    class="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700"
                                >
                                    {order.status === "measurement_scheduled"
                                        ? "Naplánováno"
                                        : "Kontaktováno"}
                                </span>
                            </div>
                            <h3
                                class="text-lg font-semibold text-slate-800 group-hover:text-futurol-green transition-colors"
                            >
                                {order.customer.fullName}
                            </h3>
                            <div
                                class="flex flex-wrap gap-4 text-sm text-slate-500"
                            >
                                {#if order.location}
                                    <span class="flex items-center gap-1.5">
                                        <MapPin class="w-4 h-4" />
                                        {order.location.city}, {order.location
                                            .street}
                                    </span>
                                {/if}
                                <span class="flex items-center gap-1.5">
                                    <Calendar class="w-4 h-4" />
                                    {formatDate(order.createdAt)}
                                </span>
                            </div>
                            {#if order.product}
                                <span
                                    class="inline-block px-2 py-1 text-xs rounded bg-slate-100 text-slate-600"
                                >
                                    {order.product.name}
                                </span>
                            {/if}
                        </div>
                        <ArrowRight
                            class="w-5 h-5 text-slate-400 group-hover:text-futurol-green transition-colors"
                        />
                    </div>
                </a>
            {/each}
        </div>
    {/if}
</div>
