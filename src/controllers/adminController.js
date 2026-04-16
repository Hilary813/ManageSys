const db = require("../config/db");

exports.dashboard = async (req, res) => {
  try {
    // Get summary stats
    const [totalStudents] = await db.query("SELECT COUNT(*) as count FROM students");
    const [totalSubjects] = await db.query("SELECT COUNT(*) as count FROM subjects");
    const [activeSemesters] = await db.query("SELECT COUNT(*) as count FROM semesters WHERE end_date >= CURDATE()");
    const [pendingSubmissions] = await db.query(`
      SELECT COUNT(*) as count FROM subject_allocations sa
      LEFT JOIN marks m ON sa.allocation_id = m.enrollment_id
      WHERE m.entry_status IS NULL OR m.entry_status = 'DRAFT'
    `);

    // Get current examination sessions
    const [sessions] = await db.query(`
      SELECT s.semester_id, s.academic_year, s.semester_number, p.programme_name,
             COUNT(sa.allocation_id) as subjects, COUNT(m.mark_id) as submitted
      FROM semesters s
      JOIN programmes p ON s.programme_id = p.programme_id
      LEFT JOIN subject_allocations sa ON s.semester_id = sa.semester_id
      LEFT JOIN marks m ON sa.allocation_id = m.enrollment_id AND m.entry_status = 'SUBMITTED'
      GROUP BY s.semester_id
    `);
    const payload = {
      user: req.session.user,
      stats: {
        totalStudents: totalStudents[0].count,
        totalSubjects: totalSubjects[0].count,
        activeSemesters: activeSemesters[0].count,
        pendingSubmissions: pendingSubmissions[0].count
      },
      sessions
    };
    console.log(payload);
    // ... rest of dashboard logic
    res.render("admin/dashboard", payload);
  } catch (err) {
    console.error(err);
    res.send("Error loading dashboard");
  }
};

// Programmes
exports.programmesPage = async (req, res) => {
  try {
    const [programmes] = await db.query(`
      SELECT p.*,
             (SELECT COUNT(*) FROM students s WHERE s.programme_id = p.programme_id) as student_count,
             (SELECT COUNT(*) FROM semesters sem WHERE sem.programme_id = p.programme_id) as semester_count
      FROM programmes p
    `);
    res.render("admin/programmes", { programmes });
  } catch (err) {
    console.error(err);
    res.send("Error loading programmes");
  }
};

exports.programmeDetailsPage = async (req, res) => {
  const { programme_id } = req.params;
  try {
    const [programme] = await db.query("SELECT * FROM programmes WHERE programme_id = ?", [programme_id]);
    if (!programme.length) return res.send("Programme not found");

    const [students] = await db.query("SELECT s.*, u.username, u.email FROM students s JOIN users u ON s.user_id = u.user_id WHERE s.programme_id = ?", [programme_id]);
    const [semesters] = await db.query("SELECT * FROM semesters WHERE programme_id = ?", [programme_id]);
    
    // Get unique subjects taught in this programme's semesters
    const [subjects] = await db.query(`
      SELECT DISTINCT sub.*
      FROM subjects sub
      JOIN subject_allocations sa ON sub.subject_id = sa.subject_id
      JOIN semesters sem ON sa.semester_id = sem.semester_id
      WHERE sem.programme_id = ?
    `, [programme_id]);

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
    await db.query("INSERT INTO programmes (programme_code, programme_name, duration_years) VALUES (?, ?, ?)", [programme_code, programme_name, duration_years]);
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
    await db.query("UPDATE programmes SET programme_code = ?, programme_name = ?, duration_years = ? WHERE programme_id = ?", [programme_code, programme_name, duration_years, programme_id]);
    res.redirect("/admin/programmes");
  } catch (err) {
    console.error(err);
    res.send("Error updating programme");
  }
};

exports.deleteProgramme = async (req, res) => {
  const { programme_id } = req.params;
  try {
    // Basic dependency check - a robust system would handle cascading differently or block deletion
    const [students] = await db.query("SELECT COUNT(*) as count FROM students WHERE programme_id = ?", [programme_id]);
    const [semesters] = await db.query("SELECT COUNT(*) as count FROM semesters WHERE programme_id = ?", [programme_id]);
    
    if (students[0].count > 0 || semesters[0].count > 0) {
      return res.send("Cannot delete programme with existing students or semesters.");
    }
    
    await db.query("DELETE FROM programmes WHERE programme_id = ?", [programme_id]);
    res.redirect("/admin/programmes");
  } catch (err) {
    console.error(err);
    res.send("Error deleting programme");
  }
};

