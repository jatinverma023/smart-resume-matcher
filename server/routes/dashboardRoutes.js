const express = require('express');

const User = require('../models/User');
const Resume = require('../models/Resume');
const Application = require('../models/Application');

const {
    authenticate,
} = require('../middleware/authMiddleware');

const router = express.Router();

/*
 * Candidate dashboard
 */
router.get('/candidate', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'candidate') {
            return res.status(403).json({
                success: false,
                message: 'Only candidates can access this dashboard',
            });
        }

        const [user, resumes, applications] =
            await Promise.all([
                User.findById(req.user.userId).select(
                    'name email role createdAt'
                ),

                Resume.find({
                    user: req.user.userId,
                })
                    .select(
                        'fileName fileType skills createdAt'
                    )
                    .sort({
                        createdAt: -1,
                    }),

                Application.find({
                    candidate: req.user.userId,
                })
                    .populate(
                        'job',
                        'title company location employmentType status'
                    )
                    .populate(
                        'resume',
                        'fileName'
                    )
                    .sort({
                        createdAt: -1,
                    }),
            ]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found',
            });
        }

        const scores = applications
            .map(
                (application) =>
                    application.matchScore
            )
            .filter(
                (score) =>
                    typeof score === 'number'
            );

        const averageMatchScore =
            scores.length > 0
                ? scores.reduce(
                    (sum, score) =>
                        sum + score,
                    0
                ) / scores.length
                : 0;

        return res.json({
            success: true,

            dashboard: {
                candidate: user,

                resumeCount: resumes.length,

                resumes,

                applicationCount:
                    applications.length,

                applications,

                averageMatchScore:
                    Math.round(
                        averageMatchScore * 100
                    ) / 100,
            },
        });
    } catch (error) {
        console.error(
            'Candidate dashboard error:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                'Unable to load candidate dashboard',
        });
    }
});

module.exports = router;