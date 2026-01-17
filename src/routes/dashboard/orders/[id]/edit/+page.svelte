<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        ArrowLeft,
        Save,
        Package,
        MapPin,
        Calendar,
        CreditCard,
        FileText,
        Loader2,
        Flag,
    } from "lucide-svelte";
    import { getCustomerDisplayName } from "$lib/utils";

    interface Location {
        id: string;
        street: string;
        city: string;
        zip: string;
    }

    interface Product {
        id: string;
        code: string;
        name: string;
    }

    interface Props {
        data: {
            order: {
                id: string;
                orderNumber: string;
                status: string;
                priority: string;
                estimatedValue: number | null;
                finalValue: number | null;
                deadlineAt: string | null;
                locationId: string | null;
                productId: string | null;
                customer: {
                    id: string;
                    type: string;
                    companyName: string | null;
                    contacts: Array<{ fullName: string; isPrimary: boolean }>;
                };
            };
            products: Product[];
            locations: Location[];
        };
    }

    let { data }: Props = $props();

    let loading = $state(false);
    let error = $state("");

    // Form data
    let status = $state("");
    let priority = $state("");
    let estimatedValue = $state<number | null>(null);
    let finalValue = $state<number | null>(null);
    let deadlineAt = $state("");
    let locationId = $state("");
    let productId = $state("");

    // Sync state when data changes
    $effect(() => {
        status = data.order.status;
        priority = data.order.priority;
        estimatedValue = data.order.estimatedValue;
        finalValue = data.order.finalValue;
        deadlineAt = data.order.deadlineAt
            ? data.order.deadlineAt.split("T")[0]
            : "";
        locationId = data.order.locationId || "";
        productId = data.order.productId || "";
    });

    const statusOptions = [
        { value: "lead", label: "Nový lead" },
        { value: "contacted", label: "Kontaktováno" },
        { value: "measurement_scheduled", label: "Zaměření naplánováno" },
        { value: "measurement_done", label: "Zaměření dokončeno" },
        { value: "quote_sent", label: "Nabídka odeslána" },
        { value: "quote_approved", label: "Nabídka schválena" },
        { value: "in_production", label: "Ve výrobě" },
        { value: "production_done", label: "Výroba dokončena" },
        { value: "installation_scheduled", label: "Montáž naplánována" },
        { value: "installed", label: "Namontováno" },
        { value: "completed", label: "Dokončeno" },
        { value: "cancelled", label: "Zrušeno" },
    ];

    const priorityOptions = [
        { value: "low", label: "Nízká" },
        { value: "normal", label: "Normální" },
        { value: "high", label: "Vysoká" },
        { value: "urgent", label: "Urgentní" },
    ];

    async function handleSubmit() {
        loading = true;
        error = "";

        try {
            const payload: Record<string, unknown> = {
                status,
                priority,
                estimatedValue: estimatedValue || null,
                finalValue: finalValue || null,
                deadlineAt: deadlineAt || null,
                locationId: locationId || null,
                productId: productId || null,
            };

            const response = await fetch(`/api/orders/${data.order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                error = result.error || "Chyba při ukládání zakázky";
                loading = false;
                return;
            }

            // Success - redirect back to order detail
            goto(`/dashboard/orders/${data.order.id}`);
        } catch (e) {
            error = "Chyba připojení k serveru";
            loading = false;
        }
    }
</script>

<div class="max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
        <a
            href="/dashboard/orders/{data.order.id}"
            class="p-2 hover:bg-slate-100 rounded transition-colors"
        >
            <ArrowLeft class="w-5 h-5 text-slate-500" />
        </a>
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Upravit zakázku</h1>
            <p class="text-slate-500 mt-1">
                {data.order.orderNumber} • {getCustomerDisplayName(
                    data.order.customer,
                )}
            </p>
        </div>
    </div>

    <!-- Form -->
    <form
        onsubmit={(e) => {
            e.preventDefault();
            handleSubmit();
        }}
        class="space-y-6"
    >
        {#if error}
            <div
                class="bg-red-50 border border-red-200 rounded p-4 text-red-600"
            >
                {error}
            </div>
        {/if}

        <!-- Status & Priority -->
        <div class="bg-white rounded border border-slate-200 p-6 shadow-sm">
            <h2
                class="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2"
            >
                <Flag class="w-5 h-5 text-futurol-green" />
                Stav a priorita
            </h2>

            <div class="grid grid-cols-2 gap-4">
                <!-- Status -->
                <div>
                    <label
                        for="status"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Stav zakázky
                    </label>
                    <select
                        id="status"
                        bind:value={status}
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                    >
                        {#each statusOptions as option}
                            <option value={option.value}>{option.label}</option>
                        {/each}
                    </select>
                </div>

                <!-- Priority -->
                <div>
                    <label
                        for="priority"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Priorita
                    </label>
                    <select
                        id="priority"
                        bind:value={priority}
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                    >
                        {#each priorityOptions as option}
                            <option value={option.value}>{option.label}</option>
                        {/each}
                    </select>
                </div>
            </div>
        </div>

        <!-- Product & Location -->
        <div class="bg-white rounded border border-slate-200 p-6 shadow-sm">
            <h2
                class="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2"
            >
                <Package class="w-5 h-5 text-futurol-green" />
                Produkt a místo realizace
            </h2>

            <div class="space-y-4">
                <!-- Product -->
                <div>
                    <label
                        for="product"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Typ pergoly
                    </label>
                    <select
                        id="product"
                        bind:value={productId}
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                    >
                        <option value="">-- Vyberte produkt --</option>
                        {#each data.products as product}
                            <option value={product.id}>
                                {product.name} ({product.code})
                            </option>
                        {/each}
                    </select>
                </div>

                <!-- Location -->
                <div>
                    <label
                        for="location"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        <span class="flex items-center gap-1">
                            <MapPin class="w-4 h-4" />
                            Místo realizace
                        </span>
                    </label>
                    <select
                        id="location"
                        bind:value={locationId}
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                    >
                        <option value="">-- Nevybráno --</option>
                        {#each data.locations as loc}
                            <option value={loc.id}>
                                {loc.street}, {loc.city}
                                {loc.zip}
                            </option>
                        {/each}
                    </select>
                    {#if data.locations.length === 0}
                        <p class="text-xs text-slate-500 mt-1">
                            Zákazník nemá žádné uložené adresy. Přidejte je v
                            detailu zákazníka.
                        </p>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Values -->
        <div class="bg-white rounded border border-slate-200 p-6 shadow-sm">
            <h2
                class="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2"
            >
                <CreditCard class="w-5 h-5 text-futurol-green" />
                Hodnota zakázky
            </h2>

            <div class="grid grid-cols-2 gap-4">
                <!-- Estimated value -->
                <div>
                    <label
                        for="estimatedValue"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Předběžná hodnota (Kč)
                    </label>
                    <input
                        id="estimatedValue"
                        type="number"
                        bind:value={estimatedValue}
                        min="0"
                        step="1000"
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                        placeholder="100 000"
                    />
                </div>

                <!-- Final value -->
                <div>
                    <label
                        for="finalValue"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Konečná hodnota (Kč)
                    </label>
                    <input
                        id="finalValue"
                        type="number"
                        bind:value={finalValue}
                        min="0"
                        step="1000"
                        class="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                        placeholder="120 000"
                    />
                </div>
            </div>
        </div>

        <!-- Deadline -->
        <div class="bg-white rounded border border-slate-200 p-6 shadow-sm">
            <h2
                class="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2"
            >
                <Calendar class="w-5 h-5 text-futurol-green" />
                Termín
            </h2>

            <div>
                <label
                    for="deadline"
                    class="block text-sm font-medium text-slate-700 mb-1"
                >
                    Deadline zakázky
                </label>
                <input
                    id="deadline"
                    type="date"
                    bind:value={deadlineAt}
                    class="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-futurol-green/20 focus:border-futurol-green"
                />
            </div>
        </div>

        <!-- Submit buttons -->
        <div class="flex items-center gap-3 justify-end">
            <a
                href="/dashboard/orders/{data.order.id}"
                class="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors"
            >
                Zrušit
            </a>
            <button
                type="submit"
                disabled={loading}
                class="inline-flex items-center gap-2 px-6 py-2 bg-futurol-green text-white rounded hover:bg-futurol-green/90 transition-colors disabled:opacity-50"
            >
                {#if loading}
                    <Loader2 class="w-4 h-4 animate-spin" />
                    Ukládám...
                {:else}
                    <Save class="w-4 h-4" />
                    Uložit změny
                {/if}
            </button>
        </div>
    </form>
</div>
