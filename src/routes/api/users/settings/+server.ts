import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ request }) {
    try {
        const body = await request.json();
        const { userId, is_transparent_mode, theme_color } = body;

        if (!userId) {
            return json({ error: 'Missing userId' }, { status: 400 });
        }

        const dataToUpdate: any = {};
        if (is_transparent_mode !== undefined) dataToUpdate.is_transparent_mode = is_transparent_mode;
        if (theme_color !== undefined) dataToUpdate.theme_color = theme_color;

        const user = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate
        });

        return json({ success: true, user });
    } catch (error: any) {
        return json({ error: error.message }, { status: 500 });
    }
}
