const studentModel = require("../models/studentModel");

exports.dashboard = async (req, res) => {
  try {
    const studentId = req.session.user.user_id;
    const student = await studentModel.getStudentProfile(studentId);
    // Get published results
    const results = await studentModel.getPublishedResults(studentId);

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
    const results = await studentModel.getSemesterResults(studentId, semester_id);

    const semesterGPA = results.reduce((sum, r) => sum + (r.grade_point * r.credit_hours), 0) / results.reduce((sum, r) => sum + r.credit_hours, 0);

    res.render("student/results", { results, semesterGPA });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};

exports.downloadTranscript = async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const student = await studentModel.getStudentProfileWithUser(userId);
    const results = await studentModel.getPublishedResultsByActualStudentId(student[0].student_id);

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
    const gpas = await studentModel.getGPAs(studentId);

    res.render("student/gpa", { gpas });
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
};
