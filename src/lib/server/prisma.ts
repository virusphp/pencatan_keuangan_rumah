import { PrismaClient } from '@prisma/client';

const prisma = (globalThis as any).prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
    (globalThis as any).prisma = prisma;
}

export { prisma };
