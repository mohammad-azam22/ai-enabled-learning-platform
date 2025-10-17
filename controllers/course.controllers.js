const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const { courseModel } = require('../models/course.model');
const { instructorModel } = require('../models/instructor.model');
const studentModel = require('../models/student.model');
const { generateOllamaEmbedding, processCourseForEmbeddings } = require('../services/course.services.js');
const lancedb = require("@lancedb/lancedb");

const getCoursePage = (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "..", "public", "html", "course_preview.html"));
};

const updateCourse = async (req, res) => {
    const { id } = req.params;
    try {
        const updateData = {};
        if (req.body.title) updateData.title = req.body.title;
        if (req.body.instructor) updateData.instructor = req.body.instructor;
        if (req.body.poster) updateData.poster = req.body.poster;
        if (req.body.difficulty) updateData.difficulty = req.body.difficulty;
        if (req.body.price) updateData.price = req.body.price;
        if (req.body.tags) updateData.tags = req.body.tags;
        if (req.body.description) updateData.description = req.body.description;
        if (req.body.units) updateData.units = req.body.units;
        if (req.body.faqs) updateData.faqs = req.body.faqs;
        if (req.body.reviews) updateData.reviews = req.body.reviews;
        if (req.body.published !== undefined) updateData.published = req.body.published;

        console.log('Updating course with data:', updateData);

        const response = await courseModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!response) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (response.published && req.body.published === true) {
            console.log(`Course ${id} published, starting direct embedding processing...`);
            const course = await courseModel.findById(id);
            if (course) {
                const success = await processCourseForEmbeddings(course);
                if (success) {
                    console.log(`Direct embedding processing for course ${id} completed.`);
                }
                else {
                    console.error(`Direct embedding processing failed for course ${id}.`);
                }
            }
            else {
                console.warn(`Course ${id} not found after publishing.`);
            }
        }



        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: error.message });
    }
};

const getTagResults = async (req, res) => {
    const { value } = req.params;

    try {
        let response;

        if (value === "all") {
            // Get 20 random courses, selecting only required fields
            response = await courseModel.aggregate([
                { $sample: { size: 20 } },
                { $project: { title: 1, poster: 1, instructor: 1, overall_rating: 1, price: 1, _id: 1, reviewsCount: { $size: "$reviews" } } }
            ]);
        } else {
            // Find courses where 'value' exists in the 'tags' array and return only specific fields
            response = await courseModel.find({ tags: { $in: [value] } })
                .select("title poster instructor overall_rating price _id reviews")
                .lean(); // Improves performance by returning plain JavaScript objects
            
            // Add review count manually
            response.forEach(course => course.reviewsCount = course.reviews.length);
        }

        // Fetch instructor names in parallel to reduce database queries overhead
        const instructorIds = response.map(course => course.instructor);
        const instructors = await instructorModel.find({ _id: { $in: instructorIds } }).select("name").lean();

        const instructorMap = Object.fromEntries(instructors.map(instr => [instr._id.toString(), instr.name]));

        response.forEach(course => {
            course.instructor = instructorMap[course.instructor];
        });

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const createCourse = async (req, res) => {
    const { title, instructorId, poster, difficulty, tags, description } = req.body;

    if (!title || !instructorId || !poster || !description) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const instructor = await instructorModel.findById(instructorId);
        if (instructor) {    // if instructor with the given instructorId is present in the DB.
            const response = await courseModel.create({
                title: title,
                instructor: instructor._id,
                poster: poster,
                difficulty: difficulty,
                price: 0,
                tags: tags,
                description: description
            });
            await instructorModel.findByIdAndUpdate(
                instructorId,
                { $push: { courses_created: response._id } }
            );
            res.status(201).json(response);
        }
        else {
            res.status(404).json({ message: 'Instructor not found' });
        }
    }
    catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ error: error.message });
    }
}

const getEditCoursePage = (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "..", "public", "html", "edit_course.html"));
}

