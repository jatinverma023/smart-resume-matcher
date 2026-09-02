const express = require('express');

const Job = require('../models/Job');

const {
    authenticate,
    authorize,
} = require('../middleware/authMiddleware');

const Application = require('../models/Application');

const router = express.Router();


/*
|--------------------------------------------------------------------------
| Create a new job
| Recruiter only
|--------------------------------------------------------------------------
|
| New jobs created through the recruiter UI are published immediately.
|
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
                applicationDeadline,
            } = req.body;

            if (!title || !company || !description) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Title, company, and description are required',
                });
            }

            const job = await Job.create({
                recruiter: req.user.userId,

                title: title.trim(),
                company: company.trim(),
                description: description.trim(),

                requiredSkills: Array.isArray(requiredSkills)
                    ? requiredSkills
                        .map((skill) => String(skill).trim())
                        .filter(Boolean)
                    : [],

                preferredSkills: Array.isArray(preferredSkills)
                    ? preferredSkills
                        .map((skill) => String(skill).trim())
                        .filter(Boolean)
                    : [],

                location: location?.trim() || '',

                employmentType:
                    employmentType || 'full-time',

                experienceLevel:
                    experienceLevel || 'entry',

                // New jobs are published immediately.
                status: 'open',

                applicationDeadline:
                    applicationDeadline || null,
            });

            return res.status(201).json({
                success: true,
                message: 'Job published successfully',
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
|--------------------------------------------------------------------------
| Get all open jobs
| Authenticated users
|--------------------------------------------------------------------------
|
| Candidates only see jobs whose status is "open".
|
*/
router.get(
    '/',
    authenticate,
    async (req, res) => {
        try {
            const jobs = await Job.find({
                status: 'open',
            })
                .populate('recruiter', 'name email')
                .sort({
                    createdAt: -1,
                });

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
    }
);


/*
|--------------------------------------------------------------------------
| Get jobs created by the logged-in recruiter
|--------------------------------------------------------------------------
|
| Recruiters can see:
| - draft
| - open
| - closed
|
*/
router.get(
    '/my',
    authenticate,
    authorize('recruiter'),
    async (req, res) => {
        try {
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
    }
);


/*
|--------------------------------------------------------------------------
| Publish an existing draft job
| Recruiter only
|--------------------------------------------------------------------------
|
| PATCH /api/v1/jobs/:jobId/publish
|
| Changes:
|
| draft → open
|
| Only the recruiter who owns the job can publish it.
|
*/
router.patch(
    '/:jobId/publish',
    authenticate,
    authorize('recruiter'),
    async (req, res) => {
        try {
            const { jobId } = req.params;

            const job = await Job.findOne({
                _id: jobId,
                recruiter: req.user.userId,
            });

            if (!job) {
                return res.status(404).json({
                    success: false,
                    message:
                        'Job not found or you do not own this job',
                });
            }

            if (job.status === 'open') {
                return res.status(400).json({
                    success: false,
                    message: 'This job is already open',
                });
            }

            if (job.status === 'closed') {
                return res.status(400).json({
                    success: false,
                    message:
                        'A closed job cannot be published',
                });
            }

            if (job.status !== 'draft') {
                return res.status(400).json({
                    success: false,
                    message:
                        'Only draft jobs can be published',
                });
            }

            job.status = 'open';

            await job.save();

            return res.json({
                success: true,
                message: 'Job published successfully',
                job,
            });
        } catch (error) {
            console.error(
                'Publish job error:',
                error
            );

            return res.status(500).json({
                success: false,
                message: 'Unable to publish job',
            });
        }
    }
);


/*
|--------------------------------------------------------------------------
| Get a single job
|--------------------------------------------------------------------------
*/
router.get(
    '/:id',
    authenticate,
    async (req, res) => {
        try {
            const job = await Job.findById(
                req.params.id
            ).populate(
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
            console.error(
                'Get job error:',
                error
            );

            return res.status(500).json({
                success: false,
                message: 'Unable to fetch job',
            });
        }
    }
);


/*
|--------------------------------------------------------------------------
| Get statistics for a recruiter's job
|--------------------------------------------------------------------------
*/
router.get(
    '/:jobId/stats',
    authenticate,
    authorize('recruiter'),
    async (req, res) => {
        try {
            const { jobId } = req.params;

            const job = await Job.findOne({
                _id: jobId,
                recruiter: req.user.userId,
            });

            if (!job) {
                return res.status(404).json({
                    success: false,
                    message:
                        'Job not found or you do not own this job',
                });
            }

            const applications =
                await Application.find({
                    job: jobId,
                });

            const totalApplicants =
                applications.length;

            const matchScores = applications
                .map(
                    (application) =>
                        application.matchScore
                )
                .filter(
                    (score) =>
                        typeof score === 'number'
                );

            const averageMatchScore =
                matchScores.length > 0
                    ? matchScores.reduce(
                        (sum, score) =>
                            sum + score,
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

            applications.forEach(
                (application) => {
                    if (
                        statusCounts[
                            application.status
                        ] !== undefined
                    ) {
                        statusCounts[
                            application.status
                        ]++;
                    }
                }
            );

            return res.json({
                success: true,

                job: {
                    id: job._id,
                    title: job.title,
                    company: job.company,
                    status: job.status,
                    location: job.location,
                    employmentType:
                        job.employmentType,
                    experienceLevel:
                        job.experienceLevel,
                },

                stats: {
                    totalApplicants,

                    averageMatchScore:
                        Math.round(
                            averageMatchScore * 100
                        ) / 100,

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
                message:
                    'Unable to fetch job statistics',
            });
        }
    }
);


module.exports = router;