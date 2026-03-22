const db = require("../config/db");

exports.dashboard = async (req, res) => {
  try {
    const studentId = req.session.user.user_id;
    const [student] = await db.query(`
      SELECT s.*, p.programme_name FROM students s
      JOIN programmes p ON s.programme_id = p.programme_id
      WHERE s.user_id = ?
    `, [studentId]);

    // Get published results
    const [results] = await db.query(`
      SELECT r.*, sub.subject_name, sub.credit_hours, sem.academic_year, sem.semester_number
      FROM results r
      JOIN enrollments e ON r.enrollment_id = e.enrollment_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      JOIN semesters sem ON e.semester_id = sem.semester_id
      WHERE e.student_id = (SELECT student_id FROM students WHERE user_id = ?) AND r.result_status = 'PUBLISHED'
      ORDER BY sem.academic_year, sem.semester_number
    `, [studentId]);

    res.render("student/dashboard", { user: req.session.user, student: student[0], results });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.viewResults = async (req, res) => {
  const { semester_id } = req.params;
  try {
    const studentId = req.session.user.user_id;
    const [results] = await db.query(`
      SELECT r.*, sub.subject_code, sub.subject_name, sub.max_marks, sub.credit_hours, sem.academic_year, sem.semester_number
      FROM results r
      JOIN enrollments e ON r.enrollment_id = e.enrollment_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      JOIN semesters sem ON e.semester_id = sem.semester_id
      WHERE e.student_id = (SELECT student_id FROM students WHERE user_id = ?) AND sem.semester_id = ? AND r.result_status = 'PUBLISHED'
    `, [studentId, semester_id]);

    const semesterGPA = results.reduce((sum, r) => sum + (r.grade_point * r.credit_hours), 0) / results.reduce((sum, r) => sum + r.credit_hours, 0);

    res.render("student/results", { results, semesterGPA });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.downloadTranscript = async (req, res) => {
  try {
    const studentId = req.session.user.user_id;
    const [student] = await db.query(`
      SELECT s.*, u.username, u.email, p.programme_name FROM students s
      JOIN users u ON s.user_id = u.user_id
      JOIN programmes p ON s.programme_id = p.programme_id
      WHERE s.user_id = ?
    `, [studentId]);

    const [results] = await db.query(`
      SELECT r.*, sub.subject_name, sub.credit_hours, sem.academic_year, sem.semester_number
      FROM results r
      JOIN enrollments e ON r.enrollment_id = e.enrollment_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      JOIN semesters sem ON e.semester_id = sem.semester_id
      WHERE e.student_id = ? AND r.result_status = 'PUBLISHED'
      ORDER BY sem.academic_year, sem.semester_number
    `, [student[0].student_id]);

    // Simple PDF generation (in real app, use pdfkit or similar)
    let transcript = `Transcript for ${student[0].username}\nProgramme: ${student[0].programme_name}\n\n`;
    let totalCredits = 0;
    let totalPoints = 0;
    results.forEach(r => {
      transcript += `${r.academic_year} Sem ${r.semester_number}: ${r.subject_name} - ${r.grade_letter} (${r.grade_point})\n`;
      totalCredits += r.credit_hours;
      totalPoints += r.grade_point * r.credit_hours;
    });
    const cgpa = totalPoints / totalCredits;
    transcript += `\nCumulative GPA: ${cgpa.toFixed(2)}`;

    res.header('Content-Type', 'text/plain');
    res.attachment('transcript.txt');
    res.send(transcript);
  } catch (err) {
    console.error(err);
    res.send("Error generating transcript");
  }
};

exports.viewGPA = async (req, res) => {
  try {
    const studentId = req.session.user.user_id;
    const [gpas] = await db.query(`
      SELECT sem.academic_year, sem.semester_number,
             SUM(r.grade_point * sub.credit_hours) / SUM(sub.credit_hours) as gpa
      FROM results r
      JOIN enrollments e ON r.enrollment_id = e.enrollment_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      JOIN semesters sem ON e.semester_id = sem.semester_id
      WHERE e.student_id = (SELECT student_id FROM students WHERE user_id = ?) AND r.result_status = 'PUBLISHED'
      GROUP BY sem.semester_id
      ORDER BY sem.academic_year, sem.semester_number
    `, [studentId]);

    res.render("student/gpa", { gpas });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};
