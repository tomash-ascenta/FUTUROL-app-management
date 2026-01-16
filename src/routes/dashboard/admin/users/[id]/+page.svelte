<script lang="ts">
    import { enhance } from "$app/forms";
    import {
        ArrowLeft,
        Save,
        Trash2,
        Shield,
        Info,
        Check,
        AlertTriangle,
    } from "lucide-svelte";

    interface Props {
        data: {
            user: {
                id: string;
                personalNumber: string;
                fullName: string;
                email: string | null;
                phone: string | null;
                roles: string[];
                isActive: boolean;
                createdAt: string;
                updatedAt: string;
            };
            roles: Array<{
                value: string;
                label: string;
                description: string;
            }>;
        };
        form: { error?: string; success?: boolean } | null;
    }

    let { data, form }: Props = $props();

    let selectedRoles = $state<string[]>([]);
    let isSubmitting = $state(false);
    let showDeleteConfirm = $state(false);

    // Initialize roles from data
    $effect(() => {
        if (data.user.roles && selectedRoles.length === 0) {
            selectedRoles = [...data.user.roles];
        }
    });

    function toggleRole(role: string) {
        if (selectedRoles.includes(role)) {
            selectedRoles = selectedRoles.filter((r) => r !== role);
        } else {
            selectedRoles = [...selectedRoles, role];
        }
    }

    function formatDate(date: string): string {
        return new Date(date).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
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

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div class="p-6 border-b border-slate-200">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div
                        class="w-14 h-14 bg-futurol-green/10 rounded-full flex items-center justify-center border-2 border-futurol-green/20"
                    >
                        <span class="text-lg font-bold text-futurol-green">
                            {data.user.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                        </span>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-slate-800">
                            {data.user.fullName}
                        </h1>
                        <p class="text-slate-500">
                            Osobní číslo:
                            <code
                                class="px-2 py-0.5 bg-slate-100 rounded text-sm font-mono"
                            >
                                {data.user.personalNumber}
                            </code>
                        </p>
                    </div>
                </div>
                {#if data.user.isActive}
                    <span
                        class="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full bg-futurol-green/10 text-futurol-green"
                    >
                        <span class="w-2 h-2 bg-futurol-green rounded-full"
                        ></span>
                        Aktivní
                    </span>
                {:else}
                    <span
                        class="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full bg-slate-100 text-slate-500"
                    >
                        <span class="w-2 h-2 bg-slate-400 rounded-full"></span>
                        Neaktivní
                    </span>
                {/if}
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

        {#if form?.success}
            <div
                class="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
            >
                <Check class="w-5 h-5 text-green-600 flex-shrink-0" />
                <p class="text-green-700 text-sm">
                    Uživatel byl úspěšně uložen
                </p>
            </div>
        {/if}

        <form
            method="POST"
            action="?/update"
            use:enhance={() => {
                isSubmitting = true;
                return async ({ update }) => {
                    isSubmitting = false;
                    await update();
                };
            }}
            class="p-6 space-y-6"
        >
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
                    value={data.user.fullName}
                    class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
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
                        value={data.user.email || ""}
                        placeholder="jan@futurol.cz"
                        class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
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
                        value={data.user.phone || ""}
                        placeholder="+420 777 123 456"
                        class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                    />
                </div>
            </div>

            <!-- Role -->
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-3">
                    Role *
                </label>
                <div class="space-y-2">
                    {#each data.roles as role}
                        <label
                            class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all {selectedRoles.includes(
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
                class="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
                <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={data.user.isActive}
                    class="w-4 h-4 text-futurol-green border-slate-300 rounded focus:ring-futurol-green"
                />
                <label for="isActive" class="flex-1">
                    <div class="font-medium text-slate-800">Aktivní účet</div>
                    <div class="text-sm text-slate-500">
                        Uživatel se může přihlásit do systému
                    </div>
                </label>
            </div>

            <!-- Metadata -->
            <div class="text-sm text-slate-500 space-y-1">
                <p>Vytvořeno: {formatDate(data.user.createdAt)}</p>
                <p>Naposledy upraveno: {formatDate(data.user.updatedAt)}</p>
            </div>

            <!-- Buttons -->
            <div
                class="flex items-center justify-between pt-4 border-t border-slate-200"
            >
                <div class="flex items-center gap-2">
                    <a
                        href="/dashboard/admin/users/{data.user.id}/reset-pin"
                        class="inline-flex items-center gap-2 px-4 py-2.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                        <Shield class="w-4 h-4" />
                        Reset PIN
                    </a>
                    <button
                        type="button"
                        onclick={() => (showDeleteConfirm = true)}
                        class="inline-flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 class="w-4 h-4" />
                        Deaktivovat
                    </button>
                </div>

                <div class="flex items-center gap-3">
                    <a
                        href="/dashboard/admin/users"
                        class="px-4 py-2.5 text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Zrušit
                    </a>
                    <button
                        type="submit"
                        disabled={isSubmitting || selectedRoles.length === 0}
                        class="inline-flex items-center gap-2 bg-futurol-green text-white px-6 py-2.5 rounded-lg font-medium hover:bg-futurol-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {#if isSubmitting}
                            <span
                                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                            ></span>
                            Ukládám...
                        {:else}
                            <Save class="w-4 h-4" />
                            Uložit změny
                        {/if}
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

<!-- Delete confirmation modal -->
{#if showDeleteConfirm}
    <div
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
        <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div class="flex items-start gap-4">
                <div
                    class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0"
                >
                    <AlertTriangle class="w-6 h-6 text-red-600" />
                </div>
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-slate-800">
                        Deaktivovat uživatele?
                    </h3>
                    <p class="text-slate-500 mt-2">
                        Opravdu chcete deaktivovat uživatele
                        <strong>{data.user.fullName}</strong>? Uživatel se
                        nebude moci přihlásit do systému.
                    </p>
                </div>
            </div>

            <div class="flex items-center justify-end gap-3 mt-6">
                <button
                    type="button"
                    onclick={() => (showDeleteConfirm = false)}
                    class="px-4 py-2.5 text-slate-600 hover:text-slate-800 transition-colors"
                >
                    Zrušit
                </button>
                <form method="POST" action="?/delete" use:enhance>
                    <button
                        type="submit"
                        class="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                        <Trash2 class="w-4 h-4" />
                        Deaktivovat
                    </button>
                </form>
            </div>
        </div>
    </div>
{/if}