const getCourseData = async (req, res) => {
    const { id } = req.params;
    const { query } = req.query;

    if (query && query === "preview") {
        try {
            const response = await courseModel.findById(id)
                .select("title instructor poster price description units.title units.description units.order faqs overall_rating reviews");

            const preparedResp = {};
            preparedResp.title = response.title;
            preparedResp.poster = response.poster;
            preparedResp.price = response.price;
            preparedResp.description = response.description;
            preparedResp.units = response.units;
            preparedResp.faqs = response.faqs;
            preparedResp.overall_rating = response.overall_rating;
            preparedResp.star5 = (response.reviews.filter(review => review.rating === 5).length * 100 / response.reviews.length).toFixed(0);
            preparedResp.star4 = (response.reviews.filter(review => review.rating === 4).length * 100 / response.reviews.length).toFixed(0);
            preparedResp.star3 = (response.reviews.filter(review => review.rating === 3).length * 100 / response.reviews.length).toFixed(0);
            preparedResp.star2 = (response.reviews.filter(review => review.rating === 2).length * 100 / response.reviews.length).toFixed(0);
            preparedResp.star1 = (response.reviews.filter(review => review.rating === 1).length * 100 / response.reviews.length).toFixed(0);
            preparedResp.reviews = response.reviews
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 50);

            if (!response) {
                return res.status(404).json({ message: 'Course not found' });
            }
            instructor = await instructorModel.findById(new mongoose.Types.ObjectId(response.instructor));
            preparedResp.instructor = instructor.name;
            res.status(200).json(preparedResp);
        }
        catch (error) {
            console.error(error); // Log the error for debugging
            res.status(500).json({ error: error.message }); // Return error message
        }
    }
    else {
        try {
            const response = await courseModel.findById(id); // Await the database call
            if (!response) {
                return res.status(404).json({ message: 'Course not found' });
            }
            res.status(200).json(response);
        }
        catch (error) {
            console.error(error); // Log the error for debugging
            res.status(500).json({ error: error.message }); // Return error message
        }
    }
}

const getCoursesData = async (req, res) => {
    try {
        const courseIds = req.body.ids;
        const coursePromises = courseIds.map(async (id) => {
            const course_data = {};
            const response = await courseModel.findById(id);
            if (response) {
                course_data.id = response._id;
                course_data.title = response.title;
                course_data.num_units = response.units.length;
                course_data.published = response.published;
                return course_data;
            }
        });
        const coursesData = await Promise.all(coursePromises);
        res.status(200).json({ data: coursesData });
    }
    catch (error) {
        console.error('Error fetching courses data:', error);
        res.status(500).json({ error: 'Failed to fetch courses data' });
    }
}

const getCourseLearnPage = (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "..", "public", "html", "course_page.html"));
}

const getCourseAnalyticsPage = (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "..", "public", "html", "course_analytics.html"));
}

const enrollCourse = async (req, res) => {
    try {
        const { courseId, studentId } = req.body;

        // Ensure studentId and courseId are ObjectId types
        const studentObjectId = new mongoose.Types.ObjectId(studentId);
        const courseObjectId = new mongoose.Types.ObjectId(courseId);

        const student = await studentModel.findById(studentObjectId);
        
        if (student) {
            const course = await courseModel.findById(courseId);

            // Create the enrollment object
            const enrollmentObject = {
                courseId: courseObjectId,
                pricePaid: course.price,
                preAssessmentScore: -1,
                unitAssessmentScore: new Array(course.units.length).fill(-1),
                lessonsCompleted: []
            };

            // Update the student's enrolledCourses array
            await studentModel.findByIdAndUpdate(
                studentObjectId,
                { $push: { enrolledCourses: enrollmentObject } }
            );

            // Update the course's enrollments array
            await courseModel.findByIdAndUpdate(
                courseObjectId,
                { $push: { enrollments: { studentId: studentObjectId } } }
            );

            console.log("Enrollment Completed");

            res.status(200).json({ message: "Enrollment successful!" });
        }
        else {
            res.status(404).json({ message: "Student not found" });
        }
    }
    catch (error) {
        console.error("Error:", error); // Logs the specific error
        res.status(500).json({ message: "Internal server error", error });
    }
};

