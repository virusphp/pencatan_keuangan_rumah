<script lang="ts">
	import '../app.css';
	import { auth } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	$effect(() => {
		if (auth.session?.theme_color) {
			document.documentElement.style.setProperty('--theme-color', auth.session.theme_color);
		} else {
			document.documentElement.style.setProperty('--theme-color', '#3B82F6');
		}
	});

	onMount(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch(console.error);
		}
	});
</script>

<svelte:head>
	<title>Keuangan Keluarga</title>
	<meta name="description" content="Aplikasi manajemen keuangan keluarga" />
	<link rel="manifest" href="/manifest.json" />
	<link rel="icon" href="/icon.svg" />
	<link rel="apple-touch-icon" href="/icon.svg" />
	<meta name="theme-color" content="#3B82F6" />
</svelte:head>

<div class="min-h-screen">
	{@render children()}
</div>
