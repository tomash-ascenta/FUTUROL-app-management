<script lang="ts">
	import { goto } from "$app/navigation";
	import { Loader2, ArrowLeft } from "lucide-svelte";

	let personalNumber = $state("");
	let pin = $state("");
	let step = $state<"number" | "pin">("number");
	let loading = $state(false);
	let error = $state("");

	const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"];

	function handleDigit(digit: string) {
		error = "";

		if (digit === "←") {
			if (step === "number") {
				personalNumber = personalNumber.slice(0, -1);
			} else {
				pin = pin.slice(0, -1);
			}
			return;
		}

		if (digit === "") return;

		if (step === "number" && personalNumber.length < 4) {
			personalNumber += digit;
			if (personalNumber.length === 4) {
				step = "pin";
			}
		} else if (step === "pin" && pin.length < 6) {
			pin += digit;
			if (pin.length === 6) {
				handleLogin();
			}
		}
	}

	async function handleLogin() {
		if (personalNumber.length !== 4 || pin.length !== 6) return;

		loading = true;
		error = "";

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ personalNumber, pin }),
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || "Chyba při přihlášení";
				pin = "";
				loading = false;
				return;
			}

			goto("/dashboard");
		} catch (e) {
			error = "Chyba připojení k serveru";
			pin = "";
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (loading) return;

		if (e.key >= "0" && e.key <= "9") {
			handleDigit(e.key);
		} else if (e.key === "Backspace") {
			handleDigit("←");
		} else if (e.key === "Escape") {
			step = "number";
			personalNumber = "";
			pin = "";
			error = "";
		}
	}

	function goBack() {
		step = "number";
		pin = "";
		error = "";
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Futurol | Management</title>
</svelte:head>

<div
	class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900"
>
	<!-- Pozadí -->
	<div
		class="absolute inset-0 bg-cover bg-center bg-fixed"
		style="background-image: url('/radce/strana_99.jpg');"
	></div>

	<div class="relative z-10 w-full max-w-xs">
		<!-- Logo -->
		<div class="text-center mb-6">
			<img
				src="/FUTUROL_logo F.jpg"
				alt="FUTUROL"
				class="h-14 w-14 mx-auto"
			/>
		</div>

		<!-- Login Card -->
		<div
			class="bg-white/90 backdrop-blur-sm rounded-sm shadow-2xl p-6 border border-green-600"
		>
			<!-- Step indicator -->
			<div class="flex items-center justify-center gap-3 mb-5">
				<div class="flex items-center gap-1.5">
					<div
						class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
							{step === 'number'
							? 'bg-futurol-green text-white'
							: 'bg-futurol-green/20 text-futurol-green'}"
					>
						1
					</div>
					<span class="text-xs text-slate-400">Číslo</span>
				</div>
				<div class="w-8 h-px bg-slate-300"></div>
				<div class="flex items-center gap-1.5">
					<div
						class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
							{step === 'pin'
							? 'bg-futurol-green text-white'
							: 'bg-slate-200 text-slate-500'}"
					>
						2
					</div>
					<span class="text-xs text-slate-400">PIN</span>
				</div>
			</div>

			<!-- Display -->
			<div class="mb-5">
				{#if step === "number"}
					<p class="text-xs text-slate-400 text-center mb-2">
						Zadejte 4-místné osobní číslo
					</p>
					<div class="flex justify-center gap-2.5">
						{#each [0, 1, 2, 3] as i}
							<div
								class="w-12 h-12 rounded-sm border-2 flex items-center justify-center text-xl font-semibold transition-all
									{personalNumber[i]
									? 'border-futurol-green bg-futurol-green/10 text-slate-800 shadow-sm shadow-futurol-green/20'
									: 'border-slate-300 bg-white text-slate-800'}"
							>
								{personalNumber[i] || ""}
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex items-center justify-between mb-2">
						<button
							type="button"
							onclick={goBack}
							class="text-xs text-futurol-green hover:underline flex items-center gap-1"
						>
							<ArrowLeft class="w-3 h-3" />
							Zpět
						</button>
						<span class="text-xs text-slate-500 font-mono"
							>{personalNumber}</span
						>
					</div>
					<p class="text-xs text-slate-400 text-center mb-2">
						Zadejte 6-místný PIN
					</p>
					<div class="flex justify-center gap-2">
						{#each [0, 1, 2, 3, 4, 5] as i}
							<div
								class="w-9 h-9 rounded-sm border-2 flex items-center justify-center text-lg transition-all
									{pin[i]
									? 'border-futurol-green bg-futurol-green/10 text-slate-800 shadow-sm shadow-futurol-green/20'
									: 'border-slate-300 bg-white text-slate-800'}"
							>
								{pin[i] ? "•" : ""}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Loading indicator -->
			{#if loading}
				<div class="flex items-center justify-center gap-2 mb-4 py-2">
					<Loader2 class="w-4 h-4 animate-spin text-futurol-green" />
					<span class="text-sm text-slate-400">Přihlašuji...</span>
				</div>
			{/if}

			<!-- Error -->
			{#if error}
				<div
					class="mb-4 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center"
				>
					{error}
				</div>
			{/if}

			<!-- Keypad -->
			<div class="grid grid-cols-3 gap-2">
				{#each digits as digit}
					<button
						type="button"
						onclick={() => handleDigit(digit)}
						disabled={digit === "" || loading}
						class="h-12 rounded-sm text-lg font-medium transition-all
							{digit === ''
							? 'invisible'
							: 'bg-white hover:bg-slate-100 active:bg-futurol-green/20 border border-slate-300 shadow-sm'}
							{digit === '←' ? 'text-slate-500' : 'text-slate-700'}
							{loading ? 'opacity-50 cursor-not-allowed' : ''}"
					>
						{digit}
					</button>
				{/each}
			</div>
		</div>

		<!-- Back link -->
		<div class="text-center mt-4">
			<a
				href="/"
				class="text-xs text-slate-600 hover:text-futurol-green transition-colors inline-flex items-center gap-1"
			>
				<ArrowLeft class="w-3 h-3" />
				Zpět na úvod
			</a>
		</div>

		<!-- Ascenta Lab credit -->
		<div class="flex justify-center mt-8">
			<a
				href="https://ascentalab.cz"
				target="_blank"
				rel="noopener noreferrer"
				class="text-xs text-slate-600 hover:text-slate-800 transition-colors bg-white/90 px-5 py-2 rounded-sm shadow-sm backdrop-blur-sm text-center"
			>
				Powered by <span class="font-semibold"
					><span class="text-emerald-600">Ascenta</span><span
						class="text-red-600">Lab</span
					></span
				>
			</a>
		</div>
	</div>
</div>
