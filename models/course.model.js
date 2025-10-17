const mongoose = require('mongoose');

// Enrollement schema
const enrollmentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
}, {
    timestamps: true
});

// Lesson schema
const lessonSchema = new mongoose.Schema({
    title: {
        type: mongoose.Schema.Types.String,
        required: true
    },
    order: {
        type: mongoose.Schema.Types.Number,
        required: true
    },
    content: {
        type: [mongoose.Schema.Types.String],
        required: true
    }
});

// Unit schema
const unitSchema = new mongoose.Schema({
    title: {
        type: mongoose.Schema.Types.String,
        required: true
    },
    description: {
        type: mongoose.Schema.Types.String,
        required: true
    },
    order: {
        type: mongoose.Schema.Types.Number,
        required: true
    },
    lessons: [lessonSchema]
});

// FAQ schema
const faqSchema = new mongoose.Schema({
    question: {
        type: mongoose.Schema.Types.String,
        required: true
    },
    answer: {
        type: mongoose.Schema.Types.String,
        required: true
    }
});

// Review schema
const reviewSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: mongoose.Schema.Types.String,
        required: true
    },
    rating: {
        type: mongoose.Schema.Types.Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: mongoose.Schema.Types.String,
        required: true,
        maxLength: 500
    }
}, {
    timestamps: true
});

// Course schema
const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor',
        required: true
    },
    poster: {
        type: mongoose.Schema.Types.String,
        required: true
    },
    difficulty: {
        type: mongoose.Schema.Types.String,
        required: true,
        enum: ["beginner", "intermediate", "advanced"]
    },
    price: {
        type: mongoose.Schema.Types.Number,
        required: true,
        min: 0,
        max: 300
    },
    tags: {
        type: mongoose.Schema.Types.Array,
        required: true,
    },
    description: {
        type: mongoose.Schema.Types.String,
        required: true
    },
    units: [unitSchema],
    faqs: [faqSchema],
    reviews: [reviewSchema],
    overall_rating: {
        type: mongoose.Schema.Types.Double,
        required: true,
        default: 0.0
    },
    enrollments: [enrollmentSchema],
    published: {
        type: mongoose.Schema.Types.Boolean,
        required: true,
        default: false
    }
}, {
    timestamps: true
});

// Create the models
const courseModel = mongoose.model('Course', courseSchema);

module.exports = {
    courseModel
};