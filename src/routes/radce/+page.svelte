<script lang="ts">
    import {
        ArrowLeft,
        ArrowRight,
        Check,
        RotateCcw,
        Loader2,
        Send,
        SlidersHorizontal,
        Lightbulb,
        CloudRain,
        Smartphone,
        Shield,
        Layers,
        Droplets,
        Flame,
        Snowflake,
        Wrench,
        Shirt,
        Award,
    } from "lucide-svelte";
    import {
        Coffee,
        ForkKnife,
        Waves,
        Car,
        Ruler,
        ArrowsOut,
        Buildings,
        SunHorizon,
        Sun,
        Snowflake as SnowIcon,
        House,
        Umbrella,
        Sparkle,
        Lightbulb as LightIcon,
        Flame as FireIcon,
        WindowsLogo,
        CloudRain as RainIcon,
        Coins,
    } from "phosphor-svelte";

    // Mapování features na ikony
    const featureIcons: Record<string, typeof Check> = {
        "Nastavitelné hliníkové lamely 0-135°": SlidersHorizontal,
        "Integrované LED osvětlení": Lightbulb,
        "Senzory deště a větru": CloudRain,
        "Ovládání přes aplikaci": Smartphone,
        "10 let záruka": Shield,
        "Sendvičové izolační panely": Layers,
        "Integrovaný odtok vody": Droplets,
        "Možnost vytápění": Flame,
        "Odolnost proti sněhu do 150 kg/m²": Snowflake,
        "8 let záruka": Shield,
        "Hliníková konstrukce": Wrench,
        "Stahovací textilní střecha": Shirt,
        "Volitelné LED osvětlení": Lightbulb,
        "Snadná údržba": Wrench,
        "5 let záruka": Award,
    };

    // Definice kroků rádce
    interface Question {
        id: string;
        title: string;
        subtitle: string;
        options: {
            id: string;
            label: string;
            description?: string;
            icon?: string;
        }[];
    }

    const questions: Question[] = [
        {
            id: "purpose",
            title: "K čemu pergolu využijete?",
            subtitle: "Vyberte hlavní účel využití",
            options: [
                {
                    id: "relax",
                    label: "Relaxace a posezení",
                    description: "Odpočinek, čtení, káva s přáteli",
                    icon: "Coffee",
                },
                {
                    id: "dining",
                    label: "Venkovní jídelna",
                    description: "Grilování, rodinné obědy",
                    icon: "ForkKnife",
                },
                {
                    id: "pool",
                    label: "Zastřešení bazénu",
                    description: "Ochrana bazénu a relaxační zóna",
                    icon: "Waves",
                },
                {
                    id: "parking",
                    label: "Parkování vozidla",
                    description: "Ochrana auta před počasím",
                    icon: "Car",
                },
            ],
        },
        {
            id: "size",
            title: "Jakou velikost potřebujete?",
            subtitle: "Přibližná plocha pergoly",
            options: [
                {
                    id: "small",
                    label: "Malá (do 12 m²)",
                    description: "Cca 3x4 m - pro 2-4 osoby",
                    icon: "Ruler",
                },
                {
                    id: "medium",
                    label: "Střední (12-20 m²)",
                    description: "Cca 4x5 m - pro 4-6 osob",
                    icon: "ArrowsOut",
                },
                {
                    id: "large",
                    label: "Velká (20-35 m²)",
                    description: "Cca 5x6 m - pro 6-10 osob",
                    icon: "Buildings",
                },
                {
                    id: "xl",
                    label: "Extra velká (35+ m²)",
                    description: "Na míru - velké plochy",
                    icon: "Buildings",
                },
            ],
        },
        {
            id: "roof",
            title: "Jaký typ střechy preferujete?",
            subtitle: "Ovlivňuje funkčnost a design",
            options: [
                {
                    id: "bioclimatic",
                    label: "Bioklimatická lamela",
                    description:
                        "Nastavitelné lamely, regulace světla a vzduchu",
                    icon: "SunHorizon",
                },
                {
                    id: "fixed",
                    label: "Pevná střecha",
                    description: "Maximální ochrana, celoroční využití",
                    icon: "House",
                },
                {
                    id: "retractable",
                    label: "Stahovací markýza",
                    description: "Flexibilita - otevřeno i zavřeno",
                    icon: "Umbrella",
                },
                {
                    id: "glass",
                    label: "Skleněná střecha",
                    description: "Maximální prosvětlení",
                    icon: "Sparkle",
                },
            ],
        },
        {
            id: "extras",
            title: "Jaké doplňky vás zajímají?",
            subtitle: "Můžete vybrat více možností",
            options: [
                {
                    id: "led",
                    label: "LED osvětlení",
                    description: "Atmosféra pro večerní posezení",
                    icon: "LightIcon",
                },
                {
                    id: "heating",
                    label: "Vytápění",
                    description: "Prodloužení sezóny",
                    icon: "FireIcon",
                },
                {
                    id: "blinds",
                    label: "Boční rolety/žaluzie",
                    description: "Ochrana před větrem a sluncem",
                    icon: "WindowsLogo",
                },
                {
                    id: "sensors",
                    label: "Senzory počasí",
                    description: "Automatické zavírání při dešti",
                    icon: "RainIcon",
                },
            ],
        },
        {
            id: "budget",
            title: "Jaký je váš rozpočet?",
            subtitle: "Orientační cenové rozmezí",
            options: [
                {
                    id: "economy",
                    label: "Do 150 000 Kč",
                    description: "Základní řešení",
                    icon: "Coins",
                },
                {
                    id: "standard",
                    label: "150 000 - 300 000 Kč",
                    description: "Střední třída s doplňky",
                    icon: "Coins",
                },
                {
                    id: "premium",
                    label: "300 000 - 500 000 Kč",
                    description: "Prémiové provedení",
                    icon: "Coins",
                },
                {
                    id: "luxury",
                    label: "500 000+ Kč",
                    description: "Luxusní řešení na míru",
                    icon: "Coins",
                },
            ],
        },
    ];

    let currentStep = $state(0);
    let answers = $state<Record<string, string | string[]>>({});
    let showResult = $state(false);

    // Pozadí pro každou obrazovku (krok 1-5 + výsledek)
    // Kroky 1-5 používají strana_1 až strana_5, výsledek používá strana_99
    const getBackgroundForStep = (step: number, isResult: boolean): string => {
        if (isResult) return "/radce/strana_99.jpg";
        return `/radce/strana_${step + 1}.jpg`;
    };

    // Mapování icon stringů na Phosphor komponenty
    const iconComponents: Record<string, any> = {
        Coffee,
        ForkKnife,
        Waves,
        Car,
        Ruler,
        ArrowsOut,
        Buildings,
        SunHorizon,
        House,
        Umbrella,
        Sparkle,
        LightIcon,
        FireIcon,
        WindowsLogo,
        RainIcon,
        Coins,
    };

    // Formulář pro poptávku
    let formData = $state({
        fullName: "",
        email: "",
        phone: "",
        note: "",
    });
    let isSubmitting = $state(false);
    let submitSuccess = $state(false);
    let submitError = $state("");

    // Lead magnet - PDF průvodce
    let leadEmail = $state("");
    let leadSubmitting = $state(false);
    let leadSubmitted = $state(false);
    let leadError = $state("");

    async function submitLeadMagnet() {
        if (!leadEmail) return;
        leadSubmitting = true;
        leadError = "";

        try {
            const response = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: leadEmail,
                    source: "pdf_guide",
                }),
            });

            if (!response.ok) {
                throw new Error("Nepodařilo se odeslat");
            }

            leadSubmitted = true;
        } catch (err) {
            leadError = "Něco se pokazilo. Zkuste to prosím znovu.";
        } finally {
            leadSubmitting = false;
        }
    }

    async function submitInquiry() {
        isSubmitting = true;
        submitError = "";

        try {
            const recommendation = getRecommendation();

            const response = await fetch("/api/inquiries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    purpose: answers.purpose,
                    size: answers.size,
                    roofType: answers.roof,
                    extras: answers.extras || [],
                    budget: answers.budget,
                    recommendedProduct: recommendation.title,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Nepodařilo se odeslat poptávku",
                );
            }

            submitSuccess = true;
        } catch (error) {
            submitError =
                error instanceof Error
                    ? error.message
                    : "Nepodařilo se odeslat poptávku";
        } finally {
            isSubmitting = false;
        }
    }

    function selectOption(questionId: string, optionId: string) {
        // Pro extras povolíme multi-select
        if (questionId === "extras") {
            const current = (answers[questionId] as string[]) || [];
            if (current.includes(optionId)) {
                answers[questionId] = current.filter((id) => id !== optionId);
            } else {
                answers[questionId] = [...current, optionId];
            }
        } else {
            // Single select - vždy přepíše předchozí hodnotu
            answers[questionId] = optionId;
            // Vynutíme reaktivitu
            answers = { ...answers };
        }
    }

    function isSelected(questionId: string, optionId: string): boolean {
        const answer = answers[questionId];
        if (Array.isArray(answer)) {
            return answer.includes(optionId);
        }
        return answer === optionId;
    }

    function canProceed(): boolean {
        const currentQuestion = questions[currentStep];
        const answer = answers[currentQuestion.id];
        if (currentQuestion.id === "extras") {
            return true; // Extras jsou volitelné
        }
        return !!answer;
    }

    function nextStep() {
        if (currentStep < questions.length - 1) {
            currentStep++;
        } else {
            showResult = true;
        }
    }

    function prevStep() {
        if (currentStep > 0) {
            currentStep--;
        }
    }

    function restart() {
        currentStep = 0;
        answers = {};
        showResult = false;
        // Reset form state
        submitSuccess = false;
        submitError = "";
        isSubmitting = false;
        formData = {
            fullName: "",
            email: "",
            phone: "",
            note: "",
        };
    }

    function getRecommendation(): {
        title: string;
        description: string;
        features: string[];
    } {
        const roof = answers.roof as string;
        const size = answers.size as string;
        const budget = answers.budget as string;

        // Jednoduchá logika doporučení
        if (
            roof === "bioclimatic" ||
            budget === "premium" ||
            budget === "luxury"
        ) {
            return {
                title: "FUTUROL Premium Bioclimatic",
                description:
                    "Prémiová bioklimatická pergola s hliníkovými lamelami, které se automaticky přizpůsobují počasí.",
                features: [
                    "Nastavitelné hliníkové lamely 0-135°",
                    "Integrované LED osvětlení",
                    "Senzory deště a větru",
                    "Ovládání přes aplikaci",
                    "10 let záruka",
                ],
            };
        } else if (roof === "fixed" || size === "xl") {
            return {
                title: "FUTUROL Solid Roof",
                description:
                    "Robustní pergola s pevnou střechou pro celoroční využití a maximální ochranu.",
                features: [
                    "Sendvičové izolační panely",
                    "Integrovaný odtok vody",
                    "Možnost vytápění",
                    "Odolnost proti sněhu do 150 kg/m²",
                    "8 let záruka",
                ],
            };
        } else {
            return {
                title: "FUTUROL Classic",
                description:
                    "Elegantní pergola s vynikajícím poměrem cena/výkon pro každodenní využití.",
                features: [
                    "Hliníková konstrukce",
                    "Stahovací textilní střecha",
                    "Volitelné LED osvětlení",
                    "Snadná údržba",
                    "5 let záruka",
                ],
            };
        }
    }

    // Preload všech obrázků pozadí pro plynulé přechody
    import { onMount } from "svelte";

    const backgroundImages = [
        "/radce/strana_1.jpg",
        "/radce/strana_2.jpg",
        "/radce/strana_3.jpg",
        "/radce/strana_4.jpg",
        "/radce/strana_5.jpg",
        "/radce/strana_99.jpg",
    ];

    let imagesLoaded = $state(false);

    onMount(() => {
        // Preload všech obrázků
        const imagePromises = backgroundImages.map((src) => {
            return new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve(); // I při chybě pokračujeme
                img.src = src;
            });
        });

        Promise.all(imagePromises).then(() => {
            imagesLoaded = true;
        });
    });