const getPreAssessmentPage = (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "..", "public", "html", "course_pre_assessment.html"));
}

const generatePreAssessment = async (req, res) => {
    try {
        const referer = req.headers.referer || req.headers.origin;
        let courseId = referer.split("/")[4];
        courseId = new mongoose.Types.ObjectId(courseId);

        const course = await courseModel.findById(courseId);
        const questions = [];
        const generated = [];
        while (questions.length < 10) {    // I want 10 questions
            const i = Math.floor(Math.random() * course.units.length);
            const j = Math.floor(Math.random() * course.units[i].lessons.length);
            if (generated.includes({ unit: i, lesson: j })) {
                continue;
            }
            else {
                generated.push({ unit: i, lesson: j });
            }
            const url = "" // LLM API
            const seed = Math.floor(Math.random() * 99999)
            const format = `{question_statement:"",A:"",B:"",C:"",D:""}`;
            const headers = {
                "Content-Type": "application/json"
            };
            try {
                const lesson_content = course.units[i].lessons[j].content;
                const prompt = `
                    Respond in JSON format like this: ${format}. 
                    Enclose any inline code in <code></code> HTML tag. Enclose any code  block in the <pre></pre> HTML tag.
                    Do not generate any advertisement. Do not generate anything else, only generate the required content. 
                    Create 1 random multiple choice question from the following content: ${lesson_content}
                `;
                const payload = {
                    model: "openai-large",
                    json: true,
                    private: true,
                    seed: seed,
                    messages: [
                        { role: "system", content: "You are an expert at creating multiple choice questions from the given content" },
                        { role: "user", content: prompt }
                    ]
                };
                const result = await axios.post(url, payload, { headers }, { timeout: 30000 });
                const response = JSON.parse(result.data.choices[0].message.content);
                if (response.question_statement && response.A && response.B && response.C && response.D) {
                    questions.push(response);
                }
                else {
                    console.log("Invalid question");
                }
            }
            catch (error) {
                console.log('Error:', error.message);
                continue;
            }
        }
        // console.log(questions);
        res.status(200).json({ questions: questions });
    }
    catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
}

