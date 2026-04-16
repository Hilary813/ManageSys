const db = require("../config/db");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

// const upload = multer({ dest: "uploads/" });

exports.dashboard = async (req, res) => {
  try {
    // Look up the real faculty_id (PK in faculty table) from the logged-in user_id
    const [facRow] = await db.query('SELECT faculty_id FROM faculty WHERE user_id = ?', [req.session.user.user_id]);
    if (!facRow.length) {
      return res.render("faculty/dashboard", { user: req.session.user, subjects: [] });
    }
    const facultyId = facRow[0].faculty_id;

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

    res.render("faculty/dashboard", { user: req.session.user, subjects });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.resultEntryPage = async (req, res) => {
  const { allocation_id } = req.params;
  try {
    const [allocation] = await db.query(`
      SELECT sa.*, s.subject_name, s.max_marks, sem.academic_year, sem.semester_number, p.programme_name
      FROM subject_allocations sa
      JOIN subjects s ON sa.subject_id = s.subject_id
      JOIN semesters sem ON sa.semester_id = sem.semester_id
      JOIN programmes p ON sem.programme_id = p.programme_id
      WHERE sa.allocation_id = ?
    `, [allocation_id]);

    const [enrollments] = await db.query(`
      SELECT e.enrollment_id, s.registration_number, u.username, m.marks_obtained, m.entry_status
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN marks m ON e.enrollment_id = m.enrollment_id
      WHERE e.subject_id = ? AND e.semester_id = ?
    `, [allocation[0].subject_id, allocation[0].semester_id]);

    res.render("faculty/resultEntry", { allocation: allocation[0], enrollments });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.enterMarks = async (req, res) => {
  const { allocation_id } = req.params;
  const marks = req.body;
  console.log(marks);
  try {
    // Look up the real faculty_id for the entered_by FK constraint
    const [facRow] = await db.query('SELECT faculty_id FROM faculty WHERE user_id = ?', [req.session.user.user_id]);
    const enteredBy = facRow.length ? facRow[0].faculty_id : null;

    for (const [enrollment_id, value] of Object.entries(marks)) {
      if (enrollment_id.startsWith('mark_')) {
        const eid = enrollment_id.replace('mark_', '');
        let mark = value;
        if (Array.isArray(mark)) {
          console.log("Array", mark);
          mark = mark[0];
        }
        // Parse as number — form values come as strings; BETWEEN fails silently on strings
        const markNum = parseFloat(mark);
        if (isNaN(markNum)) continue; // skip blank or invalid entries

        console.log([eid, markNum, enteredBy]);
        await db.query(`
          INSERT INTO marks (enrollment_id, marks_obtained, entered_by, entry_status)
          VALUES (?, ?, ?, 'SUBMITTED')
          ON DUPLICATE KEY UPDATE marks_obtained = ?, entry_status = 'SUBMITTED'
        `, [eid, markNum, enteredBy, markNum]);

        // Compute grade from grade_scale using numeric value
        const [grade] = await db.query(
          "SELECT * FROM grade_scale WHERE ? BETWEEN min_score AND max_score ORDER BY min_score DESC LIMIT 1",
          [markNum]
        );
        if (grade.length) {
          await db.query(`
            INSERT INTO results (enrollment_id, marks, grade_letter, grade_point, result_status)
            VALUES (?, ?, ?, ?, 'PENDING')
            ON DUPLICATE KEY UPDATE marks = ?, grade_letter = ?, grade_point = ?
          `, [eid, markNum, grade[0].grade_letter, grade[0].grade_point, markNum, grade[0].grade_letter, grade[0].grade_point]);
        } else {
          console.warn(`No grade_scale match for mark=${markNum}. Check grade_scale table has data.`);
        }
      }
    }
    res.redirect(`/faculty/result-entry/${allocation_id}`);
  } catch (err) {
    console.error(err);
    res.send("Error saving marks");
  }
};

exports.importCSV = async (req, res) => {
  const { allocation_id } = req.params;
  const file = req.file;
  const results = [];

  fs.createReadStream(file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        for (const row of results) {
          const [enrollment] = await db.query(`
            SELECT e.enrollment_id FROM enrollments e
            JOIN students s ON e.student_id = s.student_id
            WHERE s.registration_number = ? AND e.subject_id = (
              SELECT subject_id FROM subject_allocations WHERE allocation_id = ?
            ) AND e.semester_id = (
              SELECT semester_id FROM subject_allocations WHERE allocation_id = ?
            )
          `, [row.registration_number, allocation_id, allocation_id]);

          if (enrollment.length) {
            await db.query(`
              INSERT INTO marks (enrollment_id, marks_obtained, entered_by, entry_status)
              VALUES (?, ?, ?, 'SUBMITTED')
              ON DUPLICATE KEY UPDATE marks_obtained = ?, entry_status = 'SUBMITTED'
            `, [enrollment[0].enrollment_id, row.marks, req.session.user.user_id, row.marks]);

            // Compute grade
            const [grade] = await db.query("SELECT * FROM grade_scale WHERE ? BETWEEN min_score AND max_score ORDER BY min_score DESC LIMIT 1", [row.marks]);
            if (grade.length) {
              await db.query(`
                INSERT INTO results (enrollment_id, marks, grade_letter, grade_point, result_status)
                VALUES (?, ?, ?, ?, 'PENDING')
                ON DUPLICATE KEY UPDATE marks = ?, grade_letter = ?, grade_point = ?
              `, [enrollment[0].enrollment_id, row.marks, grade[0].grade_letter, grade[0].grade_point, row.marks, grade[0].grade_letter, grade[0].grade_point]);
            }
          }
        }
        fs.unlinkSync(file.path);
        res.redirect(`/faculty/result-entry/${allocation_id}`);
      } catch (err) {
        console.error(err);
        res.send("Error importing CSV");
      }
    });
};

exports.viewPerformance = async (req, res) => {
  const { allocation_id } = req.params;
  try {
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
    `, [allocation_id, allocation_id]);

    res.render("faculty/performance", { stats: stats[0] });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};
