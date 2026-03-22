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
    res.render("admin/dashboard", payload);
  } catch (err) {
    console.error(err);
    res.send("Error loading dashboard");
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

// Enrollments
exports.enrollmentsPage = async (req, res) => {
  try {
    const [enrollments] = await db.query(`
      SELECT e.*, s.registration_number, sub.subject_name, sem.academic_year, sem.semester_number
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      JOIN semesters sem ON e.semester_id = sem.semester_id
    `);
    const [students] = await db.query("SELECT student_id, registration_number FROM students");
    const [subjects] = await db.query("SELECT subject_id, subject_name FROM subjects");
    const [semesters] = await db.query("SELECT semester_id, academic_year, semester_number FROM semesters");
    res.render("admin/enrollments", { enrollments, students, subjects, semesters });
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

// Results
exports.resultsPage = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT r.*, s.registration_number, sub.subject_name, sem.academic_year, sem.semester_number
      FROM results r
      JOIN enrollments e ON r.enrollment_id = e.enrollment_id
      JOIN students s ON e.student_id = s.student_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      JOIN semesters sem ON e.semester_id = sem.semester_id
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
