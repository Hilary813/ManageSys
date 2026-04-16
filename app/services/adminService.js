const adminModel = require("../models/adminModel");

exports.dashboard = async (req, res) => {
  try {
    const stats = await adminModel.getDashboardStats();
    const sessions = await adminModel.getSessions();
    const payload = {
      user: req.session.user,
      stats,
      sessions
    };
    console.log(payload);
    res.render("admin/dashboard", payload);
  } catch (err) {
    console.error(err);
    res.send("Error loading dashboard");
  }
};

// Programmes
exports.programmesPage = async (req, res) => {
  try {
    const programmes = await adminModel.getProgrammesDetails();
    res.render("admin/programmes", { programmes });
  } catch (err) {
    console.error(err);
    res.send("Error loading programmes");
  }
};

exports.programmeDetailsPage = async (req, res) => {
  const { programme_id } = req.params;
  try {
    const programme = await adminModel.getProgrammeById(programme_id);
    if (!programme.length) return res.send("Programme not found");

    const students = await adminModel.getProgrammeStudents(programme_id);
    const semesters = await adminModel.getProgrammeSemesters(programme_id);
    const subjects = await adminModel.getProgrammeSubjects(programme_id);

    res.render("admin/programmeDetails", { 
      programme: programme[0], 
      students, 
      semesters, 
      subjects 
    });
  } catch (err) {
    console.error(err);
    res.send("Error loading programme details");
  }
};

exports.createProgramme = async (req, res) => {
  const { programme_code, programme_name, duration_years } = req.body;
  try {
    await adminModel.createProgramme(programme_code, programme_name, duration_years);
    res.redirect("/admin/programmes");
  } catch (err) {
    console.error(err);
    res.send("Error creating programme");
  }
};

exports.updateProgramme = async (req, res) => {
  const { programme_id } = req.params;
  const { programme_code, programme_name, duration_years } = req.body;
  try {
    await adminModel.updateProgramme(programme_id, programme_code, programme_name, duration_years);
    res.redirect("/admin/programmes");
  } catch (err) {
    console.error(err);
    res.send("Error updating programme");
  }
};

exports.deleteProgramme = async (req, res) => {
  const { programme_id } = req.params;
  try {
    const deps = await adminModel.getProgrammeDependencies(programme_id);
    
    if (deps.students > 0 || deps.semesters > 0) {
      return res.send("Cannot delete programme with existing students or semesters.");
    }
    
    await adminModel.deleteProgramme(programme_id);
    res.redirect("/admin/programmes");
  } catch (err) {
    console.error(err);
    res.send("Error deleting programme");
  }
};

