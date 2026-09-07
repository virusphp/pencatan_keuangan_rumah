import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { id: 'asc' }
        });
        return json({ categories });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const body = await request.json();
        const { name, type, role_access } = body;
        
        const category = await prisma.category.create({
            data: { name, type, role_access }
        });
        
        return json({ success: true, category });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}

export async function PUT({ request }) {
    try {
        const body = await request.json();
        const { id, name, type, role_access } = body;
        
        if (!id) return json({ error: 'ID is required' }, { status: 400 });

        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: { name, type, role_access }
        });
        
        return json({ success: true, category });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE({ request }) {
    try {
        const body = await request.json();
        const { id } = body;
        
        // Cek apakah kategori sudah digunakan di transaksi
        const transactionCount = await prisma.transaction.count({
            where: { category_id: parseInt(id) }
        });

        if (transactionCount > 0) {
            return json({ 
                success: false, 
                error: `Kategori ini tidak dapat dihapus karena sudah terkait dengan ${transactionCount} transaksi.` 
            }, { status: 400 });
        }

        await prisma.category.delete({
            where: { id: parseInt(id) }
        });
        
        return json({ success: true });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
