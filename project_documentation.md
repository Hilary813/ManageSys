# SOFTWARE DEVELOPMENT – 2

## Sprint 4 – Final Product

### Project Title
College Result Management System

### Group Members:
- Venkatesh (Assuming single developer based on workspace)

---

## Introduction:
This document represents the completion of the College Result Management System project, where all planned features have been fully developed, tested, and integrated into a working web application. The goal of this sprint was to deliver a complete, stable, and deployable system that meets the objectives defined for managing college results efficiently.

At this stage, the application is fully functional, allowing users (admins, faculty, students) to register, log in, manage programmes, semesters, subjects, enrollments, enter marks, and view results. The system demonstrates a clear connection between design, development, and user needs.

### Final Application Overview:
The developed platform is a comprehensive result management system for colleges, supporting administration of programmes, student enrollments, faculty assignments, mark entry, and result generation.

Users can:
- Create accounts and securely log in
- Admins: Manage programmes, semesters, subjects, students, faculty, and view reports
- Faculty: View allocated subjects, enter marks for students
- Students: View their enrolled subjects, marks, and GPA

The platform focuses on efficient result management with proper role-based access control.

### Application Features (Fully Implemented):
#### Core Features:
- User registration and login with role-based access (Admin, Faculty, Student)
- Secure authentication using sessions
- Role-based dashboards

#### Admin Features:
- Manage programmes, semesters, subjects
- Student and faculty management
- Subject allocations to faculty
- View reports and enrollments

#### Faculty Features:
- View allocated subjects and students
- Enter and update marks
- View performance reports

#### Student Features:
- View enrolled subjects and marks
- Calculate GPA
- View results

#### Additional Features:
- CSV upload for bulk data
- Grade calculation based on marks
- Result generation

### User Stories Implemented in Sprint 4:
| User Story ID | Role | Feature | Reason | Assigned To | Status |
|---------------|------|---------|--------|-------------|--------|
| US-01 | Admin | Register and login | Admin access to system | Venkatesh | DONE |
| US-02 | Faculty | Register and login | Faculty access | Venkatesh | DONE |
| US-03 | Student | Register and login | Student access | Venkatesh | DONE |
| US-04 | Admin | Manage programmes | Add/edit programmes | Venkatesh | DONE |
| US-05 | Admin | Manage semesters | Add/edit semesters | Venkatesh | DONE |
| US-06 | Admin | Manage subjects | Add/edit subjects | Venkatesh | DONE |
| US-07 | Admin | Manage students | Add/edit students | Venkatesh | DONE |
| US-08 | Admin | Manage faculty | Add/edit faculty | Venkatesh | DONE |
| US-09 | Admin | Allocate subjects | Assign subjects to faculty | Venkatesh | DONE |
| US-10 | Faculty | View allocations | See assigned subjects | Venkatesh | DONE |
| US-11 | Faculty | Enter marks | Input student marks | Venkatesh | DONE |
| US-12 | Student | View results | See marks and grades | Venkatesh | DONE |
| US-13 | Student | View GPA | Calculate grade point average | Venkatesh | DONE |

### Application Quality and Performance:
The final application has been developed with focus on usability and reliability.
- Smooth navigation between pages
- Clean and simple user interface using Pug templates
- Proper handling of user inputs
- Error handling for invalid actions
- Consistent data display from MySQL database

All major features work correctly without system crashes. The application provides a stable experience for managing results.

### Code Quality (MVC and Modular Design):
The project follows a structured development approach.

#### Architecture Implementation:
- **Model (Data Layer)**: Models handle database interactions with MySQL.
- **View (Presentation Layer)**: Pug templates render the UI.
- **Controller/Service Layer**: Routes and services handle logic.

#### Design Principles:
- Separation of Concerns
- Modular file organization
- Reusable components
- Input validation and error handling

### Deployment using Docker:
The application is containerized using Docker.
- Node.js application container
- MySQL database container
- Docker Compose configuration

Run with: `docker-compose up`

### Conclusion
Sprint 4 completes the development of the College Result Management System. The project has evolved into a fully functional web application meeting all requirements for result management.

The system demonstrates strong alignment between planning and implementation, with features working together effectively. The use of Express.js, Pug, MySQL, and Docker reflects modern web development practices.

Overall, the application delivers a complete result management experience.