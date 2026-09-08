<script lang="ts">
    import { onMount } from 'svelte';
    import { auth } from '$lib/stores/auth.svelte';
    import { goto } from '$app/navigation';

    let isTransparent = $state(false);
    let isSaving = $state(false);
    let errorMsg = $state('');
    let successMsg = $state('');

    onMount(async () => {
        // Fetch suami transparent mode status
        try {
            const txRes = await fetch(`/api/transactions?userId=${auth.session?.id}&role=${auth.session?.role}`);
            const txData = await txRes.json();
            isTransparent = txData.isTransparent || false;
        } catch (e) {
            console.error(e);
        }
    });

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
        <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Manajemen Data</h2>
        
        <div class="space-y-3">
            <a href="/dashboard/pengaturan/dompet" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-background-dark rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <div>
                        <span class="block font-bold text-gray-900 dark:text-gray-100">Kelola Dompet / Akun</span>
                        <span class="text-xs text-gray-500">Tambah, Edit, dan Hapus dompet Anda.</span>
                    </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </a>

            <a href="/dashboard/pengaturan/kategori" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-background-dark rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    </div>
                    <div>
                        <span class="block font-bold text-gray-900 dark:text-gray-100">Kelola Kategori</span>
                        <span class="text-xs text-gray-500">Tambah, Edit, dan Hapus kategori transaksi.</span>
                    </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </a>
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
