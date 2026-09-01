const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        fileName: {
            type: String,
            required: true,
            trim: true,
        },

        fileUrl: {
            type: String,
            required: true,
            trim: true,
        },

        fileType: {
            type: String,
            required: true,
            trim: true,
        },

        parsedText: {
            type: String,
            default: '',
        },

        skills: {
            type: [
                {
                    name: {
                        type: String,
                        required: true,
                        trim: true,
                    },

                    category: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                },
            ],

            default: [],
        },

        education: {
            type: [
                {
                    degree: {
                        type: String,
                        trim: true,
                    },
                    institution: {
                        type: String,
                        trim: true,
                    },
                    startYear: Number,
                    endYear: Number,
                },
            ],
            default: [],
        },

        experience: {
            type: [
                {
                    company: {
                        type: String,
                        trim: true,
                    },
                    position: {
                        type: String,
                        trim: true,
                    },
                    startDate: Date,
                    endDate: Date,
                    description: {
                        type: String,
                        trim: true,
                    },
                },
            ],
            default: [],
        },

        projects: {
            type: [
                {
                    name: {
                        type: String,
                        trim: true,
                    },
                    description: {
                        type: String,
                        trim: true,
                    },
                    technologies: {
                        type: [String],
                        default: [],
                    },
                },
            ],
            default: [],
        },

        isPrimary: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;