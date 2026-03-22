const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  port: process.env.DB_PORT || 3308,
  // password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

module.exports = pool.promise();
