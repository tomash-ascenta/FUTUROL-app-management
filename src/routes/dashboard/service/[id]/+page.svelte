<script lang="ts">
    import { page } from "$app/stores";
    import {
        ArrowLeft,
        User,
        Phone,
        MapPin,
        Calendar,
        Clock,
        Wrench,
        AlertCircle,
        CheckCircle,
        Download,
        Mail,
    } from "lucide-svelte";
    import { getCustomerDisplayName, getPrimaryContact } from "$lib/utils";
    import {
        generateServicePdf,
        generateServicePdfBase64,
        type ServiceTicketData,
    } from "$lib/utils/servicePdf";
    import SendEmailModal from "$lib/components/SendEmailModal.svelte";

    interface Props {
        data: {
            ticket: {
                id: string;
                ticketNumber: string;
                type: string;
                status: string;
                priority: string;
                description: string;
                resolution: string | null;
                scheduledAt: string | null;
                resolvedAt: string | null;
                createdAt: string;
                customer: {
                    id: string;
                    type: string;
                    companyName: string | null;
                    contacts: Array<{
                        fullName: string;
                        phone: string;
                        email: string | null;
                        isPrimary: boolean;
                    }>;
                };
                order: {
                    id: string;
                    orderNumber: string;
                    location: {
                        city: string;
                        street: string;
                        zip: string;
                    } | null;
                    product: {
                        name: string;
                    } | null;
                } | null;
                assignedTo: {
                    id: string;
                    fullName: string;
                    personalNumber: string;
                    phone: string | null;
                } | null;
                emailSentAt: string | null;
                emailSentTo: string | null;
            };
            canEdit: boolean;
        };
    }

    let { data }: Props = $props();

    // Dynamic back URL based on where user came from
    const backUrl = $derived(
        $page.url.searchParams.get("from") === "customer" &&
            $page.url.searchParams.get("customerId")
            ? `/dashboard/customers/${$page.url.searchParams.get("customerId")}`
            : "/dashboard/service",
    );

    const statusLabels: Record<string, { label: string; color: string }> = {
        new_ticket: { label: "Nový", color: "bg-blue-100 text-blue-700" },
        assigned: {
            label: "Přiřazeno",
            color: "bg-purple-100 text-purple-700",
        },
        scheduled: {
            label: "Naplánováno",
            color: "bg-yellow-100 text-yellow-700",
        },
        in_progress: {
            label: "Probíhá",
            color: "bg-orange-100 text-orange-700",
        },
        resolved: { label: "Vyřešeno", color: "bg-green-100 text-green-700" },
        closed: { label: "Uzavřeno", color: "bg-slate-100 text-slate-700" },
    };

    const typeLabels: Record<string, string> = {
        warranty: "Záruka",
        paid: "Placený servis",
        maintenance: "Údržba",
        complaint: "Reklamace",
    };

    const priorityLabels: Record<string, { label: string; color: string }> = {
        low: { label: "Nízká", color: "text-slate-500" },
        normal: { label: "Normální", color: "text-blue-600" },
        high: { label: "Vysoká", color: "text-orange-600" },
        urgent: { label: "Urgentní", color: "text-red-600" },
    };

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatShortDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    // Email modal state
    let showEmailModal = $state(false);
    let ticket = $state(data.ticket);

    // Get customer email for email modal
    function getCustomerEmail(): string | null {
        const primaryContact = getPrimaryContact(ticket.customer);
        return primaryContact?.email || null;
    }

    // Prepare ticket data for PDF generation
    function getTicketDataForPdf(): ServiceTicketData {
        return {
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            type: ticket.type,
            priority: ticket.priority,
            status: ticket.status,
            description: ticket.description,
            resolution: ticket.resolution,
            resolvedAt: ticket.resolvedAt,
            scheduledAt: ticket.scheduledAt,
            customer: ticket.customer,
            order: ticket.order,
            assignedTo: ticket.assignedTo,
        };
    }

    // Download PDF
    function downloadPdf() {
        generateServicePdf(getTicketDataForPdf());
    }

    // Send email handler
    async function handleSendEmail(
        recipientEmail: string,
        customMessage: string,
    ) {
        const pdfBase64 = generateServicePdfBase64(getTicketDataForPdf());

        const response = await fetch(
            `/api/service-tickets/${ticket.id}/send-email`,
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
        ticket = {
            ...ticket,
            emailSentAt: result.sentAt,
            emailSentTo: result.sentTo,
        };
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
                <div class="flex items-center gap-3">
                    <h1 class="text-2xl font-bold text-slate-800">
                        {data.ticket.ticketNumber}
                    </h1>
                    <span
                        class="px-3 py-1 text-sm font-medium rounded-full {statusLabels[
                            data.ticket.status
                        ]?.color || 'bg-slate-100 text-slate-700'}"
                    >
                        {statusLabels[data.ticket.status]?.label ||
                            data.ticket.status}
                    </span>
                    {#if data.ticket.priority === "high" || data.ticket.priority === "urgent"}
                        <span
                            class="{priorityLabels[data.ticket.priority]
                                .color} flex items-center gap-1 text-sm font-medium"
                        >
                            <AlertCircle class="w-4 h-4" />
                            {priorityLabels[data.ticket.priority].label}
                        </span>
                    {/if}
                </div>
                <p class="text-slate-500 mt-1">
                    {typeLabels[data.ticket.type] || data.ticket.type} • Vytvořeno
                    {formatShortDate(data.ticket.createdAt)}
                </p>
            </div>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-2">
            <button
                onclick={downloadPdf}
                class="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
                <Download class="w-4 h-4" />
                <span class="hidden sm:inline">Stáhnout PDF</span>
            </button>
            <button
                onclick={() => (showEmailModal = true)}
                class="flex items-center gap-2 px-4 py-2 bg-futurol-wine text-white rounded-lg hover:bg-futurol-wine/90 transition-colors"
            >
                <Mail class="w-4 h-4" />
                <span class="hidden sm:inline">Odeslat email</span>
            </button>
        </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-6">
            <!-- Description -->
            <div class="bg-white rounded shadow-sm border border-slate-200 p-6">
                <h2 class="text-lg font-semibold text-slate-800 mb-4">
                    Popis problému
                </h2>
                <p class="text-slate-600 whitespace-pre-wrap">
                    {data.ticket.description}
                </p>
            </div>

            <!-- Resolution (if exists) -->
            {#if data.ticket.resolution}
                <div class="bg-green-50 rounded border border-green-200 p-6">
                    <div class="flex items-center gap-2 mb-4">
                        <CheckCircle class="w-5 h-5 text-green-600" />
                        <h2 class="text-lg font-semibold text-green-800">
                            Řešení
                        </h2>
                    </div>
                    <p class="text-green-700 whitespace-pre-wrap">
                        {data.ticket.resolution}
                    </p>
                    {#if data.ticket.resolvedAt}
                        <p class="text-sm text-green-600 mt-4">
                            Vyřešeno: {formatDate(data.ticket.resolvedAt)}
                        </p>
                    {/if}
                </div>
            {/if}

            <!-- Order info (if linked) -->
            {#if data.ticket.order}
                <div
                    class="bg-white rounded shadow-sm border border-slate-200 p-6"
                >
                    <h2 class="text-lg font-semibold text-slate-800 mb-4">
                        Zakázka
                    </h2>
                    <div class="flex items-start gap-4">
                        <div
                            class="w-12 h-12 bg-blue-100 rounded flex items-center justify-center"
                        >
                            <Wrench class="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <a
                                href="/dashboard/orders/{data.ticket.order.id}"
                                class="font-medium text-futurol-green hover:underline"
                            >
                                {data.ticket.order.orderNumber}
                            </a>
                            {#if data.ticket.order.product}
                                <p class="text-slate-600">
                                    {data.ticket.order.product.name}
                                </p>
                            {/if}
                            {#if data.ticket.order.location}
                                <p
                                    class="text-sm text-slate-500 flex items-center gap-1 mt-1"
                                >
                                    <MapPin class="w-3 h-3" />
                                    {data.ticket.order.location.street}, {data
                                        .ticket.order.location.city}
                                </p>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
            <!-- Customer info -->
            <div class="bg-white rounded shadow-sm border border-slate-200 p-6">
                <h2 class="text-lg font-semibold text-slate-800 mb-4">
                    Zákazník
                </h2>
                <div class="space-y-3">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 bg-futurol-green/10 rounded-full flex items-center justify-center"
                        >
                            <User class="w-5 h-5 text-futurol-green" />
                        </div>
                        <div>
                            <a
                                href="/dashboard/customers/{data.ticket.customer
                                    .id}"
                                class="font-medium text-futurol-green hover:underline"
                            >
                                {getCustomerDisplayName(data.ticket.customer)}
                            </a>
                        </div>
                    </div>
                    {#if getPrimaryContact(data.ticket.customer)?.phone}
                        <div class="flex items-center gap-2 text-slate-600">
                            <Phone class="w-4 h-4" />
                            <a
                                href="tel:{getPrimaryContact(
                                    data.ticket.customer,
                                )?.phone}"
                                class="hover:text-futurol-green"
                            >
                                {getPrimaryContact(data.ticket.customer)?.phone}
                            </a>
                        </div>
                    {/if}
                    {#if getPrimaryContact(data.ticket.customer)?.email}
                        <div class="text-sm text-slate-500">
                            {getPrimaryContact(data.ticket.customer)?.email}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Assigned technician -->
            <div class="bg-white rounded shadow-sm border border-slate-200 p-6">
                <h2 class="text-lg font-semibold text-slate-800 mb-4">
                    Přiřazený technik
                </h2>
                {#if data.ticket.assignedTo}
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"
                        >
                            <User class="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <div class="font-medium text-slate-800">
                                {data.ticket.assignedTo.fullName}
                            </div>
                            <div class="text-sm text-slate-500">
                                #{data.ticket.assignedTo.personalNumber}
                            </div>
                        </div>
                    </div>
                    {#if data.ticket.assignedTo.phone}
                        <div
                            class="flex items-center gap-2 text-slate-600 mt-3"
                        >
                            <Phone class="w-4 h-4" />
                            <a
                                href="tel:{data.ticket.assignedTo.phone}"
                                class="hover:text-futurol-green"
                            >
                                {data.ticket.assignedTo.phone}
                            </a>
                        </div>
                    {/if}
                {:else}
                    <p class="text-slate-500">Tiket není přiřazen</p>
                {/if}
            </div>

            <!-- Schedule info -->
            {#if data.ticket.scheduledAt}
                <div
                    class="bg-white rounded shadow-sm border border-slate-200 p-6"
                >
                    <h2 class="text-lg font-semibold text-slate-800 mb-4">
                        Plánovaný termín
                    </h2>
                    <div class="flex items-center gap-2 text-slate-600">
                        <Calendar class="w-5 h-5" />
                        <span>{formatDate(data.ticket.scheduledAt)}</span>
                    </div>
                </div>
            {/if}

            <!-- Timeline -->
            <div class="bg-white rounded shadow-sm border border-slate-200 p-6">
                <h2 class="text-lg font-semibold text-slate-800 mb-4">
                    Časová osa
                </h2>
                <div class="space-y-4">
                    <div class="flex items-start gap-3">
                        <div
                            class="w-2 h-2 bg-futurol-green rounded-full mt-2"
                        ></div>
                        <div>
                            <div class="text-sm font-medium text-slate-800">
                                Tiket vytvořen
                            </div>
                            <div class="text-xs text-slate-500">
                                {formatDate(data.ticket.createdAt)}
                            </div>
                        </div>
                    </div>
                    {#if data.ticket.scheduledAt}
                        <div class="flex items-start gap-3">
                            <div
                                class="w-2 h-2 bg-yellow-500 rounded-full mt-2"
                            ></div>
                            <div>
                                <div class="text-sm font-medium text-slate-800">
                                    Naplánováno
                                </div>
                                <div class="text-xs text-slate-500">
                                    {formatDate(data.ticket.scheduledAt)}
                                </div>
                            </div>
                        </div>
                    {/if}
                    {#if data.ticket.resolvedAt}
                        <div class="flex items-start gap-3">
                            <div
                                class="w-2 h-2 bg-green-500 rounded-full mt-2"
                            ></div>
                            <div>
                                <div class="text-sm font-medium text-slate-800">
                                    Vyřešeno
                                </div>
                                <div class="text-xs text-slate-500">
                                    {formatDate(data.ticket.resolvedAt)}
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Email sent info -->
            {#if ticket.emailSentAt}
                <div
                    class="bg-white rounded shadow-sm border border-slate-200 p-6"
                >
                    <h2 class="text-lg font-semibold text-slate-800 mb-4">
                        Odeslaný email
                    </h2>
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"
                        >
                            <Mail class="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div class="text-sm text-slate-500">
                                Odesláno: {formatDate(ticket.emailSentAt)}
                            </div>
                            <div class="font-medium text-slate-800">
                                {ticket.emailSentTo}
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<!-- Email Modal -->
{#if showEmailModal}
    <SendEmailModal
        isOpen={showEmailModal}
        customerEmail={getCustomerEmail()}
        orderNumber={ticket.ticketNumber}
        measurementId={ticket.id}
        onClose={() => (showEmailModal = false)}
        onSend={handleSendEmail}
    />
{/if}
