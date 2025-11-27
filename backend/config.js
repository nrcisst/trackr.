function requireEnv(name, devDefault = null) {
    const value = process.env[name];
    
    if (!value && process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    
    return value || devDefault;
}

module.exports = { requireEnv };
