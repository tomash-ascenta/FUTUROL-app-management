<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import {
        LayoutDashboard,
        Users,
        ClipboardList,
        Ruler,
        Wrench,
        FileText,
        Settings,
        LogOut,
        Menu,
        X,
        ChevronDown,
        Shield,
        ScrollText,
        KeyRound,
        MessageSquare,
    } from "lucide-svelte";
    import type { Snippet } from "svelte";

    interface Props {
        children: Snippet;
        data: {
            user: {
                employeeId: string;
                personalNumber: string;
                fullName: string;
                roles: string[];
            } | null;
        };
    }

    let { children, data }: Props = $props();

    let sidebarOpen = $state(false);
    let userMenuOpen = $state(false);

    // Hlavní navigace - business moduly
    const navigation = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            roles: ["manager", "sales", "production_manager", "technician"],
        },
        {
            name: "Poptávky",
            href: "/dashboard/inquiries",
            icon: MessageSquare,
            roles: ["manager", "sales"],
        },
        {
            name: "Zákazníci",
            href: "/dashboard/customers",
            icon: Users,
            roles: ["manager", "sales", "production_manager", "technician"],
        },
        {
            name: "Zakázky",
            href: "/dashboard/orders",
            icon: ClipboardList,
            roles: ["manager", "sales", "production_manager", "technician"],
        },
        {
            name: "Zaměření",
            href: "/dashboard/measurements",
            icon: Ruler,
            roles: ["manager", "sales", "production_manager", "technician"],
        },
        {
            name: "Servis",
            href: "/dashboard/service",
            icon: Wrench,
            roles: ["manager", "sales", "technician"],
        },
        {
            name: "Reporty",
            href: "/dashboard/reports",
            icon: FileText,
            roles: ["manager"],
        },
    ];

    // Admin navigace - správa systému
    const adminNavigation = [
        {
            name: "Správa uživatelů",
            href: "/dashboard/admin/users",
            icon: Users,
            roles: ["admin"],
        },
        {
            name: "Role a oprávnění",
            href: "/dashboard/admin/roles",
            icon: Shield,
            roles: ["admin"],
        },
        {
            name: "Audit logy",
            href: "/dashboard/admin/logs",
            icon: ScrollText,
            roles: ["admin"],
        },
        {
            name: "Nastavení systému",
            href: "/dashboard/admin/settings",
            icon: Settings,
            roles: ["admin"],
        },
    ];

    function hasAccess(roles: string[]): boolean {
        if (!data.user) return false;
        // Admin má přístup ke všemu
        if (data.user.roles.includes("admin")) return true;
        return data.user.roles.some((r) => roles.includes(r));
    }

    function isActive(href: string): boolean {
        // Dashboard je aktivní pouze na přesné cestě /dashboard
        if (href === "/dashboard") {
            return $page.url.pathname === "/dashboard";
        }
        return (
            $page.url.pathname === href ||
            $page.url.pathname.startsWith(href + "/")
        );
    }

    function isAdmin(): boolean {
        return data.user?.roles.includes("admin") || false;
    }

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        goto("/login");
    }

    function getRoleLabel(role: string): string {
        const labels: Record<string, string> = {
            admin: "Administrátor",
            manager: "Manažer",
            sales: "Obchodník",
            production_manager: "Vedoucí výroby",
            technician: "Technik",
        };
        return labels[role] || role;
    }
</script>

