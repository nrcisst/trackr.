require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("./oauth");
const { requireEnv } = require("./config");
const rateLimit = require("express-rate-limit");

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tradeRoutes = require('./routes/tradeRoutes');

const PORT = process.env.PORT || 4000;
const SESSION_SECRET = requireEnv('SESSION_SECRET', 'session-secret-change-me');
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:4000';

// Rate limit login-related routes to reduce brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false
});

const app = express();

// CORS configuration
app.use(cors({
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Apply rate limiting to unauthenticated auth endpoints
app.use(['/api/auth/login', '/api/auth/register', '/auth/google', '/auth/google/callback'], authLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ ok: true });
});

// Session for OAuth flow only
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 10 * 60 * 1000, // 10 min
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : false
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    maxAge: '1d',
    etag: true,
}));

// Mount routes
app.use('/', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', tradeRoutes);

// Fallback to SPA for non-API/non-auth routes
app.get(/^\/(?!api|auth|uploads).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global error handler (must be last)
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (res.headersSent) {
        return next(err);
    }
    
    res.status(err.status || 500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
