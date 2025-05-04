const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const multer = require('multer');
const router = express.Router();
const upload = multer({ dest: './public/images/' });

// Middleware to check if admin is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

// Login Page
router.get('/login', (req, res) => {
    res.render('admin/login', { layout: 'layout', title: 'Admin Login', error: null });
});

// Login Handler
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
    try {
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length > 0 && await bcrypt.compare(password, rows[0].password)) {
            req.session.user = rows[0];
            const redirectUrl = rows[0].role === 'Admin' ? '/admin/dashboard' : '/';
            res.redirect(redirectUrl);
        } else {
            res.render('admin/login', { layout: 'layout', title: 'Admin Login', error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.render('admin/login', { layout: 'layout', title: 'Admin Login', error: 'An error occurred during login' });
    } finally {
        await connection.end();
    }
});

// Logout Route (New Route)
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.redirect('/'); // Redirect anyway if there's an error
        }
        res.redirect('/');
    });
});

// Register Page
router.get('/register', (req, res) => {
    res.render('admin/register', { layout: 'layout', title: 'Admin Register', error: null });
});

// Register Handler
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        const [existingUser] = await connection.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser.length > 0) {
            return res.render('admin/register', {
                layout: 'layout',
                title: 'Admin Register',
                error: 'Username or email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );
        res.redirect('/admin/login');
    } catch (err) {
        console.error(err);
        res.render('admin/register', {
            layout: 'layout',
            title: 'Admin Register',
            error: 'An error occurred during registration'
        });
    } finally {
        await connection.end();
    }
});

// Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
    try {
        const [photos] = await connection.execute('SELECT * FROM photos');
        const [users] = await connection.execute('SELECT id, username, email, role FROM users');
        res.render('admin/dashboard', { 
            layout: 'layout', 
            title: 'Admin Dashboard', 
            photos, 
            users: users || [], 
            userError: null 
        });
    } catch (err) {
        console.error(err);
        res.render('admin/dashboard', { 
            layout: 'layout', 
            title: 'Admin Dashboard', 
            photos: [], 
            users: [], 
            userError: 'Failed to load dashboard data' 
        });
    } finally {
        await connection.end();
    }
});

// Add User Handler
router.post('/add-user', isAuthenticated, async (req, res) => {
    const { username, email, password, role } = req.body;
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        const [existingUser] = await connection.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser.length > 0) {
            const [photos] = await connection.execute('SELECT * FROM photos');
            const [users] = await connection.execute('SELECT id, username, email, role FROM users');
            return res.render('admin/dashboard', {
                layout: 'layout',
                title: 'Admin Dashboard',
                photos,
                users: users || [],
                userError: 'Username or email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.execute(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role]
        );

        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        const [photos] = await connection.execute('SELECT * FROM photos');
        const [users] = await connection.execute('SELECT id, username, email, role FROM users');
        res.render('admin/dashboard', {
            layout: 'layout',
            title: 'Admin Dashboard',
            photos,
            users: users || [],
            userError: 'An error occurred while adding the user'
        });
    } finally {
        await connection.end();
    }
});

// Add Photo Page
router.get('/add-photo', isAuthenticated, (req, res) => {
    res.render('admin/add-photo', { layout: 'layout', title: 'Add Photo' });
});

// Add Photo Handler
router.post('/add-photo', isAuthenticated, upload.single('image'), async (req, res) => {
    const { name, description, category } = req.body;
    const imagePath = `/images/${req.file.filename}`;
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
    await connection.execute('INSERT INTO photos (name, description, image_path, category) VALUES (?, ?, ?, ?)', 
        [name, description, imagePath, category]);
    res.redirect('/admin/dashboard');
    await connection.end();
});

// Edit Photo Page
router.get('/edit-photo/:id', isAuthenticated, async (req, res) => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
    const [photos] = await connection.execute('SELECT * FROM photos WHERE id = ?', [req.params.id]);
    res.render('admin/edit-photo', { layout: 'layout', title: 'Edit Photo', photo: photos[0] });
    await connection.end();
});

// Edit Photo Handler
router.post('/edit-photo/:id', isAuthenticated, upload.single('image'), async (req, res) => {
    const { name, description, category } = req.body;
    const imagePath = req.file ? `/images/${req.file.filename}` : req.body.oldImage;
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
    await connection.execute('UPDATE photos SET name = ?, description = ?, image_path = ?, category = ? WHERE id = ?', 
        [name, description, imagePath, category, req.params.id]);
    res.redirect('/admin/dashboard');
    await connection.end();
});

// Delete Photo
router.post('/delete-photo/:id', isAuthenticated, async (req, res) => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
    await connection.execute('DELETE FROM photos WHERE id = ?', [req.params.id]);
    res.redirect('/admin/dashboard');
    await connection.end();
});

module.exports = router;