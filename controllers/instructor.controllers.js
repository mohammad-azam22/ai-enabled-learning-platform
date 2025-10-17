const path = require('path');
const bcrypt = require('bcrypt');
const { instructorModel } = require('../models/instructor.model');
const { studentModel } = require('../models/student.model');
const { courseModel } = require('../models/course.model');
const { default: mongoose } = require('mongoose');

const getSignupPage = (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "..", "public", "html", "instructor_signup.html"));
}

const signup = async (req, res) => {
    try {
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const instructorData = { ...req.body, password: hashedPassword };

        const response = await instructorModel.create(instructorData);
        res.status(201).json(response);
    }
    catch (error) {
        if (error.errors) {
            console.log(error);
            const errors = Object.values(error.errors).map(err => err.message);
            res.status(400).json({ errors });
        } else {
            res.status(500).json({ error: error.message || "Internal Server Error" });
        }
    }
};

const getLoginPage = (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "..", "public", "html", "instructor_login.html"));
}

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the instructor exists
        const instructor = await instructorModel.findOne({ email });
        if (!instructor) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if the account is inactive
        if (instructor.account_status === "inactive") {
            return res.status(401).json({ message: 'Account does not exist' });
        }

        // Verify password
        const isMatch = password === instructor.password;
        if (isMatch) {
            // Set session data
            req.session.user = {
                id: instructor._id,
                email: instructor.email,
                role: 'instructor'
            };
            
            return res.status(200).json({ message: 'Login successful', instructorId: instructor._id });
        } else {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const delete_account = async (req, res) => {
    const { instructorId } = req.body;

    try {
        // Find and update the instructor's account_status to 'inactive'
        const updatedInstructor = await instructorModel.findByIdAndUpdate(
            { _id: new mongoose.Types.ObjectId(instructorId) },
            { $set: { account_status: "inactive" } },
            { new: true } // Return the updated document
        );

        if (!updatedInstructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }

        res.status(200).json({ message: "Account successfully deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

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

const getDashboardPage = (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "..", "public", "html", "instructor_dashboard.html"));
}

const getInstructorData = async (req, res) => {
    const { id } = req.params;

    try {
        const response = await instructorModel.findById(id);
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

const getInstructorProfile = (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "..", "public", "html", "instructor_profile.html"));
}

const update_info = async (req, res) => {
    const { id } = req.params;
    try {
        const updateData = {};
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.email) updateData.email = req.body.email;
        if (req.body.mobile) updateData.mobile = req.body.mobile;
        if (req.body.gender) updateData.gender = req.body.gender;
        if (req.body.dob) updateData.dob = req.body.dob;

        const response = await instructorModel.findByIdAndUpdate(
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
        let instructor = await instructorModel.findById(id);
        if (!instructor) {
            return res.status(404).json({ error: "Instructor not found" });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(req.body.currpwd, instructor.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect Password" });
        }

        // Hash the new password before updating
        const hashedPassword = await bcrypt.hash(req.body.newpwd, 10);
        await instructorModel.findByIdAndUpdate(
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

const generate_plot = async (req, res) => {
    const { plot, granularity } = req.body; // Plot can be 'Student Enrollments' or 'Revenue'
    const { id } = req.params;

    try {
        // Fetch all courses for the given instructor ID
        const courses = await courseModel.find({ instructor: id });

        // Extract enrollments and revenue data
        const studentEnrollments = courses.flatMap(course =>
            course.enrollments.map(enrollment => ({
                studentId: enrollment.studentId,
                createdAt: enrollment.createdAt,
                pricePaid: enrollment.pricePaid // Used for revenue calculation
            }))
        );

        // Determine the time range based on granularity
        let timeUnit, count;
        if (granularity === "Daily") {
            timeUnit = "day"; count = 30; // Last 30 days
        } else if (granularity === "Monthly") {
            timeUnit = "month"; count = 12; // Last 12 months
        }
        else if (granularity === "Yearly") {
            timeUnit = "year"; count = 5; // Last 5 years
        }
        else {
            return res.status(400).json({ error: "Invalid granularity type" });
        }

        // Initialize plot data
        const plotData = [];
        const currentDate = new Date();

        for (let i = 0; i < count; i++) {
            let formattedLabel;
            if (timeUnit === "day") {
                let date = new Date();
                date.setDate(currentDate.getDate() - i);
                formattedLabel = date.toISOString().split("T")[0]; // YYYY-MM-DD
            } else if (timeUnit === "month") {
                let date = new Date();
                date.setMonth(currentDate.getMonth() - i);
                formattedLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
            } else if (timeUnit === "year") {
                formattedLabel = `${currentDate.getFullYear() - i}`; // YYYY
            }

            plotData.push({ label: formattedLabel, value: 0 }); // Default value
        }

        // Populate actual values (enrollments or revenue)
        studentEnrollments.forEach(({ createdAt, pricePaid }) => {
            let formattedLabel;
            if (timeUnit === "day") {
                formattedLabel = createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
            } else if (timeUnit === "month") {
                formattedLabel = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
            } else if (timeUnit === "year") {
                formattedLabel = `${createdAt.getFullYear()}`; // YYYY
            }

            const entry = plotData.find(e => e.label === formattedLabel);
            if (entry) {
                if (plot === "Student Enrollments") {
                    entry.value++; // Count enrollments
                } else if (plot === "Revenue") {
                    entry.value += pricePaid; // Accumulate revenue
                }
            }
        });

        res.json(plotData.reverse()); // Reverse for chronological order
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while fetching plot data" });
    }
}

module.exports = {
    getSignupPage,
    signup,
    getLoginPage,
    login,
    logout,
    getDashboardPage,
    getInstructorData,
    getInstructorProfile,
    update_info,
    update_pwd,
    generate_plot,
    delete_account
}
