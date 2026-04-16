const db = require("../../db/db");

exports.findUser = async (username, email, password) => {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE username=? OR email=? OR email=? AND password_hash=?",
    [username, email, username, password]
  );
  return rows;
};
