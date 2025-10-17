const mongoose = require('mongoose');

// Lesson Completed Schema
const lessonCompletedSchema = mongoose.Schema({
    unitOrder: {
        type: mongoose.Schema.Types.Number,
        required: true
    },
    lessonOrder: {
        type: mongoose.Schema.Types.Number,
        required: true   
    }
}, {
    timestamps: true
});


//Enrolled Course Schema
const enrolledSchema = mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    pricePaid: {
        type: mongoose.Schema.Types.Number,
        required: true
    },
    preAssessmentScore: {
        type: mongoose.Schema.Types.Number,
        required: true,
        default: -1
    },
    unitAssessmentScore: [mongoose.Schema.Types.Number],
    lessonsCompleted: [lessonCompletedSchema],
    completionDate: {
        type: mongoose.Schema.Types.Date
    }
}, {
    timestamps: true
});

// Student Schema
const studentSchema = mongoose.Schema({
    name: {
        type: mongoose.Schema.Types.String,
        required: true,
        minLength: 3,
        maxLength: 30
    },
    email: {
        type: mongoose.Schema.Types.String,
        required: true,
        unique: true,
        minLength: 4,
        maxLength: 50,
        match: [/^[a-zA-Z0-9._%+-]+@(outlook|gmail)\.com$/,
            "Only Outlook and Gmail addresses are accepted"]
    },
    mobile: {
        type: mongoose.Schema.Types.String,
        required: true,
        unique: true,
        minLength: 10,
        maxLength: 10,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v); // Validates exactly 10 digits
            },
            message: () => `Mobile number is not valid!`
        }
    },
    gender: {
        type: mongoose.Schema.Types.String,
        enum: ['male', 'female'],
        required: true
    },
    dob: {
        type: mongoose.Schema.Types.Date,
        required: true
    },
    password: {
        type: mongoose.Schema.Types.String,
        required: true,
        minLength: 8,
        maxLength: 100,
        match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).+$/,
            "Password should contain atleast 1 lowercase, 1 uppercase and 1 special character"]
    },
    enrolledCourses: [enrolledSchema]
},
    {
        timestamps: true
    }
);

const studentModel = mongoose.model('Student', studentSchema);

module.exports = studentModel;