<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
</script>

<svelte:head>
	<title>Futurol App</title>
	<meta name="description" content="Futurol - Správa zakázek a zaměření pergol" />
</svelte:head>

{@render children()}
