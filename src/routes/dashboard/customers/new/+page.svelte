<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        ArrowLeft,
        Save,
        User,
        Phone,
        Mail,
        Building2,
        MapPin,
        FileText,
        Loader2,
    } from "lucide-svelte";

    let loading = $state(false);
    let error = $state("");

    // Form data
    let fullName = $state("");
    let phone = $state("");
    let email = $state("");
    let company = $state("");
    let note = $state("");

    // Location data (optional)
    let addLocation = $state(false);
    let street = $state("");
    let city = $state("");
    let zip = $state("");

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

        if (addLocation) {
            if (!street.trim()) {
                errors.street = "Ulice je povinná";
            }
            if (!city.trim()) {
                errors.city = "Město je povinné";
            }
            if (!zip.trim() || zip.trim().length < 5) {
                errors.zip = "PSČ musí mít alespoň 5 znaků";
            }
        }

        return Object.keys(errors).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;

        loading = true;
        error = "";

        try {
            const payload: Record<string, unknown> = {
                fullName: fullName.trim(),
                phone: phone.trim(),
                email: email.trim() || undefined,
                company: company.trim() || undefined,
                note: note.trim() || undefined,
            };

            if (addLocation && street && city && zip) {
                payload.location = {
                    street: street.trim(),
                    city: city.trim(),
                    zip: zip.trim(),
                    country: "CZ",
                };
            }

            const response = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                error = data.error || "Chyba při vytváření zákazníka";
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
            href="/dashboard/customers"
            class="p-2 hover:bg-slate-100 rounded transition-colors"
        >
            <ArrowLeft class="w-5 h-5 text-slate-500" />
        </a>
        <div>
            <h1 class="text-2xl font-bold text-slate-800">Nový zákazník</h1>
            <p class="text-slate-500 mt-1">Vyplňte údaje o zákazníkovi</p>
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
                class="bg-red-50 border border-red-200 rounded p-4 text-red-700"
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
                        class="w-full px-4 py-2.5 bg-white border rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green {errors.fullName
                            ? 'border-red-500'
                            : 'border-slate-200'}"
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
                        class="w-full px-4 py-2.5 bg-white border rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green {errors.phone
                            ? 'border-red-500'
                            : 'border-slate-200'}"
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
                        class="w-full px-4 py-2.5 bg-white border rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green {errors.email
                            ? 'border-red-500'
                            : 'border-slate-200'}"
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
                        class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
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
                        class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green resize-none"
                    ></textarea>
                </div>
            </div>
        </div>

        <!-- Location (optional) -->
        <div class="bg-white rounded border border-slate-200 p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4">
                <h2
                    class="text-lg font-medium text-slate-800 flex items-center gap-2"
                >
                    <MapPin class="w-5 h-5 text-futurol-green" />
                    Adresa realizace
                </h2>
                <label class="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        bind:checked={addLocation}
                        class="w-4 h-4 rounded border-slate-300 bg-white text-futurol-green focus:ring-futurol-green focus:ring-offset-0"
                    />
                    <span class="text-sm text-slate-600">Přidat adresu</span>
                </label>
            </div>

            {#if addLocation}
                <div class="space-y-4">
                    <!-- Street -->
                    <div>
                        <label
                            for="street"
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Ulice a číslo popisné *
                        </label>
                        <input
                            type="text"
                            id="street"
                            bind:value={street}
                            placeholder="Příkladná 123"
                            class="w-full px-4 py-2.5 bg-white border rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green {errors.street
                                ? 'border-red-500'
                                : 'border-slate-200'}"
                        />
                        {#if errors.street}
                            <p class="mt-1 text-sm text-red-600">
                                {errors.street}
                            </p>
                        {/if}
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <!-- City -->
                        <div>
                            <label
                                for="city"
                                class="block text-sm font-medium text-slate-700 mb-1"
                            >
                                Město *
                            </label>
                            <input
                                type="text"
                                id="city"
                                bind:value={city}
                                placeholder="Praha"
                                class="w-full px-4 py-2.5 bg-white border rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green {errors.city
                                    ? 'border-red-500'
                                    : 'border-slate-200'}"
                            />
                            {#if errors.city}
                                <p class="mt-1 text-sm text-red-600">
                                    {errors.city}
                                </p>
                            {/if}
                        </div>

                        <!-- ZIP -->
                        <div>
                            <label
                                for="zip"
                                class="block text-sm font-medium text-slate-700 mb-1"
                            >
                                PSČ *
                            </label>
                            <input
                                type="text"
                                id="zip"
                                bind:value={zip}
                                placeholder="110 00"
                                class="w-full px-4 py-2.5 bg-white border rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green {errors.zip
                                    ? 'border-red-500'
                                    : 'border-slate-200'}"
                            />
                            {#if errors.zip}
                                <p class="mt-1 text-sm text-red-600">
                                    {errors.zip}
                                </p>
                            {/if}
                        </div>
                    </div>
                </div>
            {:else}
                <p class="text-slate-500 text-sm">
                    Adresu můžete přidat i později při vytváření zakázky.
                </p>
            {/if}
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
            <a
                href="/dashboard/customers"
                class="px-4 py-2.5 text-slate-500 hover:text-slate-800 transition-colors"
            >
                Zrušit
            </a>
            <button
                type="submit"
                disabled={loading}
                class="inline-flex items-center gap-2 bg-futurol-green text-white px-6 py-2.5 rounded font-medium hover:bg-futurol-green/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {#if loading}
                    <Loader2 class="w-5 h-5 animate-spin" />
                    Ukládám...
                {:else}
                    <Save class="w-5 h-5" />
                    Uložit zákazníka
                {/if}
            </button>
        </div>
    </form>
</div>
