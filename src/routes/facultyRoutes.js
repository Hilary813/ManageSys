const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/facultyController");
const { ensureAuth, ensureRole } = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.get("/", ensureAuth, ensureRole("FACULTY"), ctrl.dashboard);

router.get("/result-entry/:allocation_id", ensureAuth, ensureRole("FACULTY"), ctrl.resultEntryPage);
router.post("/result-entry/:allocation_id", ensureAuth, ensureRole("FACULTY"), ctrl.enterMarks);
router.post("/import-csv/:allocation_id", ensureAuth, ensureRole("FACULTY"), upload.single("csvFile"), ctrl.importCSV);
router.get("/performance/:allocation_id", ensureAuth, ensureRole("FACULTY"), ctrl.viewPerformance);

module.exports = router;
