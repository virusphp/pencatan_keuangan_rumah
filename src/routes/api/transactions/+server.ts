import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET({ url }) {
    const userId = url.searchParams.get('userId');
    const role = url.searchParams.get('role');
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');

    if (!userId || !role) {
        return json({ error: 'Missing userId or role' }, { status: 400 });
    }

    try {
        const suami = await prisma.user.findFirst({ where: { role: 'suami' } });
        const isTransparent = suami?.is_transparent_mode ?? false;

        let dateFilter = {};
        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 1);
            dateFilter = {
                created_at: {
                    gte: startDate,
                    lt: endDate
                }
            };
        }

        let my_transactions = await prisma.transaction.findMany({
            where: { user_id: userId, ...dateFilter },
            orderBy: { created_at: 'desc' },
            include: { category: true, user: true }
        });

        let spouse_transactions = [];
        let spouseBalance = 0;
        let spouseId = null;

        if (role === 'suami' || isTransparent) {
            const spouseRole = role === 'suami' ? 'istri' : 'suami';
            const spouse = await prisma.user.findFirst({ where: { role: spouseRole } });
            spouseId = spouse?.id;
        }

        if (spouseId) {
            spouse_transactions = await prisma.transaction.findMany({
                where: { user_id: spouseId, ...dateFilter },
                orderBy: { created_at: 'desc' },
                include: { category: true, user: true }
            });
            
            const spouseSum = await prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { user_id: spouseId }
            });
            spouseBalance = Number(spouseSum._sum.amount || 0);
        }

        const mySum = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { user_id: userId }
        });
        const totalBalance = Number(mySum._sum.amount || 0);
        
        return json({ 
            my_transactions,
            spouse_transactions,
            totalBalance,
            spouseBalance,
            isTransparent 
        });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const body = await request.json();
        const { amount, type, category_id, notes, user_id, role, to_user_id, date } = body;

        if (!amount || !type || !category_id || !user_id) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        const created_at = date ? new Date(date) : undefined;

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
                        created_at
                    }
                }),
                prisma.transaction.create({
                    data: {
                        user_id: receiverId,
                        amount: Math.abs(amount), // Positif untuk pemasukan transfer
                        type: 'transfer',
                        category_id: parseInt(category_id),
                        notes: notes || 'Transfer masuk',
                        created_at
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
                    notes,
                    created_at
                }
            });
            return json({ success: true, transaction: tx });
        }
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
