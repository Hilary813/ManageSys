const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminController");
const { ensureAuth, ensureRole } = require("../middleware/authMiddleware");

router.get("/", ensureAuth, ensureRole("ADMIN"), ctrl.dashboard);

// Programmes
router.get("/programmes", ensureAuth, ensureRole("ADMIN"), ctrl.programmesPage);
router.get("/programmes/:programme_id", ensureAuth, ensureRole("ADMIN"), ctrl.programmeDetailsPage);
router.post("/programmes", ensureAuth, ensureRole("ADMIN"), ctrl.createProgramme);
router.post("/programmes/:programme_id", ensureAuth, ensureRole("ADMIN"), ctrl.updateProgramme);
router.delete("/programmes/:programme_id", ensureAuth, ensureRole("ADMIN"), ctrl.deleteProgramme);

// Students
router.get("/students", ensureAuth, ensureRole("ADMIN"), ctrl.studentsPage);
router.post("/students", ensureAuth, ensureRole("ADMIN"), ctrl.registerStudent);
router.post("/students/:student_id", ensureAuth, ensureRole("ADMIN"), ctrl.updateStudent);
router.delete("/students/:student_id", ensureAuth, ensureRole("ADMIN"), ctrl.deleteStudent);
router.get("/students/search", ensureAuth, ensureRole("ADMIN"), ctrl.searchStudents);

// Semesters
router.get("/semesters", ensureAuth, ensureRole("ADMIN"), ctrl.semestersPage);
router.post("/semesters", ensureAuth, ensureRole("ADMIN"), ctrl.createSemester);
router.post("/semesters/:semester_id", ensureAuth, ensureRole("ADMIN"), ctrl.updateSemester);
router.delete("/semesters/:semester_id", ensureAuth, ensureRole("ADMIN"), ctrl.deleteSemester);

// Subjects
router.get("/subjects", ensureAuth, ensureRole("ADMIN"), ctrl.subjectsPage);
router.post("/subjects", ensureAuth, ensureRole("ADMIN"), ctrl.createSubject);
router.post("/subjects/:subject_id", ensureAuth, ensureRole("ADMIN"), ctrl.updateSubject);
router.delete("/subjects/:subject_id", ensureAuth, ensureRole("ADMIN"), ctrl.deleteSubject);

// Enrollments
router.get("/enrollments", ensureAuth, ensureRole("ADMIN"), ctrl.enrollmentsPage);
router.post("/enrollments", ensureAuth, ensureRole("ADMIN"), ctrl.enrollStudent);
router.post("/enrollments/bulk", ensureAuth, ensureRole("ADMIN"), ctrl.bulkEnroll);
router.post("/enrollments/:enrollment_id", ensureAuth, ensureRole("ADMIN"), ctrl.updateEnrollment);
router.delete("/enrollments/:enrollment_id", ensureAuth, ensureRole("ADMIN"), ctrl.deleteEnrollment);

// Faculty Allocations
router.get("/allocations", ensureAuth, ensureRole("ADMIN"), ctrl.allocationsPage);
router.post("/allocations", ensureAuth, ensureRole("ADMIN"), ctrl.createAllocation);
router.delete("/allocations/:allocation_id", ensureAuth, ensureRole("ADMIN"), ctrl.deleteAllocation);

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
router.post("/users/:user_id", ensureAuth, ensureRole("ADMIN"), ctrl.updateUser);
router.delete("/users/:user_id", ensureAuth, ensureRole("ADMIN"), ctrl.deleteUser);

module.exports = router;
