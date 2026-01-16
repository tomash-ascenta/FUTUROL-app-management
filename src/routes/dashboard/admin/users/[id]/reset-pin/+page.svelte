<script lang="ts">
    import { enhance } from "$app/forms";
    import {
        ArrowLeft,
        Shield,
        Eye,
        EyeOff,
        AlertTriangle,
    } from "lucide-svelte";

    interface Props {
        data: {
            user: {
                id: string;
                personalNumber: string;
                fullName: string;
            };
        };
        form: { error?: string } | null;
    }

    let { data, form }: Props = $props();

    let showPin = $state(false);
    let showConfirmPin = $state(false);
    let isSubmitting = $state(false);
    let newPin = $state("");
    let confirmPin = $state("");

    let pinsMatch = $derived(newPin === confirmPin && newPin.length === 6);
</script>

<div class="max-w-md mx-auto">
    <div class="mb-6">
        <a
            href="/dashboard/admin/users/{data.user.id}"
            class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
        >
            <ArrowLeft class="w-4 h-4" />
            Zpět na detail uživatele
        </a>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div class="p-6 border-b border-slate-200">
            <div class="flex items-center gap-4">
                <div
                    class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center"
                >
                    <Shield class="w-6 h-6 text-orange-600" />
                </div>
                <div>
                    <h1 class="text-xl font-bold text-slate-800">Reset PIN</h1>
                    <p class="text-slate-500">
                        {data.user.fullName}
                        <code
                            class="ml-1 px-2 py-0.5 bg-slate-100 rounded text-xs font-mono"
                        >
                            {data.user.personalNumber}
                        </code>
                    </p>
                </div>
            </div>
        </div>

        {#if form?.error}
            <div
                class="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
            >
                <AlertTriangle class="w-5 h-5 text-red-600 flex-shrink-0" />
                <p class="text-red-700 text-sm">{form.error}</p>
            </div>
        {/if}

        <form
            method="POST"
            use:enhance={() => {
                isSubmitting = true;
                return async ({ update }) => {
                    isSubmitting = false;
                    await update();
                };
            }}
            class="p-6 space-y-6"
        >
            <!-- Warning -->
            <div
                class="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200"
            >
                <AlertTriangle
                    class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                />
                <div class="text-sm text-amber-700">
                    <p class="font-medium mb-1">Upozornění</p>
                    <p>
                        Po resetování PINu bude nutné sdělit uživateli nový PIN
                        osobně. Starý PIN přestane okamžitě fungovat.
                    </p>
                </div>
            </div>

            <!-- New PIN -->
            <div>
                <label
                    for="newPin"
                    class="block text-sm font-medium text-slate-700 mb-2"
                >
                    Nový PIN *
                </label>
                <div class="relative">
                    <input
                        type={showPin ? "text" : "password"}
                        id="newPin"
                        name="newPin"
                        required
                        maxlength="6"
                        pattern="[0-9]{6}"
                        placeholder="123456"
                        bind:value={newPin}
                        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green font-mono text-xl tracking-[0.5em] pr-12"
                    />
                    <button
                        type="button"
                        onclick={() => (showPin = !showPin)}
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        {#if showPin}
                            <EyeOff class="w-5 h-5" />
                        {:else}
                            <Eye class="w-5 h-5" />
                        {/if}
                    </button>
                </div>
                <p class="mt-1 text-xs text-slate-500">6 číslic</p>
            </div>

            <!-- Confirm PIN -->
            <div>
                <label
                    for="confirmPin"
                    class="block text-sm font-medium text-slate-700 mb-2"
                >
                    Potvrdit PIN *
                </label>
                <div class="relative">
                    <input
                        type={showConfirmPin ? "text" : "password"}
                        id="confirmPin"
                        name="confirmPin"
                        required
                        maxlength="6"
                        pattern="[0-9]{6}"
                        placeholder="123456"
                        bind:value={confirmPin}
                        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green font-mono text-xl tracking-[0.5em] pr-12 {confirmPin.length >
                            0 && !pinsMatch
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                            : ''}"
                    />
                    <button
                        type="button"
                        onclick={() => (showConfirmPin = !showConfirmPin)}
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        {#if showConfirmPin}
                            <EyeOff class="w-5 h-5" />
                        {:else}
                            <Eye class="w-5 h-5" />
                        {/if}
                    </button>
                </div>
                {#if confirmPin.length > 0 && !pinsMatch}
                    <p class="mt-1 text-xs text-red-500">PINy se neshodují</p>
                {:else if pinsMatch}
                    <p class="mt-1 text-xs text-green-600">PINy se shodují ✓</p>
                {/if}
            </div>

            <!-- Buttons -->
            <div
                class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200"
            >
                <a
                    href="/dashboard/admin/users/{data.user.id}"
                    class="px-4 py-2.5 text-slate-600 hover:text-slate-800 transition-colors"
                >
                    Zrušit
                </a>
                <button
                    type="submit"
                    disabled={isSubmitting || !pinsMatch}
                    class="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {#if isSubmitting}
                        <span
                            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                        ></span>
                        Resetuji...
                    {:else}
                        <Shield class="w-4 h-4" />
                        Resetovat PIN
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>
