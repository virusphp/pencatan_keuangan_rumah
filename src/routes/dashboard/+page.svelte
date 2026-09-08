<script lang="ts">
    import { onMount } from 'svelte';
    import { auth } from '$lib/stores/auth.svelte';

    let my_transactions = $state<any[]>([]);
    let spouse_transactions = $state<any[]>([]);
    
    let totalBalance = $state(0);
    let spouseBalance = $state(0);
    let accountBalances = $state<any[]>([]);
    
    let isTransparent = $state(false);
    let isLoading = $state(true);

    const now = new Date();
    let selectedMonth = $state(now.getMonth() + 1);
    let selectedYear = $state(now.getFullYear());

    onMount(async () => {
        await fetchTransactions();
    });

    async function fetchTransactions() {
        if (!auth.session) return;
        
        try {
            isLoading = true;
            const res = await fetch(`/api/transactions?userId=${auth.session.id}&role=${auth.session.role}&month=${selectedMonth}&year=${selectedYear}`);
            const data = await res.json();
            
            if (data) {
                my_transactions = data.my_transactions || [];
                spouse_transactions = data.spouse_transactions || [];
                totalBalance = data.totalBalance || 0;
                spouseBalance = data.spouseBalance || 0;
                accountBalances = data.accountBalances || [];
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

    async function deleteTransaction(id: string) {
        if (!confirm('Hapus transaksi ini? Jika ini transfer, pasangan dari transfer ini juga akan ikut terhapus.')) return;
        try {
            const res = await fetch('/api/transactions', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                await fetchTransactions();
            } else {
                const err = await res.json();
                alert(err.error || 'Gagal menghapus transaksi');
            }
        } catch (e) {
            console.error(e);
        }
    }
</script>

<div class="space-y-6">
    <!-- Header with Month Picker -->
    <div class="flex justify-between items-center bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p class="text-xs text-gray-500">Halo, {auth.session?.name}!</p>
        </div>
        <div class="flex gap-2">
            <select bind:value={selectedMonth} onchange={fetchTransactions} class="bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-pointer">
                <option value={1}>Januari</option>
                <option value={2}>Februari</option>
                <option value={3}>Maret</option>
                <option value={4}>April</option>
                <option value={5}>Mei</option>
                <option value={6}>Juni</option>
                <option value={7}>Juli</option>
                <option value={8}>Agustus</option>
                <option value={9}>September</option>
                <option value={10}>Oktober</option>
                <option value={11}>November</option>
                <option value={12}>Desember</option>
            </select>
            <select bind:value={selectedYear} onchange={fetchTransactions} class="bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-pointer">
                <option value={now.getFullYear() - 1}>{now.getFullYear() - 1}</option>
                <option value={now.getFullYear()}>{now.getFullYear()}</option>
                <option value={now.getFullYear() + 1}>{now.getFullYear() + 1}</option>
            </select>
        </div>
    </div>

    <!-- Balance Card -->
    <div class="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <!-- Decoration -->
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        
        <div class="relative z-10">
            <div class="flex justify-between items-start mb-2">
                <p class="text-white/80 text-sm font-medium">Total Saldo (Sepanjang Waktu)</p>
                {#if auth.session?.role === 'istri' && !isTransparent}
                    <span class="bg-white/20 px-2 py-1 rounded text-[10px] backdrop-blur-sm">Mode Privat</span>
                {/if}
            </div>
            
            {#if isLoading}
                <div class="h-10 bg-white/20 animate-pulse rounded w-1/2 my-2"></div>
            {:else}
                <h2 class="text-4xl font-bold tracking-tight mb-4">{formatRupiah(totalBalance)}</h2>
                
                <!-- Accounts List -->
                <div class="mb-6 space-y-2">
                    {#each accountBalances as acc}
                        {#if acc.role_access === auth.session?.role || acc.role_access === 'all'}
                        <div class="flex justify-between items-center bg-white/10 p-2 px-3 rounded-xl backdrop-blur-sm border border-white/5">
                            <div>
                                <p class="text-[10px] text-white/70 uppercase tracking-wider">{acc.type}</p>
                                <p class="font-bold text-sm">{acc.name}</p>
                            </div>
                            <p class="font-bold text-sm">{formatRupiah(acc.balance)}</p>
                        </div>
                        {/if}
                    {/each}
                </div>
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
            <h3 class="font-bold text-gray-800 dark:text-gray-200">Riwayat Bulan Ini</h3>
            <a href="/dashboard/analisis" class="text-sm text-primary dark:text-primary-dark font-medium hover:underline">Analisis</a>
        </div>

        {#if isLoading}
            <div class="space-y-3">
                {#each Array(3) as _}
                    <div class="h-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl"></div>
                {/each}
            </div>
        {:else if my_transactions.length === 0}
            <div class="text-center py-10 bg-white dark:bg-surface-dark rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                <p class="text-gray-500 dark:text-gray-400">Belum ada transaksi bulan ini.</p>
                <a href="/dashboard/catat" class="text-primary mt-2 inline-block font-medium">Catat sekarang!</a>
            </div>
        {:else}
            <div class="space-y-3">
                {#each my_transactions as tx}
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
                                <p class="text-[11px] text-gray-500">{new Date(tx.created_at).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} • {tx.account?.name}</p>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <span class="font-bold text-sm {tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}">
                                {tx.amount > 0 ? '+' : ''}{formatRupiah(tx.amount)}
                            </span>
                            <button onclick={() => deleteTransaction(tx.id)} class="text-[10px] text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md transition">
                                Hapus
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Spouse Transparent Mode Section -->
    {#if auth.session?.role === 'suami' || (auth.session?.role === 'istri' && isTransparent)}
        <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
            <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Mengintip Dompet Pasangan
            </h3>
            
            <div class="bg-gray-100 dark:bg-gray-800 rounded-3xl p-5 mb-4 shadow-inner border border-gray-200 dark:border-gray-700">
                <p class="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Saldo Pasangan (Sepanjang Waktu)</p>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatRupiah(spouseBalance)}</h2>
            </div>
            
            <div class="space-y-3 opacity-80">
                {#if spouse_transactions.length === 0}
                    <p class="text-center text-xs text-gray-500 py-4">Tidak ada transaksi bulan ini.</p>
                {/if}
                {#each spouse_transactions as tx}
                    <div class="bg-white/50 dark:bg-surface-dark/50 p-3 rounded-xl flex justify-between items-center border border-gray-200 dark:border-gray-700">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center 
                                {tx.amount > 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}">
                                {#if tx.type === 'transfer'}
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                {:else if tx.amount > 0}
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                {:else}
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                                    </svg>
                                {/if}
                            </div>
                            <div>
                                <h4 class="font-bold text-xs text-gray-900 dark:text-gray-100">{tx.category?.name || tx.notes}</h4>
                                <p class="text-[10px] text-gray-500">{new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {tx.account?.name}</p>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <span class="font-bold text-xs {tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}">
                                {tx.amount > 0 ? '+' : ''}{formatRupiah(tx.amount)}
                            </span>
                            <button onclick={() => deleteTransaction(tx.id)} class="text-[9px] text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md transition">
                                Hapus
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
