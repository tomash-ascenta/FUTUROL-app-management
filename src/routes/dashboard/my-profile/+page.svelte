<script lang="ts">
    import {
        KeyRound,
        User,
        Save,
        AlertCircle,
        CheckCircle,
    } from "lucide-svelte";

    interface Props {
        data: {
            user: {
                employeeId: string;
                personalNumber: string;
                fullName: string;
                roles: string[];
            };
        };
    }

    let { data }: Props = $props();

    let currentPin = $state("");
    let newPin = $state("");
    let confirmPin = $state("");
    let loading = $state(false);
    let error = $state("");
    let success = $state("");

    async function handleChangePin() {
        error = "";
        success = "";

        if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
            error = "Nový PIN musí mít přesně 6 číslic";
            return;
        }

        if (newPin !== confirmPin) {
            error = "PIN a potvrzení se neshodují";
            return;
        }

        if (currentPin.length !== 6) {
            error = "Zadejte aktuální PIN";
            return;
        }

        loading = true;

        try {
            const response = await fetch("/api/auth/change-pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPin, newPin }),
            });

            const result = await response.json();

            if (!response.ok) {
                error = result.error || "Chyba při změně PIN";
                loading = false;
                return;
            }

            success = "PIN byl úspěšně změněn";
            currentPin = "";
            newPin = "";
            confirmPin = "";
        } catch (e) {
            error = "Chyba připojení k serveru";
        }

        loading = false;
    }

    function getRoleLabel(role: string): string {
        const labels: Record<string, string> = {
            admin: "Admin",
            director: "Ředitel",
            sales: "Obchodník",
            production_manager: "Vedoucí výroby",
            surveyor: "Zaměřovač",
            technician: "Technik",
        };
        return labels[role] || role;
    }
</script>

<div class="max-w-2xl mx-auto space-y-6">
    <div>
        <h1 class="text-2xl font-bold text-slate-800">Můj profil</h1>
        <p class="text-slate-500 mt-1">
            Správa vašeho účtu a bezpečnostních údajů
        </p>
    </div>

    <!-- Profile info -->
    <div class="bg-white rounded border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center gap-4 mb-6">
            <div
                class="w-16 h-16 bg-futurol-green/10 rounded-full flex items-center justify-center border border-futurol-green/20"
            >
                <span class="text-xl font-bold text-futurol-green">
                    {data.user.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                </span>
            </div>
            <div>
                <h2 class="text-xl font-semibold text-slate-800">
                    {data.user.fullName}
                </h2>
                <p class="text-slate-500">
                    Osobní číslo: {data.user.personalNumber}
                </p>
            </div>
        </div>

        <div class="border-t border-slate-200 pt-4">
            <h3 class="text-sm font-medium text-slate-500 mb-2">Vaše role</h3>
            <div class="flex flex-wrap gap-2">
                {#each data.user.roles as role}
                    <span
                        class="px-3 py-1 text-sm font-medium rounded-full bg-futurol-green/10 text-futurol-green"
                    >
                        {getRoleLabel(role)}
                    </span>
                {/each}
            </div>
        </div>
    </div>

    <!-- Change PIN -->
    <div class="bg-white rounded border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-6">
            <div
                class="w-10 h-10 bg-orange-100 rounded flex items-center justify-center"
            >
                <KeyRound class="w-5 h-5 text-orange-600" />
            </div>
            <div>
                <h2 class="text-lg font-semibold text-slate-800">Změna PIN</h2>
                <p class="text-sm text-slate-500">
                    Změňte svůj přihlašovací PIN kód
                </p>
            </div>
        </div>

        {#if error}
            <div
                class="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-700"
            >
                <AlertCircle class="w-5 h-5 flex-shrink-0" />
                <span class="text-sm">{error}</span>
            </div>
        {/if}

        {#if success}
            <div
                class="mb-4 p-3 bg-futurol-green/10 border border-futurol-green/20 rounded flex items-center gap-2 text-futurol-green"
            >
                <CheckCircle class="w-5 h-5 flex-shrink-0" />
                <span class="text-sm">{success}</span>
            </div>
        {/if}

        <form
            onsubmit={(e) => {
                e.preventDefault();
                handleChangePin();
            }}
            class="space-y-4"
        >
            <div>
                <label
                    for="currentPin"
                    class="block text-sm font-medium text-slate-700 mb-1"
                >
                    Aktuální PIN
                </label>
                <input
                    type="password"
                    id="currentPin"
                    bind:value={currentPin}
                    maxlength="6"
                    pattern="\d{6}"
                    placeholder="••••••"
                    class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green font-mono text-center text-lg tracking-widest"
                />
            </div>

            <div>
                <label
                    for="newPin"
                    class="block text-sm font-medium text-slate-700 mb-1"
                >
                    Nový PIN (6 číslic)
                </label>
                <input
                    type="password"
                    id="newPin"
                    bind:value={newPin}
                    maxlength="6"
                    pattern="\d{6}"
                    placeholder="••••••"
                    class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green font-mono text-center text-lg tracking-widest"
                />
            </div>

            <div>
                <label
                    for="confirmPin"
                    class="block text-sm font-medium text-slate-700 mb-1"
                >
                    Potvrzení nového PIN
                </label>
                <input
                    type="password"
                    id="confirmPin"
                    bind:value={confirmPin}
                    maxlength="6"
                    pattern="\d{6}"
                    placeholder="••••••"
                    class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green font-mono text-center text-lg tracking-widest"
                />
            </div>

            <button
                type="submit"
                disabled={loading ||
                    newPin.length !== 6 ||
                    confirmPin.length !== 6}
                class="w-full flex items-center justify-center gap-2 py-3 rounded font-medium text-white transition-colors
					{loading || newPin.length !== 6 || confirmPin.length !== 6
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                    : 'bg-futurol-green hover:bg-futurol-green/90 shadow-sm'}"
            >
                <Save class="w-5 h-5" />
                {loading ? "Ukládám..." : "Změnit PIN"}
            </button>
        </form>
    </div>
</div>
