<script lang="ts">
    import { goto, invalidateAll } from "$app/navigation";
    import {
        ArrowLeft,
        Edit,
        Trash2,
        Phone,
        Mail,
        Building2,
        MapPin,
        Calendar,
        ClipboardList,
        Wrench,
        Plus,
        ExternalLink,
        FileText,
        User,
        Star,
        MessageSquare,
        PhoneCall,
        Video,
        Clock,
        CheckCircle2,
        X,
        Send,
    } from "lucide-svelte";
    import { getCustomerDisplayName, getPrimaryContact } from "$lib/utils";

    interface Activity {
        id: string;
        type: string;
        content: string;
        followUpDate: string | null;
        followUpDone: boolean;
        createdAt: string;
        createdBy: {
            id: string;
            fullName: string;
        };
        order: {
            id: string;
            orderNumber: string;
        } | null;
    }

    interface Contact {
        id: string;
        fullName: string;
        email: string | null;
        phone: string | null;
        position: string | null;
        isPrimary: boolean;
        note: string | null;
    }

    interface Props {
        data: {
            customer: {
                id: string;
                type: string;
                companyName: string | null;
                ico: string | null;
                dic: string | null;
                note: string | null;
                source: string;
                createdAt: string;
                updatedAt: string;
                contacts: Contact[];
                locations: Array<{
                    id: string;
                    street: string;
                    city: string;
                    zip: string;
                    country: string;
                    note: string | null;
                }>;
                orders: Array<{
                    id: string;
                    orderNumber: string;
                    status: string;
                    createdAt: string;
                    product: { name: string } | null;
                }>;
                serviceTickets: Array<{
                    id: string;
                    ticketNumber: string;
                    type: string;
                    status: string;
                    createdAt: string;
                }>;
                activities: Activity[];
            };
            canEdit: boolean;
            canDelete: boolean;
            canAddActivity: boolean;
            currentUserId: string;
        };
    }

    let { data }: Props = $props();

    // Activity form state
    let showActivityForm = $state(false);
    let activityType = $state<string>("note");
    let activityContent = $state("");
    let activityFollowUp = $state("");
    let isSubmittingActivity = $state(false);

    const activityTypes = [
        { value: "note", label: "Poznámka", icon: MessageSquare },
        { value: "call", label: "Hovor", icon: PhoneCall },
        { value: "email", label: "Email", icon: Mail },
        { value: "meeting", label: "Schůzka", icon: Video },
    ];

    function getActivityIcon(type: string) {
        const typeMap: Record<string, typeof MessageSquare> = {
            note: MessageSquare,
            call: PhoneCall,
            email: Mail,
            meeting: Video,
            status_change: ClipboardList,
            system: FileText,
        };
        return typeMap[type] || MessageSquare;
    }

    function getActivityTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            note: "Poznámka",
            call: "Hovor",
            email: "Email",
            meeting: "Schůzka",
            status_change: "Změna stavu",
            system: "Systém",
        };
        return labels[type] || type;
    }

    function formatRelativeTime(dateStr: string): string {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Právě teď";
        if (diffMins < 60) return `před ${diffMins} min`;
        if (diffHours < 24) return `před ${diffHours} h`;
        if (diffDays < 7) return `před ${diffDays} dny`;
        return date.toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "short",
        });
    }

    async function submitActivity() {
        if (!activityContent.trim()) {
            alert("Zadejte obsah poznámky");
            return;
        }

        isSubmittingActivity = true;
        try {
            const response = await fetch("/api/activities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerId: data.customer.id,
                    type: activityType,
                    content: activityContent.trim(),
                    followUpDate: activityFollowUp || null,
                }),
            });

            if (response.ok) {
                activityContent = "";
                activityFollowUp = "";
                showActivityForm = false;
                invalidateAll();
            } else {
                const result = await response.json();
                alert(result.error || "Chyba při ukládání");
            }
        } catch {
            alert("Chyba při ukládání aktivity");
        } finally {
            isSubmittingActivity = false;
        }
    }

    async function markFollowUpDone(activityId: string) {
        try {
            const response = await fetch(`/api/activities/${activityId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ followUpDone: true }),
            });

            if (response.ok) {
                invalidateAll();
            }
        } catch {
            console.error("Error marking follow-up done");
        }
    }

    // Helper to get display name
    const displayName = $derived(getCustomerDisplayName(data.customer));
    const primaryContact = $derived(getPrimaryContact(data.customer));

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    function formatShortDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    function getSourceLabel(source: string): string {
        const labels: Record<string, string> = {
            manual: "Ruční zadání",
            advisor: "Rádce",
            import: "Import",
            web: "Web",
        };
        return labels[source] || source;
    }

    function getOrderStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            lead: "Lead",
            quoted: "Nabídka",
            confirmed: "Potvrzeno",
            measured: "Zaměřeno",
            in_production: "Ve výrobě",
            ready: "Připraveno",
            installed: "Instalováno",
            completed: "Dokončeno",
            cancelled: "Zrušeno",
        };
        return labels[status] || status;
    }

    function getOrderStatusColor(status: string): string {
        const colors: Record<string, string> = {
            lead: "bg-slate-100 text-slate-600",
            quoted: "bg-blue-100 text-blue-700",
            confirmed: "bg-purple-100 text-purple-700",
            measured: "bg-cyan-100 text-cyan-700",
            in_production: "bg-yellow-100 text-yellow-700",
            ready: "bg-orange-100 text-orange-700",
            installed: "bg-futurol-green/10 text-futurol-green",
            completed: "bg-futurol-green/10 text-futurol-green",
            cancelled: "bg-red-100 text-red-700",
        };
        return colors[status] || "bg-slate-100 text-slate-600";
    }

    function getServiceTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            warranty: "Záruční",
            paid: "Placený",
            inspection: "Kontrola",
        };
        return labels[type] || type;
    }

    async function deleteCustomer() {
        if (!confirm(`Opravdu chcete smazat zákazníka "${displayName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/customers/${data.customer.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                goto("/dashboard/customers");
            } else {
                const result = await response.json();
                alert(result.error || "Chyba při mazání zákazníka");
            }
        } catch (error) {
            alert("Chyba při mazání zákazníka");
        }
    }

    // Address modal state
    let showAddressModal = $state(false);
    let addressForm = $state({
        street: "",
        city: "",
        zip: "",
        country: "Česká republika",
        note: "",
    });
    let isAddingAddress = $state(false);

    async function addAddress() {
        if (!addressForm.street || !addressForm.city || !addressForm.zip) {
            alert("Vyplňte všechna povinná pole");
            return;
        }

        isAddingAddress = true;
        try {
            const response = await fetch(
                `/api/customers/${data.customer.id}/locations`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(addressForm),
                },
            );

            if (response.ok) {
                showAddressModal = false;
                addressForm = {
                    street: "",
                    city: "",
                    zip: "",
                    country: "Česká republika",
                    note: "",
                };
                // Reload page to show new address
                window.location.reload();
            } else {
                const result = await response.json();
                alert(result.error || "Chyba při přidávání adresy");
            }
        } catch (error) {
            alert("Chyba při přidávání adresy");
        } finally {
            isAddingAddress = false;
        }
    }

    // Edit address state
    let editingLocation: {
        id: string;
        street: string;
        city: string;
        zip: string;
        country: string;
        note: string | null;
    } | null = $state(null);
    let isEditingAddress = $state(false);

    function startEditLocation(location: {
        id: string;
        street: string;
        city: string;
        zip: string;
        country: string;
        note: string | null;
    }) {
        editingLocation = { ...location };
    }

    async function updateLocation() {
        if (!editingLocation) return;
        if (
            !editingLocation.street ||
            !editingLocation.city ||
            !editingLocation.zip
        ) {
            alert("Vyplňte všechna povinná pole");
            return;
        }

        isEditingAddress = true;
        try {
            const response = await fetch(
                `/api/locations/${editingLocation.id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        street: editingLocation.street,
                        city: editingLocation.city,
                        zip: editingLocation.zip,
                        country: editingLocation.country,
                        note: editingLocation.note,
                    }),
                },
            );

            if (response.ok) {
                editingLocation = null;
                window.location.reload();
            } else {
                const result = await response.json();
                alert(result.error || "Chyba při úpravě adresy");
            }
        } catch (error) {
            alert("Chyba při úpravě adresy");
        } finally {
            isEditingAddress = false;
        }
    }
</script>

<div class="space-y-6">
    <!-- Header -->
    <div
        class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
    >
        <div class="flex items-start gap-4">
            <a
                href="/dashboard/customers"
                class="p-2 hover:bg-slate-100 rounded transition-colors mt-1"
            >
                <ArrowLeft class="w-5 h-5 text-slate-500" />
            </a>
            <div>
                <div class="flex items-center gap-3">
                    <div
                        class="w-12 h-12 bg-futurol-green/10 rounded-full flex items-center justify-center border border-futurol-green/20"
                    >
                        <span class="text-lg font-medium text-futurol-green">
                            {displayName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">
                            {displayName}
                        </h1>
                        {#if data.customer.type === "b2b" && data.customer.companyName}
                            <p class="text-slate-500 flex items-center gap-1">
                                <Building2 class="w-4 h-4" />
                                {data.customer.companyName}
                                {#if data.customer.ico}
                                    <span class="text-xs"
                                        >(IČO: {data.customer.ico})</span
                                    >
                                {/if}
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
        {#if data.canEdit}
            <div class="flex items-center gap-2 ml-12 sm:ml-0">
                <a
                    href="/dashboard/customers/{data.customer.id}/edit"
                    class="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    <Edit class="w-4 h-4" />
                    Upravit
                </a>
                {#if data.canDelete}
                    <button
                        onclick={deleteCustomer}
                        class="inline-flex items-center gap-2 px-4 py-2 border border-red-200 rounded text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 class="w-4 h-4" />
                        Smazat
                    </button>
                {/if}
            </div>
        {/if}
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
        <!-- Main info -->
        <div class="lg:col-span-2 space-y-6">
            <!-- Contacts -->
            <div
                class="bg-white rounded border border-slate-200 p-6 shadow-sm"
            >
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-medium text-slate-800">
                        Kontaktní osoby
                    </h2>
                    {#if data.canEdit}
                        <a
                            href="/dashboard/customers/{data.customer
                                .id}/contacts/new"
                            class="text-sm text-futurol-green hover:text-futurol-green/80 transition-colors flex items-center gap-1"
                        >
                            <Plus class="w-4 h-4" />
                            Přidat kontakt
                        </a>
                    {/if}
                </div>

                {#if data.customer.contacts.length === 0}
                    <p class="text-slate-500 text-center py-4">
                        Zatím žádné kontakty
                    </p>
                {:else}
                    <div class="space-y-3">
                        {#each data.customer.contacts as contact}
                            <div
                                class="flex items-start gap-3 p-4 bg-slate-50 rounded {contact.isPrimary
                                    ? 'ring-2 ring-futurol-green/30'
                                    : ''}"
                            >
                                <div
                                    class="w-10 h-10 bg-futurol-green/10 rounded-full flex items-center justify-center flex-shrink-0"
                                >
                                    <User class="w-5 h-5 text-futurol-green" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <p class="font-medium text-slate-800">
                                            {contact.fullName}
                                        </p>
                                        {#if contact.isPrimary}
                                            <span
                                                class="inline-flex items-center gap-1 text-xs bg-futurol-green/10 text-futurol-green px-2 py-0.5 rounded-full"
                                            >
                                                <Star class="w-3 h-3" />
                                                Primární
                                            </span>
                                        {/if}
                                    </div>
                                    {#if contact.position}
                                        <p class="text-sm text-slate-500">
                                            {contact.position}
                                        </p>
                                    {/if}
                                    <div
                                        class="flex flex-wrap gap-4 mt-2 text-sm"
                                    >
                                        {#if contact.phone}
                                            <a
                                                href="tel:{contact.phone}"
                                                class="flex items-center gap-1 text-slate-600 hover:text-futurol-green transition-colors"
                                            >
                                                <Phone class="w-4 h-4" />
                                                {contact.phone}
                                            </a>
                                        {/if}
                                        {#if contact.email}
                                            <a
                                                href="mailto:{contact.email}"
                                                class="flex items-center gap-1 text-slate-600 hover:text-futurol-green transition-colors"
                                            >
                                                <Mail class="w-4 h-4" />
                                                {contact.email}
                                            </a>
                                        {/if}
                                    </div>
                                    {#if contact.note}
                                        <p class="text-sm text-slate-400 mt-2">
                                            {contact.note}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Customer note -->
            {#if data.customer.note}
                <div
                    class="bg-white rounded border border-slate-200 p-6 shadow-sm"
                >
                    <h2 class="text-lg font-medium text-slate-800 mb-4">
                        Poznámka k zákazníkovi
                    </h2>
                    <div class="flex items-start gap-3">
                        <FileText class="w-5 h-5 text-slate-400 mt-0.5" />
                        <p class="text-slate-700">
                            {data.customer.note}
                        </p>
                    </div>
                </div>
            {/if}

            <!-- Locations -->
            <div
                class="bg-white rounded border border-slate-200 p-6 shadow-sm"
            >
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-medium text-slate-800">Adresy</h2>
                    {#if data.canEdit}
                        <button
                            onclick={() => (showAddressModal = true)}
                            class="text-sm text-futurol-green hover:text-futurol-green/80 transition-colors flex items-center gap-1"
                        >
                            <Plus class="w-4 h-4" />
                            Přidat adresu
                        </button>
                    {/if}
                </div>

                {#if data.customer.locations.length === 0}
                    <p class="text-slate-500 text-center py-4">
                        Zatím žádné adresy
                    </p>
                {:else}
                    <div class="space-y-3">
                        {#each data.customer.locations as location}
                            <div
                                class="flex items-start gap-3 p-3 bg-slate-50 rounded"
                            >
                                <MapPin
                                    class="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0"
                                />
                                <div class="flex-1 min-w-0">
                                    <p class="text-slate-800">
                                        {location.street}
                                    </p>
                                    <p class="text-slate-500">
                                        {location.zip}
                                        {location.city}
                                    </p>
                                    {#if location.note}
                                        <p class="text-sm text-slate-400 mt-1">
                                            {location.note}
                                        </p>
                                    {/if}
                                </div>
                                {#if data.canEdit}
                                    <button
                                        onclick={() =>
                                            startEditLocation(location)}
                                        class="p-2 hover:bg-slate-200 rounded transition-colors"
                                        title="Upravit adresu"
                                    >
                                        <Edit class="w-4 h-4 text-slate-500" />
                                    </button>
                                {/if}
                                <a
                                    href="https://maps.google.com/?q={encodeURIComponent(
                                        `${location.street}, ${location.zip} ${location.city}`,
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="p-2 hover:bg-slate-200 rounded transition-colors"
                                    title="Otevřít v mapách"
                                >
                                    <ExternalLink
                                        class="w-4 h-4 text-slate-500"
                                    />
                                </a>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Orders -->
            <div
                class="bg-white rounded border border-slate-200 p-6 shadow-sm"
            >
                <div class="flex items-center justify-between mb-4">
                    <h2
                        class="text-lg font-medium text-slate-800 flex items-center gap-2"
                    >
                        <ClipboardList class="w-5 h-5 text-blue-600" />
                        Zakázky
                    </h2>
                    {#if data.canEdit}
                        <a
                            href="/dashboard/orders/new?customerId={data
                                .customer.id}"
                            class="text-sm text-futurol-green hover:text-futurol-green/80 transition-colors flex items-center gap-1"
                        >
                            <Plus class="w-4 h-4" />
                            Nová zakázka
                        </a>
                    {/if}
                </div>

                {#if data.customer.orders.length === 0}
                    <p class="text-slate-500 text-center py-4">
                        Zatím žádné zakázky
                    </p>
                {:else}
                    <div class="space-y-2">
                        {#each data.customer.orders as order}
                            <a
                                href="/dashboard/orders/{order.id}?from=customer&customerId={data
                                    .customer.id}"
                                class="flex items-center justify-between p-3 bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                            >
                                <div>
                                    <p class="font-medium text-slate-800">
                                        {order.orderNumber}
                                    </p>
                                    <p class="text-sm text-slate-500">
                                        {order.product?.name || "Bez produktu"} •
                                        {formatShortDate(order.createdAt)}
                                    </p>
                                </div>
                                <span
                                    class={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(order.status)}`}
                                >
                                    {getOrderStatusLabel(order.status)}
                                </span>
                            </a>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Service tickets -->
            <div
                class="bg-white rounded border border-slate-200 p-6 shadow-sm"
            >
                <div class="flex items-center justify-between mb-4">
                    <h2
                        class="text-lg font-medium text-slate-800 flex items-center gap-2"
                    >
                        <Wrench class="w-5 h-5 text-orange-600" />
                        Servisní požadavky
                    </h2>
                    <a
                        href="/dashboard/service/new?customerId={data.customer
                            .id}"
                        class="text-sm text-futurol-green hover:text-futurol-green/80 transition-colors flex items-center gap-1"
                    >
                        <Plus class="w-4 h-4" />
                        Nový servis
                    </a>
                </div>

                {#if data.customer.serviceTickets.length === 0}
                    <p class="text-slate-500 text-center py-4">
                        Zatím žádné servisní požadavky
                    </p>
                {:else}
                    <div class="space-y-2">
                        {#each data.customer.serviceTickets as ticket}
                            <a
                                href="/dashboard/service/{ticket.id}?from=customer&customerId={data
                                    .customer.id}"
                                class="flex items-center justify-between p-3 bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                            >
                                <div>
                                    <p class="font-medium text-slate-800">
                                        {ticket.ticketNumber}
                                    </p>
                                    <p class="text-sm text-slate-500">
                                        {getServiceTypeLabel(ticket.type)} • {formatShortDate(
                                            ticket.createdAt,
                                        )}
                                    </p>
                                </div>
                                <span
                                    class={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(ticket.status)}`}
                                >
                                    {ticket.status}
                                </span>
                            </a>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Activities Timeline -->
            <div
                class="bg-white rounded border border-slate-200 p-6 shadow-sm"
            >
                <div class="flex items-center justify-between mb-4">
                    <h2
                        class="text-lg font-medium text-slate-800 flex items-center gap-2"
                    >
                        <MessageSquare class="w-5 h-5 text-purple-600" />
                        Historie aktivit
                    </h2>
                    {#if data.canAddActivity}
                        <button
                            onclick={() =>
                                (showActivityForm = !showActivityForm)}
                            class="text-sm text-futurol-green hover:text-futurol-green/80 transition-colors flex items-center gap-1"
                        >
                            <Plus class="w-4 h-4" />
                            Přidat poznámku
                        </button>
                    {/if}
                </div>

                <!-- Activity Form -->
                {#if showActivityForm && data.canAddActivity}
                    <div
                        class="mb-6 p-4 bg-slate-50 rounded border border-slate-200"
                    >
                        <div class="flex gap-2 mb-3">
                            {#each activityTypes as typeOption}
                                <button
                                    type="button"
                                    onclick={() =>
                                        (activityType = typeOption.value)}
                                    class="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors {activityType ===
                                    typeOption.value
                                        ? 'bg-futurol-green text-white'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}"
                                >
                                    <svelte:component
                                        this={typeOption.icon}
                                        class="w-4 h-4"
                                    />
                                    {typeOption.label}
                                </button>
                            {/each}
                        </div>
                        <textarea
                            bind:value={activityContent}
                            placeholder="Napište poznámku..."
                            rows="3"
                            class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green resize-none mb-3"
                        ></textarea>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <Clock class="w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    bind:value={activityFollowUp}
                                    class="text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                                    placeholder="Follow-up"
                                />
                                <span class="text-xs text-slate-500"
                                    >Připomínka</span
                                >
                            </div>
                            <div class="flex gap-2">
                                <button
                                    type="button"
                                    onclick={() => {
                                        showActivityForm = false;
                                        activityContent = "";
                                        activityFollowUp = "";
                                    }}
                                    class="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                >
                                    Zrušit
                                </button>
                                <button
                                    type="button"
                                    onclick={submitActivity}
                                    disabled={isSubmittingActivity ||
                                        !activityContent.trim()}
                                    class="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-futurol-green text-white rounded hover:bg-futurol-green/90 transition-colors disabled:opacity-50"
                                >
                                    <Send class="w-4 h-4" />
                                    {isSubmittingActivity
                                        ? "Ukládám..."
                                        : "Uložit"}
                                </button>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Activities List -->
                {#if data.customer.activities.length === 0}
                    <p class="text-slate-500 text-center py-4">
                        Zatím žádné aktivity
                    </p>
                {:else}
                    <div class="space-y-4">
                        {#each data.customer.activities as activity}
                            {@const ActivityIcon = getActivityIcon(
                                activity.type,
                            )}
                            <div class="flex gap-3">
                                <div
                                    class="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"
                                >
                                    <svelte:component
                                        this={ActivityIcon}
                                        class="w-4 h-4 text-slate-500"
                                    />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div
                                        class="flex items-start justify-between gap-2"
                                    >
                                        <div>
                                            <span
                                                class="text-sm font-medium text-slate-800"
                                            >
                                                {activity.createdBy.fullName}
                                            </span>
                                            <span
                                                class="text-sm text-slate-500"
                                            >
                                                • {getActivityTypeLabel(
                                                    activity.type,
                                                )}
                                            </span>
                                            {#if activity.order}
                                                <a
                                                    href="/dashboard/orders/{activity
                                                        .order.id}"
                                                    class="text-sm text-futurol-green hover:underline ml-1"
                                                >
                                                    {activity.order.orderNumber}
                                                </a>
                                            {/if}
                                        </div>
                                        <span
                                            class="text-xs text-slate-400 whitespace-nowrap"
                                        >
                                            {formatRelativeTime(
                                                activity.createdAt,
                                            )}
                                        </span>
                                    </div>
                                    <p
                                        class="mt-1 text-sm text-slate-600 whitespace-pre-wrap"
                                    >
                                        {activity.content}
                                    </p>
                                    {#if activity.followUpDate && !activity.followUpDone}
                                        <div
                                            class="mt-2 flex items-center gap-2"
                                        >
                                            <span
                                                class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full"
                                            >
                                                <Clock class="w-3 h-3" />
                                                Follow-up: {new Date(
                                                    activity.followUpDate,
                                                ).toLocaleDateString("cs-CZ")}
                                            </span>
                                            {#if data.currentUserId === activity.createdBy.id || data.canEdit}
                                                <button
                                                    onclick={() =>
                                                        markFollowUpDone(
                                                            activity.id,
                                                        )}
                                                    class="text-xs text-green-600 hover:underline flex items-center gap-1"
                                                >
                                                    <CheckCircle2
                                                        class="w-3 h-3"
                                                    />
                                                    Splněno
                                                </button>
                                            {/if}
                                        </div>
                                    {/if}
                                    {#if activity.followUpDone}
                                        <span
                                            class="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full"
                                        >
                                            <CheckCircle2 class="w-3 h-3" />
                                            Follow-up splněn
                                        </span>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
            <!-- Meta info -->
            <div
                class="bg-white rounded border border-slate-200 p-6 shadow-sm"
            >
                <h2 class="text-lg font-medium text-slate-800 mb-4">
                    Informace
                </h2>
                <dl class="space-y-3">
                    <div>
                        <dt class="text-sm text-slate-500">Zdroj</dt>
                        <dd class="text-slate-800">
                            {getSourceLabel(data.customer.source)}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm text-slate-500">Vytvořeno</dt>
                        <dd class="text-slate-800 flex items-center gap-2">
                            <Calendar class="w-4 h-4 text-slate-400" />
                            {formatDate(data.customer.createdAt)}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm text-slate-500">Poslední úprava</dt>
                        <dd class="text-slate-500">
                            {formatDate(data.customer.updatedAt)}
                        </dd>
                    </div>
                </dl>
            </div>

            <!-- Quick stats -->
            <div
                class="bg-white rounded border border-slate-200 p-6 shadow-sm"
            >
                <h2 class="text-lg font-medium text-slate-800 mb-4">
                    Statistiky
                </h2>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-slate-500">Zakázky</span>
                        <span class="text-slate-800 font-medium">
                            {data.customer.orders.length}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-slate-500">Adresy</span>
                        <span class="text-slate-800 font-medium">
                            {data.customer.locations.length}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-slate-500">Servisní požadavky</span>
                        <span class="text-slate-800 font-medium">
                            {data.customer.serviceTickets.length}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Add Address Modal -->
{#if showAddressModal}
    <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
        <div class="bg-white rounded shadow-xl max-w-md w-full p-6">
            <h3 class="text-lg font-semibold text-slate-800 mb-4">
                Přidat adresu
            </h3>

            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    addAddress();
                }}
                class="space-y-4"
            >
                <div>
                    <label
                        for="street"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Ulice a číslo *
                    </label>
                    <input
                        id="street"
                        type="text"
                        bind:value={addressForm.street}
                        required
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                        placeholder="např. Hlavní 123"
                    />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            for="city"
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Město *
                        </label>
                        <input
                            id="city"
                            type="text"
                            bind:value={addressForm.city}
                            required
                            class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                            placeholder="např. Praha"
                        />
                    </div>
                    <div>
                        <label
                            for="zip"
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            PSČ *
                        </label>
                        <input
                            id="zip"
                            type="text"
                            bind:value={addressForm.zip}
                            required
                            class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                            placeholder="např. 110 00"
                        />
                    </div>
                </div>

                <div>
                    <label
                        for="country"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Země
                    </label>
                    <input
                        id="country"
                        type="text"
                        bind:value={addressForm.country}
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                    />
                </div>

                <div>
                    <label
                        for="note"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Poznámka
                    </label>
                    <textarea
                        id="note"
                        bind:value={addressForm.note}
                        rows="2"
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green resize-none"
                        placeholder="Volitelná poznámka k adrese..."
                    ></textarea>
                </div>

                <div class="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onclick={() => (showAddressModal = false)}
                        class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    >
                        Zrušit
                    </button>
                    <button
                        type="submit"
                        disabled={isAddingAddress}
                        class="px-4 py-2 bg-futurol-green text-white rounded hover:bg-futurol-green/90 transition-colors disabled:opacity-50"
                    >
                        {isAddingAddress ? "Ukládám..." : "Přidat adresu"}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Edit Address Modal -->
{#if editingLocation}
    <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
        <div class="bg-white rounded shadow-xl max-w-md w-full p-6">
            <h3 class="text-lg font-semibold text-slate-800 mb-4">
                Upravit adresu
            </h3>

            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    updateLocation();
                }}
                class="space-y-4"
            >
                <div>
                    <label
                        for="edit-street"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Ulice a číslo *
                    </label>
                    <input
                        id="edit-street"
                        type="text"
                        bind:value={editingLocation.street}
                        required
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                    />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            for="edit-city"
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Město *
                        </label>
                        <input
                            id="edit-city"
                            type="text"
                            bind:value={editingLocation.city}
                            required
                            class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                        />
                    </div>
                    <div>
                        <label
                            for="edit-zip"
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            PSČ *
                        </label>
                        <input
                            id="edit-zip"
                            type="text"
                            bind:value={editingLocation.zip}
                            required
                            class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                        />
                    </div>
                </div>

                <div>
                    <label
                        for="edit-country"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Země
                    </label>
                    <input
                        id="edit-country"
                        type="text"
                        bind:value={editingLocation.country}
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                    />
                </div>

                <div>
                    <label
                        for="edit-note"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Poznámka
                    </label>
                    <textarea
                        id="edit-note"
                        bind:value={editingLocation.note}
                        rows="2"
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green resize-none"
                    ></textarea>
                </div>

                <div class="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onclick={() => (editingLocation = null)}
                        class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    >
                        Zrušit
                    </button>
                    <button
                        type="submit"
                        disabled={isEditingAddress}
                        class="px-4 py-2 bg-futurol-green text-white rounded hover:bg-futurol-green/90 transition-colors disabled:opacity-50"
                    >
                        {isEditingAddress ? "Ukládám..." : "Uložit změny"}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
