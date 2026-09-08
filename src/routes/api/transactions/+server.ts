import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET({ url }) {
    const userId = url.searchParams.get('userId');
    const role = url.searchParams.get('role'); // 'suami' or 'istri'
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');
    const accountId = url.searchParams.get('accountId');

    if (!userId || !role) {
        return json({ error: 'Missing userId or role' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const isTransparent = user?.is_transparent_mode ?? false;

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

        // Determine accessible roles based on transparent mode
        let accessibleRoles = ['all', role];
        if (role === 'suami' || isTransparent) {
            accessibleRoles.push(role === 'suami' ? 'istri' : 'suami');
        }

        // Fetch accounts
        let accountFilter: any = { role_access: { in: accessibleRoles } };
        if (accountId) {
            accountFilter = { id: accountId, role_access: { in: accessibleRoles } };
        }

        const accounts = await prisma.account.findMany({
            where: accountFilter
        });
        const accountIds = accounts.map(a => a.id);

        // Fetch transactions for these accounts
        let my_transactions = await prisma.transaction.findMany({
            where: { account_id: { in: accountIds }, ...dateFilter },
            orderBy: { created_at: 'desc' },
            include: { category: true, account: true, user: true }
        });

        // Calculate total balance for these accounts (all time)
        const sums = await prisma.transaction.groupBy({
            by: ['account_id'],
            _sum: { amount: true },
            where: { account_id: { in: accountIds } }
        });

        let totalBalance = 0;
        let spouseBalance = 0; // For legacy UI compatibility, we might still want to separate spouse's private accounts
        
        // Let's map account balances
        const accountBalances = accounts.map(acc => {
            const sum = sums.find(s => s.account_id === acc.id)?._sum.amount || 0;
            const balance = Number(sum);
            
            if (acc.role_access === role || acc.role_access === 'all') {
                totalBalance += balance;
            } else {
                spouseBalance += balance;
            }
            
            return { ...acc, balance };
        });

        // Split transactions for legacy UI compatibility
        const myTx = my_transactions.filter(tx => tx.account?.role_access === role || tx.account?.role_access === 'all');
        const spouseTx = my_transactions.filter(tx => tx.account?.role_access !== role && tx.account?.role_access !== 'all');

        return json({ 
            my_transactions: myTx,
            spouse_transactions: spouseTx,
            totalBalance,
            spouseBalance,
            accountBalances, // New data structure for the UI
            isTransparent 
        });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const body = await request.json();
        const { amount, type, category_id, notes, user_id, date, account_id, to_account_id } = body;

        if (!amount || !type || !category_id || !user_id || !account_id) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        const created_at = date ? new Date(date) : undefined;

        if (type === 'transfer') {
            if (!to_account_id) return json({ error: 'Missing destination account for transfer' }, { status: 400 });

            const transfer_id = crypto.randomUUID();

            const result = await prisma.$transaction([
                prisma.transaction.create({
                    data: {
                        user_id,
                        account_id,
                        amount: -Math.abs(amount), // Outflow from source
                        type: 'transfer',
                        category_id: parseInt(category_id),
                        notes: notes || 'Transfer keluar',
                        transfer_id,
                        created_at
                    }
                }),
                prisma.transaction.create({
                    data: {
                        user_id,
                        account_id: to_account_id,
                        amount: Math.abs(amount), // Inflow to destination
                        type: 'transfer',
                        category_id: parseInt(category_id),
                        notes: notes || 'Transfer masuk',
                        transfer_id,
                        created_at
                    }
                })
            ]);
            return json({ success: true, transactions: result });
        } else {
            const actualAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

            const tx = await prisma.transaction.create({
                data: {
                    user_id,
                    account_id,
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

export async function DELETE({ request }) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) return json({ error: 'Missing ID' }, { status: 400 });

        const tx = await prisma.transaction.findUnique({ where: { id } });
        if (!tx) return json({ error: 'Transaction not found' }, { status: 404 });

        if (tx.transfer_id) {
            // Delete both sides of the transfer
            await prisma.transaction.deleteMany({
                where: { transfer_id: tx.transfer_id }
            });
        } else {
            await prisma.transaction.delete({
                where: { id }
            });
        }

        return json({ success: true });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
