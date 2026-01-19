<script lang="ts">
    import {
        ArrowLeft,
        MapPin,
        User,
        Calendar,
        Wrench,
        FileText,
        Check,
        Download,
        Mail,
        CheckCircle,
        Clock,
        Play,
        Save,
        Phone,
        Building2,
        Ruler,
    } from "lucide-svelte";
    import type { PageData } from "./$types";
    import { goto, invalidateAll } from "$app/navigation";
    import {
        generateInstallationPdfBase64,
        generateInstallationPdf,
    } from "$lib/utils/installationPdf";
    import { getCustomerDisplayName, getPrimaryContact } from "$lib/utils";
    import {
        INSTALLATION_CHECKLIST,
        getChecklistProgress,
        isChecklistComplete,
    } from "$lib/config/installationChecklist";
    import SendEmailModal from "$lib/components/SendEmailModal.svelte";

    let { data }: { data: PageData } = $props();

    let installation = $state(data.installation);
    let checklist = $state(
        (installation.checklist || {}) as Record<string, boolean>,
    );

    // Edit states
    let isSaving = $state(false);
    let showEmailModal = $state(false);
    let workNotes = $state(installation.workNotes || "");
    let handoverNotes = $state(installation.handoverNotes || "");
    let selectedTechnician = $state(installation.technicianId);
    let scheduledAt = $state(
        installation.scheduledAt ? installation.scheduledAt.split("T")[0] : "",
    );

    // Computed
    let progress = $derived(getChecklistProgress(checklist));
    let isComplete = $derived(isChecklistComplete(checklist));

    function formatDate(date: string | null) {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    function formatDateTime(date: string | null) {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getStatusConfig(status: string) {
        const configs: Record<
            string,
            {
                label: string;
                color: string;
                bgColor: string;
                icon: typeof Clock;
            }
        > = {
            planned: {
                label: "Naplánováno",
                color: "text-blue-700",
                bgColor: "bg-blue-100",
                icon: Calendar,
            },
            in_progress: {
                label: "Probíhá",
                color: "text-amber-700",
                bgColor: "bg-amber-100",
                icon: Play,
            },
            completed: {
                label: "Dokončeno",
                color: "text-green-700",
                bgColor: "bg-green-100",
                icon: CheckCircle,
            },
        };
        return (
            configs[status] || {
                label: status,
                color: "text-slate-700",
                bgColor: "bg-slate-100",
                icon: Clock,
            }
        );
    }

    // Customer email
    function getCustomerEmail(): string | null {
        const primaryContact = installation.order?.customer
            ? getPrimaryContact(installation.order.customer)
            : null;
        return (
            primaryContact?.email || installation.order?.customer?.email || null
        );
    }

    // Toggle checklist item
    async function toggleChecklistItem(key: string) {
        if (!data.canEdit) return;

        checklist = { ...checklist, [key]: !checklist[key] };
        await saveChanges();
    }

    // Save all changes
    async function saveChanges() {
        isSaving = true;
        try {
            const response = await fetch(
                `/api/installations/${installation.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        checklist,
                        workNotes: workNotes || null,
                        handoverNotes: handoverNotes || null,
                        technicianId: selectedTechnician,
                        scheduledAt: scheduledAt || null,
                    }),
                },
            );

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Chyba při ukládání");
            }

            const result = await response.json();
            installation = result.installation;
        } catch (err) {
            console.error("Save error:", err);
            alert(
                "Chyba při ukládání: " +
                    (err instanceof Error ? err.message : "Neznámá chyba"),
            );
        } finally {
            isSaving = false;
        }
    }

    // Change status
    async function changeStatus(newStatus: string) {
        if (!data.canEdit) return;

        isSaving = true;
        try {
            const response = await fetch(
                `/api/installations/${installation.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                },
            );

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Chyba při změně stavu");
            }

            const result = await response.json();
            installation = result.installation;
        } catch (err) {
            console.error("Status change error:", err);
            alert(
                "Chyba: " +
                    (err instanceof Error ? err.message : "Neznámá chyba"),
            );
        } finally {
            isSaving = false;
        }
    }

    // Download PDF
    function downloadPdf() {
        generateInstallationPdf(
            installation as Parameters<typeof generateInstallationPdf>[0],
        );
    }

    // Send email
    async function handleSendEmail(
        recipientEmail: string,
        customMessage: string,
    ) {
        const pdfBase64 = generateInstallationPdfBase64(
            installation as Parameters<typeof generateInstallationPdfBase64>[0],
        );

        const response = await fetch(
            `/api/installations/${installation.id}/send-email`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipientEmail,
                    customMessage: customMessage || undefined,
                    pdfBase64,
                }),
            },
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Nepodařilo se odeslat email");
        }

        const result = await response.json();
        installation = {
            ...installation,
            emailSentAt: result.sentAt,
            emailSentTo: result.sentTo,
        };
    }

    const statusConfig = $derived(getStatusConfig(installation.status));
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
        <div class="flex items-center gap-4">
            <button
                onclick={() => goto("/dashboard/installations")}
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
                <ArrowLeft class="w-5 h-5 text-slate-600" />
            </button>
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-2xl font-bold text-slate-800">
                        Montáž {installation.order?.orderNumber}
                    </h1>
                    <span
                        class="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full {statusConfig.bgColor} {statusConfig.color}"
                    >
                        <svelte:component
                            this={statusConfig.icon}
                            class="w-4 h-4"
                        />
                        {statusConfig.label}
                    </span>
                </div>
                {#if installation.order?.product}
                    <p class="text-slate-500 mt-1">
                        {installation.order.product.name}
                    </p>
                {/if}
            </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
            <button
                onclick={downloadPdf}
                class="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
                <Download class="w-4 h-4" />
                PDF
            </button>
            {#if data.canSendEmail}
                <button
                    onclick={() => (showEmailModal = true)}
                    class="flex items-center gap-2 px-4 py-2 bg-futurol-wine text-white rounded-lg hover:bg-futurol-wine/90 transition-colors"
                >
                    <Mail class="w-4 h-4" />
                    Odeslat
                </button>
            {/if}
        </div>
    </div>

    <!-- Email sent indicator -->
    {#if installation.emailSentAt}
        <div
            class="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg"
        >
            <CheckCircle class="w-5 h-5 text-green-600" />
            <span class="text-sm text-green-800">
                Protokol odeslán na <strong>{installation.emailSentTo}</strong>
                dne {formatDateTime(installation.emailSentAt)}
            </span>
        </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column - Info -->
        <div class="lg:col-span-1 space-y-6">
            <!-- Customer Info -->
            <div
                class="bg-white rounded-lg shadow-sm border border-slate-200 p-5"
            >
                <h3
                    class="font-semibold text-slate-800 mb-4 flex items-center gap-2"
                >
                    <Building2 class="w-5 h-5 text-slate-400" />
                    Zákazník
                </h3>
                {#if installation.order?.customer}
                    <div class="space-y-3">
                        <div>
                            <p class="font-medium text-slate-800">
                                {getCustomerDisplayName(
                                    installation.order.customer,
                                )}
                            </p>
                            {#if installation.order.customer.ico}
                                <p class="text-sm text-slate-500">
                                    IČO: {installation.order.customer.ico}
                                </p>
                            {/if}
                        </div>
                        {#if installation.order.location}
                            <div
                                class="flex items-start gap-2 text-sm text-slate-600"
                            >
                                <MapPin class="w-4 h-4 mt-0.5 text-slate-400" />
                                <div>
                                    <p>{installation.order.location.street}</p>
                                    <p>
                                        {installation.order.location.city}
                                        {installation.order.location.zip}
                                    </p>
                                </div>
                            </div>
                        {/if}
                        {#each installation.order.customer.contacts.slice(0, 1) as contact}
                            <div
                                class="flex items-center gap-2 text-sm text-slate-600"
                            >
                                <User class="w-4 h-4 text-slate-400" />
                                {contact.fullName}
                            </div>
                            {#if contact.phone}
                                <div
                                    class="flex items-center gap-2 text-sm text-slate-600"
                                >
                                    <Phone class="w-4 h-4 text-slate-400" />
                                    <a
                                        href="tel:{contact.phone}"
                                        class="hover:text-futurol-wine"
                                        >{contact.phone}</a
                                    >
                                </div>
                            {/if}
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Technician & Schedule -->
            <div
                class="bg-white rounded-lg shadow-sm border border-slate-200 p-5"
            >
                <h3
                    class="font-semibold text-slate-800 mb-4 flex items-center gap-2"
                >
                    <Wrench class="w-5 h-5 text-slate-400" />
                    Montáž
                </h3>
                <div class="space-y-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-600 mb-1"
                            >Technik</label
                        >
                        {#if data.canEdit}
                            <select
                                bind:value={selectedTechnician}
                                onchange={saveChanges}
                                class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-futurol-wine/20 focus:border-futurol-wine"
                            >
                                {#each data.technicians as tech}
                                    <option value={tech.id}
                                        >{tech.fullName}</option
                                    >
                                {/each}
                            </select>
                        {:else}
                            <p class="text-slate-800">
                                {installation.technician?.fullName || "—"}
                            </p>
                        {/if}
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-600 mb-1"
                            >Plánovaný termín</label
                        >
                        {#if data.canEdit}
                            <input
                                type="date"
                                bind:value={scheduledAt}
                                onchange={saveChanges}
                                class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-futurol-wine/20 focus:border-futurol-wine"
                            />
                        {:else}
                            <p class="text-slate-800">
                                {formatDate(installation.scheduledAt)}
                            </p>
                        {/if}
                    </div>
                    {#if installation.completedAt}
                        <div>
                            <label
                                class="block text-sm font-medium text-slate-600 mb-1"
                                >Dokončeno</label
                            >
                            <p class="text-slate-800">
                                {formatDateTime(installation.completedAt)}
                            </p>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Measurement Info -->
            {#if installation.order?.measurement}
                <div
                    class="bg-white rounded-lg shadow-sm border border-slate-200 p-5"
                >
                    <h3
                        class="font-semibold text-slate-800 mb-4 flex items-center gap-2"
                    >
                        <Ruler class="w-5 h-5 text-slate-400" />
                        Zaměření
                    </h3>
                    <div class="space-y-2 text-sm">
                        <p>
                            <span class="text-slate-500">Typ:</span>
                            <span class="font-medium"
                                >{installation.order.measurement
                                    .pergolaType}</span
                            >
                        </p>
                        <p>
                            <span class="text-slate-500">Rozměry:</span>
                            <span class="font-medium">
                                {installation.order.measurement.width} × {installation
                                    .order.measurement.depth} × {installation
                                    .order.measurement.height} mm
                            </span>
                        </p>
                    </div>
                </div>
            {/if}

            <!-- Status Actions -->
            {#if data.canEdit}
                <div
                    class="bg-white rounded-lg shadow-sm border border-slate-200 p-5"
                >
                    <h3 class="font-semibold text-slate-800 mb-4">
                        Změnit stav
                    </h3>
                    <div class="flex flex-wrap gap-2">
                        {#if installation.status === "planned"}
                            <button
                                onclick={() => changeStatus("in_progress")}
                                disabled={isSaving}
                                class="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                            >
                                <Play class="w-4 h-4" />
                                Zahájit montáž
                            </button>
                        {/if}
                        {#if installation.status === "in_progress"}
                            <button
                                onclick={() => changeStatus("completed")}
                                disabled={isSaving || !isComplete}
                                class="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                                title={!isComplete
                                    ? "Nejdříve dokončete všechny položky checklistu"
                                    : ""}
                            >
                                <CheckCircle class="w-4 h-4" />
                                Dokončit montáž
                            </button>
                        {/if}
                        {#if installation.status === "completed"}
                            <p
                                class="text-sm text-green-600 flex items-center gap-2"
                            >
                                <CheckCircle class="w-4 h-4" />
                                Montáž byla dokončena
                            </p>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>

        <!-- Right Column - Checklist & Notes -->
        <div class="lg:col-span-2 space-y-6">
            <!-- Progress -->
            <div
                class="bg-white rounded-lg shadow-sm border border-slate-200 p-5"
            >
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-slate-800">Průběh montáže</h3>
                    <span class="text-lg font-bold text-futurol-wine"
                        >{progress}%</span
                    >
                </div>
                <div
                    class="w-full h-3 bg-slate-200 rounded-full overflow-hidden"
                >
                    <div
                        class="h-full bg-futurol-green rounded-full transition-all duration-300"
                        style="width: {progress}%"
                    ></div>
                </div>
            </div>

            <!-- Checklist -->
            <div
                class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
            >
                <div class="p-5 border-b border-slate-200">
                    <h3
                        class="font-semibold text-slate-800 flex items-center gap-2"
                    >
                        <FileText class="w-5 h-5 text-slate-400" />
                        Montážní checklist
                    </h3>
                </div>
                <div class="divide-y divide-slate-100">
                    {#each INSTALLATION_CHECKLIST as section}
                        <div class="p-5">
                            <h4 class="font-medium text-slate-700 mb-3">
                                {section.label}
                            </h4>
                            <div class="space-y-2">
                                {#each section.items as item}
                                    <label
                                        class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors {!data.canEdit
                                            ? 'pointer-events-none'
                                            : ''}"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checklist[item.id] ||
                                                false}
                                            onchange={() =>
                                                toggleChecklistItem(item.id)}
                                            disabled={!data.canEdit || isSaving}
                                            class="w-5 h-5 rounded border-slate-300 text-futurol-green focus:ring-futurol-green"
                                        />
                                        <span
                                            class="flex-1 {checklist[item.id]
                                                ? 'text-slate-400 line-through'
                                                : 'text-slate-700'}"
                                        >
                                            {item.label}
                                        </span>
                                        {#if checklist[item.id]}
                                            <Check
                                                class="w-5 h-5 text-green-500"
                                            />
                                        {/if}
                                    </label>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Notes -->
            <div
                class="bg-white rounded-lg shadow-sm border border-slate-200 p-5"
            >
                <h3 class="font-semibold text-slate-800 mb-4">Poznámky</h3>
                <div class="space-y-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-600 mb-2"
                            >Pracovní poznámky</label
                        >
                        {#if data.canEdit}
                            <textarea
                                bind:value={workNotes}
                                onblur={saveChanges}
                                rows={3}
                                placeholder="Poznámky k průběhu montáže..."
                                class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-futurol-wine/20 focus:border-futurol-wine resize-none"
                            ></textarea>
                        {:else}
                            <p class="text-slate-600 whitespace-pre-wrap">
                                {workNotes || "—"}
                            </p>
                        {/if}
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-600 mb-2"
                            >Poznámky k předání</label
                        >
                        {#if data.canEdit}
                            <textarea
                                bind:value={handoverNotes}
                                onblur={saveChanges}
                                rows={3}
                                placeholder="Poznámky pro zákazníka při předání..."
                                class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-futurol-wine/20 focus:border-futurol-wine resize-none"
                            ></textarea>
                        {:else}
                            <p class="text-slate-600 whitespace-pre-wrap">
                                {handoverNotes || "—"}
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Email Modal -->
{#if showEmailModal}
    <SendEmailModal
        isOpen={showEmailModal}
        customerEmail={getCustomerEmail()}
        orderNumber={installation.order?.orderNumber || ""}
        measurementId={installation.id}
        onClose={() => (showEmailModal = false)}
        onSend={handleSendEmail}
    />
{/if}
