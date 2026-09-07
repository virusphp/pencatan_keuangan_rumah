<script lang="ts">
    import { onMount } from 'svelte';
    import { auth } from '$lib/stores/auth.svelte';

    let transactions = $state<any[]>([]);
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
            
            if (data.my_transactions) {
                transactions = data.my_transactions;
            }
        } catch (error) {
            console.error(error);
        } finally {
            isLoading = false;
        }
    }

    let totalIncome = $derived(
        transactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
    );
    let totalExpense = $derived(
        Math.abs(transactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + parseFloat(tx.amount), 0))
    );

    let expenseByCategory = $derived.by(() => {
        const expenses = transactions.filter(tx => tx.amount < 0);
        const map = new Map<string, number>();
        for (const tx of expenses) {
            const cat = tx.category?.name || 'Lainnya';
            map.set(cat, (map.get(cat) || 0) + Math.abs(parseFloat(tx.amount)));
        }
        return Array.from(map.entries())
            .map(([name, amount]) => ({ name, amount, percent: totalExpense > 0 ? (amount / totalExpense) * 100 : 0 }))
            .sort((a, b) => b.amount - a.amount);
    });

    function formatRupiah(amount: number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }
</script>

<div class="space-y-6">
    <div class="flex items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <a href="/dashboard" class="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
        </a>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white flex-1">Analisis Bulanan</h1>
    </div>

    <!-- Month Picker -->
    <div class="flex gap-2 bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <select bind:value={selectedMonth} onchange={fetchTransactions} class="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-3 text-sm font-bold outline-none cursor-pointer text-gray-900 dark:text-white">
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
        <select bind:value={selectedYear} onchange={fetchTransactions} class="w-1/3 bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-3 text-sm font-bold outline-none cursor-pointer text-gray-900 dark:text-white">
            <option value={now.getFullYear() - 1}>{now.getFullYear() - 1}</option>
            <option value={now.getFullYear()}>{now.getFullYear()}</option>
            <option value={now.getFullYear() + 1}>{now.getFullYear() + 1}</option>
        </select>
    </div>

    {#if isLoading}
        <div class="h-40 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-3xl"></div>
    {:else}
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 gap-4">
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-4 rounded-2xl text-center">
                <p class="text-green-600 dark:text-green-400 text-xs font-bold mb-1 uppercase tracking-wider">Pemasukan</p>
                <p class="text-lg font-black text-green-700 dark:text-green-300">{formatRupiah(totalIncome)}</p>
            </div>
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-2xl text-center">
                <p class="text-red-600 dark:text-red-400 text-xs font-bold mb-1 uppercase tracking-wider">Pengeluaran</p>
                <p class="text-lg font-black text-red-700 dark:text-red-300">{formatRupiah(totalExpense)}</p>
            </div>
        </div>

        <div class="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 class="text-lg font-bold mb-6 text-gray-900 dark:text-white">Rincian Pengeluaran</h2>
            
            {#if totalExpense === 0}
                <div class="text-center py-8 text-gray-500">Belum ada pengeluaran di bulan ini.</div>
            {:else}
                <div class="space-y-5">
                    {#each expenseByCategory as cat}
                        <div>
                            <div class="flex justify-between items-end mb-2">
                                <span class="font-bold text-sm text-gray-800 dark:text-gray-200">{cat.name}</span>
                                <span class="text-xs font-medium text-gray-500">{formatRupiah(cat.amount)} ({Math.round(cat.percent)}%)</span>
                            </div>
                            <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                                <div class="bg-primary h-3 rounded-full transition-all duration-1000" style="width: {cat.percent}%;"></div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>
