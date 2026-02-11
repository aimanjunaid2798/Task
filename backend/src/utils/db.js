/**
 * PostgreSQL connection pool - single shared instance.
 * Uses explicit host/port/user/password/database (no URL parsing) when DB_HOST is set.
 * Supabase requires SSL for remote connections.
 */
import pg from 'pg';
import { config } from '../../config/index.js';

const { Pool } = pg;

export const useMemoryDb = config.database.useMemory;

const db = config.database;
const useExplicit = Boolean(db.host && db.user && db.database);

const poolConfig = useMemoryDb
  ? null
  : useExplicit
    ? {
        host: db.host,
        port: Number(db.port) || 5432,
        user: db.user,
        password: db.password,
        database: db.database,
        ssl: String(db.host).includes('supabase') ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
      }
    : {
        connectionString: db.connectionString || 'postgresql://localhost:5432/chatbot',
        ssl: (db.connectionString || '').includes('supabase') ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
      };

export const pool = useMemoryDb ? null : new Pool(poolConfig);
