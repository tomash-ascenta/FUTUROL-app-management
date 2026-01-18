<script lang="ts">
    import { X, Send, Loader2, Mail } from "lucide-svelte";

    interface Props {
        isOpen: boolean;
        customerEmail: string | null;
        orderNumber: string;
        measurementId: string;
        onClose: () => void;
        onSend: (email: string, message: string) => Promise<void>;
    }

    let {
        isOpen,
        customerEmail,
        orderNumber,
        measurementId,
        onClose,
        onSend,
    }: Props = $props();

    let email = $state(customerEmail || "");
    let customMessage = $state("");
    let isLoading = $state(false);
    let error = $state("");
    let success = $state(false);

    // Reset při otevření
    $effect(() => {
        if (isOpen) {
            email = customerEmail || "";
            customMessage = "";
            error = "";
            success = false;
        }
    });

    // Zavření při Escape
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && !isLoading) {
            onClose();
        }
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = "";

        // Validace
        if (!email) {
            error = "Email je povinný";
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            error = "Neplatný formát emailu";
            return;
        }

        isLoading = true;
        try {
            await onSend(email, customMessage);
            success = true;
            // Zavřít po krátké prodlevě, aby uživatel viděl success stav
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Nepodařilo se odeslat email";
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
    <!-- Backdrop -->
    <div
        class="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onclick={() => !isLoading && onClose()}
        role="button"
        tabindex="-1"
        aria-label="Zavřít modal"
    ></div>

    <!-- Modal -->
    <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
            class="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all"
            onclick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-5 border-b border-slate-200"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 rounded-full bg-futurol-wine/10 flex items-center justify-center"
                    >
                        <Mail class="w-5 h-5 text-futurol-wine" />
                    </div>
                    <h2
                        id="modal-title"
                        class="text-lg font-semibold text-slate-900"
                    >
                        Odeslat protokol emailem
                    </h2>
                </div>
                <button
                    onclick={onClose}
                    class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Zavřít"
                    disabled={isLoading}
                >
                    <X class="w-5 h-5 text-slate-500" />
                </button>
            </div>

            <!-- Body -->
            {#if success}
                <!-- Success state -->
                <div class="p-8 text-center">
                    <div
                        class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
                    >
                        <svg
                            class="w-8 h-8 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 13l4 4L19 7"
                            ></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-slate-900 mb-2">
                        Email odeslán!
                    </h3>
                    <p class="text-slate-600">
                        Protokol byl úspěšně odeslán na<br />
                        <span class="font-medium">{email}</span>
                    </p>
                </div>
            {:else}
                <!-- Form -->
                <form onsubmit={handleSubmit} class="p-5 space-y-4">
                    <div>
                        <label
                            for="email"
                            class="block text-sm font-medium text-slate-700 mb-1.5"
                        >
                            Email příjemce <span class="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            bind:value={email}
                            class="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-futurol-wine/20 focus:border-futurol-wine outline-none transition-colors"
                            placeholder="zakaznik@email.cz"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div>
                        <label
                            for="message"
                            class="block text-sm font-medium text-slate-700 mb-1.5"
                        >
                            Zpráva <span class="text-slate-400 font-normal"
                                >(volitelná)</span
                            >
                        </label>
                        <textarea
                            id="message"
                            bind:value={customMessage}
                            rows={3}
                            class="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-futurol-wine/20 focus:border-futurol-wine outline-none resize-none transition-colors"
                            placeholder="Např. doplňující informace k zaměření..."
                            disabled={isLoading}
                        ></textarea>
                        <p class="mt-1 text-xs text-slate-500">
                            {customMessage.length}/1000 znaků
                        </p>
                    </div>

                    <div
                        class="flex items-center gap-2 p-3 bg-slate-50 rounded-lg"
                    >
                        <svg
                            class="w-5 h-5 text-slate-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            ></path>
                        </svg>
                        <span class="text-sm text-slate-600">
                            Příloha: <span class="font-medium"
                                >protokol-{orderNumber}.pdf</span
                            >
                        </span>
                    </div>

                    {#if error}
                        <div
                            class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                        >
                            <svg
                                class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                            </svg>
                            <p class="text-sm text-red-700">{error}</p>
                        </div>
                    {/if}

                    <!-- Footer -->
                    <div
                        class="flex justify-end gap-3 pt-3 border-t border-slate-200 mt-5"
                    >
                        <button
                            type="button"
                            onclick={onClose}
                            class="px-4 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                            disabled={isLoading}
                        >
                            Zrušit
                        </button>
                        <button
                            type="submit"
                            class="flex items-center gap-2 px-5 py-2.5 bg-futurol-wine text-white rounded-lg hover:bg-futurol-wine/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {#if isLoading}
                                <Loader2 class="w-4 h-4 animate-spin" />
                                Odesílám...
                            {:else}
                                <Send class="w-4 h-4" />
                                Odeslat
                            {/if}
                        </button>
                    </div>
                </form>
            {/if}
        </div>
    </div>
{/if}
