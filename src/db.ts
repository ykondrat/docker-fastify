import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.PGHOST ?? 'localhost',
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER ?? 'appuser',
  password: process.env.PGPASSWORD ?? 'apppass',
  database: process.env.PGDATABASE ?? 'appdb',
  max: Number(process.env.PG_POOL_MAX ?? 10),
});

export interface User {
  id: number;
  name: string;
  email: string;
}

export async function getUsers(): Promise<User[]> {
  const { rows } = await pool.query<User>('SELECT id, name, email FROM users ORDER BY id');

  return rows;
}
