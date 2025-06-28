const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    contact: {
        type: String,
        required: true,
        trim: true,
        match: [/^\d{10}$/, 'Contact number must be exactly 10 digits']
    },
    skillsOffered: {
        type: [String],
        default: [],
        validate: {
            validator: arr => arr.every(s => typeof s === 'string' && s.trim().length > 0),
            message: 'Skills offered must be non-empty strings'
        }
    },
    skillsWanted: {
        type: [String],
        default: [],
        validate: {
            validator: arr => arr.every(s => typeof s === 'string' && s.trim().length > 0),
            message: 'Skills wanted must be non-empty strings'
        }
    },
    nativeLanguage: {
        type: String,
        trim: true,
        default: ''
    },
    learningLanguages: {
        type: [String],
        default: [],
        validate: {
            validator: arr => arr.every(s => typeof s === 'string' && s.trim().length > 0),
            message: 'Learning languages must be non-empty strings'
        }
    },
    tutoringSubjects: {
        type: [String],
        default: [],
        validate: {
            validator: arr => arr.every(s => typeof s === 'string' && s.trim().length > 0),
            message: 'Tutoring subjects must be non-empty strings'
        }
    },
    tutoringNeeds: {
        type: [String],
        default: [],
        validate: {
            validator: arr => arr.every(s => typeof s === 'string' && s.trim().length > 0),
            message: 'Tutoring needs must be non-empty strings'
        }
    },
    bio: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);