// Students
exports.studentsPage = async (req, res) => {
  try {
    const [students] = await db.query(`
      SELECT s.*, u.username, u.email, p.programme_name
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      JOIN programmes p ON s.programme_id = p.programme_id
    `);
    const [programmes] = await db.query("SELECT * FROM programmes");
    res.render("admin/students", { students, programmes });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.registerStudent = async (req, res) => {
  const { username, email, password, registration_number, programme_id, enrollment_year } = req.body;
  try {
    await db.query("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'STUDENT')", [username, email, password]);
    const [user] = await db.query("SELECT user_id FROM users WHERE username = ?", [username]);
    await db.query("INSERT INTO students (user_id, registration_number, programme_id, enrollment_year) VALUES (?, ?, ?, ?)", [user[0].user_id, registration_number, programme_id, enrollment_year]);
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
    // Get user_id from student_id
    const [student] = await db.query("SELECT user_id FROM students WHERE student_id = ?", [student_id]);
    if (student.length === 0) return res.send("Student not found");

    await db.query("UPDATE users SET username = ?, email = ? WHERE user_id = ?", [username, email, student[0].user_id]);
    await db.query("UPDATE students SET registration_number = ?, programme_id = ?, enrollment_year = ? WHERE student_id = ?", [registration_number, programme_id, enrollment_year, student_id]);
    res.redirect("/admin/students");
  } catch (err) {
    console.error(err);
    res.send("Error updating student");
  }
};

exports.deleteStudent = async (req, res) => {
  const { student_id } = req.params;
  try {
    // Get user_id first
    const [student] = await db.query("SELECT user_id FROM students WHERE student_id = ?", [student_id]);
    if (student.length === 0) return res.send("Student not found");

    // Delete in correct order due to foreign keys
    await db.query("DELETE FROM enrollments WHERE student_id = ?", [student_id]);
    await db.query("DELETE FROM results WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE student_id = ?)", [student_id]);
    await db.query("DELETE FROM marks WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE student_id = ?)", [student_id]);
    await db.query("DELETE FROM students WHERE student_id = ?", [student_id]);
    await db.query("DELETE FROM users WHERE user_id = ?", [student[0].user_id]);
    res.redirect("/admin/students");
  } catch (err) {
    console.error(err);
    res.send("Error deleting student");
  }
};

exports.searchStudents = async (req, res) => {
  const { query } = req.query;
  try {
    const [students] = await db.query(`
      SELECT s.*, u.username, u.email, p.programme_name
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      JOIN programmes p ON s.programme_id = p.programme_id
      WHERE u.username LIKE ? OR u.email LIKE ? OR s.registration_number LIKE ? OR p.programme_name LIKE ?
    `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);
    res.json(students);
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

// Semesters
exports.semestersPage = async (req, res) => {
  try {
    const [semesters] = await db.query(`
      SELECT s.*, p.programme_name
      FROM semesters s
      JOIN programmes p ON s.programme_id = p.programme_id
    `);
    const [programmes] = await db.query("SELECT * FROM programmes");
    res.render("admin/semesters", { semesters, programmes });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.createSemester = async (req, res) => {
  const { programme_id, semester_number, academic_year, start_date, end_date } = req.body;
  try {
    await db.query("INSERT INTO semesters (programme_id, semester_number, academic_year, start_date, end_date) VALUES (?, ?, ?, ?, ?)", [programme_id, semester_number, academic_year, start_date, end_date]);
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
    await db.query("UPDATE semesters SET programme_id = ?, semester_number = ?, academic_year = ?, start_date = ?, end_date = ? WHERE semester_id = ?", [programme_id, semester_number, academic_year, start_date, end_date, semester_id]);
    res.redirect("/admin/semesters");
  } catch (err) {
    console.error(err);
    res.send("Error updating semester");
  }
};

exports.deleteSemester = async (req, res) => {
  const { semester_id } = req.params;
  try {
    // Delete in correct order due to foreign keys
    await db.query("DELETE FROM subject_allocations WHERE semester_id = ?", [semester_id]);
    await db.query("DELETE FROM enrollments WHERE semester_id = ?", [semester_id]);
    await db.query("DELETE FROM results WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE semester_id = ?)", [semester_id]);
    await db.query("DELETE FROM marks WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE semester_id = ?)", [semester_id]);
    await db.query("DELETE FROM semesters WHERE semester_id = ?", [semester_id]);
    res.redirect("/admin/semesters");
  } catch (err) {
    console.error(err);
    res.send("Error deleting semester");
  }
};

// Subjects
exports.subjectsPage = async (req, res) => {
  try {
    const [subjects] = await db.query("SELECT * FROM subjects");
    res.render("admin/subjects", { subjects });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.createSubject = async (req, res) => {
  const { subject_code, subject_name, credit_hours, max_marks } = req.body;
  try {
    await db.query("INSERT INTO subjects (subject_code, subject_name, credit_hours, max_marks) VALUES (?, ?, ?, ?)", [subject_code, subject_name, credit_hours, max_marks]);
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
    await db.query("UPDATE subjects SET subject_code = ?, subject_name = ?, credit_hours = ?, max_marks = ? WHERE subject_id = ?", [subject_code, subject_name, credit_hours, max_marks, subject_id]);
    res.redirect("/admin/subjects");
  } catch (err) {
    console.error(err);
    res.send("Error updating subject");
  }
};

exports.deleteSubject = async (req, res) => {
  const { subject_id } = req.params;
  try {
    // Delete in correct order due to foreign keys
    await db.query("DELETE FROM subject_allocations WHERE subject_id = ?", [subject_id]);
    await db.query("DELETE FROM enrollments WHERE subject_id = ?", [subject_id]);
    await db.query("DELETE FROM results WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE subject_id = ?)", [subject_id]);
    await db.query("DELETE FROM marks WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE subject_id = ?)", [subject_id]);
    await db.query("DELETE FROM subjects WHERE subject_id = ?", [subject_id]);
    res.redirect("/admin/subjects");
  } catch (err) {
    console.error(err);
    res.send("Error deleting subject");
  }
};

// Enrollments
exports.enrollmentsPage = async (req, res) => {
  try {
    const [enrollments] = await db.query(`
      SELECT e.*, s.registration_number,u.username as username, sub.subject_name, sem.academic_year, sem.semester_number
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      join users u on s.user_id = u.user_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      JOIN semesters sem ON e.semester_id = sem.semester_id
    `);
    const [students] = await db.query("SELECT student_id, registration_number,u.username as username  FROM students join users u on students.user_id = u.user_id");
    const [subjects] = await db.query("SELECT subject_id, subject_name FROM subjects");
    const [semesters] = await db.query("SELECT semester_id, academic_year, semester_number FROM semesters");
    const [programmes] = await db.query("SELECT programme_id, programme_name FROM programmes");
    res.render("admin/enrollments", { enrollments, students, subjects, semesters, programmes });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.enrollStudent = async (req, res) => {
  const { student_id, subject_id, semester_id } = req.body;
  try {
    await db.query("INSERT INTO enrollments (student_id, subject_id, semester_id) VALUES (?, ?, ?)", [student_id, subject_id, semester_id]);
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
    await db.query("UPDATE enrollments SET student_id = ?, subject_id = ?, semester_id = ? WHERE enrollment_id = ?", [student_id, subject_id, semester_id, enrollment_id]);
    res.redirect("/admin/enrollments");
  } catch (err) {
    console.error(err);
    res.send("Error updating enrollment");
  }
};

exports.deleteEnrollment = async (req, res) => {
  const { enrollment_id } = req.params;
  try {
    // Delete related records first
    await db.query("DELETE FROM results WHERE enrollment_id = ?", [enrollment_id]);
    await db.query("DELETE FROM marks WHERE enrollment_id = ?", [enrollment_id]);
    await db.query("DELETE FROM enrollments WHERE enrollment_id = ?", [enrollment_id]);
    res.redirect("/admin/enrollments");
  } catch (err) {
    console.error(err);
    res.send("Error deleting enrollment");
  }
};

// Results
exports.resultsPage = async (req, res) => {
  try {
    // JOIN both marks AND results so submitted marks always show regardless of grade computation
    const [results] = await db.query(`
      SELECT e.enrollment_id,
             s.registration_number, u.username,
             sub.subject_name, sem.academic_year, sem.semester_number,
             m.marks_obtained, m.entry_status as marks_status,
             r.result_id, r.marks, r.grade_letter, r.grade_point, r.result_status
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      JOIN semesters sem ON e.semester_id = sem.semester_id
      LEFT JOIN marks m ON m.enrollment_id = e.enrollment_id
      LEFT JOIN results r ON r.enrollment_id = e.enrollment_id
      ORDER BY sem.academic_year, sem.semester_number, s.registration_number
    `);
    const [semesters] = await db.query("SELECT semester_id, academic_year, semester_number FROM semesters");
    res.render("admin/results", { results, semesters });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.publishResults = async (req, res) => {
  const { semester_id } = req.body;
  try {
    await db.query(`
      UPDATE results SET result_status = 'PUBLISHED'
      WHERE enrollment_id IN (
        SELECT enrollment_id FROM enrollments WHERE semester_id = ?
      )
    `, [semester_id]);
    res.redirect("/admin/results");
  } catch (err) {
    console.error(err);
    res.send("Error publishing results");
  }
};

exports.withholdResult = async (req, res) => {
  const { result_id } = req.body;
  try {
    await db.query("UPDATE results SET result_status = 'WITHHELD' WHERE result_id = ?", [result_id]);
    res.redirect("/admin/results");
  } catch (err) {
    console.error(err);
    res.send("Error withholding result");
  }
};

// Reports
exports.reportsPage = async (req, res) => {
  try {
    const [semesters] = await db.query("SELECT semester_id, academic_year, semester_number FROM semesters");
    const [subjects] = await db.query("SELECT subject_id, subject_name FROM subjects");
    res.render("admin/reports", { semesters, subjects });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.exportReport = async (req, res) => {
  // Simple CSV export for class result sheet
  const { semester_id, subject_id } = req.query;
  try {
    const [results] = await db.query(`
      SELECT s.registration_number, u.username, r.marks, r.grade_letter, r.grade_point
      FROM results r
      JOIN enrollments e ON r.enrollment_id = e.enrollment_id
      JOIN students s ON e.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      WHERE e.semester_id = ? AND e.subject_id = ?
    `, [semester_id, subject_id]);

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
    const [users] = await db.query("SELECT * FROM users");
    res.render("admin/users", { users });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.createUser = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    await db.query("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)", [username, email, password, role]);
    if (role === 'FACULTY') {
      const [user] = await db.query("SELECT user_id FROM users WHERE username = ?", [username]);
      await db.query("INSERT INTO faculty (user_id) VALUES (?)", [user[0].user_id]);
    }
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
    if (password && password.trim() !== '') {
      await db.query("UPDATE users SET username = ?, email = ?, password_hash = ?, role = ?, is_active = ? WHERE user_id = ?", [username, email, password, role, is_active ? 1 : 0, user_id]);
    } else {
      await db.query("UPDATE users SET username = ?, email = ?, role = ?, is_active = ? WHERE user_id = ?", [username, email, role, is_active ? 1 : 0, user_id]);
    }
    res.redirect("/admin/users");
  } catch (err) {
    console.error(err);
    res.send("Error updating user");
  }
};

exports.deleteUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    // Check if user is faculty and delete faculty record first
    await db.query("DELETE FROM faculty WHERE user_id = ?", [user_id]);
    
    // Delete related student records if any
    const [student] = await db.query("SELECT student_id FROM students WHERE user_id = ?", [user_id]);
    if (student.length > 0) {
      await db.query("DELETE FROM enrollments WHERE student_id = ?", [student[0].student_id]);
      await db.query("DELETE FROM results WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE student_id = ?)", [student[0].student_id]);
      await db.query("DELETE FROM marks WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE student_id = ?)", [student[0].student_id]);
      await db.query("DELETE FROM students WHERE user_id = ?", [user_id]);
    }
    
    // Delete subject allocations for faculty
    await db.query("DELETE FROM subject_allocations WHERE faculty_id IN (SELECT faculty_id FROM faculty WHERE user_id = ?)", [user_id]);
    
    // Finally delete the user
    await db.query("DELETE FROM users WHERE user_id = ?", [user_id]);
    res.redirect("/admin/users");
  } catch (err) {
    console.error(err);
    res.send("Error deleting user");
  }
};
exports.allocationsPage = async (req, res) => {
  try {
    const [allocations] = await db.query(`
      SELECT sa.*, u.username, f.department, s.subject_name, sem.academic_year, sem.semester_number, p.programme_name
      FROM subject_allocations sa
      JOIN faculty f ON sa.faculty_id = f.faculty_id
      JOIN users u ON f.user_id = u.user_id
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN semesters sem ON sa.semester_id = sem.semester_id
      JOIN programmes p ON sem.programme_id = p.programme_id
    `);
    
    // Fetch data for the modal dropdowns
    const [facultyList] = await db.query(`
      SELECT f.faculty_id, u.username, f.department 
      FROM faculty f 
      JOIN users u ON f.user_id = u.user_id 
      WHERE u.is_active = 1
    `);
    const [subjects] = await db.query("SELECT subject_id, subject_code, subject_name FROM subjects");
    const [semesters] = await db.query(`
      SELECT sem.semester_id, sem.academic_year, sem.semester_number, p.programme_name 
      FROM semesters sem 
      JOIN programmes p ON sem.programme_id = p.programme_id
    `);

    res.render("admin/allocations", { allocations, facultyList, subjects, semesters });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

exports.createAllocation = async (req, res) => {
  const { faculty_id, subject_id, semester_id } = req.body;
  try {
    // Check if allocation already exists
    const [existing] = await db.query(
      "SELECT * FROM subject_allocations WHERE faculty_id = ? AND subject_id = ? AND semester_id = ?",
      [faculty_id, subject_id, semester_id]
    );

    if (existing.length > 0) {
      return res.status(400).send("This specific allocation already exists.");
    }

    await db.query(
      "INSERT INTO subject_allocations (faculty_id, subject_id, semester_id) VALUES (?, ?, ?)",
      [faculty_id, subject_id, semester_id]
    );
    res.redirect("/admin/allocations");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

exports.deleteAllocation = async (req, res) => {
  const { allocation_id } = req.params;
  try {
    // Basic dependency check - ensure we don't delete if marks are recorded for this allocation etc.
    // Assuming marks are tied to enrollments, but maybe entered_by is tied to faculty.
    await db.query("DELETE FROM subject_allocations WHERE allocation_id = ?", [allocation_id]);
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
    // Fetch all active students in this programme
    const [students] = await db.query(`
      SELECT s.student_id 
      FROM students s 
      JOIN users u ON s.user_id = u.user_id 
      WHERE s.programme_id = ? AND s.status = 'ACTIVE' AND u.is_active = 1
    `, [programme_id]);

    if (!students.length) {
      return res.status(400).send("No active students found in this programme to enroll.");
    }

    // Insert enrollments, ignoring duplicates (since we have a UNIQUE constraint)
    for (const student of students) {
      await db.query(
        "INSERT IGNORE INTO enrollments (student_id, subject_id, semester_id) VALUES (?, ?, ?)",
        [student.student_id, subject_id, semester_id]
      );
    }

    res.redirect("/admin/enrollments");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error processing bulk enrollment.");
  }
};

// Grading Configuration
exports.gradingPage = async (req, res) => {
  try {
    const [grades] = await db.query("SELECT * FROM grade_scale ORDER BY min_score DESC");
    res.render("admin/grading", { grades });
  } catch (err) {
    console.error(err);
    res.send("Error loading grading config");
  }
};

exports.createGrade = async (req, res) => {
  const { grade_letter, min_score, max_score, grade_point } = req.body;
  try {
    // Check for overlapping ranges
    const [overlap] = await db.query(`
      SELECT * FROM grade_scale 
      WHERE ? <= max_score AND ? >= min_score
    `, [min_score, max_score]);
    if (overlap.length > 0) {
      return res.status(400).send(`Grade range overlaps with existing grade "${overlap[0].grade_letter}" (${overlap[0].min_score}–${overlap[0].max_score}). Please fix the ranges first.`);
    }
    await db.query(
      "INSERT INTO grade_scale (grade_letter, min_score, max_score, grade_point) VALUES (?, ?, ?, ?)",
      [grade_letter.toUpperCase(), min_score, max_score, grade_point]
    );
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
    await db.query(
      "UPDATE grade_scale SET grade_letter = ?, min_score = ?, max_score = ?, grade_point = ? WHERE grade_id = ?",
      [grade_letter.toUpperCase(), min_score, max_score, grade_point, grade_id]
    );
    res.redirect("/admin/grading");
  } catch (err) {
    console.error(err);
    res.send("Error updating grade");
  }
};

exports.deleteGrade = async (req, res) => {
  const { grade_id } = req.params;
  try {
    await db.query("DELETE FROM grade_scale WHERE grade_id = ?", [grade_id]);
    res.redirect("/admin/grading");
  } catch (err) {
    console.error(err);
    res.send("Error deleting grade");
  }
};
