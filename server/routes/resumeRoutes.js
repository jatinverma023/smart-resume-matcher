const express = require('express');

const Resume = require('../models/Resume');

const {
    authenticate,
} = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

const {
    parseResume,
} = require('../services/resumeParser');

const {
    extractSkills,
} = require('../services/skillExtractor');

const router = express.Router();

router.get('/my', authenticate, async (req, res) => {
    try {
        const resumes = await Resume.find({
            user: req.user.userId,
        }).sort({ createdAt: -1 });

        return res.json({
            success: true,
            count: resumes.length,
            resumes: resumes.map((resume) => ({
                id: resume._id,
                fileName: resume.fileName,
                fileType: resume.fileType,
                fileUrl: resume.fileUrl,
                skills: resume.skills,
                createdAt: resume.createdAt,
            })),
        });
    } catch (error) {
        console.error('Get resumes error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch resumes',
        });
    }
});

router.post(
    '/upload',
    authenticate,
    upload.single('resume'),
    async (req, res) => {
        try {
            if (req.user.role !== 'candidate') {
                return res.status(403).json({
                    success: false,
                    message: 'Only candidates can upload resumes',
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Resume file is required',
                });
            }

            const parsedText = await parseResume(
                req.file.path,
                req.file.mimetype
            );

            const skills = extractSkills(parsedText);

            const resume = await Resume.create({
                user: req.user.userId,
                fileName: req.file.originalname,
                fileUrl: `/uploads/${req.file.filename}`,
                fileType: req.file.mimetype,
                parsedText,
                skills,
            });

            return res.status(201).json({
                success: true,
                message: 'Resume uploaded successfully',
                resume: {
                    id: resume._id,
                    fileName: resume.fileName,
                    fileType: resume.fileType,
                    skills: resume.skills,
                    parsedText: resume.parsedText,
                    createdAt: resume.createdAt,
                },
            });
        } catch (error) {
            console.error('Resume upload error:', error);

            return res.status(500).json({
                success: false,
                message: 'Unable to upload and parse resume',
                error: error.message,
            });
        }
    }
);

module.exports = router;