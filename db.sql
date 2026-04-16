CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','FACULTY','STUDENT')),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE programmes (
    programme_id INT AUTO_INCREMENT PRIMARY KEY,
    programme_name VARCHAR(100) NOT NULL,
    programme_code VARCHAR(20) UNIQUE NOT NULL,
    duration_years INT
);

CREATE TABLE semesters (
    semester_id INT AUTO_INCREMENT PRIMARY KEY,
    programme_id INT,
    semester_number INT NOT NULL,
    academic_year VARCHAR(20),
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (programme_id) REFERENCES programmes(programme_id)
);

CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    programme_id INT,
    enrollment_year INT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (programme_id) REFERENCES programmes(programme_id)
);

CREATE TABLE faculty (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    faculty_name VARCHAR(100),
    department VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    credit_hours INT,
    max_marks INT DEFAULT 100
);

CREATE TABLE subject_allocations (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT,
    faculty_id INT,
    semester_id INT,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id)
);

CREATE TABLE enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject_id INT,
    semester_id INT,
    UNIQUE(student_id, subject_id, semester_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id)
);

CREATE TABLE marks (
    mark_id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT,
    marks_obtained DECIMAL(5,2),
    entered_by INT,
    entry_status VARCHAR(20) DEFAULT 'DRAFT',
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id),
    FOREIGN KEY (entered_by) REFERENCES faculty(faculty_id)
);

CREATE TABLE grade_scale (
    grade_id INT AUTO_INCREMENT PRIMARY KEY,
    grade_letter VARCHAR(2),
    min_score INT,
    max_score INT,
    grade_point DECIMAL(3,2)
);

CREATE TABLE results (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT,
    marks INT,
    grade_letter VARCHAR(2),
    grade_point DECIMAL(3,2),
    result_status VARCHAR(20) DEFAULT 'PENDING',
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id)
);


CREATE TABLE result_publication (
    publication_id SERIAL PRIMARY KEY,
    semester_id INTEGER REFERENCES semesters(semester_id),
    published_by INTEGER REFERENCES users(user_id),
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE transcript_requests (
    request_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(student_id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'GENERATED'
);





-- adding alter statement 

ALTER TABLE results
ADD UNIQUE (enrollment_id);


ALTER TABLE marks
ADD UNIQUE (enrollment_id);