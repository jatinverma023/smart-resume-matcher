const express = require('express');
const path = require('path');
const fs = require('fs/promises');

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


/*
|--------------------------------------------------------------------------
| Get my resumes
|--------------------------------------------------------------------------
|
| Candidate can see all resumes belonging to their account.
|
*/
router.get(
    '/my',
    authenticate,
    async (req, res) => {
        try {
            if (req.user.role !== 'candidate') {
                return res.status(403).json({
                    success: false,
                    message:
                        'Only candidates can view resumes',
                });
            }

            const resumes =
                await Resume.find({
                    user: req.user.userId,
                }).sort({
                    createdAt: -1,
                });

            return res.json({
                success: true,
                count: resumes.length,

                resumes: resumes.map(
                    (resume) => ({
                        id: resume._id,
                        fileName:
                            resume.fileName,
                        fileType:
                            resume.fileType,
                        fileUrl:
                            resume.fileUrl,
                        skills:
                            resume.skills,
                        createdAt:
                            resume.createdAt,
                    })
                ),
            });
        } catch (error) {
            console.error(
                'Get resumes error:',
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    'Unable to fetch resumes',
            });
        }
    }
);


/*
|--------------------------------------------------------------------------
| Upload resume
|--------------------------------------------------------------------------
|
| Candidate uploads a PDF or DOCX resume.
| The file is parsed and skills are extracted.
|
*/
router.post(
    '/upload',
    authenticate,
    upload.single('resume'),
    async (req, res) => {
        try {
            if (
                req.user.role !==
                'candidate'
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        'Only candidates can upload resumes',
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Resume file is required',
                });
            }

            const parsedText =
                await parseResume(
                    req.file.path,
                    req.file.mimetype
                );

            const skills =
                extractSkills(
                    parsedText
                );

            const resume =
                await Resume.create({
                    user:
                        req.user.userId,

                    fileName:
                        req.file.originalname,

                    fileUrl:
                        `/uploads/${req.file.filename}`,

                    fileType:
                        req.file.mimetype,

                    parsedText,

                    skills,
                });

            return res.status(201).json({
                success: true,
                message:
                    'Resume uploaded successfully',

                resume: {
                    id: resume._id,

                    fileName:
                        resume.fileName,

                    fileType:
                        resume.fileType,

                    fileUrl:
                        resume.fileUrl,

                    skills:
                        resume.skills,

                    parsedText:
                        resume.parsedText,

                    createdAt:
                        resume.createdAt,
                },
            });
        } catch (error) {
            console.error(
                'Resume upload error:',
                error
            );

            /*
             * If parsing/database creation fails
             * after the file was uploaded, remove
             * the physical file so orphan files
             * do not accumulate.
             */
            if (req.file?.path) {
                try {
                    await fs.unlink(
                        req.file.path
                    );
                } catch (cleanupError) {
                    console.error(
                        'Resume cleanup error:',
                        cleanupError
                    );
                }
            }

            return res.status(500).json({
                success: false,
                message:
                    'Unable to upload and parse resume',
                error: error.message,
            });
        }
    }
);


/*
|--------------------------------------------------------------------------
| Delete resume
|--------------------------------------------------------------------------
|
| DELETE /api/v1/resumes/:id
|
| Candidate can only delete their own resume.
| Both MongoDB record and physical uploaded file
| are removed.
|
*/
router.delete(
    '/:id',
    authenticate,
    async (req, res) => {
        try {
            if (
                req.user.role !==
                'candidate'
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        'Only candidates can delete resumes',
                });
            }

            const resume =
                await Resume.findOne({
                    _id: req.params.id,
                    user: req.user.userId,
                });

            if (!resume) {
                return res.status(404).json({
                    success: false,
                    message:
                        'Resume not found',
                });
            }

            /*
             * Remove the physical uploaded file.
             *
             * fileUrl is stored as:
             * /uploads/filename.pdf
             */
            if (resume.fileUrl) {
                const fileName =
                    path.basename(
                        resume.fileUrl
                    );

                const filePath =
                    path.join(
                        __dirname,
                        '..',
                        'uploads',
                        fileName
                    );

                try {
                    await fs.unlink(
                        filePath
                    );
                } catch (fileError) {
                    /*
                     * If the physical file is
                     * already missing, we can
                     * still remove the database
                     * record.
                     */
                    if (
                        fileError.code !==
                        'ENOENT'
                    ) {
                        console.error(
                            'Resume file deletion error:',
                            fileError
                        );
                    }
                }
            }

            await Resume.deleteOne({
                _id: resume._id,
            });

            return res.json({
                success: true,
                message:
                    'Resume deleted successfully',
            });
        } catch (error) {
            console.error(
                'Delete resume error:',
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    'Unable to delete resume',
            });
        }
    }
);


module.exports = router;