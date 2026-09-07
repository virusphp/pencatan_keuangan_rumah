import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET({ url }) {
    const userId = url.searchParams.get('userId');
    const role = url.searchParams.get('role');

    if (!userId || !role) {
        return json({ error: 'Missing userId or role' }, { status: 400 });
    }

    try {
        // Cek is_transparent_mode dari akun suami
        const suami = await prisma.user.findFirst({ where: { role: 'suami' } });
        const isTransparent = suami?.is_transparent_mode ?? false;

        let transactions;

        if (role === 'suami' || isTransparent) {
            // Suami atau Mode Transparan: Lihat semua
            transactions = await prisma.transaction.findMany({
                orderBy: { created_at: 'desc' },
                include: { category: true, user: true }
            });
        } else {
            // Istri tanpa Mode Transparan: Lihat miliknya sendiri
            transactions = await prisma.transaction.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' },
                include: { category: true, user: true }
            });
        }

        // Hitung total saldo
        // Pemasukan = type income
        // Pengeluaran = type expense ATAU (type transfer && sumber dana (user_id pembuat))
        // Karena transfer adalah double-entry, pemasukan di istri akan tercatat sebagai type transfer tapi sebagai income buat istri?
        // Wait, the rule says:
        // 1. Pengeluaran di ID Suami sebesar X (type transfer)
        // 2. Pemasukan di ID Istri sebesar X (type transfer)
        // Kita butuh cara membedakan mana transfer keluar dan transfer masuk.
        // Jika amount selalu absolut, kita bisa buat convention:
        // Income = +amount, Expense = -amount, 
        // Atau: cek role pengirim vs penerima.
        
        return json({ transactions, isTransparent });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const body = await request.json();
        const { amount, type, category_id, notes, user_id, role, to_user_id } = body;

        if (!amount || !type || !category_id || !user_id) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (type === 'transfer') {
            // Logika Double Entry
            // Pengirim (misal Suami)
            const senderId = user_id;
            // Penerima (misal Istri)
            const receiverId = to_user_id || (role === 'suami' ? (await prisma.user.findFirst({ where: { role: 'istri' } }))?.id : null);

            if (!receiverId) return json({ error: 'Receiver not found' }, { status: 400 });

            const result = await prisma.$transaction([
                prisma.transaction.create({
                    data: {
                        user_id: senderId,
                        amount: -Math.abs(amount), // Negatif untuk pengeluaran transfer
                        type: 'transfer',
                        category_id: parseInt(category_id),
                        notes: notes || 'Transfer keluar',
                    }
                }),
                prisma.transaction.create({
                    data: {
                        user_id: receiverId,
                        amount: Math.abs(amount), // Positif untuk pemasukan transfer
                        type: 'transfer',
                        category_id: parseInt(category_id),
                        notes: notes || 'Transfer masuk',
                    }
                })
            ]);
            return json({ success: true, transactions: result });
        } else {
            // Income atau Expense biasa
            // Konvensi: expense disimpan sebagai negatif, income positif (untuk memudahkan sum query)
            const actualAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

            const tx = await prisma.transaction.create({
                data: {
                    user_id,
                    amount: actualAmount,
                    type,
                    category_id: parseInt(category_id),
                    notes
                }
            });
            return json({ success: true, transaction: tx });
        }
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
