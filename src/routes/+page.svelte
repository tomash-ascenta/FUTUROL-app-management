<script lang="ts">
	import {
		ArrowRight,
		ClipboardList,
		Users,
		Wrench,
		BarChart3,
		ShoppingCart,
	} from "lucide-svelte";
</script>

<svelte:head>
	<title>Futurol | Management</title>
	<link rel="icon" type="image/png" href="/favicon.png" />
</svelte:head>

<div class="min-h-screen flex flex-col relative overflow-hidden bg-slate-900">
	<!-- Pozadí -->
	<div
		class="absolute inset-0 bg-cover bg-center bg-fixed"
		style="background-image: url('/radce/strana_99.jpg');"
	></div>

	<!-- Logo v levém horním rohu -->
	<div class="absolute top-4 left-4 z-20">
		<img src="/FUTUROL_logo F.jpg" alt="FUTUROL" class="h-10 w-10" />
	</div>

	<!-- Horní pruh s názvem -->
	<div class="relative w-full bg-black/60 backdrop-blur-sm py-3 pt-5 z-10">
		<h1
			class="text-white font-normal uppercase tracking-wide text-center"
			style="font-size: calc(2.5rem * 2/3);"
		>
			Central Management System
		</h1>
	</div>

	<!-- Přihlásit se tlačítko vpravo nahoře -->
	<div class="absolute top-4 right-4 z-20">
		<a
			href="/login"
			class="inline-flex items-center gap-2 bg-futurol-wine text-white px-6 py-3 rounded-sm font-medium hover:bg-futurol-wine/90 transition-colors shadow-lg shadow-futurol-wine/20"
		>
			Přihlásit se
			<ArrowRight class="w-5 h-5" />
		</a>
	</div>

	<!-- Hero -->
	<main class="relative z-10 flex-1 max-w-7xl mx-auto px-4 py-16 w-full">
		<div class="text-center mb-16">
			<h2 class="text-4xl font-bold text-white mb-4">
				Order & Production Management
			</h2>
			<p class="text-xl text-slate-300 max-w-2xl mx-auto">
				From measurement to production to service. All in one place.
			</p>
			<!-- Decorative line -->
			<div
				class="w-24 h-1 bg-futurol-wine mx-auto mt-6 rounded-full"
			></div>
		</div>

		<!-- Features Grid -->
		<div class="grid md:grid-cols-3 lg:grid-cols-5 gap-5 mb-16">
			<div
				class="bg-white p-6 border-2 border-slate-100 hover:border-futurol-wine/50 hover:shadow-lg transition-all shadow-sm group"
			>
				<div
					class="w-12 h-12 bg-futurol-wine/10 rounded flex items-center justify-center mb-4 group-hover:bg-futurol-wine/20 transition-colors"
				>
					<ClipboardList class="w-6 h-6 text-futurol-wine" />
				</div>
				<h3 class="font-semibold text-lg text-slate-800 mb-2">
					Zaměření
				</h3>
				<p class="text-slate-500 text-sm">
					Digitální formulář pro zaměření přímo v terénu. Fotky,
					rozměry, specifikace.
				</p>
			</div>

			<div
				class="bg-white p-6 border-2 border-slate-100 hover:border-futurol-wine/50 hover:shadow-lg transition-all shadow-sm group"
			>
				<div
					class="w-12 h-12 bg-futurol-wine/10 rounded flex items-center justify-center mb-4 group-hover:bg-futurol-wine/20 transition-colors"
				>
					<Users class="w-6 h-6 text-futurol-wine" />
				</div>
				<h3 class="font-semibold text-lg text-slate-800 mb-2">
					Zákazníci
				</h3>
				<p class="text-slate-500 text-sm">
					Kompletní evidence zákazníků, historie zakázek a komunikace.
				</p>
			</div>

			<div
				class="bg-white p-6 border-2 border-slate-100 hover:border-futurol-wine/50 hover:shadow-lg transition-all shadow-sm group"
			>
				<div
					class="w-12 h-12 bg-futurol-wine/10 rounded flex items-center justify-center mb-4 group-hover:bg-futurol-wine/20 transition-colors"
				>
					<ShoppingCart class="w-6 h-6 text-futurol-wine" />
				</div>
				<h3 class="font-semibold text-lg text-slate-800 mb-2">
					Zakázky
				</h3>
				<p class="text-slate-500 text-sm">
					Správa zakázek od poptávky až po realizaci a fakturaci.
				</p>
			</div>

			<div
				class="bg-white p-6 border-2 border-slate-100 hover:border-futurol-wine/50 hover:shadow-lg transition-all shadow-sm group"
			>
				<div
					class="w-12 h-12 bg-futurol-wine/10 rounded flex items-center justify-center mb-4 group-hover:bg-futurol-wine/20 transition-colors"
				>
					<Wrench class="w-6 h-6 text-futurol-wine" />
				</div>
				<h3 class="font-semibold text-lg text-slate-800 mb-2">
					Servis
				</h3>
				<p class="text-slate-500 text-sm">
					Evidence servisních požadavků, přiřazení techniků, sledování
					stavu.
				</p>
			</div>

			<div
				class="bg-white p-6 border-2 border-slate-100 hover:border-futurol-wine/50 hover:shadow-lg transition-all shadow-sm group"
			>
				<div
					class="w-12 h-12 bg-futurol-wine/10 rounded flex items-center justify-center mb-4 group-hover:bg-futurol-wine/20 transition-colors"
				>
					<BarChart3 class="w-6 h-6 text-futurol-wine" />
				</div>
				<h3 class="font-semibold text-lg text-slate-800 mb-2">
					Dashboard
				</h3>
				<p class="text-slate-500 text-sm">
					Přehledy, statistiky a KPI pro vedení firmy.
				</p>
			</div>
		</div>

		<!-- Ascenta Lab credit -->
		<div class="flex justify-center mt-8">
			<a
				href="https://ascentalab.cz"
				target="_blank"
				rel="noopener noreferrer"
				class="bg-white px-4 py-2 rounded-md shadow-sm hover:shadow-md transition-shadow"
			>
				<img
					src="/Ascenta Lab logo web  300 x 50 px.svg"
					alt="Powered by Ascenta Lab"
					class="h-6"
				/>
			</a>
		</div>
	</main>
</div>
