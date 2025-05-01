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
    const [photos] = await connection.execute('SELECT * FROM photos');
    res.render('home', { layout: 'layout', title: 'Photo Gallery', photos });
});

// Photo Detail Page
router.get('/photo/:id', async (req, res) => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
    const [photos] = await connection.execute('SELECT * FROM photos WHERE id = ?', [req.params.id]);
    res.render('photo-detail', { layout: 'layout', title: photos[0].name, photo: photos[0] });
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
    res.render('home', { layout: 'layout', title: 'Search Results', photos });
});

module.exports = router;