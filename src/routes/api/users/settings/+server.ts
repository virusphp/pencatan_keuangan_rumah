import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ request }) {
    try {
        const body = await request.json();
        const { userId, is_transparent_mode } = body;

        if (!userId) {
            return json({ error: 'Missing userId' }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { is_transparent_mode }
        });

        return json({ success: true, user });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
