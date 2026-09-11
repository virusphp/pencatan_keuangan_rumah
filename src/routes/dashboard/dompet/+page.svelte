<script lang="ts">
    import { onMount } from 'svelte';
    import { auth } from '$lib/stores/auth.svelte';

    let allAccounts = $state<any[]>([]);
    let isTransparent = $state(false);
    let activeTab = $state<'saya' | 'pasangan'>('saya');
    let isLoading = $state(true);

    let canViewSpouse = $derived(
        auth.session?.role === 'suami' || (auth.session?.role === 'istri' && isTransparent)
    );

    let myAccounts = $derived(
        allAccounts.filter((acc: any) => acc.role_access === auth.session?.role || acc.role_access === 'all')
    );

    let spouseAccounts = $derived(
        allAccounts.filter((acc: any) => acc.role_access !== auth.session?.role && acc.role_access !== 'all')
    );

    let currentAccounts = $derived(activeTab === 'saya' ? myAccounts : spouseAccounts);

    onMount(async () => {
        await fetchBalances();
    });

    async function fetchBalances() {
        if (!auth.session) return;
        
        try {
            isLoading = true;
            const res = await fetch(`/api/transactions?userId=${auth.session.id}&role=${auth.session.role}`);
            const data = await res.json();
            
            if (data && data.accountBalances) {
                allAccounts = data.accountBalances;
                isTransparent = data.isTransparent;
            }
        } catch (error) {
            console.error(error);
        } finally {
            isLoading = false;
        }
    }

    function formatRupiah(amount: number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }
</script>

<div class="space-y-6">
    <div class="flex items-center gap-3 bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div class="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        </div>
        <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Buku Besar Dompet</h1>
            <p class="text-xs text-gray-500">Rincian saldo tiap-tiap akun dompet.</p>
        </div>
    </div>

    <!-- Tab Menu (Dompet Saya vs Dompet Pasangan) -->
    {#if canViewSpouse}
        <div class="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-inner gap-1">
            <button 
                type="button"
                onclick={() => activeTab = 'saya'}
                class="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 {activeTab === 'saya' ? 'bg-white dark:bg-surface-dark shadow-md text-primary dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Dompet Saya ({myAccounts.length})
            </button>
            <button 
                type="button"
                onclick={() => activeTab = 'pasangan'}
                class="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 {activeTab === 'pasangan' ? 'bg-white dark:bg-surface-dark shadow-md text-rose-600 dark:text-rose-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Dompet Pasangan ({spouseAccounts.length})
            </button>
        </div>
    {/if}

    <!-- Accounts List -->
    <div class="space-y-3">
        {#if isLoading}
            <div class="space-y-3">
                {#each Array(4) as _}
                    <div class="h-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl"></div>
                {/each}
            </div>
        {:else if currentAccounts.length === 0}
            <div class="text-center py-10 bg-white dark:bg-surface-dark rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                <p class="text-gray-500 dark:text-gray-400">
                    {activeTab === 'saya' ? 'Belum ada dompet saya.' : 'Belum ada dompet pasangan.'}
                </p>
            </div>
        {:else}
            {#each currentAccounts as acc}
                <div class="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between transition-transform hover:scale-[1.02]">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full flex items-center justify-center {activeTab === 'saya' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">{acc.type}</p>
                            <h3 class="font-bold text-gray-900 dark:text-gray-100">{acc.name}</h3>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-lg {activeTab === 'saya' ? 'text-primary dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}">{formatRupiah(acc.balance)}</p>
                    </div>
                </div>
            {/each}
        {/if}
    </div>

    {#if auth.session?.role === 'suami'}
    <div class="pt-6">
        <a href="/dashboard/pengaturan/dompet" class="block w-full text-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            Kelola Data Dompet
        </a>
    </div>
    {/if}
</div>
