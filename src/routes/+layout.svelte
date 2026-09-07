<script lang="ts">
	import '../app.css';
	import { auth } from '$lib/stores/auth.svelte';

	let { children } = $props();

	$effect(() => {
		if (auth.session?.theme_color) {
			document.documentElement.style.setProperty('--theme-color', auth.session.theme_color);
		} else {
			document.documentElement.style.setProperty('--theme-color', '#3B82F6');
		}
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<div class="min-h-screen">
	{@render children()}
</div>
