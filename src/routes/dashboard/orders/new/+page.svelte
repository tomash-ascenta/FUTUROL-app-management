<script lang="ts">
    import { ArrowLeft, Loader2, Check } from "lucide-svelte";
    import { goto } from "$app/navigation";

    interface Location {
        id: string;
        street: string;
        city: string;
        zip: string;
    }

    interface Customer {
        id: string;
        fullName: string;
        phone: string;
        company: string | null;
        locations: Location[];
    }

    interface Product {
        id: string;
        name: string;
        code: string;
        description: string | null;
    }

    interface PageData {
        customers: Customer[];
        products: Product[];
        preselectedCustomerId: string | null;
    }

    let { data }: { data: PageData } = $props();

    let isSubmitting = $state(false);
    let error = $state("");

    // Form data
    let customerId = $state("");
    let locationId = $state("");
    let productId = $state("");
    let priority = $state("normal");
    let estimatedValue: number | null = $state(null);

    // Initialize customerId from preselected value
    $effect(() => {
        if (data.preselectedCustomerId && !customerId) {
            customerId = data.preselectedCustomerId;
        }
    });

    // Get locations for selected customer
    let selectedCustomer = $derived(
        data.customers.find((c: Customer) => c.id === customerId),
    );
    let availableLocations = $derived(selectedCustomer?.locations || []);

    // Auto-select first location when customer changes
    $effect(() => {
        if (availableLocations.length > 0 && !locationId) {
            locationId = availableLocations[0].id;
        }
    });

    async function handleSubmit() {
        if (!customerId) {
            error = "Vyberte zákazníka";
            return;
        }

        // Pokud jsou dostupné lokace, musí být vybrána
        if (availableLocations.length > 0 && !locationId) {
            error = "Vyberte místo realizace";
            return;
        }

        isSubmitting = true;
        error = "";

        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerId,
                    locationId: locationId || undefined,
                    productId: productId || undefined,
                    priority,
                    estimatedValue: estimatedValue ?? undefined,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Chyba při vytváření zakázky");
            }

            goto("/dashboard/orders");
        } catch (e) {
            error = e instanceof Error ? e.message : "Nastala chyba";
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
        <a
            href="/dashboard/orders"
            class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
            <ArrowLeft class="w-5 h-5 text-slate-600" />
        </a>
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Nová zakázka</h1>
            <p class="text-slate-500 mt-1">Vytvořte novou zakázku</p>
        </div>
    </div>

    <!-- Form -->
    <form
        onsubmit={(e) => {
            e.preventDefault();
            handleSubmit();
        }}
        class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6"
    >
        {#if error}
            <div
                class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
            >
                {error}
            </div>
        {/if}

        <!-- Customer -->
        <div>
            <span class="block text-sm font-medium text-slate-700 mb-2"
                >Zákazník *</span
            >
            <select
                bind:value={customerId}
                class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                required
            >
                <option value="">Vyberte zákazníka...</option>
                {#each data.customers as customer}
                    <option value={customer.id}>
                        {customer.fullName}
                        {#if customer.company}
                            ({customer.company})
                        {/if}
                    </option>
                {/each}
            </select>
        </div>

        <!-- Location -->
        {#if customerId && availableLocations.length > 0}
            <div>
                <span class="block text-sm font-medium text-slate-700 mb-2"
                    >Místo realizace *</span
                >
                <select
                    bind:value={locationId}
                    class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                    required
                >
                    {#each availableLocations as location}
                        <option value={location.id}>
                            {location.street}, {location.city}
                            {location.zip}
                        </option>
                    {/each}
                </select>
            </div>
        {:else if customerId && availableLocations.length === 0}
            <div
                class="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm"
            >
                Zákazník nemá žádné místo realizace. Lokaci můžete přidat
                později v detailu zákazníka.
            </div>
        {/if}

        <!-- Product -->
        <div>
            <span class="block text-sm font-medium text-slate-700 mb-2"
                >Produkt</span
            >
            <select
                bind:value={productId}
                class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
            >
                <option value="">Zatím neurčeno</option>
                {#each data.products as product}
                    <option value={product.id}
                        >{product.name}{#if product.description}
                            - {product.description}{/if}</option
                    >
                {/each}
            </select>
        </div>

        <!-- Priority -->
        <div>
            <span class="block text-sm font-medium text-slate-700 mb-2"
                >Priorita</span
            >
            <div class="flex gap-3">
                {#each [{ value: "low", label: "Nízká", color: "bg-slate-100 text-slate-600" }, { value: "normal", label: "Normální", color: "bg-blue-100 text-blue-700" }, { value: "high", label: "Vysoká", color: "bg-orange-100 text-orange-700" }, { value: "urgent", label: "Urgentní", color: "bg-red-100 text-red-700" }] as p}
                    <button
                        type="button"
                        onclick={() => (priority = p.value)}
                        class="px-4 py-2 rounded-lg text-sm font-medium transition-all {priority ===
                        p.value
                            ? p.color + ' ring-2 ring-offset-1 ring-current'
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}"
                    >
                        {p.label}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Estimated value -->
        <div>
            <span class="block text-sm font-medium text-slate-700 mb-2"
                >Předběžná hodnota zakázky (Kč)</span
            >
            <input
                type="number"
                bind:value={estimatedValue}
                placeholder="Zadejte předběžnou hodnotu..."
                class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green placeholder:text-slate-400"
            />
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <a
                href="/dashboard/orders"
                class="px-4 py-2.5 text-slate-600 hover:text-slate-800 transition-colors"
            >
                Zrušit
            </a>
            <button
                type="submit"
                disabled={isSubmitting ||
                    !customerId ||
                    (availableLocations.length > 0 && !locationId)}
                class="inline-flex items-center gap-2 bg-futurol-green text-white px-6 py-2.5 rounded-lg font-medium hover:bg-futurol-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {#if isSubmitting}
                    <Loader2 class="w-5 h-5 animate-spin" />
                    Vytvářím...
                {:else}
                    <Check class="w-5 h-5" />
                    Vytvořit zakázku
                {/if}
            </button>
        </div>
    </form>
</div>
