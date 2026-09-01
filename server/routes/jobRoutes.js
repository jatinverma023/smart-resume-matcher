const express = require('express');

const Job = require('../models/Job');

const {
    authenticate,
    authorize,
} = require('../middleware/authMiddleware');

const router = express.Router();

const Application = require('../models/Application');

/*
 * Create a new job
 * Recruiter only
 */
router.post(
    '/',
    authenticate,
    authorize('recruiter'),
    async (req, res) => {
        try {
            const {
                title,
                company,
                description,
                requiredSkills,
                preferredSkills,
                location,
                employmentType,
                experienceLevel,
                status,
                applicationDeadline,
            } = req.body;

            if (!title || !company || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Title, company, and description are required',
                });
            }

            const job = await Job.create({
                recruiter: req.user.userId,
                title,
                company,
                description,
                requiredSkills: requiredSkills || [],
                preferredSkills: preferredSkills || [],
                location: location || '',
                employmentType: employmentType || 'full-time',
                experienceLevel: experienceLevel || 'entry',
                status: status || 'draft',
                applicationDeadline,
            });

            return res.status(201).json({
                success: true,
                message: 'Job created successfully',
                job,
            });
        } catch (error) {
            console.error('Create job error:', error);

            return res.status(500).json({
                success: false,
                message: 'Unable to create job',
            });
        }
    }
);

/*
 * Get all open jobs
 * Authenticated users
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const jobs = await Job.find({
            status: 'open',
        })
            .populate('recruiter', 'name email')
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            count: jobs.length,
            jobs,
        });
    } catch (error) {
        console.error('Get jobs error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch jobs',
        });
    }
});

/*
 * Get jobs created by the logged-in recruiter
 */
router.get('/my', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'recruiter') {
            return res.status(403).json({
                success: false,
                message: 'Only recruiters can view their jobs',
            });
        }

        const jobs = await Job.find({
            recruiter: req.user.userId,
        })
            .sort({
                createdAt: -1,
            });

        return res.json({
            success: true,
            count: jobs.length,
            jobs,
        });
    } catch (error) {
        console.error(
            'Get recruiter jobs error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch your jobs',
        });
    }
});

/*
 * Get a single job
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate(
            'recruiter',
            'name email'
        );

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        return res.json({
            success: true,
            job,
        });
    } catch (error) {
        console.error('Get job error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch job',
        });
    }
});

/*
 * Get statistics for a recruiter's job
 */
router.get('/:jobId/stats', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'recruiter') {
            return res.status(403).json({
                success: false,
                message: 'Only recruiters can view job statistics',
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
        });

        const totalApplicants = applications.length;

        const matchScores = applications
            .map((application) => application.matchScore)
            .filter((score) => typeof score === 'number');

        const averageMatchScore =
            matchScores.length > 0
                ? matchScores.reduce(
                    (sum, score) => sum + score,
                    0
                ) / matchScores.length
                : 0;

        const statusCounts = {
            applied: 0,
            shortlisted: 0,
            interview: 0,
            rejected: 0,
            hired: 0,
        };

        applications.forEach((application) => {
            if (statusCounts[application.status] !== undefined) {
                statusCounts[application.status]++;
            }
        });

        return res.json({
            success: true,
            job: {
                id: job._id,
                title: job.title,
                company: job.company,
            },
            stats: {
                totalApplicants,
                averageMatchScore:
                    Math.round(averageMatchScore * 100) / 100,
                statusCounts,
            },
        });
    } catch (error) {
        console.error(
            'Get job statistics error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch job statistics',
        });
    }
});

module.exports = router;