const db = require("../../db/db");

// Dashboard
exports.getDashboardStats = async () => {
    const [totalStudents] = await db.query("SELECT COUNT(*) as count FROM students");
    const [totalSubjects] = await db.query("SELECT COUNT(*) as count FROM subjects");
    const [activeSemesters] = await db.query("SELECT COUNT(*) as count FROM semesters WHERE end_date >= CURDATE()");
    const [pendingSubmissions] = await db.query(`
      SELECT COUNT(*) as count FROM subject_allocations sa
      LEFT JOIN marks m ON sa.allocation_id = m.enrollment_id
      WHERE m.entry_status IS NULL OR m.entry_status = 'DRAFT'
    `);
    return {
        totalStudents: totalStudents[0].count,
        totalSubjects: totalSubjects[0].count,
        activeSemesters: activeSemesters[0].count,
        pendingSubmissions: pendingSubmissions[0].count
    };
};

exports.getSessions = async () => {
    const [sessions] = await db.query(`
      SELECT s.semester_id, s.academic_year, s.semester_number, p.programme_name,
             COUNT(sa.allocation_id) as subjects, COUNT(m.mark_id) as submitted
      FROM semesters s
      JOIN programmes p ON s.programme_id = p.programme_id
      LEFT JOIN subject_allocations sa ON s.semester_id = sa.semester_id
      LEFT JOIN marks m ON sa.allocation_id = m.enrollment_id AND m.entry_status = 'SUBMITTED'
      GROUP BY s.semester_id
    `);
    return sessions;
};

// Programmes
exports.getProgrammesDetails = async () => {
    const [programmes] = await db.query(`
      SELECT p.*,
             (SELECT COUNT(*) FROM students s WHERE s.programme_id = p.programme_id) as student_count,
             (SELECT COUNT(*) FROM semesters sem WHERE sem.programme_id = p.programme_id) as semester_count
      FROM programmes p
    `);
    return programmes;
};

exports.getProgrammeById = async (programme_id) => {
    const [programme] = await db.query("SELECT * FROM programmes WHERE programme_id = ?", [programme_id]);
    return programme;
};

exports.getProgrammeStudents = async (programme_id) => {
    const [students] = await db.query("SELECT s.*, u.username, u.email FROM students s JOIN users u ON s.user_id = u.user_id WHERE s.programme_id = ?", [programme_id]);
    return students;
};

exports.getProgrammeSemesters = async (programme_id) => {
    const [semesters] = await db.query("SELECT * FROM semesters WHERE programme_id = ?", [programme_id]);
    return semesters;
};

exports.getProgrammeSubjects = async (programme_id) => {
    const [subjects] = await db.query(`
      SELECT DISTINCT sub.*
      FROM subjects sub
      JOIN subject_allocations sa ON sub.subject_id = sa.subject_id
      JOIN semesters sem ON sa.semester_id = sem.semester_id
      WHERE sem.programme_id = ?
    `, [programme_id]);
    return subjects;
};

exports.createProgramme = async (programme_code, programme_name, duration_years) => {
    await db.query("INSERT INTO programmes (programme_code, programme_name, duration_years) VALUES (?, ?, ?)", [programme_code, programme_name, duration_years]);
};

exports.updateProgramme = async (programme_id, programme_code, programme_name, duration_years) => {
    await db.query("UPDATE programmes SET programme_code = ?, programme_name = ?, duration_years = ? WHERE programme_id = ?", [programme_code, programme_name, duration_years, programme_id]);
};

exports.getProgrammeDependencies = async (programme_id) => {
    const [students] = await db.query("SELECT COUNT(*) as count FROM students WHERE programme_id = ?", [programme_id]);
    const [semesters] = await db.query("SELECT COUNT(*) as count FROM semesters WHERE programme_id = ?", [programme_id]);
    return { students: students[0].count, semesters: semesters[0].count };
};

exports.deleteProgramme = async (programme_id) => {
    await db.query("DELETE FROM programmes WHERE programme_id = ?", [programme_id]);
};

// Students
exports.getStudentsWithDetails = async () => {
    const [students] = await db.query(`
      SELECT s.*, u.username, u.email, p.programme_name
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      JOIN programmes p ON s.programme_id = p.programme_id
    `);
    return students;
};

exports.getProgrammes = async () => {
    const [programmes] = await db.query("SELECT * FROM programmes");
    return programmes;
};

