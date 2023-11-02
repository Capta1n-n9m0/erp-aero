import Redis from 'ioredis';
import env from 'misc/environment';

const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
});

export async function isBlacklisted(token: string) {
  return redis.get(token);
}

export async function blacklist(token: string, expiresIn: number) {
  return redis.set(token, 'true', 'EX', expiresIn);
}

export default redis;