<div class="min-h-screen bg-futurol-bg">
    <!-- Mobile sidebar backdrop -->
    {#if sidebarOpen}
        <div
            class="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onclick={() => (sidebarOpen = false)}
            role="button"
            tabindex="-1"
            onkeydown={(e) => e.key === "Escape" && (sidebarOpen = false)}
        ></div>
    {/if}

    <!-- Sidebar - Light professional -->
    <aside
        class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 sidebar-scroll
			{sidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
    >
        <!-- Logo -->
        <div
            class="h-16 flex items-center justify-between px-4 border-b border-slate-200"
        >
            <a href="/dashboard" class="flex items-center gap-3">
                <img src="/logo-icon.png" alt="Futurol" class="h-8 w-auto" />
                <span class="text-xl font-bold text-slate-800 tracking-tight"
                    >FUTUROL</span
                >
            </a>
            <button
                class="lg:hidden p-2 text-slate-400 hover:text-slate-600"
                onclick={() => (sidebarOpen = false)}
            >
                <X class="w-5 h-5" />
            </button>
        </div>

        <!-- Navigation -->
        <nav class="p-4 space-y-1 flex-1 overflow-y-auto">
            <!-- Business moduly -->
            {#each navigation as item}
                {#if hasAccess(item.roles)}
                    <a
                        href={item.href}
                        class="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all
							{isActive(item.href)
                            ? 'bg-futurol-green text-white shadow-soft'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}"
                        onclick={() => (sidebarOpen = false)}
                    >
                        <item.icon class="w-5 h-5" />
                        {item.name}
                    </a>
                {/if}
            {/each}

            <!-- Admin sekce -->
            {#if isAdmin()}
                <div class="pt-4 mt-4 border-t border-slate-200">
                    <p
                        class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                    >
                        Administrace
                    </p>
                    {#each adminNavigation as item}
                        <a
                            href={item.href}
                            class="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all
                                {isActive(item.href)
                                ? 'bg-futurol-green text-white shadow-soft'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}"
                            onclick={() => (sidebarOpen = false)}
                        >
                            <item.icon class="w-5 h-5" />
                            {item.name}
                        </a>
                    {/each}
                </div>
            {/if}
        </nav>

        <!-- Změna PIN - pro všechny přihlášené -->
        <div class="p-4 border-t border-slate-200">
            <a
                href="/dashboard/my-profile"
                class="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all
                    {isActive('/dashboard/my-profile')
                    ? 'bg-futurol-green text-white shadow-soft'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}"
            >
                <KeyRound class="w-5 h-5" />
                Můj profil
            </a>
        </div>

        <!-- Ascenta Lab credit -->
        <div class="p-4 border-t border-slate-100">
            <a
                href="https://ascentalab.cz"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
            >
                <span>Powered by</span>
                <img
                    src="/ascenta-lab-logo.svg"
                    alt="Ascenta Lab"
                    class="h-3"
                />
            </a>
        </div>
    </aside>

    <!-- Main content -->
    <div class="lg:pl-64">
        <!-- Top bar - Light -->
        <header
            class="h-16 bg-white border-b border-futurol-border flex items-center justify-between px-4 lg:px-6 shadow-soft"
        >
            <button
                class="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700"
                onclick={() => (sidebarOpen = true)}
            >
                <Menu class="w-6 h-6" />
            </button>

            <div class="flex-1"></div>

            <!-- User menu -->
            <div class="relative">
                <button
                    class="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-100 transition-colors"
                    onclick={() => (userMenuOpen = !userMenuOpen)}
                >
                    <div
                        class="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200"
                    >
                        <span class="text-sm font-semibold text-primary-700">
                            {data.user?.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                        </span>
                    </div>
                    <div class="hidden sm:block text-left">
                        <div class="text-sm font-medium text-slate-900">
                            {data.user?.fullName}
                        </div>
                        <div class="text-xs text-slate-500">
                            {data.user?.roles.map(getRoleLabel).join(", ")}
                        </div>
                    </div>
                    <ChevronDown class="w-4 h-4 text-slate-400" />
                </button>

                {#if userMenuOpen}
                    <div
                        class="absolute right-0 mt-2 w-56 bg-white rounded shadow-elevated border border-futurol-border py-1 z-50"
                    >
                        <div class="px-4 py-3 border-b border-futurol-border">
                            <div class="text-sm font-medium text-slate-900">
                                {data.user?.fullName}
                            </div>
                            <div class="text-xs text-slate-500">
                                Osobní číslo: #{data.user?.personalNumber}
                            </div>
                        </div>
                        <a
                            href="/dashboard/my-profile"
                            class="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                            <Settings class="w-4 h-4" />
                            Nastavení profilu
                        </a>
                        <button
                            class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            onclick={handleLogout}
                        >
                            <LogOut class="w-4 h-4" />
                            Odhlásit se
                        </button>
                    </div>
                {/if}
            </div>
        </header>

        <!-- Page content -->
        <main class="p-4 lg:p-6">
            {@render children()}
        </main>
    </div>
</div>

<!-- Close user menu on click outside -->
<svelte:window
    onclick={(e) => {
        if (userMenuOpen && !(e.target as Element).closest(".relative")) {
            userMenuOpen = false;
        }
    }}
/>
