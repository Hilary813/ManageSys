const db = require("../../db/db");

exports.getStudentProfile = async (userId) => {
  const [student] = await db.query(`
    SELECT s.*, p.programme_name FROM students s
    JOIN programmes p ON s.programme_id = p.programme_id
    WHERE s.user_id = ?
  `, [userId]);
  return student;
};

exports.getPublishedResults = async (userId) => {
  const [results] = await db.query(`
    SELECT r.*, sub.subject_name, sub.credit_hours, sem.academic_year, sem.semester_number
    FROM results r
    JOIN enrollments e ON r.enrollment_id = e.enrollment_id
    JOIN subjects sub ON e.subject_id = sub.subject_id
    JOIN semesters sem ON e.semester_id = sem.semester_id
    WHERE e.student_id = (SELECT student_id FROM students WHERE user_id = ?) AND r.result_status = 'PUBLISHED'
    ORDER BY sem.academic_year, sem.semester_number
  `, [userId]);
  return results;
};

exports.getSemesterResults = async (userId, semesterId) => {
  const [results] = await db.query(`
    SELECT r.*, sub.subject_code, sub.subject_name, sub.max_marks, sub.credit_hours, sem.academic_year, sem.semester_number, p.programme_name
    FROM results r
    JOIN enrollments e ON r.enrollment_id = e.enrollment_id
    JOIN subjects sub ON e.subject_id = sub.subject_id
    JOIN semesters sem ON e.semester_id = sem.semester_id
    JOIN programmes p ON sem.programme_id = p.programme_id
    WHERE e.student_id = (SELECT student_id FROM students WHERE user_id = ?) AND sem.semester_id = ? AND r.result_status = 'PUBLISHED'
  `, [userId, semesterId]);
  return results;
};

exports.getStudentProfileWithUser = async (userId) => {
  const [student] = await db.query(`
    SELECT s.*, u.username, u.email, p.programme_name FROM students s
    JOIN users u ON s.user_id = u.user_id
    JOIN programmes p ON s.programme_id = p.programme_id
    WHERE s.user_id = ?
  `, [userId]);
  return student;
};

exports.getPublishedResultsByActualStudentId = async (studentId) => {
  const [results] = await db.query(`
    SELECT r.*, sub.subject_name, sub.credit_hours, sem.academic_year, sem.semester_number
    FROM results r
    JOIN enrollments e ON r.enrollment_id = e.enrollment_id
    JOIN subjects sub ON e.subject_id = sub.subject_id
    JOIN semesters sem ON e.semester_id = sem.semester_id
    WHERE e.student_id = ? AND r.result_status = 'PUBLISHED'
    ORDER BY sem.academic_year, sem.semester_number
  `, [studentId]);
  return results;
};

exports.getGPAs = async (userId) => {
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
  `, [userId]);
  return gpas;
};
