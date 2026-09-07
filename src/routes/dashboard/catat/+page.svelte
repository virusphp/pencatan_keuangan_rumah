<script lang="ts">
    import { onMount } from 'svelte';
    import { auth } from '$lib/stores/auth.svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    let activeTab = $state('expense'); // expense, income, transfer
    let categories = $state<any[]>([]);
    
    let amount = $state('');
    let category_id = $state('');
    let notes = $state('');
    let isSubmitting = $state(false);

    onMount(async () => {
        // Set tab from URL param if available
        const typeParam = $page.url.searchParams.get('type');
        if (typeParam && ['expense', 'income', 'transfer'].includes(typeParam)) {
            activeTab = typeParam;
        }
        
        // Fetch categories
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.categories) {
            categories = data.categories;
        }
    });

    let filteredCategories = $derived(
        categories.filter(c => c.type === activeTab && (c.role_access === 'all' || c.role_access === auth.session?.role))
    );

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (!auth.session) return;
        
        isSubmitting = true;
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    type: activeTab,
                    category_id,
                    notes,
                    user_id: auth.session.id,
                    role: auth.session.role
                })
            });
            
            if (res.ok) {
                goto('/dashboard');
            } else {
                alert('Gagal menyimpan transaksi');
            }
        } catch (error) {
            console.error(error);
        } finally {
            isSubmitting = false;
        }
    }
</script>

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
        <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nominal (Rp)</label>
            <div class="relative">
                <span class="absolute left-4 top-3 font-bold text-gray-400">Rp</span>
                <input 
                    type="number" 
                    bind:value={amount} 
                    required
                    min="1"
                    placeholder="0"
                    class="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none font-bold text-lg dark:text-white"
                >
            </div>
        </div>

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
            disabled={isSubmitting || !amount || !category_id}
            class="w-full py-4 mt-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100">
            {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
        </button>
    </form>
</div>
