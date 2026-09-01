const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
    {
        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true,
            index: true,
        },

        resume: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resume',
            required: true,
        },

        status: {
            type: String,
            enum: [
                'applied',
                'shortlisted',
                'rejected',
                'interview',
                'hired',
            ],
            default: 'applied',
        },

        matchScore: {
            type: Number,
            min: 0,
            max: 100,
            default: null,
        },

        matchAnalysis: {
            required: {
                total: {
                    type: Number,
                    default: 0,
                },
                matched: {
                    type: Number,
                    default: 0,
                },
                coverage: {
                    type: Number,
                    default: 0,
                },
                matchedSkills: {
                    type: [String],
                    default: [],
                },
                missingSkills: {
                    type: [String],
                    default: [],
                },
            },

            preferred: {
                total: {
                    type: Number,
                    default: 0,
                },
                matched: {
                    type: Number,
                    default: 0,
                },
                coverage: {
                    type: Number,
                    default: 0,
                },
                matchedSkills: {
                    type: [String],
                    default: [],
                },
                missingSkills: {
                    type: [String],
                    default: [],
                },
            },
        },

        appliedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

applicationSchema.index(
    {
        candidate: 1,
        job: 1,
    },
    {
        unique: true,
    }
);

const Application = mongoose.model(
    'Application',
    applicationSchema
);

module.exports = Application;