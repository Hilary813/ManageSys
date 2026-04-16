const authModel = require("../models/authModel");

exports.loginPage = (req, res) => {
  console.log(req.session.user);
  if (!!req.session.user) {
    res.redirect(`/${req.session.user.role.toLowerCase()}`);
  } else {
    res.render("login");
  }
};

exports.login = async (req, res) => {
  const { username,email, password } = req.body;

    // Using password_hash based on db.sql schema
  if(!username && !email){
    return res.send("Invalid credentials");
  }

  const rows = await authModel.findUser(username, email, password);

  if (!rows.length) return res.send("Invalid credentials");

  req.session.user = rows[0];

  const role = rows[0].role.toLowerCase();
  res.redirect(`/${role}`);
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};
