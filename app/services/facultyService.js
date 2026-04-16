const facultyModel = require("../models/facultyModel");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

// const upload = multer({ dest: "uploads/" });

exports.dashboard = async (req, res) => {
  try {
    const facultyId = await facultyModel.getFacultyIdByUserId(req.session.user.user_id);
    if (!facultyId) {
      return res.render("faculty/dashboard", { user: req.session.user, subjects: [] });
    }

    const subjects = await facultyModel.getDashboardSubjects(facultyId);
    res.render("faculty/dashboard", { user: req.session.user, subjects });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.resultEntryPage = async (req, res) => {
  const { allocation_id } = req.params;
  try {
    const allocation = await facultyModel.getAllocationDetails(allocation_id);
    const enrollments = await facultyModel.getEnrolledStudents(allocation[0].subject_id, allocation[0].semester_id);

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
    const facultyId = await facultyModel.getFacultyIdByUserId(req.session.user.user_id);

    for (const [enrollment_id, value] of Object.entries(marks)) {
      if (enrollment_id.startsWith('mark_')) {
        const eid = enrollment_id.replace('mark_', '');
        let mark = value;
        if (Array.isArray(mark)) { mark = mark[0]; }
        const markNum = parseFloat(mark);
        if (isNaN(markNum)) continue;

        await facultyModel.saveMark(eid, markNum, facultyId);

        const grade = await facultyModel.getGradeByMark(markNum);
        if (grade.length) {
          await facultyModel.saveResult(eid, markNum, grade[0].grade_letter, grade[0].grade_point);
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
        const facultyId = await facultyModel.getFacultyIdByUserId(req.session.user.user_id);
        for (const row of results) {
          const enrollment = await facultyModel.getEnrollmentForCSV(row.registration_number, allocation_id);
          if (enrollment.length) {
            await facultyModel.saveMark(enrollment[0].enrollment_id, row.marks, facultyId);

            const grade = await facultyModel.getGradeByMark(row.marks);
            if (grade.length) {
              await facultyModel.saveResult(enrollment[0].enrollment_id, row.marks, grade[0].grade_letter, grade[0].grade_point);
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
    const stats = await facultyModel.getPerformanceStats(allocation_id);
    res.render("faculty/performance", { stats: stats[0] });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};
