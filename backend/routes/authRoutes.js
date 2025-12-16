const express = require('express');
const router = express.Router();
const passport = require('../oauth');
const jwt = require('jsonwebtoken');
const { register, login } = require('../auth');
const { JWT_SECRET } = require('../config');

// Public Auth Routes
router.post('/api/auth/register', register);
router.post('/api/auth/login', login);

// OAuth Routes
router.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/?error=oauth_failed' }),
    (req, res) => {
        const token = jwt.sign({ userId: req.user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.redirect(`/?token=${token}`);
    }
);

module.exports = router;
