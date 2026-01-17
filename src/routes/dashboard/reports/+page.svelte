<script lang="ts">
    import { FileText, Download, Calendar } from "lucide-svelte";
</script>

<div class="space-y-6">
    <div>
        <h1 class="text-2xl font-bold text-slate-800">Reporty</h1>
        <p class="text-slate-500 mt-1">Přehledy a statistiky</p>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
            class="bg-white rounded shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
            <div
                class="w-12 h-12 bg-blue-100 rounded flex items-center justify-center mb-4"
            >
                <FileText class="w-6 h-6 text-blue-600" />
            </div>
            <h3 class="font-semibold text-slate-800 mb-2">Měsíční přehled</h3>
            <p class="text-sm text-slate-500 mb-4">
                Přehled zakázek a tržeb za aktuální měsíc
            </p>
            <button
                class="text-sm text-futurol-green font-medium hover:text-futurol-green/80"
            >
                Zobrazit →
            </button>
        </div>

        <div
            class="bg-white rounded shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
            <div
                class="w-12 h-12 bg-futurol-green/10 rounded flex items-center justify-center mb-4"
            >
                <Download class="w-6 h-6 text-futurol-green" />
            </div>
            <h3 class="font-semibold text-slate-800 mb-2">Export dat</h3>
            <p class="text-sm text-slate-500 mb-4">
                Stáhněte data ve formátu Excel
            </p>
            <button
                class="text-sm text-futurol-green font-medium hover:text-futurol-green/80"
            >
                Exportovat →
            </button>
        </div>

        <div
            class="bg-white rounded shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
            <div
                class="w-12 h-12 bg-purple-100 rounded flex items-center justify-center mb-4"
            >
                <Calendar class="w-6 h-6 text-purple-600" />
            </div>
            <h3 class="font-semibold text-slate-800 mb-2">Roční statistiky</h3>
            <p class="text-sm text-slate-500 mb-4">
                Porovnání výkonu v průběhu roku
            </p>
            <button
                class="text-sm text-futurol-green font-medium hover:text-futurol-green/80"
            >
                Zobrazit →
            </button>
        </div>
    </div>
</div>
