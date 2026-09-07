<script lang="ts">
    import { auth } from '$lib/stores/auth.svelte';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let isLoading = $state(false);
    let errorMessage = $state('');
    let username = $state('');
    let password = $state('');

    onMount(() => {
        // Auto redirect if already logged in
        if (auth.isAuthenticated) {
            goto('/dashboard');
        }
    });

    async function handleLogin(e: Event) {
        e.preventDefault();
        isLoading = true;
        errorMessage = '';
        
        try {
            // Coba seed database dulu, abaikan jika sudah ada
            await fetch('/api/seed', { method: 'POST' });

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                errorMessage = data.message || 'Login gagal';
                return;
            }

            // Simulasi login sukses
            auth.login(data.user);
            
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

    <!-- Login Form -->
    <div class="w-full max-w-sm space-y-4">
        {#if errorMessage}
            <div class="p-4 bg-red-100 text-red-700 rounded-xl text-sm text-left">{errorMessage}</div>
        {/if}

        <form onsubmit={handleLogin} class="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-sm text-left flex flex-col gap-4">
            <div>
                <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                <input 
                    type="text" 
                    id="username" 
                    bind:value={username} 
                    required 
                    class="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors dark:text-white"
                    placeholder="Masukkan username"
                />
            </div>
            
            <div>
                <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input 
                    type="password" 
                    id="password" 
                    bind:value={password} 
                    required 
                    class="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors dark:text-white"
                    placeholder="Masukkan password"
                />
            </div>

            <button 
                type="submit"
                disabled={isLoading}
                class="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {#if isLoading}
                    <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                {:else}
                    Masuk
                {/if}
            </button>
        </form>
    </div>
</div>
