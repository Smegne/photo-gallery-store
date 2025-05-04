const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

// Home Page
router.get('/', async (req, res) => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
    try {
        const [photos] = await connection.execute('SELECT * FROM photos');
        res.render('home', { 
            layout: 'layout', 
            title: 'Photo Gallery', 
            photos, 
            sessionUser: req.session.user || null 
        });
    } catch (err) {
        console.error(err);
        res.render('home', { 
            layout: 'layout', 
            title: 'Photo Gallery', 
            photos: [], 
            sessionUser: req.session.user || null 
        });
    } finally {
        await connection.end();
    }
});

// Photo Detail Page
router.get('/photo/:id', async (req, res) => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
    try {
        const [photos] = await connection.execute('SELECT * FROM photos WHERE id = ?', [req.params.id]);
        if (photos.length === 0) {
            return res.status(404).render('photo-detail', { 
                layout: 'layout', 
                title: 'Photo Not Found', 
                photo: null, 
                sessionUser: req.session.user || null 
            });
        }
        res.render('photo-detail', { 
            layout: 'layout', 
            title: photos[0].name, 
            photo: photos[0], 
            sessionUser: req.session.user || null 
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('photo-detail', { 
            layout: 'layout', 
            title: 'Error', 
            photo: null, 
            sessionUser: req.session.user || null 
        });
    } finally {
        await connection.end();
    }
});

// Search and Filter
router.get('/search', async (req, res) => {
    const { keyword, category } = req.query;
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
    try {
        let query = 'SELECT * FROM photos WHERE 1=1';
        let params = [];
        if (keyword) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
        }
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        const [photos] = await connection.execute(query, params);
        res.render('home', { 
            layout: 'layout', 
            title: 'Search Results', 
            photos, 
            sessionUser: req.session.user || null 
        });
    } catch (err) {
        console.error(err);
        res.render('home', { 
            layout: 'layout', 
            title: 'Search Results', 
            photos: [], 
            sessionUser: req.session.user || null 
        });
    } finally {
        await connection.end();
    }
});

module.exports = router;