import dotenv from 'dotenv';
import * as process from 'process';

const env_files = [
  '.env',
];

for(const env_file of env_files) {
  dotenv.config({ path: env_file });
}


const env = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '') || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'test',
  },
  dev: process.env.NODE_ENV !== 'production',
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'access-token-secret',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'refresh-token-secret',
}

export default env;