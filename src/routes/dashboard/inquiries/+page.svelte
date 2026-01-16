<script lang="ts">
    import {
        MessageSquare,
        Phone,
        Mail,
        Calendar,
        User,
        CheckCircle2,
        Clock,
        FileText,
        Trophy,
        XCircle,
        UserPlus,
        Loader2,
        ExternalLink,
    } from "lucide-svelte";
    import { invalidateAll } from "$app/navigation";

    interface InquiryData {
        id: string;
        fullName: string;
        email: string;
        phone: string;
        note: string | null;
        purpose: string;
        size: string;
        roofType: string;
        extras: string[];
        budget: string;
        recommendedProduct: string;
        status: string;
        customerId: string | null;
        customer: { id: string; fullName: string } | null;
        createdAt: string | Date;
    }

    interface PageData {
        inquiries: InquiryData[];
        canConvert: boolean;
    }

    let { data }: { data: PageData } = $props();

    let convertingId = $state<string | null>(null);
    let errorMessage = $state("");

    const statusConfig: Record<
        string,
        { label: string; color: string; icon: typeof Clock }
    > = {
        new: { label: "Nová", color: "bg-blue-100 text-blue-700", icon: Clock },
        converted: {
            label: "Zpracováno",
            color: "bg-green-100 text-green-700",
            icon: CheckCircle2,
        },
        lost: {
            label: "Ztraceno",
            color: "bg-red-100 text-red-700",
            icon: XCircle,
        },
    };

    const budgetLabels: Record<string, string> = {
        economy: "Do 150 000 Kč",
        standard: "150 - 300 000 Kč",
        premium: "300 - 500 000 Kč",
        luxury: "500 000+ Kč",
    };

    const purposeLabels: Record<string, string> = {
        relax: "Relaxace",
        dining: "Jídelna",
        pool: "Bazén",
        parking: "Parkování",
    };

    function formatDate(date: string | Date) {
        return new Date(date).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getRelativeTime(date: string | Date) {
        const now = new Date();
        const then = new Date(date);
        const diffMs = now.getTime() - then.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return "Právě teď";
        if (diffHours < 24) return `Před ${diffHours}h`;
        if (diffDays < 7) return `Před ${diffDays}d`;
        return formatDate(date);
    }

    async function convertToCustomer(inquiryId: string) {
        if (convertingId) return;

        convertingId = inquiryId;
        errorMessage = "";

        try {
            const response = await fetch(
                `/api/inquiries/${inquiryId}/convert`,
                {
                    method: "POST",
                },
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Chyba při konverzi");
            }

            // Refresh data
            await invalidateAll();
        } catch (e) {
            errorMessage = e instanceof Error ? e.message : "Nastala chyba";
        } finally {
            convertingId = null;
        }
    }

    // Stats - simple: new or converted
    const stats = $derived({
        total: data.inquiries.length,
        new: data.inquiries.filter((i) => i.status === "new").length,
        converted: data.inquiries.filter((i) => i.status === "converted")
            .length,
    });
</script>

<svelte:head>
    <title>Poptávky | FUTUROL</title>
</svelte:head>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Poptávky z rádce</h1>
            <p class="text-slate-500 text-sm mt-1">
                Správa poptávek z online rádce při výběru pergoly
            </p>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-200">
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center"
                >
                    <MessageSquare class="w-5 h-5 text-slate-600" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-slate-800">
                        {stats.total}
                    </p>
                    <p class="text-xs text-slate-500">Celkem</p>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-200">
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
                >
                    <Clock class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-blue-600">{stats.new}</p>
                    <p class="text-xs text-slate-500">Nové</p>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-200">
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"
                >
                    <CheckCircle2 class="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-green-600">
                        {stats.converted}
                    </p>
                    <p class="text-xs text-slate-500">Zpracováno</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Error message -->
    {#if errorMessage}
        <div
            class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
        >
            {errorMessage}
        </div>
    {/if}

    <!-- Inquiries List -->
    {#if data.inquiries.length === 0}
        <div
            class="bg-white rounded-xl border border-slate-200 p-12 text-center"
        >
            <div
                class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
                <MessageSquare class="w-8 h-8 text-slate-400" />
            </div>
            <h3 class="text-lg font-medium text-slate-800 mb-2">
                Zatím žádné poptávky
            </h3>
            <p class="text-slate-500 text-sm">
                Poptávky z online rádce se zobrazí zde
            </p>
        </div>
    {:else}
        <div
            class="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
            <div class="divide-y divide-slate-100">
                {#each data.inquiries as inquiry}
                    {@const status =
                        statusConfig[inquiry.status] || statusConfig.new}
                    <div class="p-4 hover:bg-slate-50 transition-colors">
                        <div class="flex items-start gap-4">
                            <!-- Avatar -->
                            <div
                                class="w-12 h-12 bg-futurol-wine/10 rounded-full flex items-center justify-center flex-shrink-0"
                            >
                                <User class="w-6 h-6 text-futurol-wine" />
                            </div>

                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                                <div
                                    class="flex items-start justify-between gap-4"
                                >
                                    <div>
                                        <h3
                                            class="font-semibold text-slate-800"
                                        >
                                            {inquiry.fullName}
                                        </h3>
                                        <div
                                            class="flex items-center gap-3 text-sm text-slate-500 mt-1"
                                        >
                                            <span
                                                class="inline-flex items-center gap-1"
                                            >
                                                <Mail class="w-3.5 h-3.5" />
                                                {inquiry.email}
                                            </span>
                                            <span
                                                class="inline-flex items-center gap-1"
                                            >
                                                <Phone class="w-3.5 h-3.5" />
                                                {inquiry.phone}
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        class="flex items-center gap-2 flex-shrink-0"
                                    >
                                        <span
                                            class="px-2.5 py-1 rounded-full text-xs font-medium {status.color}"
                                        >
                                            {status.label}
                                        </span>
                                        <span class="text-xs text-slate-400">
                                            {getRelativeTime(inquiry.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <!-- Product & Details -->
                                <div
                                    class="mt-3 flex flex-wrap items-center gap-2"
                                >
                                    <span
                                        class="inline-flex items-center gap-1 px-2 py-1 bg-futurol-wine/10 text-futurol-wine rounded-lg text-xs font-medium"
                                    >
                                        🏠 {inquiry.recommendedProduct}
                                    </span>
                                    <span
                                        class="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs"
                                    >
                                        {purposeLabels[inquiry.purpose] ||
                                            inquiry.purpose}
                                    </span>
                                    <span
                                        class="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs"
                                    >
                                        {budgetLabels[inquiry.budget] ||
                                            inquiry.budget}
                                    </span>
                                    {#if inquiry.extras && inquiry.extras.length > 0}
                                        <span
                                            class="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs"
                                        >
                                            +{inquiry.extras.length} doplňků
                                        </span>
                                    {/if}
                                </div>

                                {#if inquiry.note}
                                    <p
                                        class="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg"
                                    >
                                        "{inquiry.note}"
                                    </p>
                                {/if}
                            </div>

                            <!-- Actions -->
                            <div class="flex items-center gap-2 flex-shrink-0">
                                {#if inquiry.status === "converted" && inquiry.customer}
                                    <!-- Link to customer -->
                                    <a
                                        href="/dashboard/customers/{inquiry
                                            .customer.id}"
                                        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                                    >
                                        <ExternalLink class="w-4 h-4" />
                                        Zákazník
                                    </a>
                                {:else if inquiry.status !== "converted" && inquiry.status !== "lost" && data.canConvert}
                                    <!-- Convert button -->
                                    <button
                                        onclick={() =>
                                            convertToCustomer(inquiry.id)}
                                        disabled={convertingId === inquiry.id}
                                        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-futurol-green text-white rounded-lg text-sm font-medium hover:bg-futurol-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {#if convertingId === inquiry.id}
                                            <Loader2
                                                class="w-4 h-4 animate-spin"
                                            />
                                            Vytvářím...
                                        {:else}
                                            <UserPlus class="w-4 h-4" />
                                            Založit zákazníka
                                        {/if}
                                    </button>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
