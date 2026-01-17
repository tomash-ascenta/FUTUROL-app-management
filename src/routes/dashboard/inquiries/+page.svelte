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
        Building2,
        Globe,
        PhoneCall,
        Users,
        X,
        Ban,
    } from "lucide-svelte";
    import { invalidateAll } from "$app/navigation";
    import { goto } from "$app/navigation";

    interface LeadData {
        id: string;
        originalName: string;
        originalPhone: string;
        originalEmail: string | null;
        originalCompany: string | null;
        source: string;
        channel: string | null;
        answers: Record<string, number[]> | null;
        scores: Record<string, number> | null;
        recommendedProduct: string | null;
        customerNote: string | null;
        status: string;
        lostReason: string | null;
        lostNote: string | null;
        convertedById: string | null;
        convertedAt: string | null;
        convertedBy: {
            id: string;
            fullName: string;
        } | null;
        createdAt: string;
        updatedAt: string;
        customer: {
            id: string;
            fullName: string | null;
            companyName: string | null;
            type: string;
        } | null;
    }

    interface PageData {
        leads: LeadData[];
        canConvert: boolean;
    }

    let { data }: { data: PageData } = $props();

    // State
    let processingId = $state<string | null>(null);
    let errorMessage = $state("");

    // Reject modal state
    let showRejectModal = $state(false);
    let rejectingLead = $state<LeadData | null>(null);
    let rejectReason = $state("");
    let rejectNote = $state("");

    // Convert modal state
    let showConvertModal = $state(false);
    let convertingLead = $state<LeadData | null>(null);
    let customerType = $state<"B2C" | "B2B">("B2C");
    let companyName = $state("");
    let ico = $state("");
    let dic = $state("");

    const statusConfig: Record<
        string,
        { label: string; color: string; icon: typeof Clock }
    > = {
        new: { label: "Nový", color: "bg-blue-100 text-blue-700", icon: Clock },
        contacted: {
            label: "Kontaktováno",
            color: "bg-yellow-100 text-yellow-700",
            icon: PhoneCall,
        },
        converted: {
            label: "Konvertováno",
            color: "bg-green-100 text-green-700",
            icon: CheckCircle2,
        },
        lost: {
            label: "Zamítnuto",
            color: "bg-red-100 text-red-700",
            icon: XCircle,
        },
    };

    const sourceConfig: Record<
        string,
        { label: string; icon: typeof Globe; color: string }
    > = {
        advisor: {
            label: "Rádce",
            icon: Trophy,
            color: "bg-purple-100 text-purple-700",
        },
        web: { label: "Web", icon: Globe, color: "bg-blue-100 text-blue-700" },
        phone: {
            label: "Telefon",
            icon: PhoneCall,
            color: "bg-green-100 text-green-700",
        },
        email: {
            label: "Email",
            icon: Mail,
            color: "bg-orange-100 text-orange-700",
        },
        referral: {
            label: "Doporučení",
            icon: Users,
            color: "bg-pink-100 text-pink-700",
        },
    };

    const lostReasons: Record<string, string> = {
        price: "Cena",
        timing: "Termín",
        competitor: "Konkurence",
        no_response: "Nereaguje",
        not_relevant: "Nemá zájem",
        other: "Jiný důvod",
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

    // Open convert modal
    function openConvertModal(lead: LeadData) {
        convertingLead = lead;
        customerType = lead.originalCompany ? "B2B" : "B2C";
        companyName = lead.originalCompany || "";
        ico = "";
        dic = "";
        showConvertModal = true;
    }

    // Open reject modal
    function openRejectModal(lead: LeadData) {
        rejectingLead = lead;
        rejectReason = "";
        rejectNote = "";
        showRejectModal = true;
    }

    // Convert lead to customer
    async function convertToCustomer() {
        if (!convertingLead || processingId) return;

        processingId = convertingLead.id;
        errorMessage = "";

        try {
            const body: Record<string, string> = { type: customerType };
            if (customerType === "B2B") {
                body.companyName = companyName;
                body.ico = ico;
                body.dic = dic;
            }

            const response = await fetch(
                `/api/leads/${convertingLead.id}/convert`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                },
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Chyba při konverzi");
            }

            showConvertModal = false;
            convertingLead = null;

            // Refresh data
            await invalidateAll();

            // Optionally navigate to customer
            if (result.customerId) {
                goto(`/dashboard/customers/${result.customerId}`);
            }
        } catch (e) {
            errorMessage = e instanceof Error ? e.message : "Nastala chyba";
        } finally {
            processingId = null;
        }
    }

    // Reject lead
    async function rejectLead() {
        if (!rejectingLead || !rejectReason || processingId) return;

        processingId = rejectingLead.id;
        errorMessage = "";

        try {
            const response = await fetch(
                `/api/leads/${rejectingLead.id}/reject`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        reason: rejectReason,
                        note: rejectNote,
                    }),
                },
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Chyba při zamítání");
            }

            showRejectModal = false;
            rejectingLead = null;

            // Refresh data
            await invalidateAll();
        } catch (e) {
            errorMessage = e instanceof Error ? e.message : "Nastala chyba";
        } finally {
            processingId = null;
        }
    }

    // Stats
    const stats = $derived({
        total: data.leads.length,
        new: data.leads.filter((l) => l.status === "new").length,
        converted: data.leads.filter((l) => l.status === "converted").length,
        lost: data.leads.filter((l) => l.status === "lost").length,
    });

    // Active tab
    let activeTab = $state<"new" | "processed">("new");

    // Filtered leads based on active tab
    // "new" tab: sorted by createdAt (newest first)
    // "processed" tab: only converted/lost, sorted by updatedAt (recently modified first)
    const filteredLeads = $derived.by(() => {
        if (activeTab === "new") {
            return data.leads
                .filter((l) => l.status === "new")
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                );
        } else {
            return data.leads
                .filter((l) => l.status === "converted" || l.status === "lost")
                .sort(
                    (a, b) =>
                        new Date(b.updatedAt).getTime() -
                        new Date(a.updatedAt).getTime(),
                );
        }
    });

    // Count of processed leads
    const processedCount = $derived(stats.converted + stats.lost);
