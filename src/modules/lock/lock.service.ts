import { randomUUID } from "crypto";
import redis from "../../lib/redis";
import { LOCK_PREFIX, LOCK_TTL_SECONDS } from "./lock.constants";

interface AcquireLockResult {
  acquired: boolean;
  lockId: string | null;
}

const RELEASE_LOCK_SCRIPT = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  end
  return 0
`;

function buildLockKey(key: string): string {
  return `${LOCK_PREFIX}:${key}`;
}

export const lockService = {
  async acquireLock(
    key: string,
    ttlSeconds: number = LOCK_TTL_SECONDS,
  ): Promise<AcquireLockResult> {
    const lockKey = buildLockKey(key);
    const lockId = randomUUID();

    const result = await redis.set(lockKey, lockId, "EX", ttlSeconds, "NX");

    if (result !== "OK") {
      return { acquired: false, lockId: null };
    }

    return { acquired: true, lockId };
  },

  async releaseLock(key: string, lockId: string): Promise<boolean> {
    const lockKey = buildLockKey(key);
    const result = await redis.eval(RELEASE_LOCK_SCRIPT, 1, lockKey, lockId);
    return result === 1;
  },
};
