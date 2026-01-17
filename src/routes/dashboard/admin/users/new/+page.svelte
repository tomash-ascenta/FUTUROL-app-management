<script lang="ts">
    import { enhance } from "$app/forms";
    import { ArrowLeft, Save, Eye, EyeOff, Info } from "lucide-svelte";

    interface Props {
        data: {
            roles: Array<{
                value: string;
                label: string;
                description: string;
            }>;
        };
        form: { error?: string } | null;
    }

    let { data, form }: Props = $props();

    let showPin = $state(false);
    let selectedRoles = $state<string[]>([]);
    let isSubmitting = $state(false);

    function toggleRole(role: string) {
        if (selectedRoles.includes(role)) {
            selectedRoles = selectedRoles.filter((r) => r !== role);
        } else {
            selectedRoles = [...selectedRoles, role];
        }
    }
</script>

<div class="max-w-2xl mx-auto">
    <div class="mb-6">
        <a
            href="/dashboard/admin/users"
            class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
        >
            <ArrowLeft class="w-4 h-4" />
            Zpět na seznam
        </a>
    </div>

    <div class="bg-white rounded border border-slate-200 shadow-sm">
        <div class="p-6 border-b border-slate-200">
            <h1 class="text-xl font-bold text-slate-800">Nový uživatel</h1>
            <p class="text-slate-500 mt-1">Vytvořte nový uživatelský účet</p>
        </div>

        {#if form?.error}
            <div
                class="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded"
            >
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
            <!-- Osobní číslo -->
            <div>
                <label
                    for="personalNumber"
                    class="block text-sm font-medium text-slate-700 mb-2"
                >
                    Osobní číslo *
                </label>
                <input
                    type="text"
                    id="personalNumber"
                    name="personalNumber"
                    required
                    minlength="4"
                    maxlength="4"
                    inputmode="numeric"
                    placeholder="0001"
                    class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green font-mono text-lg tracking-wider"
                />
                <p class="mt-1 text-xs text-slate-500">
                    4 číslice pro přihlášení (např. 0001)
                </p>
            </div>

            <!-- Jméno -->
            <div>
                <label
                    for="fullName"
                    class="block text-sm font-medium text-slate-700 mb-2"
                >
                    Celé jméno *
                </label>
                <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    required
                    placeholder="Jan Novák"
                    class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                />
            </div>

            <!-- Email a Telefon -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label
                        for="email"
                        class="block text-sm font-medium text-slate-700 mb-2"
                    >
                        E-mail
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="jan@futurol.cz"
                        class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                    />
                </div>
                <div>
                    <label
                        for="phone"
                        class="block text-sm font-medium text-slate-700 mb-2"
                    >
                        Telefon
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="+420 777 123 456"
                        class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                    />
                </div>
            </div>

            <!-- PIN -->
            <div>
                <label
                    for="pin"
                    class="block text-sm font-medium text-slate-700 mb-2"
                >
                    PIN pro přihlášení *
                </label>
                <div class="relative">
                    <input
                        type={showPin ? "text" : "password"}
                        id="pin"
                        name="pin"
                        required
                        minlength="6"
                        maxlength="6"
                        inputmode="numeric"
                        placeholder="123456"
                        class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green font-mono text-lg tracking-[0.5em] pr-12"
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
                <p class="mt-1 text-xs text-slate-500">
                    6 číslic pro přihlášení
                </p>
            </div>

            <!-- Role -->
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-3">
                    Role *
                </label>
                <div class="space-y-2">
                    {#each data.roles as role}
                        <label
                            class="flex items-start gap-3 p-3 border rounded cursor-pointer transition-all {selectedRoles.includes(
                                role.value,
                            )
                                ? 'border-futurol-green bg-futurol-green/5'
                                : 'border-slate-200 hover:border-slate-300'}"
                        >
                            <input
                                type="checkbox"
                                name="roles"
                                value={role.value}
                                checked={selectedRoles.includes(role.value)}
                                onchange={() => toggleRole(role.value)}
                                class="mt-0.5 w-4 h-4 text-futurol-green border-slate-300 rounded focus:ring-futurol-green"
                            />
                            <div class="flex-1">
                                <div class="font-medium text-slate-800">
                                    {role.label}
                                </div>
                                <div class="text-sm text-slate-500">
                                    {role.description}
                                </div>
                            </div>
                        </label>
                    {/each}
                </div>
            </div>

            <!-- Aktivní -->
            <div
                class="flex items-center gap-3 p-4 bg-slate-50 rounded border border-slate-200"
            >
                <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked
                    class="w-4 h-4 text-futurol-green border-slate-300 rounded focus:ring-futurol-green"
                />
                <label for="isActive" class="flex-1">
                    <div class="font-medium text-slate-800">Aktivní účet</div>
                    <div class="text-sm text-slate-500">
                        Uživatel se může přihlásit do systému
                    </div>
                </label>
            </div>

            <!-- Info box -->
            <div
                class="flex items-start gap-3 p-4 bg-blue-50 rounded border border-blue-200"
            >
                <Info class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div class="text-sm text-blue-700">
                    <p class="font-medium mb-1">Přihlašovací údaje</p>
                    <p>
                        Uživatel se přihlásí pomocí osobního čísla a PINu. Po
                        vytvoření účtu sdělte uživateli jeho přihlašovací údaje
                        osobně.
                    </p>
                </div>
            </div>

            <!-- Buttons -->
            <div
                class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200"
            >
                <a
                    href="/dashboard/admin/users"
                    class="px-4 py-2.5 text-slate-600 hover:text-slate-800 transition-colors"
                >
                    Zrušit
                </a>
                <button
                    type="submit"
                    disabled={isSubmitting || selectedRoles.length === 0}
                    class="inline-flex items-center gap-2 bg-futurol-green text-white px-6 py-2.5 rounded font-medium hover:bg-futurol-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {#if isSubmitting}
                        <span
                            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                        ></span>
                        Ukládám...
                    {:else}
                        <Save class="w-4 h-4" />
                        Vytvořit uživatele
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>
