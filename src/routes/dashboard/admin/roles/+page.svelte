<script lang="ts">
    import { Shield, Info } from "lucide-svelte";

    const roles = [
        {
            code: "admin",
            name: "Administrátor",
            description:
                "Správa systému, uživatelů, přístupů a nastavení. Nemá přístup k obchodním datům.",
            color: "red",
            permissions: [
                "Správa uživatelů",
                "Reset PIN",
                "Audit logy",
                "Nastavení systému",
            ],
        },
        {
            code: "sales",
            name: "Obchodník",
            description:
                "Správa leadů, zákazníků, zakázek a servisu. Hlavní obchodní role.",
            color: "blue",
            permissions: [
                "Poptávky (leady)",
                "Zákazníci",
                "Zakázky",
                "Zaměření (čtení)",
                "Servis",
            ],
        },
        {
            code: "manager",
            name: "Manažer",
            description: "Vidí vše, zatím nespravuje nic. Dohledová role.",
            color: "purple",
            permissions: [
                "Poptávky (čtení)",
                "Zákazníci (čtení)",
                "Zakázky (čtení)",
                "Zaměření (čtení)",
                "Servis (čtení)",
                "Reporty",
            ],
        },
        {
            code: "production_manager",
            name: "Vedoucí výroby",
            description: "Přehled zákazníků, zakázek a zaměření pro výrobu.",
            color: "yellow",
            permissions: [
                "Zákazníci (čtení)",
                "Zakázky (čtení)",
                "Zaměření (čtení)",
            ],
        },
        {
            code: "technician",
            name: "Technik",
            description: "Zaměřovač a servisní technik v terénu.",
            color: "green",
            permissions: [
                "Zákazníci (čtení)",
                "Zakázky (čtení)",
                "Zaměření",
                "Servis",
            ],
        },
    ];

    function getColorClasses(color: string): {
        bg: string;
        text: string;
        border: string;
    } {
        const colors: Record<
            string,
            { bg: string; text: string; border: string }
        > = {
            red: {
                bg: "bg-red-100",
                text: "text-red-700",
                border: "border-red-200",
            },
            purple: {
                bg: "bg-purple-100",
                text: "text-purple-700",
                border: "border-purple-200",
            },
            blue: {
                bg: "bg-blue-100",
                text: "text-blue-700",
                border: "border-blue-200",
            },
            yellow: {
                bg: "bg-yellow-100",
                text: "text-yellow-700",
                border: "border-yellow-200",
            },
            green: {
                bg: "bg-green-100",
                text: "text-green-700",
                border: "border-green-200",
            },
            orange: {
                bg: "bg-orange-100",
                text: "text-orange-700",
                border: "border-orange-200",
            },
        };
        return colors[color] || colors.blue;
    }
</script>

<div class="space-y-6">
    <div>
        <h1 class="text-2xl font-bold text-slate-800">Role a oprávnění</h1>
        <p class="text-slate-500 mt-1">
            Přehled rolí a jejich oprávnění v systému
        </p>
    </div>

    <div
        class="bg-futurol-green/5 border border-futurol-green/20 rounded p-4 flex items-start gap-3"
    >
        <Info class="w-5 h-5 text-futurol-green flex-shrink-0 mt-0.5" />
        <div class="text-sm text-slate-700">
            <p class="font-medium">Jeden uživatel může mít více rolí</p>
            <p>
                Například zaměřovač může být zároveň servisním technikem. Role
                se přidělují v sekci Správa uživatelů.
            </p>
        </div>
    </div>

    <div class="grid md:grid-cols-2 gap-4">
        {#each roles as role}
            {@const colors = getColorClasses(role.color)}
            <div
                class="bg-white rounded shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
                <div class="flex items-center gap-3 mb-4">
                    <div
                        class="w-10 h-10 {colors.bg} rounded flex items-center justify-center"
                    >
                        <Shield class="w-5 h-5 {colors.text}" />
                    </div>
                    <div>
                        <h3 class="font-semibold text-slate-800">
                            {role.name}
                        </h3>
                        <code class="text-xs text-slate-500">{role.code}</code>
                    </div>
                </div>

                <p class="text-sm text-slate-600 mb-4">{role.description}</p>

                <div>
                    <p
                        class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2"
                    >
                        Oprávnění
                    </p>
                    <div class="flex flex-wrap gap-1">
                        {#each role.permissions as permission}
                            <span
                                class="px-2 py-1 text-xs rounded-full {colors.bg} {colors.text}"
                            >
                                {permission}
                            </span>
                        {/each}
                    </div>
                </div>
            </div>
        {/each}
    </div>
</div>
