<script lang="ts">
    import { auth } from '$lib/stores/auth.svelte';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';

    let { children } = $props();

    onMount(() => {
        if (!auth.isAuthenticated) {
            goto('/');
        }
    });
</script>

<div class="min-h-screen bg-gray-50 dark:bg-background-dark pb-24">
    <!-- Header -->
    <header class="bg-primary dark:bg-surface-dark text-white p-4 pt-8 rounded-b-3xl shadow-md sticky top-0 z-10">
        <div class="flex justify-between items-center">
            <div>
                <p class="text-xs text-blue-100 dark:text-gray-400">Halo, {auth.session?.name}</p>
                <h1 class="text-xl font-bold">Dompet Keluarga</h1>
            </div>
            <button 
                onclick={() => { auth.logout(); goto('/'); }}
                class="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
        </div>
    </header>

    <!-- Main Content -->
    <main class="p-4 relative">
        {@render children()}
    </main>

    <!-- Floating Bottom Navigation -->
    <nav class="fixed bottom-4 left-4 right-4 bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-2 flex justify-around items-center z-50">
        <a href="/dashboard" 
           class="flex flex-col items-center p-2 rounded-xl w-16 transition-colors {$page.url.pathname === '/dashboard' ? 'text-primary dark:text-blue-400 font-bold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span class="text-[10px]">Beranda</span>
        </a>

        <!-- FAB / Catat Button -->
        <a href="/dashboard/catat" 
           class="relative -top-5 bg-primary dark:bg-primary-dark text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_16px_rgba(59,130,246,0.4)] hover:scale-105 transition-transform border-4 border-gray-50 dark:border-background-dark">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
        </a>

        <a href="/dashboard/analisis" 
           class="flex flex-col items-center p-2 rounded-xl w-16 transition-colors {$page.url.pathname === '/dashboard/analisis' ? 'text-primary dark:text-blue-400 font-bold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <span class="text-[10px]">Analisis</span>
        </a>

        {#if auth.session?.role === 'suami'}
        <a href="/dashboard/pengaturan" 
           class="flex flex-col items-center p-2 rounded-xl w-16 transition-colors {$page.url.pathname === '/dashboard/pengaturan' ? 'text-primary dark:text-blue-400 font-bold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="text-[10px]">Pengaturan</span>
        </a>
        {/if}
    </nav>
</div>
