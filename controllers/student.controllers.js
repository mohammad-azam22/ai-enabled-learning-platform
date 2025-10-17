const path = require('path');
const axios = require('axios');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const studentModel = require('../models/student.model');
const { courseModel } = require('../models/course.model');

const getSignupPage = (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "..", "public", "html", "student_signup.html"));
}

const signup = async (req, res) => {
    try {
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const studentData = { ...req.body, password: hashedPassword };

        const response = await studentModel.create(studentData);
        res.status(201).json(response);
    }
    catch (error) {
        if (error.errors) {
            const errors = Object.values(error.errors).map(err => err.message);
            res.status(400).json({ errors });
        } else {
            res.status(500).json({ error: error.message || "Internal Server Error" });
        }
    }
}

const getLoginPage = (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "..", "public", "html", "student_login.html"));
}

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const student = await studentModel.findOne({ email });
        if (!student) {
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, student.password);
        if (isMatch) {
            req.session.user = {
                id: student._id,
                email: student.email,
                role: 'student'
            };
            return res.status(200).json({ message: 'Login successful', studentId: student._id });
        } else {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getDashboardPage = (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "..", "public", "html", "student_dashboard.html"));
}

const getStudentData = async (req, res) => {
    const { id } = req.params;
    try {
        const response = await studentModel.findById(id);
        if (!response) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json(response);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

const delete_account = async (req, res) => {
    const { id } = req.params;

    try {
        const student = await studentModel.findById(id);
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        await studentModel.findByIdAndDelete(id);
        res.status(200).json({ message: "Account deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const submitPreAssessment = async (req, res) => {
    const { data, courseId, studentId } = req.body;

    let score = 0;
    for (let i = 0; i < data.length; i++) {
        const quesObject = data[i];
        const url = "" // LLM API
        const prompt = `
            You are given a question and 4 options. 
            Your task is to determine which option most appropriately answers the given question.    
            Question: ${quesObject.question}.
            Option A: ${quesObject.A}. If Option A is the most approproate, respond A, nothing else.
            Option B: ${quesObject.B}. If Option B is the most approproate, respond B, nothing else.
            Option C: ${quesObject.C}. If Option C is the most approproate, respond C, nothing else.
            Option D: ${quesObject.D}. If Option D is the most approproate, respond D, nothing else.
        `;
        const payload = {
            model: "openai-large",
            json: false,
            private: true,
            messages: [
                { role: "system", content: "You are an expert at checking student responses" },
                { role: "user", content: prompt }
            ]
        };
        const headers = {
            "Content-Type": "application/json"
        };

        try {
            const result = await axios.post(url, payload, { headers }, { timeout: 30000 });
            if (quesObject.response === result.data.choices[0].message.content) {
                score += 1;
            }
        }
        catch (error) {
            console.log('Error', error.message);
            i--;
        }
    }
    console.log("Pre-assessment score:", score / data.length);
    try {
        const result = await studentModel.findOneAndUpdate(
            { _id: studentId, "enrolledCourses.courseId": new mongoose.Types.ObjectId(courseId) },
            { $set: { "enrolledCourses.$.preAssessmentScore": score / data.length } },
            { new: true }
        );
        if (result) {
            // console.log("Updated Student Data:", result);
            res.status(200).json({ message: "Pre-Assessment Submitted" });
        }
        else {
            console.log("Student or course not found!");
            res.status(500).json({ message: "Student or course not found!" });
        }
    }
    catch (error) {
        console.error("Error updating preAssessmentScore:", error);
    }
}

const submitAssessment = async (req, res) => {
    const { data, courseId, studentId, unit_order } = req.body;
    let score = 0;
    const correctAnswers = [];
    for (let i = 0; i < data.length; i++) {
        const quesObject = data[i];
        const url = "" // LLM API
        const prompt = `
            You are given a question and some options. 
            Your task is to determine which option most appropriately answers the given question.    
            Question: ${quesObject.question}.
            Option A: ${quesObject.A}. If Option A is the most approproate, respond A, nothing else.
            Option B: ${quesObject.B}. If Option B is the most approproate, respond B, nothing else.
            Option C: ${quesObject.C}. If Option C is the most approproate, respond C, nothing else.
            Option D: ${quesObject.D}. If Option D is the most approproate, respond D, nothing else.
            ${quesObject.E ? `Option E: ${quesObject.E}. If Option E is the most approproate, respond E, nothing else.` : ``}
            ${quesObject.F ? `Option F: ${quesObject.F}. If Option F is the most approproate, respond F, nothing else.` : ``}
        `;
        const payload = {
            model: "openai-large",
            json: false,
            private: true,
            messages: [
                { role: "system", content: "You are an expert at checking student responses" },
                { role: "user", content: prompt }
            ]
        };
        const headers = {
            "Content-Type": "application/json"
        };
        try {
            const result = await axios.post(url, payload, { headers }, { timeout: 30000 });
            console.log("Student's response: " + quesObject.response + ", Correct Answer: " + result.data.choices[0].message.content);
            if (quesObject.response === result.data.choices[0].message.content) {
                score += 1;
            }
            correctAnswers.push(result.data.choices[0].message.content);
        }
        catch (error) {
            console.log('Error', error.message);
            i--;
        }
    }
    console.log("Assessment score", score / data.length);
    try {
        const updatePath = `enrolledCourses.$.unitAssessmentScore.${unit_order - 1}`;
        const result = await studentModel.findOneAndUpdate(
            { _id: studentId, "enrolledCourses.courseId": new mongoose.Types.ObjectId(courseId) },
            { $set: { [updatePath]: score / data.length } },
            { new: true }
        );
        if (result) {
            res.status(200).json({ message: "Assessment Submitted", correctAnswers: correctAnswers });
        }
        else {
            console.log("Student or course not found!");
            res.status(404).json({ message: "Student or course not found!" });
        }
    }
    catch (error) {
        console.error("Error updating preAssessmentScore:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
}

const logout = (req, res) => {
    // Destroy the session
    req.session.destroy(err => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Server error' });
        }
        // Send a response indicating successful logout
        return res.status(200).json({ message: 'Logout successful' });
    });
}

const mark_lesson = async (req, res) => {
    const { id } = req.params;
    const { course_id, unit_num, lesson_num } = req.body;

    try {
        // Step 1: Find the course
        const course = await courseModel.findById(course_id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Step 2: Find the unit and lesson
        const unit = course.units.find(u => u.order === unit_num);
        if (!unit) {
            return res.status(404).json({ message: "Unit not found" });
        }

        const lesson = unit.lessons.find(l => l.order === lesson_num);
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        // Step 3: Find the student
        const student = await studentModel.findById(id);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const enrolledCourse = student.enrolledCourses.find(c => c.courseId.toString() === course_id);
        if (!enrolledCourse) {
            return res.status(404).json({ message: "Student is not enrolled in this course" });
        }

        // Step 4: Check if the lesson is already completed
        const lessonAlreadyCompleted = enrolledCourse.lessonsCompleted.some(lc => lc.unitOrder === unit.order && lc.lessonOrder === lesson.order);
        if (lessonAlreadyCompleted) {
            return res.status(200).json({ message: "Lesson already marked as completed" });
        }

        // Step 5: Mark the lesson as completed
        enrolledCourse.lessonsCompleted.push({ unitOrder: unit.order, lessonOrder: lesson.order });

        // Step 6: Check if all lessons are completed
        const totalLessons = course.units.reduce((sum, u) => sum + u.lessons.length, 0);
        const completedLessons = enrolledCourse.lessonsCompleted.length;

        if (completedLessons === totalLessons) {
            enrolledCourse.completionDate = new Date(); // Set completion date
        }

        await student.save();

        res.status(200).json({ message: "Lesson marked as completed successfully", completedLessons, totalLessons, courseCompleted: completedLessons === totalLessons });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const update_info = async (req, res) => {
    const { id } = req.params;
    try {
        const updateData = {};
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.email) updateData.email = req.body.email;
        if (req.body.mobile) updateData.mobile = req.body.mobile;
        if (req.body.gender) updateData.gender = req.body.gender;
        if (req.body.dob) updateData.dob = req.body.dob;

        const response = await studentModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: false, runValidators: true }
        );
        res.status(200).json({ message: "Profile updated successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const update_pwd = async (req, res) => {
    const { id } = req.params;
    try {
        let student = await studentModel.findById(id);
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(req.body.currpwd, student.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect Password" });
        }

        // Hash new password before updating
        const hashedPassword = await bcrypt.hash(req.body.newpwd, 10);
        await studentModel.findByIdAndUpdate(
            id,
            { $set: { password: hashedPassword } },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "Password updated successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getStudentProfile = async (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "..", "public", "html", "student_profile.html"));
}

module.exports = {
    getSignupPage,
    signup,
    getLoginPage,
    login,
    getDashboardPage,
    getStudentData,
    submitPreAssessment,
    submitAssessment,
    getStudentProfile,
    logout,
    update_info,
    update_pwd,
    mark_lesson,
    delete_account
};
