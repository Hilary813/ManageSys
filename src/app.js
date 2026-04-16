require("dotenv").config();
const express = require("express");
const session = require("express-session");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const studentRoutes = require("./routes/studentRoutes");
const path = require('path');
const app = express();

app.set("view engine", "pug");
// app.set("views", "./src/views");
// app.use(express.static("./src/public"));

// app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secret-srms",
    resave: false,
    saveUninitialized: false,
  })
);

app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use("/faculty", facultyRoutes);
app.use("/student", studentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
