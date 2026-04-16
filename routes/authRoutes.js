const express = require("express");
const router = express.Router();
const auth = require("../app/services/authService");

router.get("/", auth.loginPage);
router.post("/login", auth.login);
router.get("/logout", auth.logout);

module.exports = router;
