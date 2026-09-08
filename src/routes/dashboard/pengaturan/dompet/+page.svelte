<script lang="ts">
    import { onMount } from 'svelte';
    import { auth } from '$lib/stores/auth.svelte';

    let accounts = $state<any[]>([]);
    let newAccName = $state('');
    let newAccType = $state('bank'); // bank, cash, ewallet, investment
    let newAccRole = $state('all'); // all, suami, istri

    let editingAccId = $state<string | null>(null);
    let editAccName = $state('');
    let editAccType = $state('');
    let editAccRole = $state('');

    let isSaving = $state(false);
    let errorMsg = $state('');
    let successMsg = $state('');

    onMount(async () => {
        await loadAccounts();
    });

    async function loadAccounts() {
        const res = await fetch(`/api/accounts?role=${auth.session?.role}`);
        const data = await res.json();
        if (data.accounts) {
            accounts = data.accounts;
        }
    }

    async function addAccount(e: Event) {
        e.preventDefault();
        isSaving = true;
        errorMsg = '';
        successMsg = '';
        try {
            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newAccName,
                    type: newAccType,
                    role_access: newAccRole,
                    created_by: auth.session?.id
                })
            });
            if (res.ok) {
                newAccName = '';
                await loadAccounts();
                successMsg = "Dompet berhasil ditambahkan.";
            } else {
                const errData = await res.json();
                errorMsg = errData.error || "Gagal menambahkan dompet.";
            }
        } catch (e) {
            errorMsg = "Terjadi kesalahan koneksi saat menambah dompet.";
        } finally {
            isSaving = false;
        }
    }

    function startEditAccount(acc: any) {
        editingAccId = acc.id;
        editAccName = acc.name;
        editAccType = acc.type;
        editAccRole = acc.role_access;
        errorMsg = '';
        successMsg = '';
    }

    function cancelEditAccount() {
        editingAccId = null;
        errorMsg = '';
    }

    async function updateAccount(e: Event, id: string) {
        e.preventDefault();
        isSaving = true;
        errorMsg = '';
        successMsg = '';
        
        try {
            const res = await fetch('/api/accounts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    name: editAccName,
                    type: editAccType,
                    role_access: editAccRole
                })
            });
            
            if (res.ok) {
                editingAccId = null;
                await loadAccounts();
                successMsg = "Dompet berhasil diperbarui.";
            } else {
                const errData = await res.json();
                errorMsg = errData.error || "Gagal memperbarui dompet.";
            }
        } catch (e) {
            errorMsg = "Terjadi kesalahan saat memperbarui dompet.";
        } finally {
            isSaving = false;
        }
    }

    async function deleteAccount(id: string) {
        if (!confirm('Hapus dompet ini? Semua transaksi di dalamnya juga akan terhapus!')) return;
        errorMsg = '';
        successMsg = '';
        
        try {
            const res = await fetch('/api/accounts', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            
            if (res.ok) {
                await loadAccounts();
                successMsg = "Dompet berhasil dihapus.";
            } else {
                const data = await res.json();
                errorMsg = data.error || "Gagal menghapus dompet.";
            }
        } catch (e) {
            errorMsg = "Terjadi kesalahan saat mencoba menghapus dompet.";
        }
    }
</script>

<div class="space-y-6">
    <div class="flex items-center gap-3 bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <a href="/dashboard/pengaturan" class="p-2 bg-gray-50 dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
        </a>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Manajemen Dompet</h1>
    </div>

    <div class="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        
        {#if errorMsg}
            <div class="bg-red-100 text-red-700 p-3 rounded-xl text-sm mb-4 border border-red-200">{errorMsg}</div>
        {/if}
        {#if successMsg}
            <div class="bg-green-100 text-green-700 p-3 rounded-xl text-sm mb-4 border border-green-200">{successMsg}</div>
        {/if}

        {#if editingAccId === null}
        <form onsubmit={addAccount} class="mb-6 p-4 bg-gray-50 dark:bg-background-dark rounded-xl space-y-3">
            <h3 class="font-bold text-sm text-gray-700 dark:text-gray-300">Tambah Dompet Baru</h3>
            <div>
                <input type="text" bind:value={newAccName} required placeholder="Nama Dompet (mis: BCA, DPLK, Tunai)" class="w-full px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-primary focus:border-primary outline-none text-sm dark:text-white">
            </div>
            <div class="flex gap-2">
                <select bind:value={newAccType} class="w-1/2 px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none dark:text-white">
                    <option value="bank">Bank</option>
                    <option value="cash">Tunai</option>
                    <option value="ewallet">e-Wallet</option>
                    <option value="investment">Investasi / DPLK</option>
                </select>
                <select bind:value={newAccRole} class="w-1/2 px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none dark:text-white">
                    <option value="all">Semua Role</option>
                    <option value="suami">Khusus Suami</option>
                    <option value="istri">Khusus Istri</option>
                </select>
            </div>
            <button type="submit" disabled={isSaving || !newAccName} class="w-full py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
                + Tambah Dompet
            </button>
        </form>
        {/if}

        <div class="space-y-2">
            {#each accounts as acc}
                {#if editingAccId === acc.id}
                    <form onsubmit={(e) => updateAccount(e, acc.id)} class="p-4 border border-primary/50 dark:border-blue-500/50 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 space-y-3">
                        <div class="flex justify-between items-center mb-1">
                            <h3 class="font-bold text-sm text-primary dark:text-blue-400">Edit Dompet</h3>
                            <button type="button" onclick={cancelEditAccount} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div>
                            <input type="text" bind:value={editAccName} required placeholder="Nama Dompet" class="w-full px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-primary focus:border-primary outline-none text-sm dark:text-white">
                        </div>
                        <div class="flex gap-2">
                            <select bind:value={editAccType} class="w-1/2 px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none dark:text-white">
                                <option value="bank">Bank</option>
                                <option value="cash">Tunai</option>
                                <option value="ewallet">e-Wallet</option>
                                <option value="investment">Investasi / DPLK</option>
                            </select>
                            <select bind:value={editAccRole} class="w-1/2 px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none dark:text-white">
                                <option value="all">Semua Role</option>
                                <option value="suami">Khusus Suami</option>
                                <option value="istri">Khusus Istri</option>
                            </select>
                        </div>
                        <div class="flex gap-2">
                            <button type="button" onclick={cancelEditAccount} class="w-1/2 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                                Batal
                            </button>
                            <button type="submit" disabled={isSaving || !editAccName} class="w-1/2 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition disabled:opacity-50">
                                Simpan
                            </button>
                        </div>
                    </form>
                {:else}
                    <div class="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-background-dark/50 hover:border-gray-200 dark:hover:border-gray-700 transition">
                        <div>
                            <p class="font-bold text-sm text-gray-800 dark:text-gray-200">{acc.name}</p>
                            <p class="text-[10px] text-gray-500 uppercase">{acc.type} • Akses: {acc.role_access}</p>
                        </div>
                        <div class="flex gap-1">
                            <button onclick={() => startEditAccount(acc)} class="text-blue-500 hover:text-blue-700 p-2" aria-label="Edit Dompet">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <button onclick={() => deleteAccount(acc.id)} class="text-red-500 hover:text-red-700 p-2" aria-label="Hapus Dompet">
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
</div>