exports.createStudentUser = async (username, email, password) => {
    await db.query("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'STUDENT')", [username, email, password]);
    const [user] = await db.query("SELECT user_id FROM users WHERE username = ?", [username]);
    return user[0].user_id;
};

exports.createStudent = async (user_id, registration_number, programme_id, enrollment_year) => {
    await db.query("INSERT INTO students (user_id, registration_number, programme_id, enrollment_year) VALUES (?, ?, ?, ?)", [user_id, registration_number, programme_id, enrollment_year]);
};

exports.getStudentUserId = async (student_id) => {
    const [student] = await db.query("SELECT user_id FROM students WHERE student_id = ?", [student_id]);
    return student.length ? student[0].user_id : null;
};

exports.updateStudentUser = async (username, email, user_id) => {
    await db.query("UPDATE users SET username = ?, email = ? WHERE user_id = ?", [username, email, user_id]);
};

exports.updateStudent = async (student_id, registration_number, programme_id, enrollment_year) => {
    await db.query("UPDATE students SET registration_number = ?, programme_id = ?, enrollment_year = ? WHERE student_id = ?", [registration_number, programme_id, enrollment_year, student_id]);
};

exports.deleteStudentDependencies = async (student_id) => {
    await db.query("DELETE FROM enrollments WHERE student_id = ?", [student_id]);
    await db.query("DELETE FROM results WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE student_id = ?)", [student_id]);
    await db.query("DELETE FROM marks WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE student_id = ?)", [student_id]);
};

exports.deleteStudentAndUser = async (student_id, user_id) => {
    await db.query("DELETE FROM students WHERE student_id = ?", [student_id]);
    await db.query("DELETE FROM users WHERE user_id = ?", [user_id]);
};

exports.searchStudents = async (query) => {
    const [students] = await db.query(`
      SELECT s.*, u.username, u.email, p.programme_name
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      JOIN programmes p ON s.programme_id = p.programme_id
      WHERE u.username LIKE ? OR u.email LIKE ? OR s.registration_number LIKE ? OR p.programme_name LIKE ?
    `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);
    return students;
};

// Semesters
exports.getSemestersWithProgrammes = async () => {
    const [semesters] = await db.query(`
      SELECT s.*, p.programme_name
      FROM semesters s
      JOIN programmes p ON s.programme_id = p.programme_id
    `);
    return semesters;
};

exports.createSemester = async (programme_id, semester_number, academic_year, start_date, end_date) => {
    await db.query("INSERT INTO semesters (programme_id, semester_number, academic_year, start_date, end_date) VALUES (?, ?, ?, ?, ?)", [programme_id, semester_number, academic_year, start_date, end_date]);
};

exports.updateSemester = async (semester_id, programme_id, semester_number, academic_year, start_date, end_date) => {
    await db.query("UPDATE semesters SET programme_id = ?, semester_number = ?, academic_year = ?, start_date = ?, end_date = ? WHERE semester_id = ?", [programme_id, semester_number, academic_year, start_date, end_date, semester_id]);
};

exports.deleteSemester = async (semester_id) => {
    await db.query("DELETE FROM subject_allocations WHERE semester_id = ?", [semester_id]);
    await db.query("DELETE FROM enrollments WHERE semester_id = ?", [semester_id]);
    await db.query("DELETE FROM results WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE semester_id = ?)", [semester_id]);
    await db.query("DELETE FROM marks WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE semester_id = ?)", [semester_id]);
    await db.query("DELETE FROM semesters WHERE semester_id = ?", [semester_id]);
};

// Subjects
exports.getSubjects = async () => {
    const [subjects] = await db.query("SELECT * FROM subjects");
    return subjects;
};

exports.createSubject = async (subject_code, subject_name, credit_hours, max_marks) => {
    await db.query("INSERT INTO subjects (subject_code, subject_name, credit_hours, max_marks) VALUES (?, ?, ?, ?)", [subject_code, subject_name, credit_hours, max_marks]);
};

exports.updateSubject = async (subject_id, subject_code, subject_name, credit_hours, max_marks) => {
    await db.query("UPDATE subjects SET subject_code = ?, subject_name = ?, credit_hours = ?, max_marks = ? WHERE subject_id = ?", [subject_code, subject_name, credit_hours, max_marks, subject_id]);
};