</script>

<svelte:head>
    <title>Poptávky | FUTUROL</title>
</svelte:head>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Poptávky</h1>
            <p class="text-slate-500 text-sm mt-1">
                Správa kontaktů a poptávek z různých zdrojů
            </p>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-4 gap-3">
        <div class="bg-white rounded p-4 border border-slate-200">
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 bg-slate-100 rounded flex items-center justify-center"
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
        <div class="bg-white rounded p-4 border border-slate-200">
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 bg-blue-100 rounded flex items-center justify-center"
                >
                    <Clock class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-blue-600">{stats.new}</p>
                    <p class="text-xs text-slate-500">Nové</p>
                </div>
            </div>
        </div>
        <div class="bg-white rounded p-4 border border-slate-200">
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 bg-green-100 rounded flex items-center justify-center"
                >
                    <CheckCircle2 class="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-green-600">
                        {stats.converted}
                    </p>
                    <p class="text-xs text-slate-500">Konvertováno</p>
                </div>
            </div>
        </div>
        <div class="bg-white rounded p-4 border border-slate-200">
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 bg-red-100 rounded flex items-center justify-center"
                >
                    <XCircle class="w-5 h-5 text-red-600" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-red-600">
                        {stats.lost}
                    </p>
                    <p class="text-xs text-slate-500">Zamítnuto</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Error message -->
    {#if errorMessage}
        <div class="p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {errorMessage}
        </div>
    {/if}

    <!-- Tabs -->
    <div class="bg-white rounded border border-slate-200">
        <div class="border-b border-slate-200">
            <nav class="flex -mb-px">
                <button
                    onclick={() => (activeTab = "new")}
                    class="px-6 py-4 text-sm font-medium border-b-2 transition-colors {activeTab ===
                    'new'
                        ? 'border-futurol-green text-futurol-green'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
                >
                    <span class="inline-flex items-center gap-2">
                        <Clock class="w-4 h-4" />
                        Nové
                        {#if stats.new > 0}
                            <span
                                class="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700"
                            >
                                {stats.new}
                            </span>
                        {/if}
                    </span>
                </button>
                <button
                    onclick={() => (activeTab = "processed")}
                    class="px-6 py-4 text-sm font-medium border-b-2 transition-colors {activeTab ===
                    'processed'
                        ? 'border-futurol-green text-futurol-green'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
                >
                    <span class="inline-flex items-center gap-2">
                        <CheckCircle2 class="w-4 h-4" />
                        Zpracováno
                        <span
                            class="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600"
                        >
                            {processedCount}
                        </span>
                    </span>
                </button>
            </nav>
        </div>

        <!-- Leads List -->
        {#if filteredLeads.length === 0}
            <div class="p-12 text-center">
                <div
                    class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    {#if activeTab === "new"}
                        <CheckCircle2 class="w-8 h-8 text-green-400" />
                    {:else}
                        <MessageSquare class="w-8 h-8 text-slate-400" />
                    {/if}
                </div>
                <h3 class="text-lg font-medium text-slate-800 mb-2">
                    {#if activeTab === "new"}
                        Žádné nové poptávky
                    {:else}
                        Zatím žádné poptávky
                    {/if}
                </h3>
                <p class="text-slate-500 text-sm">
                    {#if activeTab === "new"}
                        Všechny poptávky byly zpracovány 🎉
                    {:else}
                        Poptávky z webu a rádce se zobrazí zde
                    {/if}
                </p>
            </div>
        {:else}
            <div class="divide-y divide-slate-100">
                {#each filteredLeads as lead}
                    {@const status =
                        statusConfig[lead.status] || statusConfig.new}
                    {@const source =
                        sourceConfig[lead.source] || sourceConfig.web}
                    {@const SourceIcon = source.icon}
                    <div class="p-4 hover:bg-slate-50 transition-colors">
                        <div class="flex items-start gap-4">
                            <!-- Avatar -->
                            <div
                                class="w-12 h-12 bg-futurol-wine/10 rounded-full flex items-center justify-center flex-shrink-0"
                            >
                                {#if lead.originalCompany}
                                    <Building2
                                        class="w-6 h-6 text-futurol-wine"
                                    />
                                {:else}
                                    <User class="w-6 h-6 text-futurol-wine" />
                                {/if}
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
                                            {lead.originalName}
                                        </h3>
                                        {#if lead.originalCompany}
                                            <p class="text-sm text-slate-600">
                                                {lead.originalCompany}
                                            </p>
                                        {/if}
                                        <div
                                            class="flex items-center gap-3 text-sm text-slate-500 mt-1"
                                        >
                                            <span
                                                class="inline-flex items-center gap-1"
                                            >
                                                <Phone class="w-3.5 h-3.5" />
                                                {lead.originalPhone}
                                            </span>
                                            {#if lead.originalEmail}
                                                <span
                                                    class="inline-flex items-center gap-1"
                                                >
                                                    <Mail class="w-3.5 h-3.5" />
                                                    {lead.originalEmail}
                                                </span>
                                            {/if}
                                        </div>
                                    </div>
                                    <div
                                        class="flex flex-col items-end gap-1 flex-shrink-0"
                                    >
                                        <div class="flex items-center gap-2">
                                            <span
                                                class="px-2.5 py-1 rounded-full text-xs font-medium {status.color}"
                                            >
                                                {status.label}
                                            </span>
                                            <span
                                                class="text-xs text-slate-400"
                                            >
                                                {getRelativeTime(
                                                    lead.createdAt,
                                                )}
                                            </span>
                                        </div>
                                        {#if lead.convertedBy && (lead.status === "converted" || lead.status === "lost")}
                                            <span
                                                class="text-xs text-slate-500"
                                            >
                                                {lead.status === "converted"
                                                    ? "Konvertoval"
                                                    : "Zamítl"}: {lead
                                                    .convertedBy.fullName}
                                                {#if lead.convertedAt}
                                                    • {formatDate(
                                                        lead.convertedAt,
                                                    )}
                                                {/if}
                                            </span>
                                        {/if}
                                    </div>
                                </div>

                                <!-- Source & Details -->
                                <div
                                    class="mt-3 flex flex-wrap items-center gap-2"
                                >
                                    <span
                                        class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium {source.color}"
                                    >
                                        <SourceIcon class="w-3 h-3" />
                                        {source.label}
                                        {#if lead.channel}
                                            <span class="opacity-70"
                                                >• {lead.channel}</span
                                            >
                                        {/if}
                                    </span>
                                    {#if lead.recommendedProduct}
                                        <span
                                            class="inline-flex items-center gap-1 px-2 py-1 bg-futurol-wine/10 text-futurol-wine rounded text-xs font-medium"
                                        >
                                            🏠 {lead.recommendedProduct}
                                        </span>
                                    {/if}
                                    {#if lead.scores}
                                        {@const topScore = Math.max(
                                            ...Object.values(lead.scores),
                                        )}
                                        <span
                                            class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                                        >
                                            Skóre: {topScore} bodů
                                        </span>
                                    {/if}
                                </div>

                                {#if lead.customerNote}
                                    <p
                                        class="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded"
                                    >
                                        "{lead.customerNote}"
                                    </p>
                                {/if}

                                {#if lead.status === "lost" && lead.lostNote}
                                    <p
                                        class="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded"
                                    >
                                        {lostReasons[lead.lostReason || ""] ||
                                            "Zamítnuto"}: {lead.lostNote}
                                    </p>
                                {:else if lead.status === "lost" && lead.lostReason}
                                    <p
                                        class="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded"
                                    >
                                        Důvod: {lostReasons[lead.lostReason] ||
                                            lead.lostReason}
                                    </p>
                                {/if}
                            </div>

                            <!-- Actions -->
                            <div
                                class="flex flex-col items-end gap-2 flex-shrink-0"
                            >
                                {#if lead.status === "new" && data.canConvert}
                                    <button
                                        onclick={() => openConvertModal(lead)}
                                        disabled={processingId === lead.id}
                                        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-futurol-green text-white rounded text-sm font-medium hover:bg-futurol-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <UserPlus class="w-4 h-4" />
                                        Založit zákazníka
                                    </button>
                                    <button
                                        onclick={() => openRejectModal(lead)}
                                        disabled={processingId === lead.id}
                                        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Ban class="w-4 h-4" />
                                        Zamítnout
                                    </button>
                                {:else if lead.status === "converted"}
                                    {#if lead.customer}
                                        <a
                                            href="/dashboard/customers/{lead
                                                .customer.id}"
                                            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded text-sm font-medium hover:bg-green-100 transition-colors"
                                        >
                                            <CheckCircle2 class="w-4 h-4" />
                                            {lead.customer.type === "B2B" &&
                                            lead.customer.companyName
                                                ? lead.customer.companyName
                                                : lead.customer.fullName ||
                                                  "Zákazník"}
                                        </a>
                                    {:else}
                                        <span
                                            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded text-sm font-medium"
                                        >
                                            <CheckCircle2 class="w-4 h-4" />
                                            Zákazník vytvořen
                                        </span>
                                    {/if}
                                {:else if lead.status === "lost"}
                                    <span
                                        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded text-sm font-medium"
                                    >
                                        <XCircle class="w-4 h-4" />
                                        Zamítnuto
                                    </span>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<!-- Convert Modal -->
{#if showConvertModal && convertingLead}
    <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div class="p-6 border-b border-slate-200">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-slate-800">
                        Založit zákazníka
                    </h2>
                    <button
                        onclick={() => (showConvertModal = false)}
                        class="text-slate-400 hover:text-slate-600"
                    >
                        <X class="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div class="p-6 space-y-4">
                <div class="bg-slate-50 p-3 rounded">
                    <p class="font-medium text-slate-800">
                        {convertingLead.originalName}
                    </p>
                    <p class="text-sm text-slate-500">
                        {convertingLead.originalPhone}
                    </p>
                    {#if convertingLead.originalEmail}
                        <p class="text-sm text-slate-500">
                            {convertingLead.originalEmail}
                        </p>
                    {/if}
                </div>

                <fieldset>
                    <legend
                        class="block text-sm font-medium text-slate-700 mb-2"
                        >Typ zákazníka</legend
                    >
                    <div class="flex gap-3">
                        <button
                            type="button"
                            onclick={() => (customerType = "B2C")}
                            class="flex-1 py-3 px-4 rounded border-2 transition-colors {customerType ===
                            'B2C'
                                ? 'border-futurol-green bg-futurol-green/5'
                                : 'border-slate-200 hover:border-slate-300'}"
                        >
                            <User
                                class="w-6 h-6 mx-auto mb-1 {customerType ===
                                'B2C'
                                    ? 'text-futurol-green'
                                    : 'text-slate-400'}"
                            />
                            <p
                                class="font-medium {customerType === 'B2C'
                                    ? 'text-futurol-green'
                                    : 'text-slate-600'}"
                            >
                                B2C
                            </p>
                            <p class="text-xs text-slate-500">Soukromá osoba</p>
                        </button>
                        <button
                            type="button"
                            onclick={() => (customerType = "B2B")}
                            class="flex-1 py-3 px-4 rounded border-2 transition-colors {customerType ===
                            'B2B'
                                ? 'border-futurol-green bg-futurol-green/5'
                                : 'border-slate-200 hover:border-slate-300'}"
                        >
                            <Building2
                                class="w-6 h-6 mx-auto mb-1 {customerType ===
                                'B2B'
                                    ? 'text-futurol-green'
                                    : 'text-slate-400'}"
                            />
                            <p
                                class="font-medium {customerType === 'B2B'
                                    ? 'text-futurol-green'
                                    : 'text-slate-600'}"
                            >
                                B2B
                            </p>
                            <p class="text-xs text-slate-500">Firma / OSVČ</p>
                        </button>
                    </div>
                </fieldset>

                {#if customerType === "B2B"}
                    <div class="space-y-3">
                        <div>
                            <label
                                for="companyName"
                                class="block text-sm font-medium text-slate-700 mb-1"
                                >Název firmy *</label
                            >
                            <input
                                id="companyName"
                                type="text"
                                bind:value={companyName}
                                class="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                                placeholder="Např. FUTUROL s.r.o."
                            />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label
                                    for="ico"
                                    class="block text-sm font-medium text-slate-700 mb-1"
                                    >IČO</label
                                >
                                <input
                                    id="ico"
                                    type="text"
                                    bind:value={ico}
                                    class="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                                    placeholder="12345678"
                                />
                            </div>
                            <div>
                                <label
                                    for="dic"
                                    class="block text-sm font-medium text-slate-700 mb-1"
                                    >DIČ</label
                                >
                                <input
                                    id="dic"
                                    type="text"
                                    bind:value={dic}
                                    class="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                                    placeholder="CZ12345678"
                                />
                            </div>
                        </div>
                    </div>
                {/if}
            </div>

            <div class="p-6 border-t border-slate-200 flex gap-3">
                <button
                    onclick={() => (showConvertModal = false)}
                    class="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors"
                >
                    Zrušit
                </button>
                <button
                    onclick={convertToCustomer}
                    disabled={processingId !== null ||
                        (customerType === "B2B" && !companyName)}
                    class="flex-1 px-4 py-2 bg-futurol-green text-white rounded hover:bg-futurol-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                >
                    {#if processingId}
                        <Loader2 class="w-4 h-4 animate-spin" />
                        Vytvářím...
                    {:else}
                        <UserPlus class="w-4 h-4" />
                        Vytvořit zákazníka
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Reject Modal -->
{#if showRejectModal && rejectingLead}
    <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div class="p-6 border-b border-slate-200">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-slate-800">
                        Zamítnout lead
                    </h2>
                    <button
                        onclick={() => (showRejectModal = false)}
                        class="text-slate-400 hover:text-slate-600"
                    >
                        <X class="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div class="p-6 space-y-4">
                <div class="bg-slate-50 p-3 rounded">
                    <p class="font-medium text-slate-800">
                        {rejectingLead.originalName}
                    </p>
                    <p class="text-sm text-slate-500">
                        {rejectingLead.originalPhone}
                    </p>
                </div>

                <fieldset>
                    <legend
                        class="block text-sm font-medium text-slate-700 mb-2"
                        >Důvod zamítnutí *</legend
                    >
                    <div class="grid grid-cols-2 gap-2">
                        {#each Object.entries(lostReasons) as [key, label]}
                            <button
                                type="button"
                                onclick={() => (rejectReason = key)}
                                class="py-2 px-3 rounded border text-sm transition-colors {rejectReason ===
                                key
                                    ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'}"
                            >
                                {label}
                            </button>
                        {/each}
                    </div>
                </fieldset>

                <div>
                    <label
                        for="rejectNote"
                        class="block text-sm font-medium text-slate-700 mb-1"
                        >Poznámka (volitelné)</label
                    >
                    <textarea
                        id="rejectNote"
                        bind:value={rejectNote}
                        rows="3"
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
                        placeholder="Doplňující informace..."
                    ></textarea>
                </div>
            </div>

            <div class="p-6 border-t border-slate-200 flex gap-3">
                <button
                    onclick={() => (showRejectModal = false)}
                    class="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors"
                >
                    Zrušit
                </button>
                <button
                    onclick={rejectLead}
                    disabled={processingId !== null || !rejectReason}
                    class="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                >
                    {#if processingId}
                        <Loader2 class="w-4 h-4 animate-spin" />
                        Zamítám...
                    {:else}
                        <Ban class="w-4 h-4" />
                        Zamítnout
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}
