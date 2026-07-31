const JITTER_PERCENT = 0.1; // 10% jitter

export const calculateCacheTTL = (
  baseTTL: number,
  jitterPercent = JITTER_PERCENT,
) => {
  const maxJitter = Math.floor(baseTTL * jitterPercent);
  const jitter = Math.floor(Math.random() * (maxJitter * 2 + 1)) - maxJitter;
  return Math.max(1, baseTTL + jitter);
};