exports.deleteSubject = async (subject_id) => {
    await db.query("DELETE FROM subject_allocations WHERE subject_id = ?", [subject_id]);
    await db.query("DELETE FROM enrollments WHERE subject_id = ?", [subject_id]);
    await db.query("DELETE FROM results WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE subject_id = ?)", [subject_id]);
    await db.query("DELETE FROM marks WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE subject_id = ?)", [subject_id]);
    await db.query("DELETE FROM subjects WHERE subject_id = ?", [subject_id]);
};

// Enrollments
exports.getEnrollmentsWithDetails = async () => {
    const [enrollments] = await db.query(`
      SELECT e.*, s.registration_number,u.username as username, sub.subject_name, sem.academic_year, sem.semester_number
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      join users u on s.user_id = u.user_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      JOIN semesters sem ON e.semester_id = sem.semester_id
    `);
    return enrollments;
};

exports.getStudentsBasic = async () => {
    const [students] = await db.query("SELECT student_id, registration_number,u.username as username FROM students join users u on students.user_id = u.user_id");
    return students;
};

exports.getSubjectsBasic = async () => {
    const [subjects] = await db.query("SELECT subject_id, subject_code, subject_name FROM subjects");
    return subjects;
};

exports.getSemestersBasic = async () => {
    const [semesters] = await db.query(`SELECT semester_id, academic_year, semester_number, p.programme_name 
      FROM semesters sem JOIN programmes p ON sem.programme_id = p.programme_id`);
    return semesters;
};

exports.getProgrammesBasic = async () => {
    const [programmes] = await db.query("SELECT programme_id, programme_name FROM programmes");
    return programmes;
};

exports.createEnrollment = async (student_id, subject_id, semester_id) => {
    await db.query("INSERT INTO enrollments (student_id, subject_id, semester_id) VALUES (?, ?, ?)", [student_id, subject_id, semester_id]);
};

exports.updateEnrollment = async (enrollment_id, student_id, subject_id, semester_id) => {
    await db.query("UPDATE enrollments SET student_id = ?, subject_id = ?, semester_id = ? WHERE enrollment_id = ?", [student_id, subject_id, semester_id, enrollment_id]);
};

exports.deleteEnrollment = async (enrollment_id) => {
    await db.query("DELETE FROM results WHERE enrollment_id = ?", [enrollment_id]);
    await db.query("DELETE FROM marks WHERE enrollment_id = ?", [enrollment_id]);
    await db.query("DELETE FROM enrollments WHERE enrollment_id = ?", [enrollment_id]);
};

// Results
exports.getAllResults = async () => {
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
    return results;
};

exports.publishResults = async (semester_id) => {
    await db.query(`
      UPDATE results SET result_status = 'PUBLISHED'
      WHERE enrollment_id IN (
        SELECT enrollment_id FROM enrollments WHERE semester_id = ?
      )
    `, [semester_id]);
};

exports.withholdResult = async (result_id) => {
    await db.query("UPDATE results SET result_status = 'WITHHELD' WHERE result_id = ?", [result_id]);
};

// Reports
exports.getResultsForReport = async (semester_id, subject_id) => {
    const [results] = await db.query(`
      SELECT s.registration_number, u.username, r.marks, r.grade_letter, r.grade_point
      FROM results r
      JOIN enrollments e ON r.enrollment_id = e.enrollment_id
      JOIN students s ON e.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      WHERE e.semester_id = ? AND e.subject_id = ?
    `, [semester_id, subject_id]);
    return results;
};

// Users
exports.getUsers = async () => {
    const [users] = await db.query("SELECT * FROM users");
    return users;
};

exports.createUserWithRole = async (username, email, password, role) => {
    await db.query("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)", [username, email, password, role]);
    if (role === 'FACULTY') {
        const [user] = await db.query("SELECT user_id FROM users WHERE username = ?", [username]);
        await db.query("INSERT INTO faculty (user_id) VALUES (?)", [user[0].user_id]);
    }
};

exports.updateUser = async (user_id, username, email, password, role, is_active) => {
    if (password && password.trim() !== '') {
        await db.query("UPDATE users SET username = ?, email = ?, password_hash = ?, role = ?, is_active = ? WHERE user_id = ?", [username, email, password, role, is_active ? 1 : 0, user_id]);
    } else {
        await db.query("UPDATE users SET username = ?, email = ?, role = ?, is_active = ? WHERE user_id = ?", [username, email, role, is_active ? 1 : 0, user_id]);
    }
};

