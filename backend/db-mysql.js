const mysql = require('mysql2');
const { requireEnv } = require('./config');

const pool = mysql.createPool({
    host: requireEnv('MYSQLHOST'),
    port: process.env.MYSQLPORT || 3306,
    user: requireEnv('MYSQLUSER'),
    password: requireEnv('MYSQLPASSWORD'),
    database: requireEnv('MYSQLDATABASE'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = { pool };
