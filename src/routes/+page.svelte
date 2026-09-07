<script lang="ts">
    import { auth } from '$lib/stores/auth.svelte';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let isLoading = $state(false);
    let errorMessage = $state('');

    onMount(() => {
        // Auto redirect if already logged in
        if (auth.isAuthenticated) {
            goto('/dashboard');
        }
    });

    async function handleLogin(role: 'suami' | 'istri') {
        isLoading = true;
        errorMessage = '';
        
        try {
            // Coba seed database dulu, abaikan jika sudah ada
            await fetch('/api/seed', { method: 'POST' });

            // Simulasi login sukses
            auth.login({
                id: role === 'suami' ? 'suami-id-1234' : 'istri-id-5678',
                name: role === 'suami' ? 'Suami' : 'Istri',
                role: role
            });
            
            goto('/dashboard');
        } catch (error) {
            console.error(error);
            errorMessage = 'Terjadi kesalahan saat mencoba masuk.';
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="min-h-screen flex flex-col items-center justify-center p-6 text-center">
    <!-- Header -->
    <div class="mb-12">
        <div class="w-20 h-20 bg-primary/20 text-primary dark:bg-primary-dark/30 dark:text-blue-300 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg rotate-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <h1 class="text-3xl font-bold tracking-tight mb-2">Keuangan Keluarga</h1>
        <p class="text-gray-500 dark:text-gray-400">Transparan, Harmonis, Sejahtera</p>
    </div>

    <!-- Login Cards -->
    <div class="w-full max-w-sm space-y-4">
        {#if errorMessage}
            <div class="p-4 bg-red-100 text-red-700 rounded-xl text-sm">{errorMessage}</div>
        {/if}

        <button 
            onclick={() => handleLogin('suami')}
            disabled={isLoading}
            class="w-full relative overflow-hidden group bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 p-5 rounded-2xl flex items-center justify-between hover:border-primary hover:shadow-lg transition-all active:scale-[0.98]">
            <div class="flex items-center gap-4 relative z-10">
                <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <div class="text-left">
                    <h2 class="font-bold text-lg">Suami</h2>
                    <p class="text-xs text-gray-500">Pencari nafkah utama</p>
                </div>
            </div>
            <div class="text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>

        <button 
            onclick={() => handleLogin('istri')}
            disabled={isLoading}
            class="w-full relative overflow-hidden group bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 p-5 rounded-2xl flex items-center justify-between hover:border-pink-500 hover:shadow-lg transition-all active:scale-[0.98]">
            <div class="flex items-center gap-4 relative z-10">
                <div class="w-12 h-12 bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <div class="text-left">
                    <h2 class="font-bold text-lg">Istri</h2>
                    <p class="text-xs text-gray-500">Manajer keuangan rumah</p>
                </div>
            </div>
            <div class="text-gray-300 dark:text-gray-600 group-hover:text-pink-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    </div>

    {#if isLoading}
        <div class="mt-8 text-sm text-gray-400 animate-pulse">Menghubungkan ke database...</div>
    {/if}
</div>