const generateAssessment = async (req, res) => {
    try {
        const referer = req.headers.referer || req.headers.origin;
        let courseId = referer.split("/")[4];
        courseId = new mongoose.Types.ObjectId(courseId);
        let studentId = referer.split("=")[1];
        studentId = new mongoose.Types.ObjectId(studentId);
        const { unit_order } = req.query;

        const course = await courseModel.findById(courseId);

        const [unit] = course.units.filter((unit => {
            return (unit.order == unit_order);
        }));

        const questions = [];
        const student = await studentModel.findOne(
            { _id: studentId, 'enrolledCourses.courseId': courseId },
            { 'enrolledCourses.$': 1 }
        );
        const enrolledCourse = student.enrolledCourses.filter(course => {
            return (course.courseId.toString() == courseId);
        });

        for (let i = 0; i < unit.lessons.length; i++) {
            try {
                const lesson_content = unit.lessons[i].content;
                const url = "" // LLM API
                const seed = Math.floor(Math.random() * 99999)
                const headers = {
                    "Content-Type": "application/json"
                };
                const easy_format = `{question_statement:,A:,B:,C:,D:}`;
                const medium_format = `{question_statement:,A:,B:,C:,D:,E:}`;
                const hard_format = `{question_statement:,A:,B:,C:,D:,E:,F:}`;
                let prompt;
                if (enrolledCourse[0].preAssessmentScore > 0.7 && enrolledCourse[0].preAssessmentScore <= 1.0) prompt = `
                    Respond in the following format: ${hard_format}. 
                    Enclose any inline code in <code></code> HTML tag. Enclose any code  block in the <pre></pre> HTML tag.
                    Do not generate any advertisement. 
                    Create 1 random multiple choice question with high difficulty level from the following content: ${lesson_content}
                `;
                else if (enrolledCourse[0].preAssessmentScore < 0.4 && enrolledCourse[0].preAssessmentScore >= 0.0) prompt = `
                    Respond in the following format: ${easy_format}. 
                    Enclose any inline code in <code></code> HTML tag. Enclose any code  block in the <pre></pre> HTML tag.
                    Do not generate any advertisement. 
                    Create 1 random multiple choice question with easy difficulty level from the following content: ${lesson_content}
                `;
                else prompt = `
                    Respond in the following format: ${medium_format}. 
                    Enclose any inline code in <code></code> HTML tag. Enclose any code  block in the <pre></pre> HTML tag.
                    Do not generate any advertisement. 
                    Create 1 random multiple choice question with medium difficulty level from the following content: ${lesson_content}
                `;
                const payload = {
                    model: "openai-large",
                    json: true,
                    private: true,
                    seed: seed,
                    messages: [
                        { role: "system", content: "You are an expert at creating multiple choice questions from the given content" },
                        { role: "user", content: prompt }
                    ]
                };
                const result = await axios.post(url, payload, { headers }, { timeout: 30000 });
                const response = JSON.parse(result.data.choices[0].message.content);
                if (response.question_statement && response.A && response.B && response.C && response.D) {
                    questions.push(response);
                }
                else {
                    console.log("Invalid question");
                    i--;
                }
            }
            catch (error) {
                console.log('Error:', error.message);
                i--;
                continue;
            }
        }
        res.status(200).json({ questions: questions });
    }
    catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
}

const getSearchResults = async (req, res) => {
    const { query } = req.body;
    try {
        const courses = await courseModel.find({
            $or: [
                // { title: { $regex: query, $options: "i" } },
                { tags: { $in: [query.toLowerCase()] } }
            ]
        }).select("_id title poster instructor price overall_rating reviews");

        const refinedCourses = courses.map(course => ({
            _id: course._id.toString(),
            title: course.title,
            poster: course.poster,
            instructor: course.instructor,
            price: course.price,
            overall_rating: course.overall_rating,
            review_count: course.reviews.length
        }));
        res.status(200).json(refinedCourses);
    }
    catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
}

const getPopularCourses = async (req, res) => {
    const referer = req.headers.referer || req.headers.origin;
    const studentId = referer.split("/")[4];

    try {
        // Find the student and get their enrolledCourses array
        const student = await studentModel.findById(studentId).select("enrolledCourses");
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const enrolledCourseIds = student.enrolledCourses.map(course => course.courseId); // Extract courseIds

        const popularCourses = await courseModel.aggregate([
            {
                $match: {
                    published: true,
                    _id: { $nin: enrolledCourseIds } // Exclude courses already enrolled
                }
            },
            {
                $project: {
                    title: 1,
                    instructor: 1,
                    poster: 1,
                    price: 1,
                    overall_rating: 1,
                    reviewsCount: { $size: { $ifNull: ["$reviews", []] } },
                    enrollmentsCount: { $size: { $ifNull: ["$enrollments", []] } } // Use $ifNull for missing enrollments
                }
            },
            {
                $sort: { enrollmentsCount: -1 } // Sort by enrollmentsCount in descending order
            },
            {
                $limit: 10
            }
        ]);
        res.status(200).json(popularCourses);
    }
    catch (error) {
        console.error(error); // Log error for debugging
        res.status(500).json({ error: error.message }); // Return error message
    }
};

