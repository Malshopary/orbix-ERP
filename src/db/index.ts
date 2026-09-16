import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import * as schema from './schema.ts';

dotenv.config();

declare global {
  var _postgresPool: Pool | undefined;
}

let _currentDrizzle: any = null;

export const createPool = () => {
  if (!global._postgresPool) {
    dotenv.config();
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST || 'localhost',
      port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
      user: process.env.SQL_USER || 'postgres',
      password: String(process.env.SQL_PASSWORD || '123'),
      database: process.env.SQL_DB_NAME || 'orbix_erp',
      ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

export const resetPool = async () => {
  if (global._postgresPool) {
    try {
      await global._postgresPool.end();
    } catch (e: any) {
      console.warn('Warning ending postgres pool:', e?.message);
    }
    global._postgresPool = undefined;
  }
  _currentDrizzle = null;
};

export const getDb = () => {
  const pool = createPool();
  if (!_currentDrizzle) {
    _currentDrizzle = drizzle(pool, { schema });
  }
  return _currentDrizzle;
};

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const instance = getDb();
    const val = (instance as any)[prop];
    if (typeof val === 'function') {
      return val.bind(instance);
    }
    return val;
  },
});

