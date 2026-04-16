import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const db = new Pool({
  host:     process.env.DB_HOST     || '192.168.0.199',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'project_hub',
  user:     process.env.DB_USER     || 'cmworld',
  password: process.env.DB_PASSWORD || '!@cmworld1234',
});

db.on('error', (err) => {
  console.error('DB pool error:', err);
});
