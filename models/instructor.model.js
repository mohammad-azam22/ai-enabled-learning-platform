const mongoose = require('mongoose');

// Instructor Schema
const instructorSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        minLength: 4,
        maxLength: 50,
        match: [/^[a-zA-Z0-9._%+-]+@(outlook|gmail)\.com$/, "Only Outlook and Gmail addresses are accepted"]
    },
    mobile: {
        type: String,
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
        type: String,
        minLength: 8,
        maxLength: 100,
        required: true,
        match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).+$/,
            "Password should contain atleast 1 lowercase, 1 uppercase and 1 special character"]
    },
    courses_created: [mongoose.Schema.Types.ObjectId],
    account_status: {
        type: mongoose.Schema.Types.String,
        enum: ["active", "inactive"],
        default: "active",
        required: true
    }
},
    {
        timestamps: true
    }
);

// create model
const instructorModel = mongoose.model('Instructor', instructorSchema);

module.exports = {
    instructorModel
}
