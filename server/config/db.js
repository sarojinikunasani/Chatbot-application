const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('!!! DATABASE CONNECTION ERROR !!!:', err.stack);
    } else {
        console.info('Database connected successfully at:', res.rows[0].now);
    }
});

module.exports = pool;