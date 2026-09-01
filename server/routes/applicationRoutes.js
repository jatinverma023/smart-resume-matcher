const express = require('express');

const Application = require('../models/Application');
const Resume = require('../models/Resume');
const Job = require('../models/Job');

const {
    authenticate,
} = require('../middleware/authMiddleware');

const {
    calculateMatch,
} = require('../services/matchingEngine');

const router = express.Router();

/*
 * Apply to a job
 */
router.post('/', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'candidate') {
            return res.status(403).json({
                success: false,
                message: 'Only candidates can apply for jobs',
            });
        }

        const {
            jobId,
            resumeId,
        } = req.body;

        if (!jobId || !resumeId) {
            return res.status(400).json({
                success: false,
                message: 'jobId and resumeId are required',
            });
        }

        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        if (job.status !== 'open') {
            return res.status(400).json({
                success: false,
                message: 'This job is no longer accepting applications',
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

        const existingApplication =
            await Application.findOne({
                candidate: req.user.userId,
                job: jobId,
            });

        if (existingApplication) {
            return res.status(409).json({
                success: false,
                message: 'You have already applied for this job',
                application: {
                    id: existingApplication._id,
                    status: existingApplication.status,
                },
            });
        }

        const match = calculateMatch(
            resume,
            job
        );

        const application = await Application.create({
            candidate: req.user.userId,
            job: jobId,
            resume: resumeId,
            matchScore: match.score,
            matchAnalysis: {
                required: match.required,
                preferred: match.preferred,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application: {
                id: application._id,
                candidate: application.candidate,
                job: application.job,
                resume: application.resume,
                status: application.status,
                matchScore: application.matchScore,
                appliedAt: application.appliedAt,
            },
            match,
        });
    } catch (error) {
        console.error('Apply error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to submit application',
        });
    }
});

/*
 * Get applicants for a recruiter's job
 */
router.get('/job/:jobId', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'recruiter') {
            return res.status(403).json({
                success: false,
                message: 'Only recruiters can view job applicants',
            });
        }

        const { jobId } = req.params;

        const job = await Job.findOne({
            _id: jobId,
            recruiter: req.user.userId,
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found or you do not own this job',
            });
        }

        const applications = await Application.find({
            job: jobId,
        })
            .populate(
                'candidate',
                'name email'
            )
            .populate(
                'resume',
                'fileName skills createdAt'
            )
            .sort({
                matchScore: -1,
                createdAt: 1,
            });

        return res.json({
            success: true,
            job: {
                id: job._id,
                title: job.title,
                company: job.company,
            },
            count: applications.length,
            applications,
        });
    } catch (error) {
        console.error(
            'Get job applicants error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch job applicants',
        });
    }
});

/*
 * Update application status
 */
router.patch('/:applicationId/status', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'recruiter') {
            return res.status(403).json({
                success: false,
                message: 'Only recruiters can update application status',
            });
        }

        const { applicationId } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            'applied',
            'shortlisted',
            'rejected',
            'interview',
            'hired',
        ];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid application status',
                allowedStatuses,
            });
        }

        const application = await Application.findById(
            applicationId
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        const job = await Job.findOne({
            _id: application.job,
            recruiter: req.user.userId,
        });

        if (!job) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this application',
            });
        }

        application.status = status;

        await application.save();

        return res.json({
            success: true,
            message: 'Application status updated successfully',
            application: {
                id: application._id,
                status: application.status,
                matchScore: application.matchScore,
                updatedAt: application.updatedAt,
            },
        });
    } catch (error) {
        console.error(
            'Update application status error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to update application status',
        });
    }
});

/*
 * Get candidate's applications
 */
router.get('/my', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'candidate') {
            return res.status(403).json({
                success: false,
                message: 'Only candidates can view their applications',
            });
        }

        const applications = await Application.find({
            candidate: req.user.userId,
        })
            .populate(
                'job',
                'title company location employmentType status'
            )
            .populate(
                'resume',
                'fileName skills createdAt'
            )
            .sort({
                createdAt: -1,
            });

        return res.json({
            success: true,
            count: applications.length,
            applications,
        });
    } catch (error) {
        console.error(
            'Get candidate applications error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch applications',
        });
    }
});

module.exports = router;