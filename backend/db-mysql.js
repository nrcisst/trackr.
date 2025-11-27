const mysql = require('mysql2');
const { requireEnv } = require('./config');

const pool = mysql.createPool({
    host: requireEnv('MYSQL_HOST'),
    port: process.env.MYSQL_PORT || 3306,
    user: requireEnv('MYSQL_USER'),
    password: requireEnv('MYSQL_PASSWORD'),
    database: requireEnv('MYSQL_DATABASE'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = { pool };
