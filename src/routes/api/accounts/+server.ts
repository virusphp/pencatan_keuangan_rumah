import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET({ url }) {
    const role = url.searchParams.get('role'); // suami, istri

    try {
        let whereClause = {};
        if (role) {
            whereClause = {
                OR: [
                    { role_access: 'all' },
                    { role_access: role }
                ]
            };
        }

        const accounts = await prisma.account.findMany({
            where: whereClause,
            orderBy: { created_at: 'asc' }
        });

        return json({ accounts });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const body = await request.json();
        const { name, type, role_access, created_by } = body;

        if (!name || !type || !role_access || !created_by) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }

        const account = await prisma.account.create({
            data: {
                name,
                type,
                role_access,
                created_by
            }
        });

        return json({ success: true, account });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}

export async function PUT({ request }) {
    try {
        const body = await request.json();
        const { id, name, type, role_access } = body;

        if (!id) {
            return json({ error: 'Missing ID' }, { status: 400 });
        }

        const account = await prisma.account.update({
            where: { id },
            data: {
                name,
                type,
                role_access
            }
        });

        return json({ success: true, account });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE({ request }) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return json({ error: 'Missing ID' }, { status: 400 });
        }

        // Transactions connected to this account will be deleted automatically 
        // due to onDelete: Cascade we added in prisma schema
        await prisma.account.delete({
            where: { id }
        });

        return json({ success: true });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
