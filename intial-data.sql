INSERT INTO programmes (programme_name, programme_code, duration_years)
VALUES ('BSc Computer Science', 'BSC-CS', 3);

INSERT INTO users (username, email, password_hash, role) VALUES
('admin1', 'admin1@srms.edu', 'hashed_pwd', 'ADMIN'),

('faculty1', 'fac1@srms.edu', 'hashed_pwd', 'FACULTY'),
('faculty2', 'fac2@srms.edu', 'hashed_pwd', 'FACULTY'),
('faculty3', 'fac3@srms.edu', 'hashed_pwd', 'FACULTY'),
('faculty4', 'fac4@srms.edu', 'hashed_pwd', 'FACULTY'),
('faculty5', 'fac5@srms.edu', 'hashed_pwd', 'FACULTY'),

('student1', 'stud1@srms.edu', 'hashed_pwd', 'STUDENT'),
('student2', 'stud2@srms.edu', 'hashed_pwd', 'STUDENT'),
('student3', 'stud3@srms.edu', 'hashed_pwd', 'STUDENT'),
('student4', 'stud4@srms.edu', 'hashed_pwd', 'STUDENT'),
('student5', 'stud5@srms.edu', 'hashed_pwd', 'STUDENT');


INSERT INTO faculty (user_id, faculty_name, department) VALUES
(2, 'Dr. Ahmad Khan', 'Computer Science'),
(3, 'Dr. Sara Ali', 'Computer Science'),
(4, 'Prof. John David', 'Mathematics'),
(5, 'Dr. Mary Joseph', 'Physics'),
(6, 'Dr. Rahul Sharma', 'AI & Data Science');


INSERT INTO students 
(user_id, registration_number, programme_id, enrollment_year) VALUES

(7, 'REG2023001', 1, 2023),
(8, 'REG2023002', 1, 2023),
(9, 'REG2023003', 1, 2023),
(10, 'REG2023004', 1, 2023),
(11, 'REG2023005', 1, 2023);

INSERT INTO semesters 
(programme_id, semester_number, academic_year, start_date, end_date)
VALUES
(1, 1, '2025-2026', '2025-07-01', '2025-12-01');

INSERT INTO subjects 
(subject_code, subject_name, credit_hours, max_marks) VALUES

('CS101', 'Programming Fundamentals', 4, 100),
('CS102', 'Database Systems', 4, 100),
('MA101', 'Discrete Mathematics', 3, 100),
('PH101', 'Applied Physics', 3, 100),
('AI101', 'Introduction to AI', 4, 100);



INSERT INTO subject_allocations 
(subject_id, faculty_id, semester_id) VALUES

(1, 1, 1),
(2, 2, 1),
(3, 3, 1),
(4, 4, 1),
(5, 5, 1);


INSERT INTO enrollments (student_id, subject_id, semester_id) VALUES

(1,1,1),(1,2,1),(1,3,1),(1,4,1),(1,5,1),
(2,1,1),(2,2,1),(2,3,1),(2,4,1),(2,5,1),
(3,1,1),(3,2,1),(3,3,1),(3,4,1),(3,5,1),
(4,1,1),(4,2,1),(4,3,1),(4,4,1),(4,5,1),
(5,1,1),(5,2,1),(5,3,1),(5,4,1),(5,5,1);


INSERT INTO marks 
(enrollment_id, marks_obtained, entered_by, entry_status) VALUES

(1, 85, 1, 'SUBMITTED'),
(2, 78, 2, 'SUBMITTED'),
(3, 88, 3, 'SUBMITTED'),
(4, 91, 4, 'SUBMITTED'),
(5, 73, 5, 'SUBMITTED');

INSERT INTO grade_scale 
(grade_letter, min_score, max_score, grade_point) VALUES

('A', 85, 100, 4.0),
('B', 70, 84, 3.0),
('C', 55, 69, 2.0),
('D', 40, 54, 1.0),
('F', 0, 39, 0.0);

INSERT INTO results 
(enrollment_id, marks, grade_letter, grade_point, result_status) VALUES

(1, 85, 'A', 4.0, 'PENDING'),
(2, 78, 'B', 3.0, 'PENDING'),
(3, 88, 'A', 4.0, 'PENDING'),
(4, 91, 'A', 4.0, 'PENDING'),
(5, 73, 'B', 3.0, 'PENDING');

INSERT INTO result_publication 
(semester_id, published_by)
VALUES (1, 1);
