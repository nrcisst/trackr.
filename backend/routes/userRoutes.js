const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { dbClient } = require('../db-client');
const authMiddleware = require('../authMiddleware');

// Configure multer for profile image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/profiles');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Ensure req.userId exists (authMiddleware must run first)
        const userId = req.userId || 'unknown';
        const ext = path.extname(file.originalname);
        cb(null, `user-${userId}-${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP allowed.'));
        }
    }
});

// Get current user profile
router.get('/me', authMiddleware, (req, res) => {
    dbClient.get('SELECT id, username, email, oauth_email, display_name, profile_image_url, created_at FROM users WHERE id = ?',
        [req.userId], (err, user) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (!user) return res.status(404).json({ error: 'User not found' });

            res.json({
                id: user.id,
                username: user.username,
                email: user.email || user.oauth_email,
                displayName: user.display_name,
                profileImage: user.profile_image_url,
                memberSince: user.created_at
            });
        });
});

// Upload profile image
router.post('/profile-image', authMiddleware, upload.single('profileImage'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    // Get old image to delete
    dbClient.get('SELECT profile_image_url FROM users WHERE id = ?', [req.userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        // Delete old image file if exists
        if (user && user.profile_image_url) {
            const oldPath = path.join(__dirname, '../..', user.profile_image_url);
            fs.unlink(oldPath, () => { });
        }

        // Update database
        dbClient.run('UPDATE users SET profile_image_url = ? WHERE id = ?',
            [imageUrl, req.userId], (err) => {
                if (err) return res.status(500).json({ error: 'Failed to update profile' });
                res.json({ profileImage: imageUrl });
            });
    });
});

// Update username
router.put('/username', authMiddleware, (req, res) => {
    const { username } = req.body;
    
    if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'Username is required' });
    }
    
    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    if (trimmedUsername.length > 30) {
        return res.status(400).json({ error: 'Username too long (max 30 chars)' });
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, hyphens, and underscores' });
    }
    
    dbClient.run('UPDATE users SET username = ? WHERE id = ?', [trimmedUsername, req.userId], function(err, result) {
        if (err) {
            if (err.message && err.message.includes('UNIQUE')) {
                return res.status(409).json({ error: 'Username already taken' });
            }
            return res.status(500).json({ error: 'Failed to update username' });
        }
        res.json({ username: trimmedUsername });
    });
});

module.exports = router;
