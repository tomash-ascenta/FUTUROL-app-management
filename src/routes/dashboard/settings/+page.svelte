<script lang="ts">
    import { Users, Shield, Bell, Database } from "lucide-svelte";
</script>

<div class="space-y-6">
    <div>
        <h1 class="text-2xl font-bold text-slate-800">Nastavení</h1>
        <p class="text-slate-500 mt-1">Správa systému a uživatelů</p>
    </div>

    <div class="grid md:grid-cols-2 gap-4">
        <a
            href="/dashboard/settings/users"
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-futurol-green hover:shadow-md transition-all"
        >
            <div
                class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4"
            >
                <Users class="w-6 h-6 text-blue-600" />
            </div>
            <h3 class="font-semibold text-slate-800 mb-2">Správa uživatelů</h3>
            <p class="text-sm text-slate-500">Přidávání a správa zaměstnanců</p>
        </a>

        <a
            href="/dashboard/settings/roles"
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-futurol-green hover:shadow-md transition-all"
        >
            <div
                class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4"
            >
                <Shield class="w-6 h-6 text-purple-600" />
            </div>
            <h3 class="font-semibold text-slate-800 mb-2">Role a oprávnění</h3>
            <p class="text-sm text-slate-500">Nastavení přístupových práv</p>
        </a>

        <a
            href="/dashboard/settings/notifications"
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-futurol-green hover:shadow-md transition-all"
        >
            <div
                class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4"
            >
                <Bell class="w-6 h-6 text-orange-600" />
            </div>
            <h3 class="font-semibold text-slate-800 mb-2">Notifikace</h3>
            <p class="text-sm text-slate-500">Nastavení push notifikací</p>
        </a>

        <a
            href="/dashboard/settings/data"
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-futurol-green hover:shadow-md transition-all"
        >
            <div
                class="w-12 h-12 bg-futurol-green/10 rounded-lg flex items-center justify-center mb-4"
            >
                <Database class="w-6 h-6 text-futurol-green" />
            </div>
            <h3 class="font-semibold text-slate-800 mb-2">Import dat</h3>
            <p class="text-sm text-slate-500">Import zákazníků z Excelu</p>
        </a>
    </div>
</div>
