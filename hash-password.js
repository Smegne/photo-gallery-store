const bcrypt = require('bcryptjs');

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(hashedPassword);
}

hashPassword('123456');

// INSERT INTO users (username, password) 
// VALUES ('admin', '$2a$10$your_hashed_password_here');