const addReview = async (req, res) => {
    const { rating, review } = req.body;
    const { id: courseId } = req.params;
    const referer = req.headers.referer || req.headers.origin;

    // Validate referer format
    if (!referer || !referer.includes("=")) {
        return res.status(400).json({ message: "Invalid referer header" });
    }

    // Extract and validate studentId
    const studentIdStr = referer.split("=")[1];

    if (!mongoose.Types.ObjectId.isValid(studentIdStr)) {
        return res.status(400).json({ message: "Invalid Student ID" });
    }
    const studentId = new mongoose.Types.ObjectId(studentIdStr);
    try {
        // Find the student
        const student = await studentModel.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        // Find the course
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        // Check if a review by this student already exists
        const existingReviewIndex = course.reviews.findIndex(r => r.studentId.toString() === studentId.toString());
        if (existingReviewIndex !== -1) {
            // Update existing review
            course.reviews[existingReviewIndex] = { studentId, name: student.name, rating, review };
        }
        else {
            // Add new review
            course.reviews.push({ studentId: studentId, name: student.name, rating: rating, review: review });
        }
        // Recalculate overall rating
        const totalRatings = course.reviews.reduce((sum, r) => sum + parseInt(r.rating), 0);
        course.overall_rating = totalRatings / course.reviews.length;
        await course.save();
        res.status(201).json({ message: existingReviewIndex !== -1 ? "Review updated" : "Review submitted", overall_rating: course.overall_rating });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

const deleteReview = async (req, res) => {
    const { id: courseId } = req.params;
    const referer = req.headers.referer || req.headers.origin;

    // Validate referer format
    if (!referer || !referer.includes("=")) {
        return res.status(400).json({ message: "Invalid referer header" });
    }

    // Extract and validate studentId
    const studentIdStr = referer.split("=")[1];
    if (!mongoose.Types.ObjectId.isValid(studentIdStr)) {
        return res.status(400).json({ message: "Invalid Student ID" });
    }
    const studentId = new mongoose.Types.ObjectId(studentIdStr);

    try {
        // Find the student
        const student = await studentModel.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Find the course
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Find and remove the review
        const reviewIndex = course.reviews.findIndex(r => r.studentId.toString() === studentId.toString());
        if (reviewIndex === -1) {
            return res.status(404).json({ message: "Review not found" });
        }

        course.reviews.splice(reviewIndex, 1);

        // Recalculate overall rating
        if (course.reviews.length > 0) {
            const totalRatings = course.reviews.reduce((sum, r) => sum + parseInt(r.rating), 0);
            course.overall_rating = totalRatings / course.reviews.length;
        } else {
            course.overall_rating = 0.0;
        }

        await course.save();
        res.status(200).json({ message: "Review deleted", overall_rating: course.overall_rating });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getTrendingCourses = async (req, res) => {
    try {
        // Get the date 1 month ago
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // Query to find top 6 courses with maximum enrollments in the last 1 month
        let response = await courseModel.aggregate([
            { $match: { "enrollments.createdAt": { $gte: oneMonthAgo } } }, // Filter enrollments in last 1 month
            { $addFields: { enrollments_count: { $size: "$enrollments" } } }, // Count enrollments
            { $sort: { enrollments_count: -1 } }, // Sort by enrollments count (descending)
            { $limit: 6 }, // Get top 6 courses
            { $project: { title: 1, poster: 1, instructor: 1, overall_rating: 1, price: 1, _id: 1, enrollments_count: 1 } } // Select required fields
        ]);
        if (response.length < 6) response = await courseModel.aggregate([
            { $sample: { size: 6 } },
            { $project: { title: 1, poster: 1, instructor: 1, overall_rating: 1, price: 1, _id: 1, reviewsCount: { $size: "$reviews" } } }
        ]);

        for (course of response) {
            instructor = await instructorModel.findById(new mongoose.Types.ObjectId(course.instructor));
            course.instructor = instructor.name;
        }

        res.status(200).json(response);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getCourseAnalyticsData = async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch course details
        const course = await courseModel.findById({ "_id": id }).select("title price createdAt updatedAt reviews");

        // Find enrolled students
        const students = await studentModel.find({ "enrolledCourses.courseId": id });

        // Total number of students enrolled
        const totalStudents = students.length;

        if (totalStudents === 0) {
            return res.status(200).json({
                course, 
                genderStats: {}, 
                ageGroups: {}, 
                reviewStats: {}, 
                completionRate: {}
            });
        }

        // Calculate gender percentage
        const genderStats = students.reduce((acc, student) => {
            acc[student.gender] = (acc[student.gender] || 0) + 1;
            return acc;
        }, {});

        Object.keys(genderStats).forEach(gender => {
            genderStats[gender] = ((genderStats[gender] / totalStudents) * 100).toFixed(2) + "%";
        });

        // Calculate age group percentage
        const currentDate = new Date();
        const ageGroups = {
            "Under 18": 0,
            "18-25": 0,
            "26-35": 0,
            "36-50": 0,
            "Above 50": 0
        };

        students.forEach(student => {
            const age = currentDate.getFullYear() - student.dob.getFullYear();

            if (age < 18) ageGroups["Under 18"]++;
            else if (age <= 25) ageGroups["18-25"]++;
            else if (age <= 35) ageGroups["26-35"]++;
            else if (age <= 50) ageGroups["36-50"]++;
            else ageGroups["Above 50"]++;
        });

        Object.keys(ageGroups).forEach(group => {
            ageGroups[group] = ((ageGroups[group] / totalStudents) * 100).toFixed(2) + "%";
        });

        // Calculate review percentages
        const reviewStats = { "1Star": 0, "2Star": 0, "3Star": 0, "4Star": 0, "5Star": 0 };
        const totalReviews = course.reviews.length;

        if (totalReviews > 0) {
            course.reviews.forEach(review => {
                reviewStats[`${review.rating}Star`]++;
            });

            Object.keys(reviewStats).forEach(star => {
                reviewStats[star] = ((reviewStats[star] / totalReviews) * 100).toFixed(2) + "%";
            });
        }

        // Calculate completion rate
        let completedCount = 0;
        let inProgressCount = 0;

        students.forEach(student => {
            const enrolledCourse = student.enrolledCourses.find(c => c.courseId.toString() === id);
            if (enrolledCourse?.completionDate) {
                completedCount++;
            }
            else {
                inProgressCount++;
            }
        });

        const completedPercentage = ((completedCount / totalStudents) * 100).toFixed(2) + "%";
        const inProgressPercentage = ((inProgressCount / totalStudents) * 100).toFixed(2) + "%";

        const completionRate = { completedPercentage, inProgressPercentage };

        // Send response with updated completion rate data
        res.status(200).json({ course, genderStats, ageGroups, reviewStats, completionRate });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0, magnitudeA = 0, magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {

        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    return magnitudeA === 0 || magnitudeB === 0 ? NaN : dotProduct / (magnitudeA * magnitudeB);
}

const getRecommendedCourses = async (req, res) => {
    const referer = req.headers.referer || req.headers.origin;
    const studentId = referer.split("/")[4];

    try {
        const student = await studentModel.findById(studentId).select("enrolledCourses");
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const enrolledCourseIds = student.enrolledCourses.map(course => course.courseId.toString());
        const db = await lancedb.connect("./lancedb_data");
        const table = await db.openTable("course_embeddings");

        let enrolledEmbeddings = [];

        // Retrieve stored embeddings for enrolled courses
        for await (const batch of table.query()) {
            batch.toArray().forEach(row => {
                if (enrolledCourseIds.includes(row.course_id)) {
                    enrolledEmbeddings.push({ id: row.course_id, embedding: row.vectors });
                }
            });
        }

        let recommendedCourses = [];

        // Compare embeddings manually
        for await (const batch of table.query()) {
            batch.toArray().forEach(row => {
                if (!enrolledCourseIds.includes(row.course_id)) { // Avoid already enrolled courses
                    enrolledEmbeddings.forEach(enrolledCourse => {
                        const similarity = cosineSimilarity(enrolledCourse.embedding.toArray(), row.vectors.toArray());
                        recommendedCourses.push({ id: row.course_id, similarity });
                    });
                }
            });
        }

        // Sort by highest similarity and select top 5
        recommendedCourses.sort((a, b) => b.similarity - a.similarity);
        // console.log(recommendedCourses);
        const uniqueRecommendedCourses = Array.from(new Map(recommendedCourses.map(course => [course.id, course])).values()).slice(0, 5);

        // Fetch course details
        const recommendedCoursesDetails = await Promise.all(uniqueRecommendedCourses.map(async (course) => {
            const courseDetails = await courseModel.findById(course.id).select("_id title instructor poster price overall_rating reviews");
            const instructor = await instructorModel.findById(courseDetails.instructor);

            return {
                ...courseDetails.toObject(),
                instructor: instructor.name,
                reviewsCount: courseDetails.reviews.length // Get the length of the reviews array
            };
        }));

        res.status(200).json(recommendedCoursesDetails);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getQueryResponse = async (req, res) => {
    const { query } = req.body;
    const { id } = req.params;
    const MIN_SIMILARITY_THRESHOLD = 0.45; // Adjust based on testing

    try {
        // Step 1: Generate embedding for user's query
        const queryEmbedding = await generateOllamaEmbedding(query);

        // Step 2: Connect to LanceDB and retrieve course embeddings
        const db = await lancedb.connect("./lancedb_data");
        const table = await db.openTable("course_embeddings");

        let relevantContent = [];

        for await (const batch of table.query().where(`course_id == '${id}'`)) {
            batch.toArray().forEach(row => {
                // Step 3: Compute similarity score
                const similarity = cosineSimilarity(queryEmbedding, row.vectors.toArray());

                // Step 4: Store content with similarity score
                relevantContent.push({ lessonTitle: row.lesson_title, content: row.content, similarity });
            });
        }

        // Step 5: Sort by similarity and pick top 5 matches
        relevantContent.sort((a, b) => b.similarity - a.similarity);
        const topContent = relevantContent.slice(0, 3).map(c => `${c.lessonTitle}: ${c.content}`).join("\n\n");

        // Check if any relevant content meets the threshold
        const maxSimilarity = relevantContent.length > 0 ? relevantContent[0].similarity : 0;

        if (maxSimilarity < MIN_SIMILARITY_THRESHOLD) {
            return res.status(200).json({
                answer: "I can't answer that as it seems unrelated to the course content.",
                sources: []
            });
        }

        // Step 6: Send retrieved context to LLM for answer generation
        const url = "" // LLM API
        const seed = Math.floor(Math.random() * 99999)
        const headers = {
            "Content-Type": "application/json"
        };
        const prompt = `
            Context: ${topContent}
            Question : ${query}
        `;
        const payload = {
            model: "openai-large",
            json: false,
            private: true,
            seed: seed,
            messages: [
                {
                    role: "system", content: `Answer the given question in maximum 100 words using the given context. 
                                            Respond in HTML format. Use <p> tag for plain text.
                                            Use <code> tag for enclosing inline code and formulas.
                                            Use <pre> tag for enclosing code block.` },
                { role: "user", content: prompt }
            ]
        };
        const result = await axios.post(url, payload, { headers }, { timeout: 30000 });
        const responseFromLLM = result.data.choices[0].message;
        res.status(200).json({
            answer: responseFromLLM,
            sources: relevantContent.slice(0, 1).map(source => source.lessonTitle) // Include sources for transparency
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getCoursePage,
    updateCourse,
    getEditCoursePage,
    getCourseData,
    getCoursesData,
    createCourse,
    getCourseLearnPage,
    enrollCourse,
    getPreAssessmentPage,
    getCourseAnalyticsPage,
    generatePreAssessment,
    generateAssessment,
    getSearchResults,
    getPopularCourses,
    addReview,
    getTagResults,
    getTrendingCourses,
    getCourseAnalyticsData,
    getRecommendedCourses,
    getQueryResponse,
    deleteReview
}