</script>

<svelte:head>
    <title>Futurol | Rádce</title>
    <!-- Preload kritických obrázků pozadí -->
    {#each backgroundImages as src}
        <link rel="preload" as="image" href={src} />
    {/each}
</svelte:head>

<div class="min-h-screen flex flex-col relative overflow-hidden bg-slate-900">
    <!-- Dynamické pozadí podle aktuálního kroku -->
    <div
        class="absolute inset-0 bg-cover bg-center bg-fixed transition-opacity duration-500 ease-in-out {imagesLoaded
            ? 'opacity-100'
            : 'opacity-0'}"
        style="background-image: url('{getBackgroundForStep(
            currentStep,
            showResult,
        )}');"
    ></div>

    <!-- Logo v levém horním rohu - proklik na úvod rádce -->
    <button
        onclick={restart}
        class="absolute top-4 left-4 z-20 hover:opacity-80 transition-opacity cursor-pointer"
        title="Zpět na začátek"
    >
        <img src="/FUTUROL_logo F.jpg" alt="FUTUROL" class="h-10 w-10" />
    </button>

    <!-- Horní pruh s názvem -->
    <div class="relative w-full bg-black/60 backdrop-blur-sm py-3 pt-5 z-10">
        <h1
            class="text-white font-normal uppercase tracking-wide text-center"
            style="font-size: calc(2.5rem * 2/3);"
        >
            {#if submitSuccess}
                DĚKUJEME ZA VAŠI POPTÁVKU
            {:else if showResult}
                MÁME PRO VÁS DOPORUČENÍ NA ZÁKLADĚ VAŠICH ODPOVĚDÍ
            {:else}
                RÁDCE PRO VÝBĚR PERGOLY FUTUROL
            {/if}
        </h1>
    </div>

    <main
        class="relative z-10 flex-1 max-w-4xl px-4 py-6 lg:py-8 w-full flex flex-col justify-center {showResult
            ? 'mx-auto'
            : 'mr-auto ml-[calc(50%-32rem+20rem)]'}"
    >
        {#if !showResult}
            <!-- Progress bar -->
            <div class="mb-8 max-w-xl mx-auto text-center">
                <div class="text-sm text-slate-400 mb-2">
                    Krok {currentStep + 1} z {questions.length}
                </div>
                <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        class="h-full bg-futurol-green transition-all duration-300 rounded-full"
                        style="width: {((currentStep + 1) / questions.length) *
                            100}%"
                    ></div>
                </div>
            </div>

            <!-- Question -->
            {#each questions as question, index}
                {#if index === currentStep}
                    <div class="text-center mb-8">
                        <h1
                            class="text-2xl lg:text-3xl font-extrabold text-white mb-2"
                        >
                            {question.title}
                        </h1>
                        <p class="text-slate-300">
                            {question.subtitle}
                        </p>
                    </div>

                    <!-- Options - 2x2 Grid -->
                    <div
                        class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8"
                    >
                        {#each question.options as option}
                            <button
                                type="button"
                                onclick={() =>
                                    selectOption(question.id, option.id)}
                                class="group text-left p-5 border-2 transition-all duration-300 {isSelected(
                                    question.id,
                                    option.id,
                                )
                                    ? 'border-futurol-wine bg-white shadow-md'
                                    : 'border-slate-600/30 bg-white/95 hover:border-futurol-wine/50 hover:shadow-sm'}"
                            >
                                <div class="flex items-start gap-3">
                                    <div
                                        class="w-12 h-12 flex items-center justify-center bg-amber-50 border border-amber-200/60 flex-shrink-0 transition-all duration-300 group-hover:bg-amber-100 group-hover:border-amber-300"
                                    >
                                        {#if iconComponents[option.icon || ""]}
                                            {@const IconComponent =
                                                iconComponents[
                                                    option.icon || ""
                                                ]}
                                            <IconComponent
                                                size={28}
                                                weight="regular"
                                                class="text-amber-700 transition-all duration-300 group-hover:text-amber-800 group-hover:scale-110"
                                            />
                                        {/if}
                                    </div>
                                    <div class="flex-1">
                                        <div
                                            class="flex items-center justify-between gap-2"
                                        >
                                            <h3
                                                class="font-semibold text-slate-800"
                                            >
                                                {option.label}
                                            </h3>
                                            {#if isSelected(question.id, option.id)}
                                                <div
                                                    class="w-6 h-6 bg-futurol-green rounded-full flex items-center justify-center flex-shrink-0"
                                                >
                                                    <Check
                                                        class="w-3.5 h-3.5 text-white"
                                                    />
                                                </div>
                                            {/if}
                                        </div>
                                        {#if option.description}
                                            <p
                                                class="text-sm text-slate-500 mt-1"
                                            >
                                                {option.description}
                                            </p>
                                        {/if}
                                    </div>
                                </div>
                            </button>
                        {/each}
                    </div>

                    <!-- Navigation - Centered -->
                    <div
                        class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                    >
                        {#if currentStep > 0}
                            <button
                                type="button"
                                onclick={prevStep}
                                class="inline-flex items-center gap-2 px-6 py-2 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-sm transition-all"
                            >
                                <ArrowLeft class="w-4 h-4" />
                                Zpět
                            </button>
                        {/if}

                        <button
                            type="button"
                            onclick={nextStep}
                            disabled={!canProceed()}
                            class="group inline-flex items-center gap-2 bg-transparent border-2 border-futurol-green text-futurol-green px-6 py-2 text-sm font-normal rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:bg-futurol-green hover:text-white hover:border-futurol-green hover:shadow-lg hover:-translate-y-0.5"
                        >
                            {currentStep === questions.length - 1
                                ? "Zobrazit doporučení"
                                : "Pokračovat"}
                            <ArrowRight
                                class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                            />
                        </button>
                    </div>
                {/if}
            {/each}
        {:else}
            <!-- Result - Full Screen Layout -->
            {@const recommendation = getRecommendation()}

            <div>
                {#if submitSuccess}
                    <!-- SUCCESS STATE - Clean thank you page - centered -->
                    <div class="flex items-center justify-center">
                        <div class="w-full max-w-xl">
                            <div
                                class="bg-white border-2 border-green-600 p-6 shadow-lg"
                            >
                                <div class="flex items-start gap-4 mb-5">
                                    <div
                                        class="w-14 h-14 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden"
                                    >
                                        <img
                                            src="/FUTUROL_logo F.jpg"
                                            alt="FUTUROL"
                                            class="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div>
                                        <h2
                                            class="text-xl font-bold text-slate-800 mb-1"
                                        >
                                            Poptávku jsme v pořádku přijali!
                                        </h2>
                                        <p class="text-slate-600 text-sm">
                                            Děkujeme za váš zájem o produkt <strong
                                                >{recommendation.title}</strong
                                            >.
                                        </p>
                                    </div>
                                </div>

                                <div class="border-t border-slate-200 pt-5">
                                    <h3
                                        class="font-semibold text-slate-800 mb-3 text-sm"
                                    >
                                        Co dál:
                                    </h3>
                                    <ul class="space-y-3">
                                        <li class="flex items-center gap-3">
                                            <div
                                                class="w-8 h-8 bg-green-50 border-2 border-green-600 flex items-center justify-center flex-shrink-0"
                                            >
                                                <Check
                                                    class="w-4 h-4 text-green-700"
                                                />
                                            </div>
                                            <span class="text-slate-700 text-sm"
                                                >Ozveme se vám v pracovní dny do
                                                24 hodin</span
                                            >
                                        </li>
                                        <li class="flex items-center gap-3">
                                            <div
                                                class="w-8 h-8 bg-green-50 border-2 border-green-600 flex items-center justify-center flex-shrink-0"
                                            >
                                                <Check
                                                    class="w-4 h-4 text-green-700"
                                                />
                                            </div>
                                            <span class="text-slate-700 text-sm"
                                                >Připravíme pro vás cenovou
                                                nabídku na míru</span
                                            >
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <!-- Bonus slide-up -->
                            <div class="mt-2 pt-4">
                                <a
                                    href="/Podrobný průvodce rozhodováním při pořízení pergoly.pdf"
                                    download
                                    class="block bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 transition-all duration-300 ease-out cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-green-300/40 hover:border-green-400 hover:-translate-y-1"
                                >
                                    <div class="flex items-start gap-3">
                                        <span class="text-2xl">🎁</span>
                                        <div>
                                            <p
                                                class="text-sm font-semibold text-green-700 mb-1"
                                            >
                                                Váš bonus je připraven ke
                                                stažení!
                                            </p>
                                            <p class="text-sm text-green-600">
                                                <strong
                                                    >15stránkový Průvodce
                                                    pořízením pergoly</strong
                                                >
                                                v PDF.<br />
                                                Klikněte
                                                <span
                                                    class="underline font-bold text-green-700 hover:text-green-800"
                                                    >ZDE</span
                                                > pro stažení.
                                            </p>
                                        </div>
                                    </div>
                                </a>
                            </div>

                            <!-- Secondary action - restart -->
                            <button
                                type="button"
                                onclick={restart}
                                class="inline-flex items-center gap-2 text-slate-500 hover:text-futurol-wine mt-4 text-sm transition-colors"
                            >
                                <RotateCcw class="w-4 h-4" />
                                Začít znovu
                            </button>
                        </div>
                    </div>
                {:else}
                    <!-- RESULT STATE - Recommendation + Inquiry Form -->
                    <div class="flex flex-col lg:flex-row gap-8 items-start">
                        <!-- Left side - Recommendation -->
                        <div class="flex-1 w-full">
                            <!-- Recommendation card wrapper pro slide-up efekt -->
                            <div class="relative z-10">
                                <div
                                    class="bg-white border-2 border-green-600 p-6 shadow-lg relative z-20"
                                >
                                    <div class="flex items-start gap-4 mb-5">
                                        <div
                                            class="w-14 h-14 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden"
                                        >
                                            <img
                                                src="/FUTUROL_logo F.jpg"
                                                alt="FUTUROL"
                                                class="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div>
                                            <h2
                                                class="text-xl font-bold text-slate-800 mb-1"
                                            >
                                                {recommendation.title}
                                            </h2>
                                            <p class="text-slate-600 text-sm">
                                                {recommendation.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div class="border-t border-slate-200 pt-5">
                                        <h3
                                            class="font-semibold text-slate-800 mb-3 text-sm"
                                        >
                                            Co zahrnuje:
                                        </h3>
                                        <ul
                                            class="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                        >
                                            {#each recommendation.features as feature}
                                                {@const IconComponent =
                                                    featureIcons[feature] ||
                                                    Check}
                                                <li
                                                    class="flex items-center gap-3"
                                                >
                                                    <div
                                                        class="w-8 h-8 bg-green-50 border-2 border-green-600 flex items-center justify-center flex-shrink-0"
                                                    >
                                                        <IconComponent
                                                            class="w-4 h-4 text-green-700"
                                                        />
                                                    </div>
                                                    <span
                                                        class="text-slate-700 text-sm"
                                                        >{feature}</span
                                                    >
                                                </li>
                                            {/each}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Lead Magnet Bonus - animovaný slide-up zpod karty -->
                            <div class="mt-2 pt-4">
                                <div
                                    class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 animate-bonus-slide-up transition-all duration-300 ease-out cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-green-300/40 hover:border-green-400 hover:-translate-y-1"
                                >
                                    <div class="flex items-start gap-3">
                                        <span class="text-2xl">🎁</span>
                                        <div>
                                            <p
                                                class="text-sm font-semibold text-green-700 mb-1"
                                            >
                                                Bonus zdarma!
                                            </p>
                                            <p class="text-sm text-green-600">
                                                Odesláním nezávazné poptávky
                                                získáte okamžitě
                                                <strong
                                                    >15stránkového Průvodce
                                                    pořízením pergoly</strong
                                                >
                                                v PDF.<br />
                                                Vše na jednom místě, co potřebujete
                                                vědět před rozhodnutím o pořízení
                                                pergoly.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Secondary action - restart -->
                            <button
                                type="button"
                                onclick={restart}
                                class="inline-flex items-center gap-2 text-slate-500 hover:text-futurol-wine mt-4 text-sm transition-colors"
                            >
                                <RotateCcw class="w-4 h-4" />
                                Začít znovu
                            </button>
                        </div>

                        <!-- Right side - Inquiry Form (Sticky on desktop) -->
                        <div class="w-full lg:w-96 lg:sticky lg:top-8">
                            <!-- Inquiry Form -->
                            <div
                                class="bg-white border-2 border-green-600 p-5 shadow-lg"
                            >
                                <div class="text-center mb-4">
                                    <h3
                                        class="text-lg font-bold text-slate-800 mb-0.5"
                                    >
                                        Zašleme vám cenovou nabídku
                                    </h3>
                                    <p class="text-slate-500 text-sm">
                                        Ozveme se vám v pracovní dny do 24 hodin
                                    </p>
                                </div>

                                <form
                                    onsubmit={(e) => {
                                        e.preventDefault();
                                        submitInquiry();
                                    }}
                                    class="space-y-3"
                                >
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
                                            bind:value={formData.fullName}
                                            required
                                            class="w-full px-3 py-2.5 border border-slate-200 focus:ring-2 focus:ring-futurol-wine/20 focus:border-futurol-wine outline-none transition-all text-sm"
                                            placeholder="Jan Novák"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            for="email"
                                            class="block text-sm font-medium text-slate-700 mb-1"
                                        >
                                            E-mail *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            bind:value={formData.email}
                                            required
                                            class="w-full px-3 py-2.5 border border-slate-200 focus:ring-2 focus:ring-futurol-wine/20 focus:border-futurol-wine outline-none transition-all text-sm"
                                            placeholder="jan@email.cz"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            for="phone"
                                            class="block text-sm font-medium text-slate-700 mb-1"
                                        >
                                            Telefon <span class="text-slate-400"
                                                >(nepovinné)</span
                                            >
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            bind:value={formData.phone}
                                            class="w-full px-3 py-2.5 border border-slate-200 focus:ring-2 focus:ring-futurol-wine/20 focus:border-futurol-wine outline-none transition-all text-sm"
                                            placeholder="+420 123 456 789"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            for="note"
                                            class="block text-sm font-medium text-slate-700 mb-1"
                                        >
                                            Poznámka <span
                                                class="text-slate-400"
                                                >(nepovinné)</span
                                            >
                                        </label>
                                        <input
                                            type="text"
                                            id="note"
                                            bind:value={formData.note}
                                            class="w-full px-3 py-2.5 border border-slate-200 focus:ring-2 focus:ring-futurol-wine/20 focus:border-futurol-wine outline-none transition-all text-sm"
                                            placeholder="Speciální požadavky..."
                                        />
                                    </div>

                                    {#if submitError}
                                        <div
                                            class="bg-red-50 text-red-600 text-sm p-3"
                                        >
                                            {submitError}
                                        </div>
                                    {/if}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        class="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3.5 font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-600/20"
                                    >
                                        {#if isSubmitting}
                                            <Loader2
                                                class="w-5 h-5 animate-spin"
                                            />
                                            Odesílám...
                                        {:else}
                                            <Send class="w-5 h-5" />
                                            Odeslat nezávaznou poptávku
                                        {/if}
                                    </button>

                                    <p
                                        class="text-center text-slate-400 text-xs pt-1"
                                    >
                                        Odesláním formuláře souhlasím se <a
                                            href="https://www.futurol.cz/zasady-o-zpracovani-osobnich-udaju"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="text-slate-500 hover:text-slate-600 underline"
                                            >Zásadami zpracování osobních údajů</a
                                        >.
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </main>
</div>

<style>
    /* Animace pro bonus sekci - vyjíždí zpod karty */
    @keyframes bonus-slide-up {
        0% {
            opacity: 0;
            transform: translateY(-100%);
        }
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-bonus-slide-up {
        opacity: 0;
        transform: translateY(-100%);
        animation: bonus-slide-up 1s cubic-bezier(0.22, 1, 0.36, 1) 1.8s
            forwards;
    }
</style>
