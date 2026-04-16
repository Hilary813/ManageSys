const db = require("../../db/db");

exports.getFacultyIdByUserId = async (userId) => {
  const [facRow] = await db.query('SELECT faculty_id FROM faculty WHERE user_id = ?', [userId]);
  return facRow.length ? facRow[0].faculty_id : null;
};

exports.getDashboardSubjects = async (facultyId) => {
  const [subjects] = await db.query(`
      SELECT sa.*, s.subject_name, sem.academic_year, sem.semester_number, sem.end_date, p.programme_name,
             COUNT(DISTINCT m.mark_id) as entered_marks, COUNT(DISTINCT e.enrollment_id) as total_students
      FROM subject_allocations sa
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN semesters sem ON sa.semester_id = sem.semester_id
      JOIN programmes p ON sem.programme_id = p.programme_id
      LEFT JOIN enrollments e ON sa.subject_id = e.subject_id AND sa.semester_id = e.semester_id
      LEFT JOIN marks m ON e.enrollment_id = m.enrollment_id
      WHERE sa.faculty_id = ?
      GROUP BY sa.allocation_id
    `, [facultyId]);
  return subjects;
};

exports.getAllocationDetails = async (allocationId) => {
  const [allocation] = await db.query(`
      SELECT sa.*, s.subject_name, s.max_marks, sem.academic_year, sem.semester_number, p.programme_name
      FROM subject_allocations sa
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN semesters sem ON sa.semester_id = sem.semester_id
      JOIN programmes p ON sem.programme_id = p.programme_id
      WHERE sa.allocation_id = ?
    `, [allocationId]);
  return allocation;
};

exports.getEnrolledStudents = async (subjectId, semesterId) => {
  const [enrollments] = await db.query(`
      SELECT e.enrollment_id, s.registration_number, u.username, m.marks_obtained, m.entry_status
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN marks m ON e.enrollment_id = m.enrollment_id
      WHERE e.subject_id = ? AND e.semester_id = ?
    `, [subjectId, semesterId]);
  return enrollments;
};

exports.saveMark = async (enrollmentId, markNum, facultyId) => {
  await db.query(`
      INSERT INTO marks (enrollment_id, marks_obtained, entered_by, entry_status)
      VALUES (?, ?, ?, 'SUBMITTED')
      ON DUPLICATE KEY UPDATE marks_obtained = ?, entry_status = 'SUBMITTED'
    `, [enrollmentId, markNum, facultyId, markNum]);
};

exports.getGradeByMark = async (markNum) => {
  const [grade] = await db.query(
    "SELECT * FROM grade_scale WHERE ? BETWEEN min_score AND max_score ORDER BY min_score DESC LIMIT 1",
    [markNum]
  );
  return grade;
};

exports.saveResult = async (enrollmentId, markNum, gradeLetter, gradePoint) => {
  await db.query(`
      INSERT INTO results (enrollment_id, marks, grade_letter, grade_point, result_status)
      VALUES (?, ?, ?, ?, 'PENDING')
      ON DUPLICATE KEY UPDATE marks = ?, grade_letter = ?, grade_point = ?
    `, [enrollmentId, markNum, gradeLetter, gradePoint, markNum, gradeLetter, gradePoint]);
};

exports.getEnrollmentForCSV = async (registrationStr, allocationId) => {
  const [enrollment] = await db.query(`
      SELECT e.enrollment_id FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      WHERE s.registration_number = ? AND e.subject_id = (
        SELECT subject_id FROM subject_allocations WHERE allocation_id = ?
      ) AND e.semester_id = (
        SELECT semester_id FROM subject_allocations WHERE allocation_id = ?
      )
    `, [registrationStr, allocationId, allocationId]);
  return enrollment;
};

exports.getPerformanceStats = async (allocationId) => {
  const [stats] = await db.query(`
      SELECT AVG(m.marks_obtained) as average, COUNT(*) as total,
             SUM(CASE WHEN m.marks_obtained >= 85 THEN 1 ELSE 0 END) as a_count,
             SUM(CASE WHEN m.marks_obtained >= 70 AND m.marks_obtained < 85 THEN 1 ELSE 0 END) as b_count,
             SUM(CASE WHEN m.marks_obtained >= 55 AND m.marks_obtained < 70 THEN 1 ELSE 0 END) as c_count,
             SUM(CASE WHEN m.marks_obtained >= 40 AND m.marks_obtained < 55 THEN 1 ELSE 0 END) as d_count,
             SUM(CASE WHEN m.marks_obtained < 40 THEN 1 ELSE 0 END) as f_count
      FROM marks m
      JOIN enrollments e ON m.enrollment_id = e.enrollment_id
      WHERE e.subject_id = (SELECT subject_id FROM subject_allocations WHERE allocation_id = ?) 
      AND e.semester_id = (SELECT semester_id FROM subject_allocations WHERE allocation_id = ?)
    `, [allocationId, allocationId]);
  return stats;
};
