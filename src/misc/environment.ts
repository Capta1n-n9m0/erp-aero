import dotenv from 'dotenv';

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
}

export default env;