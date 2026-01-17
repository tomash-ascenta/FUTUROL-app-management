<script lang="ts">
    import {
        ArrowLeft,
        ArrowRight,
        Check,
        Loader2,
        MapPin,
        User,
    } from "lucide-svelte";
    import type { PageData } from "./$types";
    import { goto } from "$app/navigation";
    import { getCustomerDisplayName } from "$lib/utils";

    let { data }: { data: PageData } = $props();

    // Derived values
    let order = $derived(data.order);

    // Multi-step form state
    let currentStep = $state(0);
    let isSubmitting = $state(false);
    let error = $state("");

    const steps = [
        { id: "type", title: "Typ pergoly" },
        { id: "dimensions", title: "Rozměry" },
        { id: "construction", title: "Konstrukce" },
        { id: "mounting", title: "Montáž" },
        { id: "accessories", title: "Příslušenství" },
        { id: "screens", title: "Rolety" },
        { id: "notes", title: "Poznámky" },
    ];

    // Form data
    let formData = $state({
        // Typ pergoly
        pergolaType: "",

        // Rozměry
        width: null as number | null,
        depth: null as number | null,
        height: null as number | null,
        clearanceHeight: null as number | null,

        // Konstrukce
        roofPanels: 4,
        legLength: 2500,
        legCount: 2,
        bracketInfo: "",
        colorFrame: "RAL 7016",
        colorRoof: "RAL 9003",

        // Montáž
        wallType: "",
        insulationType: "",
        insulationThickness: null as number | null,
        anchoringType: "",
        anchoringDetails: "",
        concreteFootingsNeeded: false,
        concreteFootingsType: "",
        concreteFootingsCount: null as number | null,
        drainOutput: "vpravo",
        electricalInlet: "",
        electricalPreparation: [] as string[],

        // Příslušenství
        remote: "",
        motor: "IO",
        windSensorEnabled: false,
        windSensorPosition: "",
        ledType: "",
        ledCount: 0,
        trapezoidCover: "",
        anchoringProfile: "",
        reinforcementProfile: false,
        outlets: 0,
        izymoReceiver: false,
        tahoma: "",

        // Rolety
        screenFront: { width: null as number | null, fabric: "" },
        screenFrontLeft: { width: null as number | null, fabric: "" },
        screenFrontRight: { width: null as number | null, fabric: "" },
        screenLeft: { width: null as number | null, fabric: "" },
        screenRight: { width: null as number | null, fabric: "" },

        // Poznámky
        parking: "",
        storageSpace: "",
        duration: "",
        terrain: "",
        access: "",
        additionalNotes: "",
    });

    // Pergola types
    const pergolaTypes = [
        { id: "HORIZONTAL", label: "HORIZONTAL" },
        { id: "KLASIK", label: "KLASIK" },
        { id: "HORIZONTAL_STANDALONE", label: "HORIZONTAL SAMOSTOJNÁ" },
        { id: "KLASIK_STANDALONE", label: "KLASIK SAMOSTOJNÁ" },
        { id: "HORIZONTAL_DOUBLE", label: "HORIZONTAL DVĚ VEDLE SEBE" },
        { id: "KLASIK_DOUBLE", label: "KLASIK DVĚ VEDLE SEBE" },
        { id: "CUSTOM", label: "ATYPICKÉ ŘEŠENÍ" },
    ];

    // Color options
    const frameColors = [
        "RAL 1015",
        "RAL 7015",
        "RAL 7016",
        "RAL 7035",
        "RAL 7037",
        "RAL 7039",
        "RAL 8003",
        "RAL 8011",
        "RAL 8017",
        "RAL 8019",
        "RAL 9003",
        "RAL 9005",
        "RAL 9006",
        "RAL 9007",
        "CUSTOM",
    ];

    const roofColors = [
        { id: "RAL 1015", label: "RAL 1015 - Bílová" },
        { id: "RAL 7035", label: "RAL 7035 - Šedá" },
        { id: "RAL 9003", label: "RAL 9003 - Bílá" },
    ];

    const legLengths = [2000, 2500, 3000, 3500, 4000];

    // Navigation
    function nextStep() {
        if (currentStep < steps.length - 1) {
            currentStep++;
        }
    }

    function prevStep() {
        if (currentStep > 0) {
            currentStep--;
        }
    }

    function canProceed(): boolean {
        switch (currentStep) {
            case 0:
                return formData.pergolaType !== "";
            case 1:
                return (
                    formData.width !== null &&
                    formData.width > 0 &&
                    formData.depth !== null &&
                    formData.depth > 0 &&
                    formData.height !== null &&
                    formData.height > 0
                );
            default:
                return true;
        }
    }

    async function submitForm() {
        isSubmitting = true;
        error = "";

        // Validate required fields
        if (!formData.width || !formData.depth || !formData.height) {
            error = "Vyplňte povinné rozměry (šířka, hloubka, výška)";
            isSubmitting = false;
            return;
        }

        try {
            const payload = {
                pergolaType: formData.pergolaType,
                width: formData.width,
                depth: formData.depth,
                height: formData.height,
                clearanceHeight: formData.clearanceHeight || undefined,
                details: {
                    roofPanels: formData.roofPanels,
                    legLength: formData.legLength,
                    legCount: formData.legCount,
                    bracketInfo: formData.bracketInfo || undefined,
                    colorFrame: formData.colorFrame,
                    colorRoof: formData.colorRoof,
                    wallType: formData.wallType || undefined,
                    insulation: formData.insulationType
                        ? {
                              type: formData.insulationType,
                              thickness: formData.insulationThickness,
                          }
                        : undefined,
                    anchoring: formData.anchoringType
                        ? {
                              type: formData.anchoringType,
                              details: formData.anchoringDetails,
                          }
                        : undefined,
                    concreteFootings: {
                        needed: formData.concreteFootingsNeeded,
                        type: formData.concreteFootingsType || undefined,
                        count: formData.concreteFootingsCount || undefined,
                    },
                    drainOutput: formData.drainOutput,
                    electricalInlet: formData.electricalInlet || undefined,
                    electricalPreparation:
                        formData.electricalPreparation.length > 0
                            ? formData.electricalPreparation
                            : undefined,
                    accessories: {
                        remote: formData.remote || undefined,
                        motor: formData.motor,
                        windSensor: {
                            enabled: formData.windSensorEnabled,
                            position: formData.windSensorPosition || undefined,
                        },
                        led: formData.ledType
                            ? {
                                  type: formData.ledType,
                                  count: formData.ledCount,
                              }
                            : undefined,
                        trapezoidCover: formData.trapezoidCover || undefined,
                        anchoringProfile:
                            formData.anchoringProfile || undefined,
                        reinforcementProfile: formData.reinforcementProfile,
                        outlets: formData.outlets || undefined,
                        izymoReceiver: formData.izymoReceiver,
                        tahoma: formData.tahoma || undefined,
                    },
                    screens: {
                        front: formData.screenFront.width
                            ? formData.screenFront
                            : undefined,
                        frontLeft: formData.screenFrontLeft.width
                            ? formData.screenFrontLeft
                            : undefined,
                        frontRight: formData.screenFrontRight.width
                            ? formData.screenFrontRight
                            : undefined,
                        left: formData.screenLeft.width
                            ? formData.screenLeft
                            : undefined,
                        right: formData.screenRight.width
                            ? formData.screenRight
                            : undefined,
                    },
                    installationNotes: {
                        parking: formData.parking || undefined,
                        storageSpace: formData.storageSpace || undefined,
                        duration: formData.duration || undefined,
                        terrain: formData.terrain || undefined,
                        access: formData.access || undefined,
                    },
                    additionalNotes: formData.additionalNotes || undefined,
                },
                photos: [],
            };

            const response = await fetch(
                `/api/orders/${order.id}/measurement`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                },
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Chyba při ukládání");
            }

            goto(`/dashboard/measurements/${result.measurement.id}`);
        } catch (e) {
            error = e instanceof Error ? e.message : "Nastala chyba";
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
        <a
            href="/dashboard/measurements/new"
            class="p-2 hover:bg-slate-100 rounded transition-colors"
        >
            <ArrowLeft class="w-5 h-5 text-slate-600" />
        </a>
        <div class="flex-1">
            <h1 class="text-2xl font-bold text-slate-800">Zaměření</h1>
            <div class="flex items-center gap-3 text-slate-500 mt-1">
                <span class="font-mono text-sm">{order.orderNumber}</span>
                <span>•</span>
                <span class="flex items-center gap-1">
                    <User class="w-4 h-4" />
                    {getCustomerDisplayName(order.customer)}
                </span>
                {#if order.location}
                    <span>•</span>
                    <span class="flex items-center gap-1">
                        <MapPin class="w-4 h-4" />
                        {order.location.city}
                    </span>
                {/if}
            </div>
        </div>
    </div>

    <!-- Progress -->
    <div class="bg-white rounded shadow-sm border border-slate-200 p-4">
        <div class="flex items-center gap-2 overflow-x-auto pb-2">
            {#each steps as step, i}
                <button
                    type="button"
                    onclick={() => {
                        if (i <= currentStep) currentStep = i;
                    }}
                    class="flex items-center gap-2 px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors {i ===
                    currentStep
                        ? 'bg-futurol-green text-white'
                        : i < currentStep
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'}"
                >
                    {#if i < currentStep}
                        <Check class="w-4 h-4" />
                    {:else}
                        <span
                            class="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs"
                            >{i + 1}</span
                        >
                    {/if}
                    {step.title}
                </button>
            {/each}
        </div>
    </div>

    <!-- Form -->
    <div class="bg-white rounded shadow-sm border border-slate-200 p-6">
        {#if error}
            <div
                class="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700"
            >
                {error}
            </div>
        {/if}

        <!-- Step 0: Typ pergoly -->
        {#if currentStep === 0}
            <div class="space-y-4">
                <h2 class="text-lg font-semibold text-slate-800">
                    Typ pergoly
                </h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {#each pergolaTypes as type}
                        <button
                            type="button"
                            onclick={() => (formData.pergolaType = type.id)}
                            class="p-4 rounded border-2 text-left transition-all {formData.pergolaType ===
                            type.id
                                ? 'border-futurol-green bg-futurol-green/5'
                                : 'border-slate-200 hover:border-slate-300'}"
                        >
                            <span class="font-medium text-slate-800"
                                >{type.label}</span
                            >
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Step 1: Rozměry -->
        {#if currentStep === 1}
            <div class="space-y-6">
                <h2 class="text-lg font-semibold text-slate-800">
                    Rozměry (v mm)
                </h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Výrobní šířka *
                        </label>
                        <input
                            type="number"
                            bind:value={formData.width}
                            placeholder="např. 4000"
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        />
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Výrobní výsun (hloubka) *
                        </label>
                        <input
                            type="number"
                            bind:value={formData.depth}
                            placeholder="např. 3500"
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        />
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Montážní výška *
                        </label>
                        <input
                            type="number"
                            bind:value={formData.height}
                            placeholder="např. 2800"
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        />
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Podchozí výška od podlahy pod okap
                        </label>
                        <input
                            type="number"
                            bind:value={formData.clearanceHeight}
                            placeholder="např. 2200"
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        />
                    </div>
                </div>
            </div>
        {/if}

        <!-- Step 2: Konstrukce -->
        {#if currentStep === 2}
            <div class="space-y-6">
                <h2 class="text-lg font-semibold text-slate-800">Konstrukce</h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Počet nosných profilů střechy
                        </label>
                        <select
                            bind:value={formData.roofPanels}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            {#each [2, 3, 4, 5, 6, 7, 8, 9] as n}
                                <option value={n}>{n}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Délka nohou (mm)
                        </label>
                        <select
                            bind:value={formData.legLength}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            {#each legLengths as len}
                                <option value={len}>{len} mm</option>
                            {/each}
                            <option value={0}>Nestandardní</option>
                        </select>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Počet nohou
                        </label>
                        <select
                            bind:value={formData.legCount}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            {#each [1, 2, 3, 4, 5, 6] as n}
                                <option value={n}>{n}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Nerezové konzole pro kotvení
                        </label>
                        <input
                            type="text"
                            bind:value={formData.bracketInfo}
                            placeholder="Počet a umístění"
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Barva konstrukce
                        </label>
                        <select
                            bind:value={formData.colorFrame}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            {#each frameColors as color}
                                <option value={color}>{color}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Barva střešního PVC + profilů
                        </label>
                        <select
                            bind:value={formData.colorRoof}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            {#each roofColors as color}
                                <option value={color.id}>{color.label}</option>
                            {/each}
                        </select>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Step 3: Montáž -->
        {#if currentStep === 3}
            <div class="space-y-6">
                <h2 class="text-lg font-semibold text-slate-800">
                    Informace k montáži
                </h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Typ zdiva
                        </label>
                        <input
                            type="text"
                            bind:value={formData.wallType}
                            placeholder="např. cihla, beton..."
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        />
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Zateplení
                        </label>
                        <div class="flex gap-2">
                            <input
                                type="text"
                                bind:value={formData.insulationType}
                                placeholder="Typ (EPS, minerální...)"
                                class="flex-1 px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            />
                            <input
                                type="number"
                                bind:value={formData.insulationThickness}
                                placeholder="mm"
                                class="w-20 px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            />
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Kotvení
                        </label>
                        <select
                            bind:value={formData.anchoringType}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            <option value="">Vyberte...</option>
                            <option value="zavitove_tyce">Závitové tyče</option>
                            <option value="zavitove_tyce_sroky"
                                >Závitové tyče + síťky</option
                            >
                            <option value="thermax">Thermax</option>
                            <option value="propasiv_block"
                                >Propasiv Block</option
                            >
                            <option value="vruty_drevo">Vruty do dřeva</option>
                        </select>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Detaily kotvení
                        </label>
                        <input
                            type="text"
                            bind:value={formData.anchoringDetails}
                            placeholder="Počet ks, délka..."
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        />
                    </div>
                </div>

                <div class="space-y-3">
                    <label class="flex items-center gap-3">
                        <input
                            type="checkbox"
                            bind:checked={formData.concreteFootingsNeeded}
                            class="w-5 h-5 rounded border-slate-300 text-futurol-green focus:ring-futurol-green"
                        />
                        <span class="text-sm font-medium text-slate-700"
                            >Betonové patky</span
                        >
                    </label>
                    {#if formData.concreteFootingsNeeded}
                        <div class="grid grid-cols-2 gap-4 pl-8">
                            <select
                                bind:value={formData.concreteFootingsType}
                                class="px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            >
                                <option value="">Vyberte typ...</option>
                                <option value="podbetonovat"
                                    >Podbetonovat stávající dlažbu</option
                                >
                                <option value="s_sebou"
                                    >S sebou k montáži zralé kostky</option
                                >
                                <option value="pripravi_investor"
                                    >Připraví investor</option
                                >
                            </select>
                            <input
                                type="number"
                                bind:value={formData.concreteFootingsCount}
                                placeholder="Počet ks"
                                class="px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            />
                        </div>
                    {/if}
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Vývod z okapu
                        </label>
                        <select
                            bind:value={formData.drainOutput}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            <option value="vpravo">Vpravo standart</option>
                            <option value="vlevo">Vlevo standart</option>
                            <option value="vpravo_vlevo">Vpravo + vlevo</option>
                            <option value="vpravo_nerez"
                                >Vpravo nerez. trubka</option
                            >
                            <option value="vlevo_nerez"
                                >Vlevo nerez. trubka</option
                            >
                        </select>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Přívod elektra
                        </label>
                        <select
                            bind:value={formData.electricalInlet}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            <option value="">Vyberte...</option>
                            <option value="vlevo_kotvici"
                                >Vlevo v místě kotvícího profilu</option
                            >
                            <option value="vpravo_kotvici"
                                >Vpravo v místě kotvícího profilu</option
                            >
                            <option value="leva_predni_noha"
                                >Levou přední nohou</option
                            >
                            <option value="prava_predni_noha"
                                >Pravou přední nohou</option
                            >
                            <option value="leva_zadni_noha"
                                >Levou zadní nohou</option
                            >
                            <option value="prava_zadni_noha"
                                >Pravou zadní nohou</option
                            >
                            <option value="kastlik_rolet"
                                >Z kastlíku předokenních rolet</option
                            >
                        </select>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Step 4: Příslušenství -->
        {#if currentStep === 4}
            <div class="space-y-6">
                <h2 class="text-lg font-semibold text-slate-800">
                    Příslušenství a doplňková výbava
                </h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Dálkový ovladač
                        </label>
                        <select
                            bind:value={formData.remote}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            <option value="">Vyberte...</option>
                            <option value="situo_1_pure"
                                >Situo 1 io Pure II</option
                            >
                            <option value="situo_5_pure"
                                >Situo 5 io Pure II</option
                            >
                            <option value="situo_1_var"
                                >Situo 1 Var io Pure II</option
                            >
                            <option value="situo_5_var"
                                >Situo 5 Var io Pure II</option
                            >
                            <option value="smoove_1">Smoove 1 io Pure</option>
                            <option value="nina">Nina io</option>
                            <option value="ysia_patio"
                                >Somfy Ysia Patio IO 16k Antracit</option
                            >
                        </select>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Motor
                        </label>
                        <select
                            bind:value={formData.motor}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            <option value="IO">IO</option>
                            <option value="WT">WT</option>
                        </select>
                    </div>
                </div>

                <div class="space-y-3">
                    <label class="flex items-center gap-3">
                        <input
                            type="checkbox"
                            bind:checked={formData.windSensorEnabled}
                            class="w-5 h-5 rounded border-slate-300 text-futurol-green focus:ring-futurol-green"
                        />
                        <span class="text-sm font-medium text-slate-700"
                            >Větrný senzor</span
                        >
                    </label>
                    {#if formData.windSensorEnabled}
                        <div class="pl-8">
                            <select
                                bind:value={formData.windSensorPosition}
                                class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            >
                                <option value="vpravo">Vpravo</option>
                                <option value="vlevo">Vlevo</option>
                                <option value="parovat"
                                    >Napárovat na stávající zákazníkův</option
                                >
                            </select>
                        </div>
                    {/if}
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            LED osvětlení
                        </label>
                        <select
                            bind:value={formData.ledType}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            <option value="">Bez LED</option>
                            <option value="COB_4000K"
                                >COB 4000K (neutrální bílá)</option
                            >
                            <option value="COB_3000K"
                                >COB 3000K (teplá bílá)</option
                            >
                            <option value="CCT"
                                >CCT 2700-6500K (nastavitelná)</option
                            >
                            <option value="RGB">RGB</option>
                        </select>
                    </div>
                    {#if formData.ledType}
                        <div>
                            <label
                                class="block text-sm font-medium text-slate-700 mb-1"
                            >
                                Počet LED pásků
                            </label>
                            <select
                                bind:value={formData.ledCount}
                                class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            >
                                {#each [1, 2, 3, 4] as n}
                                    <option value={n}>{n} ks</option>
                                {/each}
                            </select>
                        </div>
                    {/if}
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Venkovní zásuvky IP44
                        </label>
                        <select
                            bind:value={formData.outlets}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            <option value={0}>Bez zásuvek</option>
                            {#each [1, 2, 3, 4] as n}
                                <option value={n}>{n} ks</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Tahoma Switch
                        </label>
                        <select
                            bind:value={formData.tahoma}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            <option value="">Ne</option>
                            <option value="ano">Ano - nová</option>
                            <option value="parovat">Párovat na stávající</option
                            >
                        </select>
                    </div>
                </div>

                <div class="space-y-3">
                    <label class="flex items-center gap-3">
                        <input
                            type="checkbox"
                            bind:checked={formData.izymoReceiver}
                            class="w-5 h-5 rounded border-slate-300 text-futurol-green focus:ring-futurol-green"
                        />
                        <span class="text-sm font-medium text-slate-700"
                            >Izymo ON-OFF Receiver IO</span
                        >
                    </label>
                    <label class="flex items-center gap-3">
                        <input
                            type="checkbox"
                            bind:checked={formData.reinforcementProfile}
                            class="w-5 h-5 rounded border-slate-300 text-futurol-green focus:ring-futurol-green"
                        />
                        <span class="text-sm font-medium text-slate-700"
                            >Zpevňující profil pro dvě nohy (nad 5000 mm šířky)</span
                        >
                    </label>
                </div>
            </div>
        {/if}

        <!-- Step 5: Rolety -->
        {#if currentStep === 5}
            <div class="space-y-6">
                <h2 class="text-lg font-semibold text-slate-800">
                    Screenové rolety
                </h2>
                <p class="text-sm text-slate-500">
                    Vyplňte pouze u rolet, které jsou součástí zakázky.
                </p>

                <!-- Čelní -->
                <div class="p-4 border border-slate-200 rounded">
                    <h3 class="font-medium text-slate-700 mb-3">Čelní</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <span class="block text-sm text-slate-600 mb-1"
                                >Šířka (mm)</span
                            >
                            <input
                                type="number"
                                bind:value={formData.screenFront.width}
                                placeholder="0 = bez rolety"
                                class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            />
                        </div>
                        <div>
                            <span class="block text-sm text-slate-600 mb-1"
                                >Látka</span
                            >
                            <input
                                type="text"
                                bind:value={formData.screenFront.fabric}
                                placeholder="např. SE6-007007"
                                class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            />
                        </div>
                    </div>
                </div>

                <!-- Čelní levá -->
                <div class="p-4 border border-slate-200 rounded">
                    <h3 class="font-medium text-slate-700 mb-3">Čelní levá</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <span class="block text-sm text-slate-600 mb-1"
                                >Šířka (mm)</span
                            >
                            <input
                                type="number"
                                bind:value={formData.screenFrontLeft.width}
                                placeholder="0 = bez rolety"
                                class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            />
                        </div>
                        <div>
                            <span class="block text-sm text-slate-600 mb-1"
                                >Látka</span
                            >
                            <input
                                type="text"
                                bind:value={formData.screenFrontLeft.fabric}
                                placeholder="např. SE6-007007"
                                class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            />
                        </div>
                    </div>
                </div>

                <!-- Čelní pravá -->
                <div class="p-4 border border-slate-200 rounded">
                    <h3 class="font-medium text-slate-700 mb-3">Čelní pravá</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <span class="block text-sm text-slate-600 mb-1"
                                >Šířka (mm)</span
                            >
                            <input
                                type="number"
                                bind:value={formData.screenFrontRight.width}
                                placeholder="0 = bez rolety"
                                class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            />
                        </div>
                        <div>
                            <span class="block text-sm text-slate-600 mb-1"
                                >Látka</span
                            >
                            <input
                                type="text"
                                bind:value={formData.screenFrontRight.fabric}
                                placeholder="např. SE6-007007"
                                class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            />
                        </div>
                    </div>
                </div>

                <!-- Boční levá -->
                <div class="p-4 border border-slate-200 rounded">
                    <h3 class="font-medium text-slate-700 mb-3">Boční levá</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <span class="block text-sm text-slate-600 mb-1"
                                >Šířka (mm)</span
                            >
                            <input
                                type="number"
                                bind:value={formData.screenLeft.width}
                                placeholder="0 = bez rolety"
                                class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            />
                        </div>
                        <div>
                            <span class="block text-sm text-slate-600 mb-1"
                                >Látka</span
                            >
                            <input
                                type="text"
                                bind:value={formData.screenLeft.fabric}
                                placeholder="např. SE6-007007"
                                class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            />
                        </div>
                    </div>
                </div>

                <!-- Boční pravá -->
                <div class="p-4 border border-slate-200 rounded">
                    <h3 class="font-medium text-slate-700 mb-3">Boční pravá</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <span class="block text-sm text-slate-600 mb-1"
                                >Šířka (mm)</span
                            >
                            <input
                                type="number"
                                bind:value={formData.screenRight.width}
                                placeholder="0 = bez rolety"
                                class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            />
                        </div>
                        <div>
                            <span class="block text-sm text-slate-600 mb-1"
                                >Látka</span
                            >
                            <input
                                type="text"
                                bind:value={formData.screenRight.fabric}
                                placeholder="např. SE6-007007"
                                class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                            />
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Step 6: Poznámky -->
        {#if currentStep === 6}
            <div class="space-y-6">
                <h2 class="text-lg font-semibold text-slate-800">
                    Informace pro zákaznický servis
                </h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Parkování
                        </label>
                        <input
                            type="text"
                            bind:value={formData.parking}
                            placeholder="Popis přístupu..."
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        />
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Prostor pro složení profilů
                        </label>
                        <input
                            type="text"
                            bind:value={formData.storageSpace}
                            placeholder="Popis prostoru..."
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Délka montáže
                        </label>
                        <select
                            bind:value={formData.duration}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            <option value="">Vyberte...</option>
                            <option value="mozno_do_vecera"
                                >Možno montovat do večerních hodin</option
                            >
                            <option value="rozdelit_2_dny"
                                >Montáž rozdělit na dva dny</option
                            >
                        </select>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Terén v okolí
                        </label>
                        <select
                            bind:value={formData.terrain}
                            class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                        >
                            <option value="">Vyberte...</option>
                            <option value="v_poradku">V pořádku</option>
                            <option value="nestandartni">Nestandardní</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Přístup k místu montáže
                    </label>
                    <select
                        bind:value={formData.access}
                        class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                    >
                        <option value="">Vyberte...</option>
                        <option value="v_poradku">V pořádku</option>
                        <option value="nestandartni">Nestandardní</option>
                    </select>
                </div>

                <div>
                    <label
                        class="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Doplňující informace k výrobě a montáži
                    </label>
                    <textarea
                        bind:value={formData.additionalNotes}
                        rows="4"
                        placeholder="Další poznámky..."
                        class="w-full px-4 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-futurol-green/30 focus:border-futurol-green"
                    ></textarea>
                </div>
            </div>
        {/if}
    </div>

    <!-- Navigation -->
    <div class="flex justify-between items-center">
        <button
            type="button"
            onclick={prevStep}
            disabled={currentStep === 0}
            class="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            <ArrowLeft class="w-5 h-5" />
            Zpět
        </button>

        {#if currentStep < steps.length - 1}
            <button
                type="button"
                onclick={nextStep}
                disabled={!canProceed()}
                class="inline-flex items-center gap-2 bg-futurol-green text-white px-6 py-2.5 rounded font-medium hover:bg-futurol-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Pokračovat
                <ArrowRight class="w-5 h-5" />
            </button>
        {:else}
            <button
                type="button"
                onclick={submitForm}
                disabled={isSubmitting}
                class="inline-flex items-center gap-2 bg-futurol-green text-white px-6 py-2.5 rounded font-medium hover:bg-futurol-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {#if isSubmitting}
                    <Loader2 class="w-5 h-5 animate-spin" />
                    Ukládám...
                {:else}
                    <Check class="w-5 h-5" />
                    Uložit zaměření
                {/if}
            </button>
        {/if}
    </div>
</div>
