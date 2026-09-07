import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST() {
    try {
        // Cek apakah user sudah ada
        const existingUsers = await prisma.user.count();
        if (existingUsers > 0) {
            return json({ success: false, message: 'Database is already seeded.' });
        }

        // 1. Buat User Suami & Istri
        const suami = await prisma.user.create({
            data: {
                id: 'suami-id-1234', // Hardcoded for simplicity in dummy auth
                name: 'Suami',
                role: 'suami',
                theme_color: '#3B82F6',
                is_transparent_mode: true
            }
        });

        const istri = await prisma.user.create({
            data: {
                id: 'istri-id-5678', // Hardcoded for simplicity in dummy auth
                name: 'Istri',
                role: 'istri',
                theme_color: '#EC4899'
            }
        });

        // 2. Buat Kategori Default
        await prisma.category.createMany({
            data: [
                { name: 'Gaji Suami', type: 'income', role_access: 'suami' },
                { name: 'Pendapatan Istri', type: 'income', role_access: 'istri' },
                { name: 'Jatah Istri', type: 'transfer', role_access: 'all' },
                { name: 'Makan & Minum', type: 'expense', role_access: 'all' },
                { name: 'Tagihan Listrik & Air', type: 'expense', role_access: 'suami' },
                { name: 'Belanja Dapur', type: 'expense', role_access: 'istri' },
                { name: 'Transportasi', type: 'expense', role_access: 'all' },
                { name: 'Hiburan', type: 'expense', role_access: 'all' }
            ]
        });

        return json({
            success: true,
            message: 'Seeding completed!',
            users: { suami, istri }
        });
    } catch (error: any) {
        return json({ success: false, error: error.message }, { status: 500 });
    }
}
