const express = require('express');

const Resume = require('../models/Resume');
const Job = require('../models/Job');

const {
    authenticate,
} = require('../middleware/authMiddleware');

const {
    calculateMatch,
} = require('../services/matchingEngine');

const router = express.Router();

router.post('/calculate', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'candidate') {
            return res.status(403).json({
                success: false,
                message: 'Only candidates can calculate resume matches',
            });
        }

        const { resumeId, jobId } = req.body;

        if (!resumeId || !jobId) {
            return res.status(400).json({
                success: false,
                message: 'resumeId and jobId are required',
            });
        }

        const resume = await Resume.findOne({
            _id: resumeId,
            user: req.user.userId,
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: 'Resume not found',
            });
        }

        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        const match = calculateMatch(resume, job);

        return res.json({
            success: true,
            match: {
                resumeId: resume._id,
                jobId: job._id,
                jobTitle: job.title,
                company: job.company,
                ...match,
            },
        });
    } catch (error) {
        console.error('Calculate match error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to calculate resume match',
        });
    }
});

module.exports = router;