<script lang="ts">
    import { onMount } from 'svelte';
    import { auth } from '$lib/stores/auth.svelte';

    let transactions = $state<any[]>([]);
    let isTransparent = $state(false);
    let isLoading = $state(true);

    onMount(async () => {
        await fetchTransactions();
    });

    async function fetchTransactions() {
        if (!auth.session) return;
        
        try {
            isLoading = true;
            const res = await fetch(`/api/transactions?userId=${auth.session.id}&role=${auth.session.role}`);
            const data = await res.json();
            
            if (data.transactions) {
                transactions = data.transactions;
                isTransparent = data.isTransparent;
            }
        } catch (error) {
            console.error(error);
        } finally {
            isLoading = false;
        }
    }

    let totalBalance = $derived(
        transactions.reduce((sum, tx) => {
            // Karena kita simpan expense sebagai negatif dan income positif, tinggal di-sum
            return sum + parseFloat(tx.amount);
        }, 0)
    );

    function formatRupiah(amount: number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }
</script>

<div class="space-y-6">
    <!-- Balance Card -->
    <div class="bg-gradient-to-br from-primary to-blue-400 dark:from-primary-dark dark:to-blue-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <!-- Decoration -->
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        
        <div class="relative z-10">
            <div class="flex justify-between items-start mb-2">
                <p class="text-blue-100 dark:text-blue-200 text-sm font-medium">Total Saldo Saat Ini</p>
                {#if auth.session?.role === 'istri' && !isTransparent}
                    <span class="bg-white/20 px-2 py-1 rounded text-[10px] backdrop-blur-sm">Mode Privat</span>
                {/if}
            </div>
            
            {#if isLoading}
                <div class="h-10 bg-white/20 animate-pulse rounded w-1/2 my-2"></div>
            {:else}
                <h2 class="text-4xl font-bold tracking-tight mb-6">{formatRupiah(totalBalance)}</h2>
            {/if}
            
            <!-- Quick Actions -->
            <div class="flex gap-3">
                <a href="/dashboard/catat?type=income" class="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md transition py-2 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    Pemasukan
                </a>
                <a href="/dashboard/catat?type=expense" class="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md transition py-2 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                    Pengeluaran
                </a>
            </div>
        </div>
    </div>

    <!-- Recent Transactions -->
    <div>
        <div class="flex justify-between items-end mb-4">
            <h3 class="font-bold text-gray-800 dark:text-gray-200">Riwayat Terakhir</h3>
            <button class="text-sm text-primary dark:text-blue-400 font-medium hover:underline">Lihat Semua</button>
        </div>

        {#if isLoading}
            <div class="space-y-3">
                {#each Array(3) as _}
                    <div class="h-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl"></div>
                {/each}
            </div>
        {:else if transactions.length === 0}
            <div class="text-center py-10 bg-white dark:bg-surface-dark rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                <p class="text-gray-500 dark:text-gray-400">Belum ada transaksi bulan ini.</p>
                <a href="/dashboard/catat" class="text-primary mt-2 inline-block font-medium">Catat sekarang!</a>
            </div>
        {:else}
            <div class="space-y-3">
                {#each transactions as tx}
                    <div class="bg-white dark:bg-surface-dark p-4 rounded-2xl flex justify-between items-center shadow-sm border border-gray-100 dark:border-gray-800">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center 
                                {tx.amount > 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}">
                                {#if tx.type === 'transfer'}
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                {:else if tx.amount > 0}
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                {:else}
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                                    </svg>
                                {/if}
                            </div>
                            <div>
                                <h4 class="font-bold text-sm text-gray-900 dark:text-gray-100">{tx.category?.name || tx.notes}</h4>
                                <p class="text-[11px] text-gray-500">{new Date(tx.created_at).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })} • Oleh: {tx.user?.name}</p>
                            </div>
                        </div>
                        <div class="font-bold text-sm {tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}">
                            {tx.amount > 0 ? '+' : ''}{formatRupiah(tx.amount)}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
