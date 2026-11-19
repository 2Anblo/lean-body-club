// Reads settings from environment variables, with defaults for local development.
const int = (value, fallback) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
};

export function loadConfig(env = process.env) {
  return {
    env: env.NODE_ENV ?? 'development',
    port: int(env.PORT, 4000),
    mongoUri: env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/lean-body-club',
    corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:5173,https://2anblo.github.io')
      .split(',')
      .map((s) => s.trim().replace(/\/+$/, ''))
      .filter(Boolean),
    sessionTtlDays: int(env.SESSION_TTL_DAYS, 30),
    authRateLimit: int(env.AUTH_RATE_LIMIT, 20),
    bcryptRounds: int(env.BCRYPT_ROUNDS, 11),
  };
}
