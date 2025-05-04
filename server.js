const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const adminRoutes = require('./routes/admin');
const galleryRoutes = require('./routes/gallery');

dotenv.config(); // Load environment variables
// ... rest of the code

const app = express();

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL Connected');
});

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Multer for file uploads
const storage = multer.diskStorage({
    destination: './public/images/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Routes
app.use('/admin', adminRoutes);
app.use('/', galleryRoutes);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
