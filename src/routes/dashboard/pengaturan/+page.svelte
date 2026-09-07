<script lang="ts">
    import { onMount } from 'svelte';
    import { auth } from '$lib/stores/auth.svelte';

    let isTransparent = $state(false);
    let categories = $state<any[]>([]);
    
    // Form fields for new category
    let newCatName = $state('');
    let newCatType = $state('expense'); // expense, income, transfer
    let newCatRole = $state('all'); // all, suami, istri

    let isSaving = $state(false);
    let errorMsg = $state('');

    onMount(async () => {
        // Fetch suami transparent mode status
        try {
            const txRes = await fetch(`/api/transactions?userId=${auth.session?.id}&role=${auth.session?.role}`);
            const txData = await txRes.json();
            isTransparent = txData.isTransparent || false;

            await loadCategories();
        } catch (e) {
            console.error(e);
        }
    });

    async function loadCategories() {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.categories) {
            categories = data.categories;
        }
    }

    async function toggleTransparentMode() {
        isSaving = true;
        try {
            await fetch('/api/users/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: auth.session?.id,
                    is_transparent_mode: isTransparent
                })
            });
        } catch (e) {
            console.error(e);
            errorMsg = "Gagal menyimpan pengaturan transparansi.";
        } finally {
            isSaving = false;
        }
    }

    async function addCategory(e: Event) {
        e.preventDefault();
        isSaving = true;
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCatName,
                    type: newCatType,
                    role_access: newCatRole
                })
            });
            if (res.ok) {
                newCatName = '';
                await loadCategories();
            } else {
                errorMsg = "Gagal menambahkan kategori.";
            }
        } catch (e) {
            console.error(e);
        } finally {
            isSaving = false;
        }
    }

    async function deleteCategory(id: number) {
        if (!confirm('Hapus kategori ini?')) return;
        try {
            const res = await fetch('/api/categories', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                await loadCategories();
            }
        } catch (e) {
            console.error(e);
        }
    }
</script>

<div class="space-y-6">
    <div class="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Pengaturan Akses</h2>
        
        {#if errorMsg}
            <div class="bg-red-100 text-red-700 p-3 rounded-xl text-sm mb-4">{errorMsg}</div>
        {/if}

        <label class="flex items-center justify-between p-4 bg-gray-50 dark:bg-background-dark rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <div>
                <span class="block font-bold text-gray-900 dark:text-gray-100">Mode Transparan</span>
                <span class="text-xs text-gray-500">Istri dapat melihat seluruh transaksi suami jika aktif.</span>
            </div>
            <div class="relative">
                <input type="checkbox" bind:checked={isTransparent} onchange={toggleTransparentMode} class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </div>
        </label>
    </div>

    <div class="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Manajemen Kategori</h2>
        
        <form onsubmit={addCategory} class="mb-6 p-4 bg-gray-50 dark:bg-background-dark rounded-xl space-y-3">
            <h3 class="font-bold text-sm text-gray-700 dark:text-gray-300">Tambah Baru</h3>
            <div>
                <input type="text" bind:value={newCatName} required placeholder="Nama Kategori (mis: Gaji, Makan)" class="w-full px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-primary focus:border-primary outline-none text-sm dark:text-white">
            </div>
            <div class="flex gap-2">
                <select bind:value={newCatType} class="w-1/2 px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none dark:text-white">
                    <option value="expense">Pengeluaran</option>
                    <option value="income">Pemasukan</option>
                    <option value="transfer">Transfer</option>
                </select>
                <select bind:value={newCatRole} class="w-1/2 px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none dark:text-white">
                    <option value="all">Semua Role</option>
                    <option value="suami">Khusus Suami</option>
                    <option value="istri">Khusus Istri</option>
                </select>
            </div>
            <button type="submit" disabled={isSaving || !newCatName} class="w-full py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
                + Tambah Kategori
            </button>
        </form>

        <div class="space-y-2">
            {#each categories as cat}
                <div class="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-background-dark/50">
                    <div>
                        <p class="font-bold text-sm text-gray-800 dark:text-gray-200">{cat.name}</p>
                        <p class="text-[10px] text-gray-500 uppercase">{cat.type} • Akses: {cat.role_access}</p>
                    </div>
                    <button onclick={() => deleteCategory(cat.id)} class="text-red-500 hover:text-red-700 p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            {/each}
        </div>
    </div>
</div>