exports.deleteUser = async (user_id) => {
    await db.query("DELETE FROM faculty WHERE user_id = ?", [user_id]);
    const [student] = await db.query("SELECT student_id FROM students WHERE user_id = ?", [user_id]);
    if (student.length > 0) {
      const student_id = student[0].student_id;
      await db.query("DELETE FROM enrollments WHERE student_id = ?", [student_id]);
      await db.query("DELETE FROM results WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE student_id = ?)", [student_id]);
      await db.query("DELETE FROM marks WHERE enrollment_id IN (SELECT enrollment_id FROM enrollments WHERE student_id = ?)", [student_id]);
      await db.query("DELETE FROM students WHERE user_id = ?", [user_id]);
    }
    await db.query("DELETE FROM subject_allocations WHERE faculty_id IN (SELECT faculty_id FROM faculty WHERE user_id = ?)", [user_id]);
    await db.query("DELETE FROM users WHERE user_id = ?", [user_id]);
};

// Allocations
exports.getAllocationsDetails = async () => {
    const [allocations] = await db.query(`
      SELECT sa.*, u.username, f.department, s.subject_name, sem.academic_year, sem.semester_number, p.programme_name
      FROM subject_allocations sa
      JOIN faculty f ON sa.faculty_id = f.faculty_id
      JOIN users u ON f.user_id = u.user_id
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN semesters sem ON sa.semester_id = sem.semester_id
      JOIN programmes p ON sem.programme_id = p.programme_id
    `);
    return allocations;
};

exports.getFacultyList = async () => {
    const [facultyList] = await db.query(`
      SELECT f.faculty_id, u.username, f.department 
      FROM faculty f 
      JOIN users u ON f.user_id = u.user_id 
      WHERE u.is_active = 1
    `);
    return facultyList;
};

exports.checkAllocationExists = async (faculty_id, subject_id, semester_id) => {
    const [existing] = await db.query(
      "SELECT * FROM subject_allocations WHERE faculty_id = ? AND subject_id = ? AND semester_id = ?",
      [faculty_id, subject_id, semester_id]
    );
    return existing.length > 0;
};

exports.createAllocation = async (faculty_id, subject_id, semester_id) => {
    await db.query(
      "INSERT INTO subject_allocations (faculty_id, subject_id, semester_id) VALUES (?, ?, ?)",
      [faculty_id, subject_id, semester_id]
    );
};

exports.deleteAllocation = async (allocation_id) => {
    await db.query("DELETE FROM subject_allocations WHERE allocation_id = ?", [allocation_id]);
};

// Bulk Enroll
exports.getActiveStudentsInProgramme = async (programme_id) => {
    const [students] = await db.query(`
      SELECT s.student_id 
      FROM students s 
      JOIN users u ON s.user_id = u.user_id 
      WHERE s.programme_id = ? AND s.status = 'ACTIVE' AND u.is_active = 1
    `, [programme_id]);
    return students;
};

exports.bulkEnrollStudents = async (students, subject_id, semester_id) => {
    for (const student of students) {
      await db.query(
        "INSERT IGNORE INTO enrollments (student_id, subject_id, semester_id) VALUES (?, ?, ?)",
        [student.student_id, subject_id, semester_id]
      );
    }
};

// Grading Configuration
exports.getGradeScales = async () => {
    const [grades] = await db.query("SELECT * FROM grade_scale ORDER BY min_score DESC");
    return grades;
};

exports.checkGradeOverlap = async (min_score, max_score) => {
    const [overlap] = await db.query(`
      SELECT * FROM grade_scale 
      WHERE ? <= max_score AND ? >= min_score
    `, [min_score, max_score]);
    return overlap;
};

exports.createGradeScale = async (grade_letter, min_score, max_score, grade_point) => {
    await db.query(
      "INSERT INTO grade_scale (grade_letter, min_score, max_score, grade_point) VALUES (?, ?, ?, ?)",
      [grade_letter.toUpperCase(), min_score, max_score, grade_point]
    );
};

exports.updateGradeScale = async (grade_id, grade_letter, min_score, max_score, grade_point) => {
    await db.query(
      "UPDATE grade_scale SET grade_letter = ?, min_score = ?, max_score = ?, grade_point = ? WHERE grade_id = ?",
      [grade_letter.toUpperCase(), min_score, max_score, grade_point, grade_id]
    );
};

exports.deleteGradeScale = async (grade_id) => {
    await db.query("DELETE FROM grade_scale WHERE grade_id = ?", [grade_id]);
};
