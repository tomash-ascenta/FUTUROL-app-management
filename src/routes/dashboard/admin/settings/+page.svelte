<script lang="ts">
    import { Settings, Database, Bell, Globe } from "lucide-svelte";
</script>

<div class="space-y-6">
    <div>
        <h1 class="text-2xl font-bold text-slate-800">Nastavení systému</h1>
        <p class="text-slate-500 mt-1">Konfigurace aplikace Futurol</p>
    </div>

    <div class="grid md:grid-cols-2 gap-4">
        <div
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
            <div
                class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4"
            >
                <Database class="w-6 h-6 text-blue-600" />
            </div>
            <h3 class="font-semibold text-slate-800 mb-2">Import dat</h3>
            <p class="text-sm text-slate-500 mb-4">
                Import zákazníků a zakázek z Excel souborů
            </p>
            <button
                class="text-sm text-futurol-green font-medium hover:text-futurol-green/80"
            >
                Otevřít →
            </button>
        </div>

        <div
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
            <div
                class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4"
            >
                <Bell class="w-6 h-6 text-orange-600" />
            </div>
            <h3 class="font-semibold text-slate-800 mb-2">Push notifikace</h3>
            <p class="text-sm text-slate-500 mb-4">
                Konfigurace VAPID klíčů pro push notifikace
            </p>
            <button
                class="text-sm text-futurol-green font-medium hover:text-futurol-green/80"
            >
                Nastavit →
            </button>
        </div>

        <div
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
            <div
                class="w-12 h-12 bg-futurol-green/10 rounded-lg flex items-center justify-center mb-4"
            >
                <Globe class="w-6 h-6 text-futurol-green" />
            </div>
            <h3 class="font-semibold text-slate-800 mb-2">Google Drive</h3>
            <p class="text-sm text-slate-500 mb-4">
                Propojení s Google Drive pro ukládání fotek
            </p>
            <button
                class="text-sm text-futurol-green font-medium hover:text-futurol-green/80"
            >
                Propojit →
            </button>
        </div>

        <div
            class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
            <div
                class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4"
            >
                <Settings class="w-6 h-6 text-purple-600" />
            </div>
            <h3 class="font-semibold text-slate-800 mb-2">Obecné nastavení</h3>
            <p class="text-sm text-slate-500 mb-4">
                Název firmy, logo a další základní nastavení
            </p>
            <button
                class="text-sm text-futurol-green font-medium hover:text-futurol-green/80"
            >
                Upravit →
            </button>
        </div>
    </div>

    <!-- System info -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 class="font-semibold text-slate-800 mb-4">Informace o systému</h3>
        <dl class="grid grid-cols-2 gap-4 text-sm">
            <div>
                <dt class="text-slate-500">Verze aplikace</dt>
                <dd class="font-medium text-slate-800">1.0.0</dd>
            </div>
            <div>
                <dt class="text-slate-500">Databáze</dt>
                <dd class="font-medium text-slate-800">PostgreSQL 16</dd>
            </div>
            <div>
                <dt class="text-slate-500">Framework</dt>
                <dd class="font-medium text-slate-800">SvelteKit 2.x</dd>
            </div>
            <div>
                <dt class="text-slate-500">Prostředí</dt>
                <dd class="font-medium text-slate-800">Development</dd>
            </div>
        </dl>
    </div>
</div>
