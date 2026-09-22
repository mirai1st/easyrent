const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,       // e.g. "localhost"
    user: process.env.DB_USER,       // e.g. "root"
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,   // e.g. "easyrent"
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;