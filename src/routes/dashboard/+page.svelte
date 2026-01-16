<script lang="ts">
    import {
        Users,
        ClipboardList,
        Ruler,
        Wrench,
        TrendingUp,
        Calendar,
        AlertCircle,
        CheckCircle2,
    } from "lucide-svelte";

    interface Props {
        data: {
            user: {
                employeeId: string;
                personalNumber: string;
                fullName: string;
                roles: string[];
            } | null;
        };
    }

    let { data }: Props = $props();

    // Mock stats - in real app, these would come from server
    const stats = [
        {
            name: "Aktivní zakázky",
            value: "24",
            change: "+3",
            icon: ClipboardList,
            color: "blue",
        },
        {
            name: "Zákazníci",
            value: "156",
            change: "+12",
            icon: Users,
            color: "green",
        },
        {
            name: "Zaměření tento měsíc",
            value: "8",
            change: "+2",
            icon: Ruler,
            color: "purple",
        },
        {
            name: "Otevřené servisy",
            value: "5",
            change: "-1",
            icon: Wrench,
            color: "orange",
        },
    ];

    const recentActivity = [
        {
            type: "order",
            text: "Nová zakázka FUT-2026-0042",
            time: "Před 2 hodinami",
            icon: ClipboardList,
        },
        {
            type: "measurement",
            text: "Zaměření dokončeno - Novák",
            time: "Před 4 hodinami",
            icon: CheckCircle2,
        },
        {
            type: "service",
            text: "Servis naplánován - Praha 4",
            time: "Včera",
            icon: Calendar,
        },
        {
            type: "alert",
            text: "Zakázka čeká na schválení",
            time: "Včera",
            icon: AlertCircle,
        },
    ];

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
                class="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow shadow-sm"
            >
                <div class="flex items-center justify-between">
                    <div
                        class={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}
                    >
                        <stat.icon class={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <span
                        class="text-sm font-medium text-futurol-green flex items-center gap-1"
                    >
                        <TrendingUp class="w-3 h-3" />
                        {stat.change}
                    </span>
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

    <!-- Content grid -->
    <div class="grid lg:grid-cols-3 gap-6">
        <!-- Recent activity -->
        <div
            class="{data.user?.roles.includes('production_manager') &&
            !data.user?.roles.some((r) =>
                ['admin', 'manager', 'sales', 'technician'].includes(r),
            )
                ? 'lg:col-span-3'
                : 'lg:col-span-2'} bg-white rounded-xl border border-slate-200 shadow-sm"
        >
            <div class="p-5 border-b border-slate-200">
                <h2 class="font-semibold text-slate-800">Nedávná aktivita</h2>
            </div>
            <div class="divide-y divide-slate-100">
                {#each recentActivity as activity}
                    <div
                        class="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                    >
                        <div
                            class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"
                        >
                            <activity.icon class="w-5 h-5 text-slate-600" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium text-slate-800">
                                {activity.text}
                            </div>
                            <div class="text-xs text-slate-500">
                                {activity.time}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
            <div class="p-4 border-t border-slate-200">
                <a
                    href="/dashboard/orders"
                    class="text-sm text-futurol-green hover:text-futurol-green/80 font-medium"
                >
                    Zobrazit vše →
                </a>
            </div>
        </div>

        <!-- Quick actions - skryto pro vedoucího výroby (pouze prohlíží) -->
        {#if !data.user?.roles.includes("production_manager") || data.user?.roles.some( (r) => ["admin", "manager", "sales", "technician"].includes(r), )}
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div class="p-5 border-b border-slate-200">
                    <h2 class="font-semibold text-slate-800">Rychlé akce</h2>
                </div>
                <div class="p-4 space-y-2">
                    {#if data.user?.roles.some( (r) => ["admin", "manager", "sales"].includes(r), )}
                        <a
                            href="/dashboard/customers/new"
                            class="block w-full p-3 text-left rounded-lg border border-slate-200 hover:border-futurol-green hover:bg-futurol-green/5 transition-colors"
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
                            class="block w-full p-3 text-left rounded-lg border border-slate-200 hover:border-futurol-green hover:bg-futurol-green/5 transition-colors"
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
                            class="block w-full p-3 text-left rounded-lg border border-slate-200 hover:border-futurol-green hover:bg-futurol-green/5 transition-colors"
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
                        class="block w-full p-3 text-left rounded-lg border border-slate-200 hover:border-futurol-green hover:bg-futurol-green/5 transition-colors"
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
