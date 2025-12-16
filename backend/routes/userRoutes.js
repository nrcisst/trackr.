const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { dbClient } = require('../db-client');
const authMiddleware = require('../authMiddleware');

// Configure Cloudinary (uses CLOUDINARY_URL env var, or individual vars)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Use memory storage for multer (we'll upload to Cloudinary, not local disk)
const upload = multer({
    storage: multer.memoryStorage(),
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

// Upload profile image to Cloudinary
router.post('/profile-image', authMiddleware, upload.single('profileImage'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Get old image public_id to delete from Cloudinary
        const user = await new Promise((resolve, reject) => {
            dbClient.get('SELECT profile_image_url FROM users WHERE id = ?', [req.userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Delete old image from Cloudinary if exists
        if (user && user.profile_image_url && user.profile_image_url.includes('cloudinary')) {
            try {
                // Extract public_id from Cloudinary URL
                const urlParts = user.profile_image_url.split('/');
                const filename = urlParts[urlParts.length - 1];
                const publicId = `trading-tracker/profiles/${filename.split('.')[0]}`;
                await cloudinary.uploader.destroy(publicId);
            } catch (deleteErr) {
                console.error('Failed to delete old image from Cloudinary:', deleteErr);
                // Continue anyway - old image might not exist
            }
        }

        // Upload new image to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'trading-tracker/profiles',
                    public_id: `user-${req.userId}-${Date.now()}`,
                    resource_type: 'image',
                    transformation: [
                        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                        { quality: 'auto', fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        const imageUrl = uploadResult.secure_url;

        // Update database with new Cloudinary URL
        await new Promise((resolve, reject) => {
            dbClient.run('UPDATE users SET profile_image_url = ? WHERE id = ?',
                [imageUrl, req.userId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });

        res.json({ profileImage: imageUrl });

    } catch (err) {
        console.error('Cloudinary upload error:', err);
        res.status(500).json({ error: 'Failed to upload image' });
    }
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

    dbClient.run('UPDATE users SET username = ? WHERE id = ?', [trimmedUsername, req.userId], function (err, result) {
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
