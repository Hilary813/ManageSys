const express = require("express");
const router = express.Router();
const ctrl = require("../app/services/studentService");
const { ensureAuth, ensureRole } = require("../app/middleware/authMiddleware");

router.get("/", ensureAuth, ensureRole("STUDENT"), ctrl.dashboard);

router.get("/results/:semester_id", ensureAuth, ensureRole("STUDENT"), ctrl.viewResults);
router.get("/transcript", ensureAuth, ensureRole("STUDENT"), ctrl.downloadTranscript);
router.get("/gpa", ensureAuth, ensureRole("STUDENT"), ctrl.viewGPA);

module.exports = router;
