const mysql = require("mysql2");

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  port: process.env.DB_PORT || 3308,
  database: process.env.DB_NAME,
};



if (process.env.DB_PASS) {
  config.password = process.env.DB_PASS;
}
const pool = mysql.createPool(config);

module.exports = pool.promise();