// Students
exports.studentsPage = async (req, res) => {
  try {
    const students = await adminModel.getStudentsWithDetails();
    const programmes = await adminModel.getProgrammes();
    res.render("admin/students", { students, programmes });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.registerStudent = async (req, res) => {
  const { username, email, password, registration_number, programme_id, enrollment_year } = req.body;
  try {
    const user_id = await adminModel.createStudentUser(username, email, password);
    await adminModel.createStudent(user_id, registration_number, programme_id, enrollment_year);
    res.redirect("/admin/students");
  } catch (err) {
    console.error(err);
    res.send("Error registering student");
  }
};

exports.updateStudent = async (req, res) => {
  const { student_id } = req.params;
  const { username, email, registration_number, programme_id, enrollment_year } = req.body;
  try {
    const user_id = await adminModel.getStudentUserId(student_id);
    if (!user_id) return res.send("Student not found");

    await adminModel.updateStudentUser(username, email, user_id);
    await adminModel.updateStudent(student_id, registration_number, programme_id, enrollment_year);
    res.redirect("/admin/students");
  } catch (err) {
    console.error(err);
    res.send("Error updating student");
  }
};

exports.deleteStudent = async (req, res) => {
  const { student_id } = req.params;
  try {
    const user_id = await adminModel.getStudentUserId(student_id);
    if (!user_id) return res.send("Student not found");

    await adminModel.deleteStudentDependencies(student_id);
    await adminModel.deleteStudentAndUser(student_id, user_id);
    res.redirect("/admin/students");
  } catch (err) {
    console.error(err);
    res.send("Error deleting student");
  }
};

exports.searchStudents = async (req, res) => {
  const { query } = req.query;
  try {
    const students = await adminModel.searchStudents(query);
    res.json(students);
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

// Semesters
exports.semestersPage = async (req, res) => {
  try {
    const semesters = await adminModel.getSemestersWithProgrammes();
    const programmes = await adminModel.getProgrammes();
    res.render("admin/semesters", { semesters, programmes });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.createSemester = async (req, res) => {
  const { programme_id, semester_number, academic_year, start_date, end_date } = req.body;
  try {
    await adminModel.createSemester(programme_id, semester_number, academic_year, start_date, end_date);
    res.redirect("/admin/semesters");
  } catch (err) {
    console.error(err);
    res.send("Error creating semester");
  }
};

exports.updateSemester = async (req, res) => {
  const { semester_id } = req.params;
  const { programme_id, semester_number, academic_year, start_date, end_date } = req.body;
  try {
    await adminModel.updateSemester(semester_id, programme_id, semester_number, academic_year, start_date, end_date);
    res.redirect("/admin/semesters");
  } catch (err) {
    console.error(err);
    res.send("Error updating semester");
  }
};

exports.deleteSemester = async (req, res) => {
  const { semester_id } = req.params;
  try {
    await adminModel.deleteSemester(semester_id);
    res.redirect("/admin/semesters");
  } catch (err) {
    console.error(err);
    res.send("Error deleting semester");
  }
};

// Subjects
exports.subjectsPage = async (req, res) => {
  try {
    const subjects = await adminModel.getSubjects();
    res.render("admin/subjects", { subjects });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.createSubject = async (req, res) => {
  const { subject_code, subject_name, credit_hours, max_marks } = req.body;
  try {
    await adminModel.createSubject(subject_code, subject_name, credit_hours, max_marks);
    res.redirect("/admin/subjects");
  } catch (err) {
    console.error(err);
    res.send("Error creating subject");
  }
};

exports.updateSubject = async (req, res) => {
  const { subject_id } = req.params;
  const { subject_code, subject_name, credit_hours, max_marks } = req.body;
  try {
    await adminModel.updateSubject(subject_id, subject_code, subject_name, credit_hours, max_marks);
    res.redirect("/admin/subjects");
  } catch (err) {
    console.error(err);
    res.send("Error updating subject");
  }
};

exports.deleteSubject = async (req, res) => {
  const { subject_id } = req.params;
  try {
    await adminModel.deleteSubject(subject_id);
    res.redirect("/admin/subjects");
  } catch (err) {
    console.error(err);
    res.send("Error deleting subject");
  }
};

// Enrollments
exports.enrollmentsPage = async (req, res) => {
  try {
    const enrollments = await adminModel.getEnrollmentsWithDetails();
    const students = await adminModel.getStudentsBasic();
    const subjects = await adminModel.getSubjectsBasic();
    const semesters = await adminModel.getSemestersBasic();
    const programmes = await adminModel.getProgrammesBasic();
    res.render("admin/enrollments", { enrollments, students, subjects, semesters, programmes });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.enrollStudent = async (req, res) => {
  const { student_id, subject_id, semester_id } = req.body;
  try {
    await adminModel.createEnrollment(student_id, subject_id, semester_id);
    res.redirect("/admin/enrollments");
  } catch (err) {
    console.error(err);
    res.send("Error enrolling student");
  }
};

exports.updateEnrollment = async (req, res) => {
  const { enrollment_id } = req.params;
  const { student_id, subject_id, semester_id } = req.body;
  try {
    await adminModel.updateEnrollment(enrollment_id, student_id, subject_id, semester_id);
    res.redirect("/admin/enrollments");
  } catch (err) {
    console.error(err);
    res.send("Error updating enrollment");
  }
};

exports.deleteEnrollment = async (req, res) => {
  const { enrollment_id } = req.params;
  try {
    await adminModel.deleteEnrollment(enrollment_id);
    res.redirect("/admin/enrollments");
  } catch (err) {
    console.error(err);
    res.send("Error deleting enrollment");
  }
};

// Results
exports.resultsPage = async (req, res) => {
  try {
    const results = await adminModel.getAllResults();
    const semesters = await adminModel.getSemestersBasic();
    res.render("admin/results", { results, semesters });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.publishResults = async (req, res) => {
  const { semester_id } = req.body;
  try {
    await adminModel.publishResults(semester_id);
    res.redirect("/admin/results");
  } catch (err) {
    console.error(err);
    res.send("Error publishing results");
  }
};

exports.withholdResult = async (req, res) => {
  const { result_id } = req.body;
  try {
    await adminModel.withholdResult(result_id);
    res.redirect("/admin/results");
  } catch (err) {
    console.error(err);
    res.send("Error withholding result");
  }
};

// Reports
exports.reportsPage = async (req, res) => {
  try {
    const semesters = await adminModel.getSemestersBasic();
    const subjects = await adminModel.getSubjectsBasic();
    res.render("admin/reports", { semesters, subjects });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.exportReport = async (req, res) => {
  const { semester_id, subject_id } = req.query;
  try {
    const results = await adminModel.getResultsForReport(semester_id, subject_id);

    let csv = "Registration Number,Student Name,Marks,Grade,GPA\n";
    results.forEach(row => {
      csv += `${row.registration_number},${row.username},${row.marks},${row.grade_letter},${row.grade_point}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('report.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.send("Error exporting report");
  }
};

// Users
exports.usersPage = async (req, res) => {
  try {
    const users = await adminModel.getUsers();
    res.render("admin/users", { users });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.createUser = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    await adminModel.createUserWithRole(username, email, password, role);
    res.redirect("/admin/users");
  } catch (err) {
    console.error(err);
    res.send("Error creating user");
  }
};

exports.updateUser = async (req, res) => {
  const { user_id } = req.params;
  const { username, email, password, role, is_active } = req.body;
  try {
    await adminModel.updateUser(user_id, username, email, password, role, is_active);
    res.redirect("/admin/users");
  } catch (err) {
    console.error(err);
    res.send("Error updating user");
  }
};

exports.deleteUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    await adminModel.deleteUser(user_id);
    res.redirect("/admin/users");
  } catch (err) {
    console.error(err);
    res.send("Error deleting user");
  }
};

// Allocations
exports.allocationsPage = async (req, res) => {
  try {
    const allocations = await adminModel.getAllocationsDetails();
    const facultyList = await adminModel.getFacultyList();
    const subjects = await adminModel.getSubjectsBasic();
    const semesters = await adminModel.getSemestersBasic();

    res.render("admin/allocations", { allocations, facultyList, subjects, semesters });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

exports.createAllocation = async (req, res) => {
  const { faculty_id, subject_id, semester_id } = req.body;
  try {
    const exists = await adminModel.checkAllocationExists(faculty_id, subject_id, semester_id);
    if (exists) {
      return res.status(400).send("This specific allocation already exists.");
    }
    await adminModel.createAllocation(faculty_id, subject_id, semester_id);
    res.redirect("/admin/allocations");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

exports.deleteAllocation = async (req, res) => {
  const { allocation_id } = req.params;
  try {
    await adminModel.deleteAllocation(allocation_id);
    res.redirect("/admin/allocations");
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).send("Cannot delete allocation. Faculty has likely already entered marks.");
    }
    res.status(500).send("Server Error");
  }
};

exports.bulkEnroll = async (req, res) => {
  const { programme_id, semester_id, subject_id } = req.body;
  try {
    const students = await adminModel.getActiveStudentsInProgramme(programme_id);
    if (!students.length) {
      return res.status(400).send("No active students found in this programme to enroll.");
    }
    await adminModel.bulkEnrollStudents(students, subject_id, semester_id);
    res.redirect("/admin/enrollments");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error processing bulk enrollment.");
  }
};

// Grading Configuration
exports.gradingPage = async (req, res) => {
  try {
    const grades = await adminModel.getGradeScales();
    res.render("admin/grading", { grades });
  } catch (err) {
    console.error(err);
    res.send("Error loading grading config");
  }
};

exports.createGrade = async (req, res) => {
  const { grade_letter, min_score, max_score, grade_point } = req.body;
  try {
    const overlap = await adminModel.checkGradeOverlap(min_score, max_score);
    if (overlap.length > 0) {
      return res.status(400).send(`Grade range overlaps with existing grade "${overlap[0].grade_letter}" (${overlap[0].min_score}–${overlap[0].max_score}). Please fix the ranges first.`);
    }
    await adminModel.createGradeScale(grade_letter, min_score, max_score, grade_point);
    res.redirect("/admin/grading");
  } catch (err) {
    console.error(err);
    res.send("Error creating grade");
  }
};

exports.updateGrade = async (req, res) => {
  const { grade_id } = req.params;
  const { grade_letter, min_score, max_score, grade_point } = req.body;
  try {
    await adminModel.updateGradeScale(grade_id, grade_letter, min_score, max_score, grade_point);
    res.redirect("/admin/grading");
  } catch (err) {
    console.error(err);
    res.send("Error updating grade");
  }
};

exports.deleteGrade = async (req, res) => {
  const { grade_id } = req.params;
  try {
    await adminModel.deleteGradeScale(grade_id);
    res.redirect("/admin/grading");
  } catch (err) {
    console.error(err);
    res.send("Error deleting grade");
  }
};
