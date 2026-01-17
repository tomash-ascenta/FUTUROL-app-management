<script lang="ts">
    import {
        ArrowLeft,
        Save,
        User,
        Phone,
        MapPin,
        AlertCircle,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { getCustomerDisplayName, getPrimaryContact } from "$lib/utils";

    interface Props {
        data: {
            customers: Array<{
                id: string;
                type: string;
                companyName: string | null;
                contacts: Array<{
                    fullName: string;
                    phone: string;
                    isPrimary: boolean;
                }>;
                orders: Array<{
                    id: string;
                    orderNumber: string;
                    location: { city: string } | null;
                }>;
            }>;
            technicians: Array<{
                id: string;
                fullName: string;
                personalNumber: string;
            }>;
            preselectedCustomerId: string | null;
            preselectedOrderId: string | null;
        };
    }

    let { data }: Props = $props();

    let isSubmitting = $state(false);
    let error = $state("");

    // Form data - initialize with preselected customer if provided
    let customerId = $state("");
    let orderId = $state("");
    let type = $state<"warranty" | "paid" | "maintenance" | "complaint">(
        "complaint",
    );
    let priority = $state<"low" | "normal" | "high" | "urgent">("normal");
    let description = $state("");
    let assignedToId = $state("");

    // Set preselected customer and order on load
    $effect(() => {
        if (data.preselectedCustomerId && !customerId) {
            customerId = data.preselectedCustomerId;
        }
    });

    // Set preselected order after customer is set
    $effect(() => {
        if (data.preselectedOrderId && customerId && !orderId) {
            orderId = data.preselectedOrderId;
        }
    });

    // Get orders for selected customer
    let selectedCustomer = $derived(
        data.customers.find((c) => c.id === customerId),
    );
    let availableOrders = $derived(selectedCustomer?.orders || []);

    // Form validation
    let isValid = $derived(customerId !== "" && description.trim() !== "");

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        if (!isValid || isSubmitting) return;

        isSubmitting = true;
        error = "";

        try {
            const response = await fetch("/api/service-tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerId,
                    orderId: orderId || null,
                    type,
                    priority,
                    description: description.trim(),
                    assignedToId: assignedToId || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Nepodařilo se vytvořit tiket");
            }

            const result = await response.json();
            goto(`/dashboard/service/${result.id}`);
        } catch (err) {
            error = err instanceof Error ? err.message : "Neznámá chyba";
        } finally {
            isSubmitting = false;
        }
    }

    const typeLabels: Record<string, string> = {
        warranty: "Záruka",
        paid: "Placený servis",
        maintenance: "Údržba",
        complaint: "Reklamace",
    };

    const priorityLabels: Record<string, string> = {
        low: "Nízká",
        normal: "Normální",
        high: "Vysoká",
        urgent: "Urgentní",
    };
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
        <a
            href="/dashboard/service"
            class="p-2 hover:bg-slate-100 rounded transition-colors"
        >
            <ArrowLeft class="w-5 h-5 text-slate-600" />
        </a>
        <div>
            <h1 class="text-2xl font-bold text-slate-800">
                Nový servisní tiket
            </h1>
            <p class="text-slate-500 mt-1">
                Zadejte informace o servisním požadavku
            </p>
        </div>
    </div>

    {#if error}
        <div
            class="bg-red-50 border border-red-200 rounded p-4 flex items-center gap-3"
        >
            <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
            <p class="text-red-700">{error}</p>
        </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-6">
        <div
            class="bg-white rounded shadow-sm border border-slate-200 p-6 space-y-6"
        >
            <!-- Customer selection -->
            <div>
                <label
                    for="customer"
                    class="block text-sm font-medium text-slate-700 mb-1"
                >
                    Zákazník *
                </label>
                <select
                    id="customer"
                    bind:value={customerId}
                    required
                    class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                >
                    <option value="">Vyberte zákazníka</option>
                    {#each data.customers as customer}
                        <option value={customer.id}>
                            {getCustomerDisplayName(customer)} ({getPrimaryContact(
                                customer,
                            )?.phone || "-"})
                        </option>
                    {/each}
                </select>
            </div>

            <!-- Order selection (optional) -->
            {#if availableOrders.length > 0}
                <div>
                    <label
                        for="order"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Zakázka (volitelné)
                    </label>
                    <select
                        id="order"
                        bind:value={orderId}
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                    >
                        <option value="">Bez vazby na zakázku</option>
                        {#each availableOrders as order}
                            <option value={order.id}>
                                {order.orderNumber}
                                {#if order.location}
                                    - {order.location.city}
                                {/if}
                            </option>
                        {/each}
                    </select>
                </div>
            {/if}

            <!-- Type and Priority -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label
                        for="type"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Typ tiketu *
                    </label>
                    <select
                        id="type"
                        bind:value={type}
                        required
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                    >
                        {#each Object.entries(typeLabels) as [value, label]}
                            <option {value}>{label}</option>
                        {/each}
                    </select>
                </div>

                <div>
                    <label
                        for="priority"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Priorita *
                    </label>
                    <select
                        id="priority"
                        bind:value={priority}
                        required
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                    >
                        {#each Object.entries(priorityLabels) as [value, label]}
                            <option {value}>{label}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <!-- Assigned technician (optional) -->
            <div>
                <label
                    for="assignedTo"
                    class="block text-sm font-medium text-slate-700 mb-1"
                >
                    Přiřadit technikovi (volitelné)
                </label>
                <select
                    id="assignedTo"
                    bind:value={assignedToId}
                    class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                >
                    <option value="">Nepřiřazeno</option>
                    {#each data.technicians as tech}
                        <option value={tech.id}>
                            {tech.fullName} ({tech.personalNumber})
                        </option>
                    {/each}
                </select>
            </div>

            <!-- Description -->
            <div>
                <label
                    for="description"
                    class="block text-sm font-medium text-slate-700 mb-1"
                >
                    Popis problému *
                </label>
                <textarea
                    id="description"
                    bind:value={description}
                    required
                    rows="4"
                    placeholder="Popište detailně problém zákazníka..."
                    class="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green resize-none"
                ></textarea>
            </div>
        </div>

        <!-- Submit button -->
        <div class="flex justify-end gap-3">
            <a
                href="/dashboard/service"
                class="px-4 py-2.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors"
            >
                Zrušit
            </a>
            <button
                type="submit"
                disabled={!isValid || isSubmitting}
                class="inline-flex items-center gap-2 bg-futurol-green text-white px-6 py-2.5 rounded font-medium hover:bg-futurol-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Save class="w-5 h-5" />
                {isSubmitting ? "Ukládám..." : "Vytvořit tiket"}
            </button>
        </div>
    </form>
</div>
