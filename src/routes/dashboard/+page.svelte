<script lang="ts">
    import {
        Users,
        ClipboardList,
        Ruler,
        Wrench,
        Phone,
        Mail,
        MessageSquare,
        Calendar,
        CheckCircle2,
        ArrowRight,
        Bell,
        Building2,
        User,
    } from "lucide-svelte";

    interface PipelineStage {
        status: string;
        label: string;
        color: string;
        count: number;
        value: number;
    }

    interface FollowUp {
        id: string;
        content: string;
        type: string;
        followUpDate: string | null;
        customerId: string;
        customerName: string;
        customerType: string;
        createdByName: string;
    }

    interface Props {
        data: {
            user: {
                employeeId: string;
                personalNumber: string;
                fullName: string;
                roles: string[];
            } | null;
            pipeline: PipelineStage[];
            followUps: FollowUp[];
            stats: {
                conversionsThisMonth: number;
                pendingFollowUps: number;
                openServices: number;
                contracts: number;
            };
            today: string;
        };
    }

    let { data }: Props = $props();

    // Stats karty z reálných dat
    const stats = $derived([
        {
            name: "Konverze tento měsíc",
            value: data.stats.conversionsThisMonth.toString(),
            icon: Users,
            color: "slate",
        },
        {
            name: "Čekající follow-upy",
            value: data.stats.pendingFollowUps.toString(),
            icon: Bell,
            color: "amber",
        },
        {
            name: "Podepsané smlouvy",
            value: data.stats.contracts.toString(),
            icon: CheckCircle2,
            color: "green",
        },
        {
            name: "Otevřené servisy",
            value: data.stats.openServices.toString(),
            icon: Wrench,
            color: "orange",
        },
    ]);

    // Celková hodnota pipeline
    const totalPipelineValue = $derived(
        data.pipeline.reduce((sum, stage) => sum + stage.value, 0),
    );

    // Formátování hodnoty
    function formatValue(value: number): string {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + "M";
        }
        if (value >= 1000) {
            return Math.round(value / 1000) + "k";
        }
        return value.toString();
    }

    // Formátování data follow-upu
    function formatFollowUpDate(dateStr: string | null): {
        label: string;
        urgency: "overdue" | "today" | "tomorrow" | "week";
    } {
        if (!dateStr) return { label: "", urgency: "week" };

        const date = new Date(dateStr);
        const today = new Date(data.today);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const diffDays = Math.floor(
            (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays < 0) return { label: "Po termínu!", urgency: "overdue" };
        if (diffDays === 0) return { label: "Dnes", urgency: "today" };
        if (diffDays === 1) return { label: "Zítra", urgency: "tomorrow" };

        const dayNames = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
        return {
            label:
                dayNames[date.getDay()] +
                " " +
                date.getDate() +
                "." +
                (date.getMonth() + 1) +
                ".",
            urgency: "week",
        };
    }

    // Ikona podle typu aktivity
    function getActivityIcon(type: string) {
        switch (type) {
            case "call":
                return Phone;
            case "email":
                return Mail;
            case "meeting":
                return Calendar;
            default:
                return MessageSquare;
        }
    }

    // Barvy pro pipeline stages
    function getPipelineColor(color: string): string {
        const colors: Record<string, string> = {
            slate: "bg-slate-100 text-slate-700 border-slate-200",
            blue: "bg-blue-100 text-blue-700 border-blue-200",
            purple: "bg-purple-100 text-purple-700 border-purple-200",
            amber: "bg-amber-100 text-amber-700 border-amber-200",
            green: "bg-green-100 text-green-700 border-green-200",
            orange: "bg-orange-100 text-orange-700 border-orange-200",
            teal: "bg-teal-100 text-teal-700 border-teal-200",
            emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
        };
        return colors[color] || colors.slate;
    }

    function getGreeting(): string {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return "Dobré ráno";
        if (hour >= 12 && hour < 18) return "Dobrý den";
        return "Dobrý večer";
    }

    function getColorClasses(color: string): {
        bg: string;
        text: string;
        icon: string;
    } {
        const colors: Record<
            string,
            { bg: string; text: string; icon: string }
        > = {
            slate: {
                bg: "bg-slate-100",
                text: "text-slate-700",
                icon: "text-slate-600",
            },
            red: {
                bg: "bg-red-100",
                text: "text-red-700",
                icon: "text-red-600",
            },
            amber: {
                bg: "bg-amber-100",
                text: "text-amber-700",
                icon: "text-amber-600",
            },
            blue: {
                bg: "bg-blue-100",
                text: "text-blue-700",
                icon: "text-blue-600",
            },
            green: {
                bg: "bg-futurol-green/10",
                text: "text-futurol-green",
                icon: "text-futurol-green",
            },
            purple: {
                bg: "bg-purple-100",
                text: "text-purple-700",
                icon: "text-purple-600",
            },
            orange: {
                bg: "bg-orange-100",
                text: "text-orange-700",
                icon: "text-orange-600",
            },
        };
        return colors[color] || colors.blue;
    }
</script>

<div class="space-y-6">
    <!-- Welcome header -->
    <div>
        <h1 class="text-2xl font-bold text-slate-800">
            {getGreeting()}!
        </h1>
        <p class="text-slate-500 mt-1">Zde je přehled vaší práce</p>
    </div>

    <!-- Stats grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {#each stats as stat}
            {@const colors = getColorClasses(stat.color)}
            <div
                class="bg-white rounded p-5 border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 group cursor-default"
            >
                <div class="flex items-center justify-between">
                    <div
                        class={`w-10 h-10 rounded flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${colors.bg}`}
                    >
                        <stat.icon class={`w-5 h-5 ${colors.icon}`} />
                    </div>
                </div>
                <div class="mt-3">
                    <div class="text-2xl font-bold text-slate-800">
                        {stat.value}
                    </div>
                    <div class="text-sm text-slate-500">{stat.name}</div>
                </div>
            </div>
        {/each}
    </div>

    <!-- Pipeline zakázek -->
    <div class="bg-white rounded border border-slate-200 shadow-sm">
        <div class="p-5 border-b border-slate-200">
            <h2 class="font-semibold text-slate-800">Pipeline zakázek</h2>
            <p class="text-xs text-slate-500 mt-0.5">
                Aktivní zakázky podle fáze
            </p>
        </div>
        <div class="p-5">
            <div class="flex items-center gap-2 overflow-x-auto pb-2">
                {#each data.pipeline as stage, i}
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <div
                            class={`px-3 py-2 rounded border-2 text-center min-w-[90px] transition-all duration-200 hover:shadow-md cursor-default ${getPipelineColor(stage.color)}`}
                        >
                            <div class="text-xl font-bold">
                                {stage.count}
                            </div>
                            <div
                                class="text-[10px] font-medium whitespace-nowrap"
                            >
                                {stage.label}
                            </div>
                        </div>
                        {#if i < data.pipeline.length - 1}
                            <ArrowRight
                                class="w-4 h-4 text-slate-300 flex-shrink-0"
                            />
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
        <div class="px-5 pb-4">
            <a
                href="/dashboard/orders"
                class="text-sm text-futurol-green hover:text-futurol-green/80 font-medium inline-flex items-center gap-1"
            >
                Zobrazit všechny zakázky
                <ArrowRight class="w-4 h-4" />
            </a>
        </div>
    </div>

    <!-- Content grid -->
    <div class="grid lg:grid-cols-3 gap-6">
        <!-- Follow-upy -->
        <div
            class="{data.user?.roles.includes('production_manager') &&
            !data.user?.roles.some((r) =>
                ['admin', 'manager', 'sales', 'technician'].includes(r),
            )
                ? 'lg:col-span-3'
                : 'lg:col-span-2'} bg-white rounded border border-slate-200 shadow-sm"
        >
            <div
                class="p-5 border-b border-slate-200 flex items-center justify-between"
            >
                <div class="flex items-center gap-2">
                    <Bell class="w-5 h-5 text-futurol-wine" />
                    <h2 class="font-semibold text-slate-800">Připomínky</h2>
                </div>
                {#if data.followUps.length > 0}
                    <span
                        class="px-2 py-0.5 text-xs font-medium bg-futurol-wine/10 text-futurol-wine rounded"
                    >
                        {data.followUps.length} aktivních
                    </span>
                {/if}
            </div>

            {#if data.followUps.length === 0}
                <div class="p-8 text-center">
                    <div
                        class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3"
                    >
                        <CheckCircle2 class="w-6 h-6 text-green-500" />
                    </div>
                    <p class="text-sm text-slate-600 font-medium">
                        Žádné připomínky
                    </p>
                    <p class="text-xs text-slate-500 mt-1">
                        Všechny follow-upy jsou splněny
                    </p>
                </div>
            {:else}
                <div class="divide-y divide-slate-100">
                    {#each data.followUps.slice(0, 5) as followUp}
                        {@const dateInfo = formatFollowUpDate(
                            followUp.followUpDate,
                        )}
                        {@const ActivityIcon = getActivityIcon(followUp.type)}
                        <a
                            href="/dashboard/customers/{followUp.customerId}"
                            class="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors block"
                        >
                            <div
                                class="w-8 h-8 rounded flex items-center justify-center flex-shrink-0
                                {dateInfo.urgency === 'overdue'
                                    ? 'bg-red-100'
                                    : dateInfo.urgency === 'today'
                                      ? 'bg-amber-100'
                                      : dateInfo.urgency === 'tomorrow'
                                        ? 'bg-blue-100'
                                        : 'bg-slate-100'}"
                            >
                                <ActivityIcon
                                    class="w-4 h-4 
                                    {dateInfo.urgency === 'overdue'
                                        ? 'text-red-600'
                                        : dateInfo.urgency === 'today'
                                          ? 'text-amber-600'
                                          : dateInfo.urgency === 'tomorrow'
                                            ? 'text-blue-600'
                                            : 'text-slate-600'}"
                                />
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 mb-0.5">
                                    <span
                                        class="text-sm font-medium text-slate-800 truncate"
                                    >
                                        {followUp.customerName}
                                    </span>
                                    {#if followUp.customerType === "B2B"}
                                        <Building2
                                            class="w-3 h-3 text-slate-400 flex-shrink-0"
                                        />
                                    {:else}
                                        <User
                                            class="w-3 h-3 text-slate-400 flex-shrink-0"
                                        />
                                    {/if}
                                </div>
                                <p class="text-sm text-slate-600 line-clamp-1">
                                    {followUp.content}
                                </p>
                                <div class="flex items-center gap-2 mt-1">
                                    <span
                                        class="text-xs font-medium px-1.5 py-0.5 rounded
                                        {dateInfo.urgency === 'overdue'
                                            ? 'bg-red-100 text-red-700'
                                            : dateInfo.urgency === 'today'
                                              ? 'bg-amber-100 text-amber-700'
                                              : dateInfo.urgency === 'tomorrow'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-slate-100 text-slate-600'}"
                                    >
                                        {dateInfo.label}
                                    </span>
                                </div>
                            </div>
                        </a>
                    {/each}
                </div>
                {#if data.followUps.length > 5}
                    <div class="p-4 border-t border-slate-200 text-center">
                        <span class="text-xs text-slate-500">
                            + {data.followUps.length - 5} dalších připomínek
                        </span>
                    </div>
                {/if}
            {/if}
        </div>

        <!-- Quick actions - skryto pro vedoucího výroby (pouze prohlíží) -->
        {#if !data.user?.roles.includes("production_manager") || data.user?.roles.some( (r) => ["admin", "manager", "sales", "technician"].includes(r), )}
            <div class="bg-white rounded border border-slate-200 shadow-sm">
                <div class="p-5 border-b border-slate-200">
                    <h2 class="font-semibold text-slate-800">Rychlé akce</h2>
                </div>
                <div class="p-4 space-y-2">
                    {#if data.user?.roles.some( (r) => ["admin", "manager", "sales"].includes(r), )}
                        <a
                            href="/dashboard/customers/new"
                            class="block w-full p-3 text-left rounded border border-slate-200 hover:border-futurol-green hover:bg-futurol-green/5 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <div class="flex items-center gap-3">
                                <Users class="w-5 h-5 text-futurol-green" />
                                <span class="text-sm font-medium text-slate-800"
                                    >Nový zákazník</span
                                >
                            </div>
                        </a>
                        <a
                            href="/dashboard/orders/new"
                            class="block w-full p-3 text-left rounded border border-slate-200 hover:border-futurol-green hover:bg-futurol-green/5 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <div class="flex items-center gap-3">
                                <ClipboardList
                                    class="w-5 h-5 text-futurol-green"
                                />
                                <span class="text-sm font-medium text-slate-800"
                                    >Nová zakázka</span
                                >
                            </div>
                        </a>
                    {/if}
                    {#if data.user?.roles.includes("technician")}
                        <a
                            href="/dashboard/measurements/new"
                            class="block w-full p-3 text-left rounded border border-slate-200 hover:border-futurol-green hover:bg-futurol-green/5 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <div class="flex items-center gap-3">
                                <Ruler class="w-5 h-5 text-futurol-green" />
                                <span class="text-sm font-medium text-slate-800"
                                    >Nové zaměření</span
                                >
                            </div>
                        </a>
                    {/if}
                    <a
                        href="/dashboard/service/new"
                        class="block w-full p-3 text-left rounded border border-slate-200 hover:border-futurol-green hover:bg-futurol-green/5 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <div class="flex items-center gap-3">
                            <Wrench class="w-5 h-5 text-futurol-green" />
                            <span class="text-sm font-medium text-slate-800"
                                >Nový servis</span
                            >
                        </div>
                    </a>
                </div>
            </div>
        {/if}
    </div>
</div>
