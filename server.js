require('dotenv').config();    // loading the .env file
require('./config/connection');    // establishing connection to the database
const express = require('express');    // for creating express app
const session = require('express-session');    // for creating express session
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
// Importing Routes
const studentRoutes = require('./routes/student.routes');
const instructorRoutes = require('./routes/instructor.routes');
const courseRoutes = require('./routes/course.routes');

const app = express();    // initializing express application

// middlewares
app.use(express.static(path.join(__dirname, "public")))    // to serve static files
app.use(cors());    // to enable cors
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.json());    // to parse request body in JSON format
app.use(session({
    secret: process.env.EXPRESS_SESSION_KEY, // Replace with your secret key
    resave: false,           // Forces session to be saved, even when unmodified
    saveUninitialized: true, // Forces a session that is "uninitialized" to be saved
    cookie: { secure: false } // Set secure to true if using HTTPS
}));

const PORT = process.env.BACKEND_PORT || 3300;    // backend port

app.use("/student", studentRoutes);    // student endpoint
app.use("/instructor", instructorRoutes);    // instructor endpoint
app.use("/course", courseRoutes);    // course endpoint

app.get("/", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "public", "html", "home.html"));
});

app.get("/about", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "public", "html", "about.html"));
});

app.get("/contact", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "public", "html", "contact.html"));
});

app.get("/privacy_policy", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "public", "html", "privacy_policy.html"));
});

app.get("/sitemap", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "public", "html", "sitemap.html"));
});

app.get("/terms_of_service", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "public", "html", "terms_of_service.html"));
});

app.get("/search", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "public", "html", "search_page.html"));
});

app.get("/instructor/dashboard", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "public", "html", "instructor_dashboard.html"));
});

app.get("/course/create", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "public", "html", "create_course.html"));
});

app.get("/course/edit", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "public", "html", "edit_course.html"));
});

app.listen(PORT, (err) => {
    if (err) console.error(err.message);
    console.log(`http://localhost:${PORT}`);
});
