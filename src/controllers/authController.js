const db = require("../config/db");

exports.loginPage = (req, res) => {
  res.render("login");
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  // Using password_hash based on db.sql schema
  const [rows] = await db.query(
    "SELECT * FROM users WHERE username=? AND password_hash=?",
    [username, password]
  );

  if (!rows.length) return res.send("Invalid credentials");

  req.session.user = rows[0];

  const role = rows[0].role.toLowerCase();
  res.redirect(`/${role}`);
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};
