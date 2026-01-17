<script lang="ts">
    import {
        ArrowLeft,
        MapPin,
        User,
        Calendar,
        Ruler,
        Pencil,
        FileText,
        Trash2,
        Check,
        X,
        Download,
    } from "lucide-svelte";
    import type { PageData } from "./$types";
    import { goto, invalidateAll } from "$app/navigation";
    import { generateMeasurementPdf } from "$lib/utils/measurementPdf";
    import { getCustomerDisplayName, getPrimaryContact } from "$lib/utils";

    let { data }: { data: PageData } = $props();

    let measurement = $derived(data.measurement);
    let details = $derived(measurement.details as Record<string, unknown>);
    let accessories = $derived(
        (details.accessories ?? {}) as Record<string, unknown>,
    );
    let screens = $derived((details.screens ?? {}) as Record<string, unknown>);

    // Edit state
    let editingField: string | null = $state(null);
    let editValue: string = $state("");
    let isSaving = $state(false);

    function formatDate(date: string | Date) {
        return new Date(date).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatDimensions() {
        return `${measurement.width} × ${measurement.depth} × ${measurement.height} mm`;
    }

    // Helper for showing detail values
    function getDetail(key: string): string | undefined {
        const value = details[key];
        if (value === null || value === undefined || value === "")
            return undefined;
        if (typeof value === "boolean") return value ? "Ano" : "Ne";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
    }

    // Get raw value for editing (supports nested paths like "accessories.remote")
    function getRawValue(key: string): string {
        const parts = key.split(".");
        let value: unknown = details;
        for (const part of parts) {
            if (value && typeof value === "object") {
                value = (value as Record<string, unknown>)[part];
            } else {
                return "";
            }
        }
        if (value === null || value === undefined) return "";
        if (typeof value === "boolean") return value ? "true" : "false";
        return String(value);
    }

    // Get nested value for display
    function getNestedValue(key: string): unknown {
        const parts = key.split(".");
        let value: unknown = details;
        for (const part of parts) {
            if (value && typeof value === "object") {
                value = (value as Record<string, unknown>)[part];
            } else {
                return undefined;
            }
        }
        return value;
    }

    // Helper for showing all values (even empty ones)
    function getDetailOrEmpty(key: string): string {
        const value = getDetail(key);
        return value ?? "—";
    }

    // Get nested detail for display
    function getNestedDetail(key: string): string {
        const value = getNestedValue(key);
        if (value === null || value === undefined || value === "") return "—";
        if (typeof value === "boolean") return value ? "Ano" : "Ne";
        return String(value);
    }

    // Check if nested value exists
    function hasNestedValue(key: string): boolean {
        const value = getNestedValue(key);
        return value !== null && value !== undefined && value !== "";
    }

    // Check if detail exists
    function hasDetail(key: string): boolean {
        return getDetail(key) !== undefined;
    }

    // Start editing a field (supports nested paths and main measurement fields)
    function startEdit(fieldKey: string) {
        editingField = fieldKey;
        // Check if it's a main measurement field
        if (
            ["width", "depth", "height", "clearanceHeight"].includes(fieldKey)
        ) {
            const value = measurement[fieldKey as keyof typeof measurement];
            editValue =
                value !== null && value !== undefined ? String(value) : "";
        } else {
            editValue = getRawValue(fieldKey);
        }
    }

    // Cancel editing
    function cancelEdit() {
        editingField = null;
        editValue = "";
    }

    // Save edited value (supports nested paths like "accessories.remote" and main measurement fields)
    async function saveEdit() {
        if (!editingField || isSaving) return;

        isSaving = true;
        try {
            // Check if it's a main measurement field (width, depth, height, clearanceHeight)
            const mainMeasurementFields = [
                "width",
                "depth",
                "height",
                "clearanceHeight",
            ];
            if (mainMeasurementFields.includes(editingField)) {
                const numValue = editValue ? parseInt(editValue, 10) : null;
                const response = await fetch(
                    `/api/measurements/${measurement.id}`,
                    {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ [editingField]: numValue }),
                    },
                );

                if (response.ok) {
                    await invalidateAll();
                    editingField = null;
                    editValue = "";
                } else {
                    const error = await response.json();
                    alert(error.error || "Chyba při ukládání");
                }
                return;
            }

            // Build updated details object (deep clone)
            const updatedDetails = JSON.parse(JSON.stringify(details));

            // Handle nested paths
            const parts = editingField.split(".");
            let target = updatedDetails;

            // Navigate to parent object
            for (let i = 0; i < parts.length - 1; i++) {
                if (!target[parts[i]]) {
                    target[parts[i]] = {};
                }
                target = target[parts[i]];
            }

            const finalKey = parts[parts.length - 1];

            // Handle numeric fields
            const numericFields = [
                "roofPanels",
                "legCount",
                "legLength",
                "insulationThickness",
                "ledCount",
                "outlets",
                "width",
                "height",
            ];

            // Handle boolean fields
            const booleanFields = [
                "windSensorEnabled",
                "reinforcementProfile",
                "izymoReceiver",
            ];

            if (numericFields.includes(finalKey)) {
                target[finalKey] = editValue ? parseInt(editValue, 10) : null;
            } else if (booleanFields.includes(finalKey)) {
                target[finalKey] =
                    editValue === "true"
                        ? true
                        : editValue === "false"
                          ? false
                          : null;
            } else {
                target[finalKey] = editValue || null;
            }

            const response = await fetch(
                `/api/measurements/${measurement.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ details: updatedDetails }),
                },
            );

            if (response.ok) {
                await invalidateAll();
                editingField = null;
                editValue = "";
            } else {
                const error = await response.json();
                alert(error.error || "Chyba při ukládání");
            }
        } catch (e) {
            console.error("Save error:", e);
            alert("Chyba při ukládání");
        } finally {
            isSaving = false;
        }
    }

    // Handle keyboard events
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            saveEdit();
        } else if (event.key === "Escape") {
            cancelEdit();
        }
    }

    async function deleteMeasurement() {
        if (!confirm("Opravdu chcete smazat toto zaměření?")) return;

        const response = await fetch(`/api/measurements/${measurement.id}`, {
            method: "DELETE",
        });

        if (response.ok) {
            goto("/dashboard/measurements");
        } else {
            alert("Chyba při mazání zaměření");
        }
    }
</script>

{#snippet editableField(label: string, fieldKey: string, suffix?: string)}
    <div
        class="flex justify-between items-center py-2 border-b border-slate-100 group"
    >
        <dt class="text-slate-500">{label}</dt>
        <dd class="flex items-center gap-2">
            {#if editingField === fieldKey && data.canEdit}
                <input
                    type="text"
                    class="w-32 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    bind:value={editValue}
                    onkeydown={handleKeydown}
                />
                <button
                    onclick={saveEdit}
                    disabled={isSaving}
                    class="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Uložit"
                >
                    <Check class="w-4 h-4" />
                </button>
                <button
                    onclick={cancelEdit}
                    class="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Zrušit"
                >
                    <X class="w-4 h-4" />
                </button>
            {:else}
                <span
                    class="font-medium {hasDetail(fieldKey)
                        ? 'text-slate-800'
                        : 'text-slate-300'}"
                >
                    {hasDetail(fieldKey) && suffix
                        ? getDetail(fieldKey) + suffix
                        : getDetailOrEmpty(fieldKey)}
                </span>
                {#if data.canEdit}
                    <button
                        onclick={() => startEdit(fieldKey)}
                        class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="Upravit"
                    >
                        <Pencil class="w-3.5 h-3.5" />
                    </button>
                {/if}
            {/if}
        </dd>
    </div>
{/snippet}

{#snippet nestedEditableField(label: string, fieldKey: string, suffix?: string)}
    <div
        class="flex justify-between items-center py-2 border-b border-slate-100 group"
    >
        <dt class="text-slate-500">{label}</dt>
        <dd class="flex items-center gap-2">
            {#if editingField === fieldKey && data.canEdit}
                <input
                    type="text"
                    class="w-32 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    bind:value={editValue}
                    onkeydown={handleKeydown}
                />
                <button
                    onclick={saveEdit}
                    disabled={isSaving}
                    class="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Uložit"
                >
                    <Check class="w-4 h-4" />
                </button>
                <button
                    onclick={cancelEdit}
                    class="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Zrušit"
                >
                    <X class="w-4 h-4" />
                </button>
            {:else}
                <span
                    class="font-medium {hasNestedValue(fieldKey)
                        ? 'text-slate-800'
                        : 'text-slate-300'}"
                >
                    {hasNestedValue(fieldKey) && suffix
                        ? getNestedDetail(fieldKey) + suffix
                        : getNestedDetail(fieldKey)}
                </span>
                {#if data.canEdit}
                    <button
                        onclick={() => startEdit(fieldKey)}
                        class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="Upravit"
                    >
                        <Pencil class="w-3.5 h-3.5" />
                    </button>
                {/if}
            {/if}
        </dd>
    </div>
{/snippet}

<div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-4">
            <a
                href="/dashboard/measurements"
                class="p-2 hover:bg-slate-100 rounded transition-colors"
            >
                <ArrowLeft class="w-5 h-5 text-slate-600" />
            </a>
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-2xl font-bold text-slate-800">Zaměření</h1>
                    <span
                        class="px-2 py-1 text-sm font-medium rounded bg-blue-100 text-blue-700"
                    >
                        {measurement.pergolaType}
                    </span>
                </div>
                <div class="flex items-center gap-3 text-slate-500 mt-1">
                    <span class="font-mono text-sm"
                        >{measurement.order?.orderNumber ?? "N/A"}</span
                    >
                    <span>•</span>
                    <span class="flex items-center gap-1">
                        <Calendar class="w-4 h-4" />
                        {formatDate(measurement.measuredAt)}
                    </span>
                </div>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <button
                onclick={() =>
                    generateMeasurementPdf(
                        measurement as Parameters<
                            typeof generateMeasurementPdf
                        >[0],
                    )}
                class="flex items-center gap-2 px-4 py-2 bg-futurol-wine text-white rounded hover:bg-futurol-wine/90 transition-colors"
                title="Stáhnout PDF"
            >
                <Download class="w-4 h-4" />
                <span class="hidden sm:inline">Stáhnout PDF</span>
            </button>
            <button
                onclick={deleteMeasurement}
                class="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Smazat"
            >
                <Trash2 class="w-5 h-5" />
            </button>
        </div>
    </div>

    <!-- Info cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#if measurement.order}
            <!-- Customer info -->
            <div
                class="bg-white rounded shadow-sm border border-slate-200 p-5"
            >
                <div class="flex items-center gap-2 text-slate-600 mb-3">
                    <User class="w-5 h-5" />
                    <span class="font-medium">Zákazník</span>
                </div>
                {#if measurement.order.customer}
                    <h3 class="text-lg font-semibold text-slate-800">
                        {getCustomerDisplayName(measurement.order.customer)}
                    </h3>
                    {#if getPrimaryContact(measurement.order.customer)?.phone}
                        <p class="text-slate-500">
                            {getPrimaryContact(measurement.order.customer)
                                ?.phone}
                        </p>
                    {/if}
                    {#if getPrimaryContact(measurement.order.customer)?.email}
                        <p class="text-slate-500">
                            {getPrimaryContact(measurement.order.customer)
                                ?.email}
                        </p>
                    {/if}
                {:else}
                    <p class="text-slate-500">Zákazník není přiřazen</p>
                {/if}
            </div>

            <!-- Location info -->
            <div
                class="bg-white rounded shadow-sm border border-slate-200 p-5"
            >
                <div class="flex items-center gap-2 text-slate-600 mb-3">
                    <MapPin class="w-5 h-5" />
                    <span class="font-medium">Místo realizace</span>
                </div>
                {#if measurement.order.location}
                    <h3 class="text-lg font-semibold text-slate-800">
                        {measurement.order.location.city}
                    </h3>
                    <p class="text-slate-500">
                        {measurement.order.location.street}
                    </p>
                    <p class="text-slate-500">
                        {measurement.order.location.zip}
                    </p>
                {:else}
                    <p class="text-slate-500">Lokace není zadána</p>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Main measurements -->
    <div class="bg-white rounded shadow-sm border border-slate-200 p-5">
        <div class="flex items-center gap-2 text-slate-600 mb-4">
            <Ruler class="w-5 h-5" />
            <span class="font-medium">Základní rozměry</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 bg-slate-50 rounded group relative">
                {#if editingField === "width"}
                    <input
                        type="text"
                        class="w-full text-center text-2xl font-bold px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        bind:value={editValue}
                        onkeydown={handleKeydown}
                    />
                    <div class="flex justify-center gap-1 mt-2">
                        <button
                            onclick={saveEdit}
                            disabled={isSaving}
                            class="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Uložit"
                        >
                            <Check class="w-4 h-4" />
                        </button>
                        <button
                            onclick={cancelEdit}
                            class="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Zrušit"
                        >
                            <X class="w-4 h-4" />
                        </button>
                    </div>
                {:else}
                    <div class="text-2xl font-bold text-slate-800">
                        {measurement.width}
                    </div>
                    <button
                        onclick={() => startEdit("width")}
                        class="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="Upravit"
                    >
                        <Pencil class="w-3.5 h-3.5" />
                    </button>
                {/if}
                <div class="text-sm text-slate-500">Šířka (mm)</div>
            </div>
            <div class="text-center p-4 bg-slate-50 rounded group relative">
                {#if editingField === "depth"}
                    <input
                        type="text"
                        class="w-full text-center text-2xl font-bold px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        bind:value={editValue}
                        onkeydown={handleKeydown}
                    />
                    <div class="flex justify-center gap-1 mt-2">
                        <button
                            onclick={saveEdit}
                            disabled={isSaving}
                            class="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Uložit"
                        >
                            <Check class="w-4 h-4" />
                        </button>
                        <button
                            onclick={cancelEdit}
                            class="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Zrušit"
                        >
                            <X class="w-4 h-4" />
                        </button>
                    </div>
                {:else}
                    <div class="text-2xl font-bold text-slate-800">
                        {measurement.depth}
                    </div>
                    <button
                        onclick={() => startEdit("depth")}
                        class="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="Upravit"
                    >
                        <Pencil class="w-3.5 h-3.5" />
                    </button>
                {/if}
                <div class="text-sm text-slate-500">Hloubka (mm)</div>
            </div>
            <div class="text-center p-4 bg-slate-50 rounded group relative">
                {#if editingField === "height"}
                    <input
                        type="text"
                        class="w-full text-center text-2xl font-bold px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        bind:value={editValue}
                        onkeydown={handleKeydown}
                    />
                    <div class="flex justify-center gap-1 mt-2">
                        <button
                            onclick={saveEdit}
                            disabled={isSaving}
                            class="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Uložit"
                        >
                            <Check class="w-4 h-4" />
                        </button>
                        <button
                            onclick={cancelEdit}
                            class="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Zrušit"
                        >
                            <X class="w-4 h-4" />
                        </button>
                    </div>
                {:else}
                    <div class="text-2xl font-bold text-slate-800">
                        {measurement.height}
                    </div>
                    <button
                        onclick={() => startEdit("height")}
                        class="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="Upravit"
                    >
                        <Pencil class="w-3.5 h-3.5" />
                    </button>
                {/if}
                <div class="text-sm text-slate-500">Výška (mm)</div>
            </div>
            <div class="text-center p-4 bg-slate-50 rounded group relative">
                {#if editingField === "clearanceHeight"}
                    <input
                        type="text"
                        class="w-full text-center text-2xl font-bold px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        bind:value={editValue}
                        onkeydown={handleKeydown}
                    />
                    <div class="flex justify-center gap-1 mt-2">
                        <button
                            onclick={saveEdit}
                            disabled={isSaving}
                            class="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Uložit"
                        >
                            <Check class="w-4 h-4" />
                        </button>
                        <button
                            onclick={cancelEdit}
                            class="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Zrušit"
                        >
                            <X class="w-4 h-4" />
                        </button>
                    </div>
                {:else}
                    <div
                        class="text-2xl font-bold {measurement.clearanceHeight
                            ? 'text-slate-800'
                            : 'text-slate-300'}"
                    >
                        {measurement.clearanceHeight ?? "—"}
                    </div>
                    <button
                        onclick={() => startEdit("clearanceHeight")}
                        class="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="Upravit"
                    >
                        <Pencil class="w-3.5 h-3.5" />
                    </button>
                {/if}
                <div class="text-sm text-slate-500">Podchozí výška (mm)</div>
            </div>
        </div>
    </div>

    <!-- Construction details -->
    <div class="bg-white rounded shadow-sm border border-slate-200 p-5">
        <h3 class="font-medium text-slate-800 mb-4">Konstrukce</h3>
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {@render editableField("Počet nosných profilů", "roofPanels")}
            {@render editableField("Počet nohou", "legCount")}
            {@render editableField("Délka nohou", "legLength", " mm")}
            {@render editableField("Info o konzolách", "bracketInfo")}
            {@render editableField("Barva konstrukce", "colorFrame")}
            {@render editableField("Barva střechy", "colorRoof")}
        </dl>
    </div>

    <!-- Mounting details -->
    <div class="bg-white rounded shadow-sm border border-slate-200 p-5">
        <h3 class="font-medium text-slate-800 mb-4">Montáž</h3>
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {@render editableField("Typ zdiva", "wallType")}
            {@render editableField("Typ zateplení", "insulationType")}
            {@render editableField(
                "Tloušťka zateplení",
                "insulationThickness",
                " mm",
            )}
            {@render editableField("Typ kotvení", "anchoringType")}
            {@render editableField("Betonové patky", "concreteFootingsNeeded")}
            {@render editableField("Vývod z okapu", "drainOutput")}
            {@render editableField("Přívod elektra", "electricalInlet")}
        </dl>
    </div>

    <!-- Accessories -->
    <div class="bg-white rounded shadow-sm border border-slate-200 p-5">
        <h3 class="font-medium text-slate-800 mb-4">Příslušenství</h3>
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {@render nestedEditableField("Ovladač", "accessories.remote")}
            {@render nestedEditableField("Motor", "accessories.motor")}
            {@render nestedEditableField(
                "Větrný senzor",
                "accessories.windSensorEnabled",
            )}
            {@render nestedEditableField(
                "LED osvětlení",
                "accessories.ledType",
            )}
            {@render nestedEditableField(
                "Počet LED",
                "accessories.ledCount",
                " ks",
            )}
            {@render nestedEditableField(
                "Zásuvky",
                "accessories.outlets",
                " ks",
            )}
            {@render nestedEditableField(
                "Trapézový kryt",
                "accessories.trapezoidCover",
            )}
            {@render nestedEditableField(
                "Kotvicí profil",
                "accessories.anchoringProfile",
            )}
            {@render nestedEditableField(
                "Výztužný profil",
                "accessories.reinforcementProfile",
            )}
            {@render nestedEditableField(
                "Izymo přijímač",
                "accessories.izymoReceiver",
            )}
            {@render nestedEditableField("Tahoma", "accessories.tahoma")}
        </dl>
    </div>

    <!-- Screens/Rolety -->
    <div class="bg-white rounded shadow-sm border border-slate-200 p-5">
        <h3 class="font-medium text-slate-800 mb-4">Rolety</h3>
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <!-- Přední -->
            {@render nestedEditableField(
                "Přední - šířka",
                "screens.front.width",
                " mm",
            )}
            {@render nestedEditableField(
                "Přední - látka",
                "screens.front.fabric",
            )}
            <!-- Přední levá -->
            {@render nestedEditableField(
                "Přední levá - šířka",
                "screens.frontLeft.width",
                " mm",
            )}
            {@render nestedEditableField(
                "Přední levá - látka",
                "screens.frontLeft.fabric",
            )}
            <!-- Přední pravá -->
            {@render nestedEditableField(
                "Přední pravá - šířka",
                "screens.frontRight.width",
                " mm",
            )}
            {@render nestedEditableField(
                "Přední pravá - látka",
                "screens.frontRight.fabric",
            )}
            <!-- Levá -->
            {@render nestedEditableField(
                "Levá - šířka",
                "screens.left.width",
                " mm",
            )}
            {@render nestedEditableField("Levá - látka", "screens.left.fabric")}
            <!-- Pravá -->
            {@render nestedEditableField(
                "Pravá - šířka",
                "screens.right.width",
                " mm",
            )}
            {@render nestedEditableField(
                "Pravá - látka",
                "screens.right.fabric",
            )}
        </dl>
    </div>

    <!-- Logistics/Poznámky -->
    <div class="bg-white rounded shadow-sm border border-slate-200 p-5">
        <h3 class="font-medium text-slate-800 mb-4">Logistika a poznámky</h3>
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {@render editableField("Parkování", "parking")}
            {@render editableField("Skladovací prostor", "storageSpace")}
            {@render editableField("Předpokládaná doba", "duration")}
            {@render editableField("Terén", "terrain")}
            {@render editableField("Přístup", "access")}
        </dl>
    </div>

    <!-- Additional notes -->
    <div class="bg-white rounded shadow-sm border border-slate-200 p-5">
        <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-slate-800">Doplňující poznámky</h3>
            {#if editingField !== "additionalNotes"}
                <button
                    onclick={() => startEdit("additionalNotes")}
                    class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all"
                    title="Upravit"
                >
                    <Pencil class="w-4 h-4" />
                </button>
            {/if}
        </div>
        {#if editingField === "additionalNotes"}
            <div class="space-y-2">
                <textarea
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    bind:value={editValue}
                ></textarea>
                <div class="flex gap-2">
                    <button
                        onclick={saveEdit}
                        disabled={isSaving}
                        class="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                        <Check class="w-4 h-4" />
                        Uložit
                    </button>
                    <button
                        onclick={cancelEdit}
                        class="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors flex items-center gap-1"
                    >
                        <X class="w-4 h-4" />
                        Zrušit
                    </button>
                </div>
            </div>
        {:else}
            <p
                class="text-slate-600 whitespace-pre-wrap {hasDetail(
                    'additionalNotes',
                )
                    ? ''
                    : 'text-slate-300'}"
            >
                {getDetailOrEmpty("additionalNotes")}
            </p>
        {/if}
    </div>

    <!-- Surveyor info -->
    <div class="bg-slate-50 rounded p-4 text-sm text-slate-500">
        <div class="flex items-center gap-2">
            <User class="w-4 h-4" />
            <span
                >Zaměřil: <strong class="text-slate-700"
                    >{measurement.employee.fullName}</strong
                ></span
            >
            <span>({measurement.employee.personalNumber})</span>
        </div>
    </div>
</div>
