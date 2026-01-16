<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import {
        Search,
        Plus,
        MapPin,
        Phone,
        Mail,
        Building2,
        ChevronLeft,
        ChevronRight,
        ClipboardList,
        Wrench,
        User,
        MoreVertical,
        Eye,
        Edit,
        Trash2,
    } from "lucide-svelte";

    interface Customer {
        id: string;
        fullName: string;
        email: string | null;
        phone: string;
        company: string | null;
        note: string | null;
        source: string;
        createdAt: string;
        updatedAt: string;
        locations: Array<{
            id: string;
            street: string;
            city: string;
            zip: string;
        }>;
        _count: {
            orders: number;
            serviceTickets: number;
        };
    }

    interface Props {
        data: {
            customers: Customer[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
            search: string;
            canEdit: boolean;
            canDelete: boolean;
        };
    }

    let { data }: Props = $props();

    let searchQuery = $state("");
    let searchTimeout: ReturnType<typeof setTimeout>;
    let openDropdown = $state<string | null>(null);

    // Sync search query from URL on data change
    $effect(() => {
        searchQuery = data.search || "";
    });

    function handleSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const url = new URL($page.url);
            if (searchQuery) {
                url.searchParams.set("search", searchQuery);
            } else {
                url.searchParams.delete("search");
            }
            url.searchParams.set("page", "1");
            goto(url.toString(), { replaceState: true, keepFocus: true });
        }, 300);
    }

    function goToPage(pageNum: number) {
        const url = new URL($page.url);
        url.searchParams.set("page", pageNum.toString());
        goto(url.toString());
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

    function getSourceBadgeColor(source: string): string {
        const colors: Record<string, string> = {
            manual: "bg-slate-100 text-slate-600",
            advisor: "bg-purple-100 text-purple-700",
            import: "bg-blue-100 text-blue-700",
            web: "bg-green-100 text-green-700",
        };
        return colors[source] || "bg-slate-100 text-slate-600";
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    function toggleDropdown(id: string) {
        openDropdown = openDropdown === id ? null : id;
    }

    async function deleteCustomer(customer: Customer) {
        if (
            !confirm(`Opravdu chcete smazat zákazníka "${customer.fullName}"?`)
        ) {
            return;
        }

        try {
            const response = await fetch(`/api/customers/${customer.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                // Reload page to refresh data
                goto($page.url.toString(), { invalidateAll: true });
            } else {
                const data = await response.json();
                alert(data.error || "Chyba při mazání zákazníka");
            }
        } catch (error) {
            alert("Chyba při mazání zákazníka");
        }
    }

    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest(".dropdown-container")) {
            openDropdown = null;
        }
    }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="space-y-6">
    <!-- Header -->
    <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold text-slate-900">Zákazníci</h1>
            <p class="text-slate-500 mt-1">
                Celkem {data.pagination.total} zákazníků
            </p>
        </div>
        {#if data.canEdit}
            <a
                href="/dashboard/customers/new"
                class="inline-flex items-center gap-2 bg-futurol-green text-white px-4 py-2.5 rounded-lg font-medium hover:bg-futurol-green-dark transition-colors shadow-sm"
            >
                <Plus class="w-5 h-5" />
                Nový zákazník
            </a>
        {/if}
    </div>

    <!-- Search -->
    <div class="relative max-w-md">
        <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
        />
        <input
            type="text"
            placeholder="Hledat podle jména, telefonu, emailu..."
            bind:value={searchQuery}
            oninput={handleSearch}
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green focus:border-transparent shadow-sm"
        />
    </div>

    <!-- Customers table -->
    {#if data.customers.length === 0}
        <div
            class="bg-white rounded-xl border border-futurol-border p-12 text-center shadow-card"
        >
            <div
                class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
                <User class="w-8 h-8 text-slate-400" />
            </div>
            <h3 class="text-lg font-medium text-slate-900 mb-2">
                {#if data.search}
                    Žádní zákazníci nenalezeni
                {:else}
                    Zatím žádní zákazníci
                {/if}
            </h3>
            <p class="text-slate-500 mb-6">
                {#if data.search}
                    Zkuste upravit vyhledávání nebo přidat nového zákazníka.
                {:else}
                    Začněte přidáním prvního zákazníka.
                {/if}
            </p>
            <a
                href="/dashboard/customers/new"
                class="inline-flex items-center gap-2 bg-futurol-green text-white px-4 py-2 rounded-lg font-medium hover:bg-futurol-green-dark transition-colors"
            >
                <Plus class="w-5 h-5" />
                Přidat zákazníka
            </a>
        </div>
    {:else}
        <div
            class="bg-white rounded-xl border border-futurol-border overflow-hidden shadow-card"
        >
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-slate-50 border-b border-futurol-border">
                        <tr>
                            <th
                                class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                            >
                                Zákazník
                            </th>
                            <th
                                class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell"
                            >
                                Kontakt
                            </th>
                            <th
                                class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell"
                            >
                                Lokace
                            </th>
                            <th
                                class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell"
                            >
                                Zakázky
                            </th>
                            <th
                                class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell"
                            >
                                Zdroj
                            </th>
                            <th
                                class="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                            >
                                Akce
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-futurol-border">
                        {#each data.customers as customer}
                            <tr
                                class="hover:bg-slate-50 transition-colors cursor-pointer"
                                onclick={() =>
                                    goto(`/dashboard/customers/${customer.id}`)}
                            >
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200 flex-shrink-0"
                                        >
                                            <span
                                                class="text-sm font-semibold text-primary-700"
                                            >
                                                {customer.fullName
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </span>
                                        </div>
                                        <div class="min-w-0">
                                            <div
                                                class="font-medium text-slate-900 truncate"
                                            >
                                                {customer.fullName}
                                            </div>
                                            {#if customer.company}
                                                <div
                                                    class="text-sm text-slate-500 flex items-center gap-1"
                                                >
                                                    <Building2
                                                        class="w-3 h-3"
                                                    />
                                                    <span class="truncate"
                                                        >{customer.company}</span
                                                    >
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 hidden md:table-cell">
                                    <div class="space-y-1">
                                        <div
                                            class="flex items-center gap-2 text-sm text-slate-700"
                                        >
                                            <Phone
                                                class="w-4 h-4 text-slate-400"
                                            />
                                            {customer.phone}
                                        </div>
                                        {#if customer.email}
                                            <div
                                                class="flex items-center gap-2 text-sm text-slate-500"
                                            >
                                                <Mail
                                                    class="w-4 h-4 text-slate-400"
                                                />
                                                <span
                                                    class="truncate max-w-[200px]"
                                                    >{customer.email}</span
                                                >
                                            </div>
                                        {/if}
                                    </div>
                                </td>
                                <td class="px-6 py-4 hidden lg:table-cell">
                                    {#if customer.locations.length > 0}
                                        <div
                                            class="flex items-center gap-2 text-sm text-slate-700"
                                        >
                                            <MapPin
                                                class="w-4 h-4 text-slate-400 flex-shrink-0"
                                            />
                                            <span
                                                class="truncate max-w-[200px]"
                                            >
                                                {customer.locations[0].city}
                                            </span>
                                        </div>
                                    {:else}
                                        <span class="text-sm text-slate-300"
                                            >—</span
                                        >
                                    {/if}
                                </td>
                                <td class="px-6 py-4 hidden sm:table-cell">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="flex items-center gap-1 text-sm"
                                            title="Zakázky"
                                        >
                                            <ClipboardList
                                                class="w-4 h-4 text-blue-500"
                                            />
                                            <span class="text-slate-700"
                                                >{customer._count.orders}</span
                                            >
                                        </div>
                                        <div
                                            class="flex items-center gap-1 text-sm"
                                            title="Servisy"
                                        >
                                            <Wrench
                                                class="w-4 h-4 text-orange-500"
                                            />
                                            <span class="text-slate-700"
                                                >{customer._count
                                                    .serviceTickets}</span
                                            >
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 hidden lg:table-cell">
                                    <span
                                        class={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getSourceBadgeColor(customer.source)}`}
                                    >
                                        {getSourceLabel(customer.source)}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="dropdown-container relative">
                                        <button
                                            onclick={(e) => {
                                                e.stopPropagation();
                                                toggleDropdown(customer.id);
                                            }}
                                            class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <MoreVertical
                                                class="w-5 h-5 text-slate-400"
                                            />
                                        </button>
                                        {#if openDropdown === customer.id}
                                            <div
                                                class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-elevated border border-futurol-border py-1 z-10"
                                            >
                                                <a
                                                    href="/dashboard/customers/{customer.id}"
                                                    class="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                    onclick={(e) =>
                                                        e.stopPropagation()}
                                                >
                                                    <Eye class="w-4 h-4" />
                                                    Zobrazit detail
                                                </a>
                                                {#if data.canEdit}
                                                    <a
                                                        href="/dashboard/customers/{customer.id}/edit"
                                                        class="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                        onclick={(e) =>
                                                            e.stopPropagation()}
                                                    >
                                                        <Edit class="w-4 h-4" />
                                                        Upravit
                                                    </a>
                                                {/if}
                                                {#if data.canDelete}
                                                    <button
                                                        onclick={(e) => {
                                                            e.stopPropagation();
                                                            deleteCustomer(
                                                                customer,
                                                            );
                                                        }}
                                                        class="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                                                    >
                                                        <Trash2
                                                            class="w-4 h-4"
                                                        />
                                                        Smazat
                                                    </button>
                                                {/if}
                                            </div>
                                        {/if}
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
                    class="px-6 py-4 border-t border-futurol-border flex items-center justify-between bg-slate-50"
                >
                    <div class="text-sm text-slate-500">
                        Strana {data.pagination.page} z {data.pagination
                            .totalPages}
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            onclick={() => goToPage(data.pagination.page - 1)}
                            disabled={data.pagination.page === 1}
                            class="p-2 rounded-lg border border-futurol-border bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft class="w-5 h-5 text-slate-500" />
                        </button>
                        <button
                            onclick={() => goToPage(data.pagination.page + 1)}
                            disabled={data.pagination.page ===
                                data.pagination.totalPages}
                            class="p-2 rounded-lg border border-futurol-border bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight class="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>
