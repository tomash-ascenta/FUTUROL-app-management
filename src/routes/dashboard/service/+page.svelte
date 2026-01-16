<script lang="ts">
    import {
        Search,
        Plus,
        Wrench,
        User,
        Calendar,
        MapPin,
        AlertCircle,
    } from "lucide-svelte";

    interface Props {
        data: {
            tickets: Array<{
                id: string;
                ticketNumber: string;
                type: string;
                status: string;
                priority: string;
                description: string;
                scheduledAt: string | null;
                createdAt: string;
                customer: {
                    id: string;
                    fullName: string;
                    phone: string;
                };
                order: {
                    id: string;
                    orderNumber: string;
                    location: {
                        city: string;
                    } | null;
                } | null;
                assignedTo: {
                    id: string;
                    fullName: string;
                } | null;
            }>;
            canCreate: boolean;
        };
    }

    let { data }: Props = $props();

    let searchQuery = $state("");

    const filteredTickets = $derived(
        data.tickets.filter((ticket) => {
            const query = searchQuery.toLowerCase();
            return (
                ticket.ticketNumber.toLowerCase().includes(query) ||
                ticket.customer.fullName.toLowerCase().includes(query) ||
                ticket.description.toLowerCase().includes(query)
            );
        }),
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
        paid: "Placený",
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
            month: "short",
            year: "numeric",
        });
    }
</script>

<div class="space-y-6">
    <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Servis</h1>
            <p class="text-slate-500 mt-1">
                Servisní tikety a opravy ({data.tickets.length})
            </p>
        </div>
        {#if data.canCreate}
            <a
                href="/dashboard/service/new"
                class="inline-flex items-center gap-2 bg-futurol-green text-white px-4 py-2.5 rounded-lg font-medium hover:bg-futurol-green/90 transition-colors shadow-sm"
            >
                <Plus class="w-5 h-5" />
                Nový tiket
            </a>
        {/if}
    </div>

    <!-- Search -->
    <div class="relative">
        <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
        />
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Hledat tikety..."
            class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
        />
    </div>

    {#if filteredTickets.length === 0}
        <!-- Empty state -->
        <div
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center"
        >
            <div
                class="w-16 h-16 bg-futurol-green/10 rounded-full flex items-center justify-center mx-auto mb-4"
            >
                <Wrench class="w-8 h-8 text-futurol-green" />
            </div>
            <h3 class="text-lg font-medium text-slate-800 mb-2">
                {searchQuery
                    ? "Žádné tikety nenalezeny"
                    : "Žádné otevřené tikety"}
            </h3>
            <p class="text-slate-500 mb-6">
                {searchQuery
                    ? "Zkuste upravit vyhledávání"
                    : "Všechny servisní požadavky jsou vyřízeny"}
            </p>
        </div>
    {:else}
        <!-- Tickets list -->
        <div
            class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th
                                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
                            >
                                Tiket
                            </th>
                            <th
                                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
                            >
                                Zákazník
                            </th>
                            <th
                                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
                            >
                                Typ
                            </th>
                            <th
                                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
                            >
                                Stav
                            </th>
                            <th
                                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
                            >
                                Přiřazeno
                            </th>
                            <th
                                class="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase"
                            >
                                Vytvořeno
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#each filteredTickets as ticket}
                            <tr class="hover:bg-slate-50 transition-colors">
                                <td class="px-4 py-3">
                                    <a
                                        href="/dashboard/service/{ticket.id}"
                                        class="font-medium text-futurol-green hover:underline"
                                    >
                                        {ticket.ticketNumber}
                                    </a>
                                    {#if ticket.priority === "high" || ticket.priority === "urgent"}
                                        <span
                                            class="ml-2 {priorityLabels[
                                                ticket.priority
                                            ].color}"
                                        >
                                            <AlertCircle
                                                class="w-4 h-4 inline"
                                            />
                                        </span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex flex-col">
                                        <span
                                            class="font-medium text-slate-800"
                                        >
                                            {ticket.customer.fullName}
                                        </span>
                                        {#if ticket.order?.location}
                                            <span
                                                class="text-sm text-slate-500 flex items-center gap-1"
                                            >
                                                <MapPin class="w-3 h-3" />
                                                {ticket.order.location.city}
                                            </span>
                                        {/if}
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <span class="text-sm text-slate-600">
                                        {typeLabels[ticket.type] || ticket.type}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        class="px-2 py-1 text-xs font-medium rounded {statusLabels[
                                            ticket.status
                                        ]?.color ||
                                            'bg-slate-100 text-slate-700'}"
                                    >
                                        {statusLabels[ticket.status]?.label ||
                                            ticket.status}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    {#if ticket.assignedTo}
                                        <span
                                            class="text-sm text-slate-600 flex items-center gap-1"
                                        >
                                            <User class="w-3 h-3" />
                                            {ticket.assignedTo.fullName}
                                        </span>
                                    {:else}
                                        <span class="text-sm text-slate-400"
                                            >Nepřiřazeno</span
                                        >
                                    {/if}
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        class="text-sm text-slate-500 flex items-center gap-1"
                                    >
                                        <Calendar class="w-3 h-3" />
                                        {formatDate(ticket.createdAt)}
                                    </span>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</div>
