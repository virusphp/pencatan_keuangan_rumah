import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET() {
    try {
        const categories = await prisma.category.findMany();
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

export async function DELETE({ request }) {
    try {
        const body = await request.json();
        const { id } = body;
        
        await prisma.category.delete({
            where: { id: parseInt(id) }
        });
        
        return json({ success: true });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
