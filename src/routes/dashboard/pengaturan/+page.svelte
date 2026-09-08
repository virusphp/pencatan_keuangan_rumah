<script lang="ts">
    import { onMount } from 'svelte';
    import { auth } from '$lib/stores/auth.svelte';
    import { goto } from '$app/navigation';

    let isTransparent = $state(false);
    let categories = $state<any[]>([]);
    
    // Form fields for new category
    let newCatName = $state('');
    let newCatType = $state('expense'); // expense, income, transfer
    let newCatRole = $state('all'); // all, suami, istri

    // State for editing category
    let editingCatId = $state<number | null>(null);
    let editCatName = $state('');
    let editCatType = $state('');
    let editCatRole = $state('');

    let isSaving = $state(false);
    let errorMsg = $state('');
    let successMsg = $state('');

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
        errorMsg = '';
        successMsg = '';
        try {
            await fetch('/api/users/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: auth.session?.id,
                    is_transparent_mode: isTransparent
                })
            });
            successMsg = "Pengaturan mode transparan disimpan.";
        } catch (e) {
            console.error(e);
            errorMsg = "Gagal menyimpan pengaturan transparansi.";
        } finally {
            isSaving = false;
        }
    }

    const themeColors = [
        { name: 'Biru (Default)', value: '#3B82F6' },
        { name: 'Hijau', value: '#10B981' },
        { name: 'Merah', value: '#EF4444' },
        { name: 'Ungu', value: '#8B5CF6' },
        { name: 'Pink', value: '#EC4899' },
        { name: 'Oranye', value: '#F97316' }
    ];

    async function changeTheme(color: string) {
        if (!auth.session) return;
        auth.update({ theme_color: color });
        isSaving = true;
        try {
            await fetch('/api/users/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: auth.session.id,
                    theme_color: color
                })
            });
            successMsg = "Tema berhasil diubah.";
        } catch (e) {
            console.error(e);
            errorMsg = "Gagal menyimpan tema.";
        } finally {
            isSaving = false;
        }
    }

    async function addCategory(e: Event) {
        e.preventDefault();
        isSaving = true;
        errorMsg = '';
        successMsg = '';
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
                successMsg = "Kategori berhasil ditambahkan.";
            } else {
                const errData = await res.json();
                errorMsg = errData.error || "Gagal menambahkan kategori.";
            }
        } catch (e) {
            console.error(e);
            errorMsg = "Terjadi kesalahan koneksi saat menambah kategori.";
        } finally {
            isSaving = false;
        }
    }

    function startEditCategory(cat: any) {
        editingCatId = cat.id;
        editCatName = cat.name;
        editCatType = cat.type;
        editCatRole = cat.role_access;
        errorMsg = '';
        successMsg = '';
    }

    function cancelEdit() {
        editingCatId = null;
        errorMsg = '';
    }

    async function updateCategory(e: Event, id: number) {
        e.preventDefault();
        isSaving = true;
        errorMsg = '';
        successMsg = '';
        
        try {
            const res = await fetch('/api/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    name: editCatName,
                    type: editCatType,
                    role_access: editCatRole
                })
            });
            
            if (res.ok) {
                editingCatId = null;
                await loadCategories();
                successMsg = "Kategori berhasil diperbarui.";
            } else {
                const errData = await res.json();
                errorMsg = errData.error || "Gagal memperbarui kategori.";
            }
        } catch (e) {
            console.error(e);
            errorMsg = "Terjadi kesalahan saat memperbarui kategori.";
        } finally {
            isSaving = false;
        }
    }

    async function deleteCategory(id: number) {
        if (!confirm('Hapus kategori ini?')) return;
        errorMsg = '';
        successMsg = '';
        
        try {
            const res = await fetch('/api/categories', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            
            if (res.ok) {
                await loadCategories();
                successMsg = "Kategori berhasil dihapus.";
            } else {
                const data = await res.json();
                errorMsg = data.error || "Gagal menghapus kategori.";
            }
        } catch (e) {
            console.error(e);
            errorMsg = "Terjadi kesalahan saat mencoba menghapus kategori.";
        }
    }
</script>

<div class="space-y-6">
    <!-- Personalisasi Tema -->
    <div class="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Personalisasi Tema</h2>
        <p class="text-sm text-gray-500 mb-4">Pilih warna utama untuk aplikasi Anda.</p>
        <div class="flex flex-wrap gap-3">
            {#each themeColors as theme}
                <button 
                    onclick={() => changeTheme(theme.value)}
                    aria-label="Pilih tema warna {theme.name}"
                    class="w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center
                    {auth.session?.theme_color === theme.value || (!auth.session?.theme_color && theme.value === '#3B82F6') ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}"
                    style="background-color: {theme.value};"
                    title={theme.name}>
                    {#if auth.session?.theme_color === theme.value || (!auth.session?.theme_color && theme.value === '#3B82F6')}
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white drop-shadow-md" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                    {/if}
                </button>
            {/each}
        </div>
    </div>

    <div class="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Pengaturan Akses</h2>
        
        {#if errorMsg}
            <div class="bg-red-100 text-red-700 p-3 rounded-xl text-sm mb-4 border border-red-200">{errorMsg}</div>
        {/if}
        {#if successMsg}
            <div class="bg-green-100 text-green-700 p-3 rounded-xl text-sm mb-4 border border-green-200">{successMsg}</div>
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
        
        <!-- Add New Category Form -->
        {#if editingCatId === null}
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
        {/if}

        <div class="space-y-2">
            {#each categories as cat}
                {#if editingCatId === cat.id}
                    <!-- Edit Category Form -->
                    <form onsubmit={(e) => updateCategory(e, cat.id)} class="p-4 border border-primary/50 dark:border-blue-500/50 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 space-y-3">
                        <div class="flex justify-between items-center mb-1">
                            <h3 class="font-bold text-sm text-primary dark:text-blue-400">Edit Kategori</h3>
                            <button type="button" onclick={cancelEdit} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div>
                            <input type="text" bind:value={editCatName} required placeholder="Nama Kategori" class="w-full px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-primary focus:border-primary outline-none text-sm dark:text-white">
                        </div>
                        <div class="flex gap-2">
                            <select bind:value={editCatType} class="w-1/2 px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none dark:text-white">
                                <option value="expense">Pengeluaran</option>
                                <option value="income">Pemasukan</option>
                                <option value="transfer">Transfer</option>
                            </select>
                            <select bind:value={editCatRole} class="w-1/2 px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none dark:text-white">
                                <option value="all">Semua Role</option>
                                <option value="suami">Khusus Suami</option>
                                <option value="istri">Khusus Istri</option>
                            </select>
                        </div>
                        <div class="flex gap-2">
                            <button type="button" onclick={cancelEdit} class="w-1/2 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                                Batal
                            </button>
                            <button type="submit" disabled={isSaving || !editCatName} class="w-1/2 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
                                Simpan
                            </button>
                        </div>
                    </form>
                {:else}
                    <!-- Normal View -->
                    <div class="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-background-dark/50 hover:border-gray-200 dark:hover:border-gray-700 transition">
                        <div>
                            <p class="font-bold text-sm text-gray-800 dark:text-gray-200">{cat.name}</p>
                            <p class="text-[10px] text-gray-500 uppercase">{cat.type} • Akses: {cat.role_access}</p>
                        </div>
                        <div class="flex gap-1">
                            <button onclick={() => startEditCategory(cat)} class="text-blue-500 hover:text-blue-700 p-2" aria-label="Edit Kategori">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <button onclick={() => deleteCategory(cat.id)} class="text-red-500 hover:text-red-700 p-2" aria-label="Hapus Kategori">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
    </div>

    <!-- Keluar / Logout -->
    <div class="pt-4 pb-8">
        <button 
            onclick={() => { auth.logout(); goto('/'); }}
            class="w-full flex items-center justify-center gap-2 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-2xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar dari Akun
        </button>
    </div>
</div>
