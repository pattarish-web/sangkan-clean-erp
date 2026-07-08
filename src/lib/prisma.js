import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = globalThis;

function createPrismaClient() {
  const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export function normalizeSheet(sheetName) {
  return String(sheetName || '').trim().toLowerCase();
}

export function recordToObject(record) {
  const data = record.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return { ...data, id: data.id ?? record.recordId };
  }
  return { id: record.recordId, ...(data || {}) };
}
