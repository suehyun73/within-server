import { defineConfig } from 'drizzle-kit';
import path from 'path';

export default defineConfig({
  out: path.join(__dirname, '../migration'),
  schema: path.join(__dirname, 'schema.ts'),
  dialect: 'postgresql',
  verbose: true,
  dbCredentials: {
    url: `postgresql://${process.env.PG_USER}:${process.env.PG_PW}@localhost:5432/${process.env.PG_DB}`, // 여기서는 pg가 아닌 localhost
  },
});
