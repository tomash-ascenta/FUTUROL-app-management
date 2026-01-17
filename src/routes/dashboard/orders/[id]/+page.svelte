<script lang="ts">
    import { page } from "$app/stores";
    import {
        ArrowLeft,
        User,
        MapPin,
        Package,
        Calendar,
        Clock,
        Ruler,
        FileText,
        Edit,
    } from "lucide-svelte";
    import type { PageData } from "./$types";
    import { getCustomerDisplayName, getPrimaryContact } from "$lib/utils";

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    // Dynamic back URL based on where user came from
    const backUrl = $derived(
        $page.url.searchParams.get("from") === "customer" &&
            $page.url.searchParams.get("customerId")
            ? `/dashboard/customers/${$page.url.searchParams.get("customerId")}`
            : "/dashboard/orders",
    );

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
        return new Date(dateString).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    function formatDateTime(dateString: string | null): string {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleString("cs-CZ", {
            day: "numeric",
            month: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <a
                href={backUrl}
                class="p-2 hover:bg-slate-100 rounded transition-colors"
            >
                <ArrowLeft class="w-5 h-5 text-slate-600" />
            </a>
            <div>
                <h1 class="text-2xl font-bold text-slate-800">
                    {data.order.orderNumber}
                </h1>
                <p class="text-slate-500 mt-1">Detail zakázky</p>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <span
                class="inline-flex px-3 py-1.5 rounded-full text-sm font-medium {statusColors[
                    data.order.status
                ] || 'bg-slate-100 text-slate-700'}"
            >
                {statusLabels[data.order.status] || data.order.status}
            </span>
            {#if data.canEdit}
                <a
                    href="/dashboard/orders/{data.order.id}/edit"
                    class="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                >
                    <Edit class="w-4 h-4" />
                    Upravit
                </a>
            {/if}
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-6">
            <!-- Customer & Location -->
            <div class="bg-white rounded shadow-sm border border-slate-200 p-6">
                <h2 class="text-lg font-semibold text-slate-800 mb-4">
                    Zákazník a místo realizace
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {#if data.order.customer}
                        <div class="flex items-start gap-3">
                            <div
                                class="w-10 h-10 bg-futurol-green/10 rounded flex items-center justify-center"
                            >
                                <User class="w-5 h-5 text-futurol-green" />
                            </div>
                            <div>
                                <p class="text-sm text-slate-500">Zákazník</p>
                                <a
                                    href="/dashboard/customers/{data.order
                                        .customer.id}"
                                    class="font-medium text-slate-900 hover:text-futurol-green"
                                >
                                    {getCustomerDisplayName(
                                        data.order.customer,
                                    )}
                                </a>
                                {#if getPrimaryContact(data.order.customer)?.phone}
                                    <p class="text-sm text-slate-500">
                                        {getPrimaryContact(data.order.customer)
                                            ?.phone}
                                    </p>
                                {/if}
                            </div>
                        </div>
                    {/if}

                    {#if data.order.location}
                        <div class="flex items-start gap-3">
                            <div
                                class="w-10 h-10 bg-blue-50 rounded flex items-center justify-center"
                            >
                                <MapPin class="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p class="text-sm text-slate-500">
                                    Místo realizace
                                </p>
                                <p class="font-medium text-slate-900">
                                    {data.order.location.street}
                                </p>
                                <p class="text-sm text-slate-500">
                                    {data.order.location.city}, {data.order
                                        .location.zip}
                                </p>
                            </div>
                        </div>
                    {:else}
                        <div class="flex items-start gap-3">
                            <div
                                class="w-10 h-10 bg-amber-50 rounded flex items-center justify-center"
                            >
                                <MapPin class="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p class="text-sm text-slate-500">
                                    Místo realizace
                                </p>
                                <p class="font-medium text-amber-600">
                                    Není definováno
                                </p>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Product -->
            {#if data.order.product}
                <div
                    class="bg-white rounded shadow-sm border border-slate-200 p-6"
                >
                    <h2 class="text-lg font-semibold text-slate-800 mb-4">
                        Produkt
                    </h2>
                    <div class="flex items-start gap-3">
                        <div
                            class="w-10 h-10 bg-purple-50 rounded flex items-center justify-center"
                        >
                            <Package class="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p class="font-medium text-slate-900">
                                {data.order.product.name}
                            </p>
                            <p class="text-sm text-slate-500">
                                {data.order.product.code}
                            </p>
                            {#if data.order.product.description}
                                <p class="text-sm text-slate-500 mt-1">
                                    {data.order.product.description}
                                </p>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Measurement -->
            {#if data.order.measurement}
                <div
                    class="bg-white rounded shadow-sm border border-slate-200 p-6"
                >
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-slate-800">
                            Zaměření
                        </h2>
                        <a
                            href="/dashboard/measurements/{data.order
                                .measurement.id}"
                            class="text-sm text-futurol-green hover:underline"
                        >
                            Detail zaměření
                        </a>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="flex items-center gap-2">
                            <Ruler class="w-4 h-4 text-slate-400" />
                            <div>
                                <p class="text-xs text-slate-500">Šířka</p>
                                <p class="font-medium">
                                    {data.order.measurement.width || "-"} mm
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <Ruler class="w-4 h-4 text-slate-400" />
                            <div>
                                <p class="text-xs text-slate-500">Výška</p>
                                <p class="font-medium">
                                    {data.order.measurement.height || "-"} mm
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <Ruler class="w-4 h-4 text-slate-400" />
                            <div>
                                <p class="text-xs text-slate-500">Hloubka</p>
                                <p class="font-medium">
                                    {data.order.measurement.depth || "-"} mm
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <Calendar class="w-4 h-4 text-slate-400" />
                            <div>
                                <p class="text-xs text-slate-500">Zaměřeno</p>
                                <p class="font-medium">
                                    {formatDate(
                                        data.order.measurement.measuredAt,
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            {:else}
                <div
                    class="bg-white rounded shadow-sm border border-slate-200 p-6"
                >
                    <h2 class="text-lg font-semibold text-slate-800 mb-4">
                        Zaměření
                    </h2>
                    <div
                        class="text-center py-6 text-slate-500 bg-slate-50 rounded"
                    >
                        <Ruler class="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p>Zatím nebylo provedeno zaměření</p>
                        {#if data.canCreateMeasurement}
                            <a
                                href="/dashboard/measurements/new/{data.order
                                    .id}"
                                class="inline-flex items-center gap-2 mt-3 text-futurol-green hover:underline"
                            >
                                + Vytvořit zaměření
                            </a>
                        {/if}
                    </div>
                </div>
            {/if}

            <!-- Status History -->
            <div class="bg-white rounded shadow-sm border border-slate-200 p-6">
                <h2 class="text-lg font-semibold text-slate-800 mb-4">
                    Historie změn
                </h2>
                {#if data.order.statusHistory.length > 0}
                    <div class="space-y-4">
                        {#each data.order.statusHistory as history}
                            <div
                                class="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0"
                            >
                                <div
                                    class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"
                                >
                                    <Clock class="w-4 h-4 text-slate-500" />
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        {#if history.fromStatus}
                                            <span
                                                class="text-sm text-slate-500"
                                            >
                                                {statusLabels[
                                                    history.fromStatus
                                                ] || history.fromStatus}
                                            </span>
                                            <span class="text-slate-400">→</span
                                            >
                                        {/if}
                                        <span class="text-sm font-medium">
                                            {statusLabels[history.toStatus] ||
                                                history.toStatus}
                                        </span>
                                    </div>
                                    {#if history.note}
                                        <p class="text-sm text-slate-500 mt-1">
                                            {history.note}
                                        </p>
                                    {/if}
                                    <p class="text-xs text-slate-400 mt-1">
                                        {formatDateTime(history.createdAt)}
                                        {#if history.changedBy}
                                            • {history.changedBy.fullName}
                                        {/if}
                                    </p>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="text-slate-500 text-center py-4">
                        Žádná historie změn
                    </p>
                {/if}
            </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
            <!-- Info card -->
            <div class="bg-white rounded shadow-sm border border-slate-200 p-6">
                <h3 class="font-semibold text-slate-800 mb-4">Informace</h3>
                <dl class="space-y-4">
                    <div>
                        <dt class="text-sm text-slate-500">Priorita</dt>
                        <dd>
                            <span
                                class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium {priorityColors[
                                    data.order.priority
                                ] || 'bg-slate-100 text-slate-600'}"
                            >
                                {priorityLabels[data.order.priority] ||
                                    data.order.priority}
                            </span>
                        </dd>
                    </div>
                    {#if data.order.quotes.length > 0}
                        {@const latestQuote = data.order.quotes[0]}
                        <div>
                            <dt class="text-sm text-slate-500">
                                Hodnota nabídky
                            </dt>
                            <dd class="font-medium text-slate-900">
                                {formatCurrency(latestQuote.amount)}
                                {#if latestQuote.status === "approved"}
                                    <span class="ml-1 text-xs text-green-600"
                                        >(schváleno)</span
                                    >
                                {:else if latestQuote.status === "sent"}
                                    <span class="ml-1 text-xs text-blue-600"
                                        >(odesláno)</span
                                    >
                                {/if}
                            </dd>
                        </div>
                    {/if}
                    {#if data.order.deadlineAt}
                        <div>
                            <dt class="text-sm text-slate-500">Termín</dt>
                            <dd class="font-medium text-slate-900">
                                {formatDate(data.order.deadlineAt)}
                            </dd>
                        </div>
                    {/if}
                    <div>
                        <dt class="text-sm text-slate-500">Vytvořeno</dt>
                        <dd class="flex items-center gap-2 text-slate-700">
                            <Calendar class="w-4 h-4" />
                            {formatDate(data.order.createdAt)}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm text-slate-500">Poslední úprava</dt>
                        <dd class="text-slate-700">
                            {formatDate(data.order.updatedAt)}
                        </dd>
                    </div>
                </dl>
            </div>

            <!-- Quick actions -->
            <div class="bg-white rounded shadow-sm border border-slate-200 p-6">
                <h3 class="font-semibold text-slate-800 mb-4">Rychlé akce</h3>
                <div class="space-y-2">
                    {#if !data.order.measurement && data.canCreateMeasurement}
                        <a
                            href="/dashboard/measurements/new/{data.order.id}"
                            class="flex items-center gap-2 w-full px-4 py-2 text-left rounded hover:bg-slate-50 transition-colors"
                        >
                            <Ruler class="w-4 h-4 text-slate-500" />
                            <span>Přidat zaměření</span>
                        </a>
                    {/if}
                    {#if data.order.customer}
                        <a
                            href="/dashboard/service/new?customerId={data.order
                                .customer.id}&orderId={data.order.id}"
                            class="flex items-center gap-2 w-full px-4 py-2 text-left rounded hover:bg-slate-50 transition-colors"
                        >
                            <FileText class="w-4 h-4 text-slate-500" />
                            <span>Vytvořit servisní požadavek</span>
                        </a>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
