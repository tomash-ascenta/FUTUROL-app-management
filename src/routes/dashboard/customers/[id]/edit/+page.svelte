<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        ArrowLeft,
        Save,
        User,
        Phone,
        Mail,
        Building2,
        FileText,
        Loader2,
    } from "lucide-svelte";

    interface Props {
        data: {
            customer: {
                id: string;
                fullName: string;
                email: string | null;
                phone: string;
                company: string | null;
                note: string | null;
            };
        };
    }

    let { data }: Props = $props();

    let loading = $state(false);
    let error = $state("");

    // Form data - synced from customer data via $effect
    let fullName = $state("");
    let phone = $state("");
    let email = $state("");
    let company = $state("");
    let note = $state("");

    // Sync state when data changes (Svelte 5 pattern - no initial reference)
    $effect(() => {
        fullName = data.customer.fullName;
        phone = data.customer.phone;
        email = data.customer.email || "";
        company = data.customer.company || "";
        note = data.customer.note || "";
    });

    // Validation
    let errors = $state<Record<string, string>>({});

    function validate(): boolean {
        errors = {};

        if (!fullName.trim() || fullName.trim().length < 2) {
            errors.fullName = "Jméno musí mít alespoň 2 znaky";
        }

        if (!phone.trim() || phone.trim().length < 9) {
            errors.phone = "Telefon musí mít alespoň 9 znaků";
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Neplatný formát emailu";
        }

        return Object.keys(errors).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;

        loading = true;
        error = "";

        try {
            const payload = {
                fullName: fullName.trim(),
                phone: phone.trim(),
                email: email.trim() || null,
                company: company.trim() || null,
                note: note.trim() || null,
            };

            const response = await fetch(`/api/customers/${data.customer.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                error = result.error || "Chyba při ukládání zákazníka";
                loading = false;
                return;
            }

            // Success - redirect to customer detail
            goto(`/dashboard/customers/${data.customer.id}`);
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
            href="/dashboard/customers/{data.customer.id}"
            class="p-2 hover:bg-slate-100 rounded transition-colors"
        >
            <ArrowLeft class="w-5 h-5 text-slate-500" />
        </a>
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Upravit zákazníka</h1>
            <p class="text-slate-500 mt-1">{data.customer.fullName}</p>
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

        <!-- Basic info -->
        <div class="bg-white rounded border border-slate-200 p-6 shadow-sm">
            <h2
                class="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2"
            >
                <User class="w-5 h-5 text-futurol-green" />
                Základní údaje
            </h2>

            <div class="space-y-4">
                <!-- Full name -->
                <div>
                    <label
                        for="fullName"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Jméno a příjmení *
                    </label>
                    <input
                        type="text"
                        id="fullName"
                        bind:value={fullName}
                        placeholder="Jan Novák"
                        class="w-full px-4 py-2.5 bg-white border rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green focus:border-transparent {errors.fullName
                            ? 'border-red-500'
                            : 'border-slate-300'}"
                    />
                    {#if errors.fullName}
                        <p class="mt-1 text-sm text-red-600">
                            {errors.fullName}
                        </p>
                    {/if}
                </div>

                <!-- Phone -->
                <div>
                    <label
                        for="phone"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        <span class="flex items-center gap-1">
                            <Phone class="w-4 h-4" />
                            Telefon *
                        </span>
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        bind:value={phone}
                        placeholder="+420 777 123 456"
                        class="w-full px-4 py-2.5 bg-white border rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green focus:border-transparent {errors.phone
                            ? 'border-red-500'
                            : 'border-slate-300'}"
                    />
                    {#if errors.phone}
                        <p class="mt-1 text-sm text-red-600">{errors.phone}</p>
                    {/if}
                </div>

                <!-- Email -->
                <div>
                    <label
                        for="email"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        <span class="flex items-center gap-1">
                            <Mail class="w-4 h-4" />
                            Email
                        </span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        bind:value={email}
                        placeholder="jan.novak@email.cz"
                        class="w-full px-4 py-2.5 bg-white border rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green focus:border-transparent {errors.email
                            ? 'border-red-500'
                            : 'border-slate-300'}"
                    />
                    {#if errors.email}
                        <p class="mt-1 text-sm text-red-600">{errors.email}</p>
                    {/if}
                </div>

                <!-- Company -->
                <div>
                    <label
                        for="company"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        <span class="flex items-center gap-1">
                            <Building2 class="w-4 h-4" />
                            Firma
                        </span>
                    </label>
                    <input
                        type="text"
                        id="company"
                        bind:value={company}
                        placeholder="Název firmy (volitelné)"
                        class="w-full px-4 py-2.5 bg-white border border-slate-300 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green focus:border-transparent"
                    />
                </div>

                <!-- Note -->
                <div>
                    <label
                        for="note"
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        <span class="flex items-center gap-1">
                            <FileText class="w-4 h-4" />
                            Poznámka
                        </span>
                    </label>
                    <textarea
                        id="note"
                        bind:value={note}
                        rows="3"
                        placeholder="Interní poznámka k zákazníkovi..."
                        class="w-full px-4 py-2.5 bg-white border border-slate-300 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green focus:border-transparent resize-none"
                    ></textarea>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
            <a
                href="/dashboard/customers/{data.customer.id}"
                class="px-4 py-2.5 text-slate-500 hover:text-slate-700 transition-colors"
            >
                Zrušit
            </a>
            <button
                type="submit"
                disabled={loading}
                class="inline-flex items-center gap-2 bg-futurol-green text-white px-6 py-2.5 rounded font-medium hover:bg-futurol-green-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {#if loading}
                    <Loader2 class="w-5 h-5 animate-spin" />
                    Ukládám...
                {:else}
                    <Save class="w-5 h-5" />
                    Uložit změny
                {/if}
            </button>
        </div>
    </form>
</div>
