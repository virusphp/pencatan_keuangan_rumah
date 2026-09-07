import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import bcrypt from 'bcryptjs';

export async function POST({ request }) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return json({ success: false, message: 'Username dan password wajib diisi' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return json({ success: false, message: 'Username tidak ditemukan' }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return json({ success: false, message: 'Password salah' }, { status: 401 });
        }

        // Return user data without password
        const { password: _, ...userData } = user;

        return json({
            success: true,
            user: userData
        });

    } catch (error: any) {
        console.error('Login error:', error);
        return json({ success: false, message: 'Terjadi kesalahan pada server' }, { status: 500 });
    }
}
