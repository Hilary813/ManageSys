exports.ensureAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect("/");
  next();
};

exports.ensureRole = role => (req, res, next) => {
  if (req.session.user.role !== role) return res.send("Access Denied");
  next();
};
