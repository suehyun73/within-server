import { defineConfig } from 'drizzle-kit';
import path from 'path';

// 도커 컨테이너라면 PG_HOST를, 아니면 localhost를 사용
const getHost = () => {
  return require('fs').existsSync('/.dockerenv')
    ? process.env.PG_HOST!
    : 'localhost';
};

export default defineConfig({
  out: './src/adapter/pg/migration',
  schema: path.join(__dirname, 'schema.ts'),
  dialect: 'postgresql',

  // 상세 로깅 활성화 여부
  verbose: true,

  dbCredentials: {
    url: `postgresql://${process.env.PG_USER!}:${process.env.PG_PW!}@${getHost()}:${process.env.PG_PORT!}/${process.env.PG_DB!}`,
  },
});
