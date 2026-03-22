const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminController");
const { ensureAuth, ensureRole } = require("../middleware/authMiddleware");

router.get("/", ensureAuth, ensureRole("ADMIN"), ctrl.dashboard);

// Students
router.get("/students", ensureAuth, ensureRole("ADMIN"), ctrl.studentsPage);
router.post("/students", ensureAuth, ensureRole("ADMIN"), ctrl.registerStudent);
router.get("/students/search", ensureAuth, ensureRole("ADMIN"), ctrl.searchStudents);

// Semesters
router.get("/semesters", ensureAuth, ensureRole("ADMIN"), ctrl.semestersPage);
router.post("/semesters", ensureAuth, ensureRole("ADMIN"), ctrl.createSemester);

// Subjects
router.get("/subjects", ensureAuth, ensureRole("ADMIN"), ctrl.subjectsPage);
router.post("/subjects", ensureAuth, ensureRole("ADMIN"), ctrl.createSubject);

// Enrollments
router.get("/enrollments", ensureAuth, ensureRole("ADMIN"), ctrl.enrollmentsPage);
router.post("/enrollments", ensureAuth, ensureRole("ADMIN"), ctrl.enrollStudent);

// Results
router.get("/results", ensureAuth, ensureRole("ADMIN"), ctrl.resultsPage);
router.post("/results/publish", ensureAuth, ensureRole("ADMIN"), ctrl.publishResults);
router.post("/results/withhold", ensureAuth, ensureRole("ADMIN"), ctrl.withholdResult);

// Reports
router.get("/reports", ensureAuth, ensureRole("ADMIN"), ctrl.reportsPage);
router.get("/reports/export", ensureAuth, ensureRole("ADMIN"), ctrl.exportReport);

// Users
router.get("/users", ensureAuth, ensureRole("ADMIN"), ctrl.usersPage);
router.post("/users", ensureAuth, ensureRole("ADMIN"), ctrl.createUser);

module.exports = router;
