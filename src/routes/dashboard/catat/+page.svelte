<script lang="ts">
    import { onMount } from 'svelte';
    import { auth } from '$lib/stores/auth.svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    let activeTab = $state('expense'); // expense, income, transfer
    let categories = $state<any[]>([]);
    
    // For balance calculation
    let transactions = $state<any[]>([]);
    let totalBalance = $state(0);
    
    let amountStr = $state('');
    let amount = $derived(amountStr ? parseFloat(amountStr.replace(/[^0-9]/g, '')) : 0);
    
    let category_id = $state('');
    const now = new Date();
    let date = $state(now.toISOString().split('T')[0]);
    let time = $state(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    let notes = $state('');
    let isSubmitting = $state(false);

    let accounts = $state<any[]>([]);
    let account_id = $state('');
    let to_account_id = $state('');

    let accessibleAccounts = $derived(
        accounts.filter(a => a.role_access === 'all' || a.role_access === auth.session?.role)
    );
    let destinationAccounts = $derived(
        accounts.filter(a => a.id !== account_id)
    );

    onMount(async () => {
        // Set tab from URL param if available
        const typeParam = $page.url.searchParams.get('type');
        if (typeParam && ['expense', 'income', 'transfer'].includes(typeParam)) {
            activeTab = typeParam;
        }
        
        // Fetch categories
        const resCat = await fetch('/api/categories');
        const dataCat = await resCat.json();
        if (dataCat.categories) {
            categories = dataCat.categories;
        }

        // Fetch transactions for balance
        if (auth.session) {
            const resTx = await fetch(`/api/transactions?userId=${auth.session.id}&role=${auth.session.role}`);
            const dataTx = await resTx.json();
            if (dataTx) {
                totalBalance = dataTx.totalBalance || 0;
            }

            // Fetch accounts
            const resAcc = await fetch(`/api/accounts?role=${auth.session.role}`);
            const dataAcc = await resAcc.json();
            if (dataAcc.accounts) {
                accounts = dataAcc.accounts;
                const myAccs = accounts.filter(a => a.role_access === auth.session?.role || a.role_access === 'all');
                if (myAccs.length > 0) {
                    account_id = myAccs[0].id;
                }
            }
        }
    });

    let filteredCategories = $derived(
        categories.filter(c => c.type === activeTab && (c.role_access === 'all' || c.role_access === auth.session?.role))
    );

    function formatRupiah(amount: number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    function handleAmountInput(e: Event) {
        const target = e.target as HTMLInputElement;
        const rawValue = target.value.replace(/[^0-9]/g, '');
        if (rawValue) {
            amountStr = new Intl.NumberFormat('id-ID').format(parseInt(rawValue, 10));
        } else {
            amountStr = '';
        }
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (!auth.session) return;
        
        isSubmitting = true;
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: auth.session.id,
                    role: auth.session.role,
                    amount,
                    type: activeTab,
                    category_id,
                    account_id,
                    to_account_id: activeTab === 'transfer' ? to_account_id : undefined,
                    notes,
                    date,
                    time
                })
            });
            
            if (res.ok) {
                goto('/dashboard');
            } else {
                const err = await res.json();
                alert(err.error || 'Gagal menyimpan transaksi');
            }
        } catch (error) {
            console.error(error);
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="space-y-6">
    <!-- Wallet Balance Card -->
    <div class="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        
        <div class="relative z-10 flex justify-between items-center">
            <div>
                <p class="text-white/80 text-sm font-medium mb-1">Saldo Dompet Saat Ini</p>
                <h2 class="text-3xl font-bold tracking-tight">{formatRupiah(totalBalance)}</h2>
            </div>
            <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            </div>
        </div>
    </div>

    <!-- Form Section -->
    <div class="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 class="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Catat Transaksi</h2>
    
    <!-- Tabs -->
    <div class="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
        <button 
            onclick={() => { activeTab = 'expense'; category_id = ''; }}
            class="flex-1 py-2 text-sm font-medium rounded-lg transition {activeTab === 'expense' ? 'bg-white dark:bg-surface-dark shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}">
            Keluar
        </button>
        <button 
            onclick={() => { activeTab = 'income'; category_id = ''; }}
            class="flex-1 py-2 text-sm font-medium rounded-lg transition {activeTab === 'income' ? 'bg-white dark:bg-surface-dark shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}">
            Masuk
        </button>
        <button 
            onclick={() => { activeTab = 'transfer'; category_id = ''; }}
            class="flex-1 py-2 text-sm font-medium rounded-lg transition {activeTab === 'transfer' ? 'bg-white dark:bg-surface-dark shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}">
            Transfer
        </button>
    </div>

    <!-- Form -->
    <form onsubmit={handleSubmit} class="space-y-4">
        <!-- Form Fields -->
        <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal</label>
                    <input 
                        type="date" 
                        bind:value={date} 
                        required
                        class="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-primary focus:border-primary outline-none dark:text-white transition"
                    >
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jam (WIB)</label>
                    <input 
                        type="time" 
                        bind:value={time} 
                        required
                        class="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-primary focus:border-primary outline-none dark:text-white transition"
                    >
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah (Rp)</label>
            <div class="relative">
                <span class="absolute left-4 top-3 font-bold text-gray-400">Rp</span>
                <input 
                    type="text" 
                    inputmode="numeric"
                    value={amountStr} 
                    oninput={handleAmountInput}
                    required
                    placeholder="0"
                    class="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-primary focus:border-primary outline-none font-bold text-lg dark:text-white transition"
                >
            </div>
        </div>

        <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {activeTab === 'income' ? 'Masuk ke Dompet' : 'Sumber Dompet'}
            </label>
            <select bind:value={account_id} required class="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-gray-900 dark:text-white appearance-none">
                {#if !account_id}<option value="" disabled>Pilih Dompet...</option>{/if}
                {#each accessibleAccounts as acc}
                    <option value={acc.id}>{acc.name} ({acc.type})</option>
                {/each}
            </select>
        </div>

        {#if activeTab === 'transfer'}
        <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tujuan Dompet</label>
            <select bind:value={to_account_id} required class="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-gray-900 dark:text-white appearance-none">
                <option value="" disabled>Pilih Tujuan Transfer...</option>
                {#each destinationAccounts as acc}
                    <option value={acc.id}>{acc.name} ({acc.type})</option>
                {/each}
            </select>
        </div>
        {/if}

        <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kategori</label>
            <select bind:value={category_id} required class="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-gray-900 dark:text-white appearance-none">
                <option value="" disabled>Pilih Kategori...</option>
                {#each filteredCategories as cat}
                    <option value={cat.id}>{cat.name}</option>
                {/each}
            </select>
        </div>

        <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Catatan Tambahan</label>
            <textarea 
                bind:value={notes}
                rows="3" 
                placeholder="Opsional"
                class="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-gray-900 dark:text-white resize-none"
            ></textarea>
        </div>

        <button 
            type="submit" 
            disabled={isSubmitting || !amount || !category_id || !account_id || (activeTab === 'transfer' && !to_account_id)}
            class="w-full py-4 mt-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100">
            {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
        </button>
    </form>
    </div>
</div>
