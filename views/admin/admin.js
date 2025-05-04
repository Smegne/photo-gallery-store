const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Adjust path to your database config

// GET /admin/register - Render registration form
router.get('/register', (req, res) => {
    res.render('admin/register', { error: null });
});

// POST /admin/register - Handle registration
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Check if username or email already exists
        const [existing] = await db.query('SELECT * FROM admins WHERE username = ? OR email = ?', [username, email]);
        if (existing.length > 0) {
            return res.render('admin/register', { error: 'Username or email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new admin
        await db.query('INSERT INTO admins (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);

        // Redirect to login page after successful registration
        res.redirect('/admin/login');
    } catch (error) {
        console.error('Error registering admin:', error);
        res.render('admin/register', { error: 'Registration failed. Please try again.' });
    }
});

// GET /admin/login - Render login form
router.get('/login', (req, res) => {
    res.render('admin/login', { error: null });
});

// POST /admin/login - Handle login (placeholder, adjust as needed)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [admins] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
        if (admins.length === 0) {
            return res.render('admin/login', { error: 'Invalid username or password' });
        }

        const admin = admins[0];
        const match = await bcrypt.compare(password, admin.password);
        if (!match) {
            return res.render('admin/login', { error: 'Invalid username or password' });
        }

        // Set session (adjust based on your session setup)
        req.session.adminId = admin.id;
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Error logging in:', error);
        res.render('admin/login', { error: 'Login failed. Please try again.' });
    }
});

module.exports = router;