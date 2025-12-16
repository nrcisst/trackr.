function requireEnv(name, devDefault = null) {
    const value = process.env[name];

    if (!value && process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value || devDefault;
}

// Centralized JWT secret - used by auth.js, authMiddleware.js, and authRoutes.js
const JWT_SECRET = requireEnv('JWT_SECRET', 'dev-secret-change-in-production');

module.exports = { requireEnv, JWT_SECRET };
