const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
    {
        recruiter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        company: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        requiredSkills: {
            type: [String],
            default: [],
        },

        preferredSkills: {
            type: [String],
            default: [],
        },

        location: {
            type: String,
            trim: true,
            default: '',
        },

        employmentType: {
            type: String,
            enum: [
                'full-time',
                'part-time',
                'internship',
                'contract',
            ],
            default: 'full-time',
        },

        experienceLevel: {
            type: String,
            enum: [
                'entry',
                'mid',
                'senior',
            ],
            default: 'entry',
        },

        status: {
            type: String,
            enum: [
                'draft',
                'open',
                'closed',
            ],
            default: 'draft',
        },

        applicationDeadline: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;