import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// SQLite databases are read-only in Netlify serverless functions.
// To bypass this, we copy the database file to the writable "/tmp" directory at runtime.
const localDbPath = path.join(process.cwd(), 'prisma/dev.db');
const tmpDbPath = '/tmp/dev.db';

let databaseUrl = 'file:./dev.db';

if (process.env.NODE_ENV === 'production') {
  try {
    if (!fs.existsSync(tmpDbPath)) {
      if (fs.existsSync(localDbPath)) {
        fs.copyFileSync(localDbPath, tmpDbPath);
        // Ensure write permissions on the copied file
        fs.chmodSync(tmpDbPath, 0o666);
        console.log('Production Database successfully copied to /tmp/dev.db');
      } else {
        console.warn('Production localDbPath not found at:', localDbPath);
      }
    }
    databaseUrl = `file:${tmpDbPath}`;
  } catch (err) {
    console.error('Failed to copy database to /tmp/dev.db, using fallback:', err);
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
