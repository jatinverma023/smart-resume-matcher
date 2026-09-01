import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';

import {
    calculateMatch,
    getJob,
} from '../api/jobs';

import { getMyResumes } from '../api/resumes';

import {
    applyToJob,
    getMyApplications,
} from '../api/applications';

function getSkillLabel(skill) {
    if (typeof skill === 'string') {
        return skill;
    }

    if (skill && typeof skill === 'object') {
        return (
            skill.name ||
            skill.label ||
            skill.title ||
            skill.category ||
            skill._id ||
            'Unknown skill'
        );
    }

    return String(skill ?? '');
}

function getSkillKey(skill, index) {
    if (typeof skill === 'object' && skill !== null) {
        return skill._id || skill.name || skill.category || `skill-${index}`;
    }

    return `${skill}-${index}`;
}

function JobDetails() {
    const { token } = useAuth();

    const jobId = window.location.pathname.split('/')[2];

    const [job, setJob] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [selectedResume, setSelectedResume] = useState('');

    const [match, setMatch] = useState(null);
    const [existingApplication, setExistingApplication] = useState(null);

    const [loading, setLoading] = useState(true);
    const [matching, setMatching] = useState(false);
    const [applying, setApplying] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError('');

                const [
                    jobData,
                    resumeData,
                    applicationData,
                ] = await Promise.all([
                    getJob(token, jobId),
                    getMyResumes(token),
                    getMyApplications(token),
                ]);

                const availableResumes =
                    resumeData.resumes || [];

                const applications =
                    applicationData.applications || [];

                const existing = applications.find(
                    (application) =>
                        String(
                            application.job?._id ||
                            application.job
                        ) === String(jobId)
                );

                setJob(jobData.job);
                setResumes(availableResumes);

                if (existing) {
                    setExistingApplication(existing);
                }

                /*
                 * Prefer the resume used for the existing
                 * application. Otherwise use the newest resume.
                 */
                const applicationResumeId =
                    existing?.resume?._id ||
                    existing?.resume;

                const preferredResume =
                    availableResumes.find(
                        (resume) =>
                            String(
                                resume.id || resume._id
                            ) === String(applicationResumeId)
                    ) || availableResumes[0];

                if (preferredResume) {
                    const resumeId =
                        preferredResume.id ||
                        preferredResume._id;

                    setSelectedResume(resumeId);

                    /*
                     * If the candidate has already applied,
                     * immediately calculate the full match
                     * so the page doesn't show a fake 0%.
                     */
                    if (existing) {
                        try {
                            const matchData =
                                await calculateMatch(
                                    token,
                                    resumeId,
                                    jobId
                                );

                            setMatch(matchData.match);
                        } catch (matchError) {
                            console.error(
                                'Unable to restore match:',
                                matchError
                            );

                            /*
                             * At minimum preserve the stored
                             * application score.
                             */
                            if (
                                existing.matchScore !== null &&
                                existing.matchScore !== undefined
                            ) {
                                setMatch({
                                    score: existing.matchScore,
                                    required: {
                                        total: 0,
                                        matched: 0,
                                        coverage: 0,
                                        matchedSkills: [],
                                        missingSkills: [],
                                    },
                                    preferred: {
                                        total: 0,
                                        matched: 0,
                                        coverage: 0,
                                        matchedSkills: [],
                                        missingSkills: [],
                                    },
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                setError(
                    err.message || 'Unable to load job'
                );
            } finally {
                setLoading(false);
            }
        };

        if (token && jobId) {
            loadData();
        }
    }, [token, jobId]);

    const handleCalculateMatch = async () => {
        if (!selectedResume) {
            setError('Please select a resume first.');
            return;
        }

        try {
            setMatching(true);
            setError('');
            setSuccess('');

            const data = await calculateMatch(
                token,
                selectedResume,
                jobId
            );

            setMatch(data.match);
        } catch (err) {
            setError(
                err.message || 'Unable to calculate match'
            );
        } finally {
            setMatching(false);
        }
    };

    const handleApply = async () => {
        if (!selectedResume) {
            setError('Please select a resume first.');
            return;
        }

        if (existingApplication) {
            setError(
                'You have already applied for this job.'
            );
            return;
        }

        try {
            setApplying(true);
            setError('');
            setSuccess('');

            const data = await applyToJob(
                token,
                jobId,
                selectedResume
            );

            setExistingApplication(
                data.application || {
                    status: 'applied',
                    matchScore: match?.score ?? null,
                }
            );

            setSuccess(
                data.message ||
                'Application submitted successfully.'
            );
        } catch (err) {
            setError(
                err.message ||
                'Unable to submit application'
            );
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050814] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
                    <p className="text-sm text-slate-400">
                        Loading opportunity...
                    </p>
                </div>
            </div>
        );
    }

    if (error && !job) {
        return (
            <div className="min-h-screen bg-[#050814] text-white">
                <div className="mx-auto max-w-5xl px-6 py-16">
                    <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6">
                        <p className="text-red-400">
                            {error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!job) {
        return null;
    }

    const applicationStatus =
        existingApplication?.status;

    const statusLabel = {
        applied: 'Application submitted',
        shortlisted: 'Shortlisted',
        interview: 'Interview stage',
        rejected: 'Application not selected',
        hired: 'Hired',
    };

    const statusText =
        statusLabel[applicationStatus] ||
        'Application submitted';

    return (
        <div className="min-h-screen bg-[#050814] text-white">

            <main className="mx-auto max-w-6xl px-6 py-10 lg:px-10">

                {/* Back */}
                <button
                    onClick={() => {
                        window.location.href = '/jobs';
                    }}
                    className="mb-8 text-sm text-slate-400 transition hover:text-white"
                >
                    ← Back to jobs
                </button>

                {/* Job header */}
                <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8">

                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

                        <div className="flex gap-5">

                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl font-bold text-blue-400">
                                {job.company
                                    ?.charAt(0)
                                    ?.toUpperCase() || 'J'}
                            </div>

                            <div>

                                <p className="text-sm font-medium text-blue-400">
                                    {job.company}
                                </p>

                                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                                    {job.title}
                                </h1>

                                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">

                                    <span>
                                        📍 {job.location || 'Remote'}
                                    </span>

                                    <span>
                                        💼 {job.employmentType || 'Any type'}
                                    </span>

                                    <span>
                                        ◈ {job.experienceLevel || 'Any level'}
                                    </span>

                                </div>

                            </div>

                        </div>

                        <span className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
                            {job.status || 'open'}
                        </span>

                    </div>

                </section>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">

                    {/* Left */}
                    <section className="space-y-6">

                        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7">

                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                                Opportunity
                            </p>

                            <h2 className="mt-2 text-xl font-semibold">
                                About the role
                            </h2>

                            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-400">
                                {job.description}
                            </p>

                        </div>

                        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7">

                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                                Requirements
                            </p>

                            <h2 className="mt-2 text-xl font-semibold">
                                Required skills
                            </h2>

                            <div className="mt-5 flex flex-wrap gap-2">

                                {job.requiredSkills?.map(
                                    (skill, index) => {
                                        const label = getSkillLabel(skill);

                                        return (
                                            <span
                                                key={getSkillKey(skill, index)}
                                                className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-300"
                                            >
                                                {label}
                                            </span>
                                        );
                                    }
                                )}

                            </div>

                            <h3 className="mt-8 text-sm font-semibold text-slate-300">
                                Preferred skills
                            </h3>

                            <div className="mt-4 flex flex-wrap gap-2">

                                {job.preferredSkills?.map(
                                    (skill, index) => {
                                        const label = getSkillLabel(skill);

                                        return (
                                            <span
                                                key={getSkillKey(skill, index)}
                                                className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-400"
                                            >
                                                {label}
                                            </span>
                                        );
                                    }
                                )}

                            </div>

                        </div>

                    </section>

                    {/* Right application panel */}
                    <aside className="h-fit rounded-3xl border border-slate-800 bg-slate-900/70 p-7 lg:sticky lg:top-6">

                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                            AI compatibility
                        </p>

                        <h2 className="mt-2 text-xl font-semibold">
                            {existingApplication
                                ? 'Your application'
                                : 'Check your match'}
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            {existingApplication
                                ? 'Your resume has already been evaluated for this opportunity.'
                                : 'Select one of your resumes to calculate how well your skills match this opportunity.'}
                        </p>

                        {/* Resume */}
                        {resumes.length === 0 ? (

                            <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                                <p className="text-sm text-yellow-400">
                                    Upload a resume before applying.
                                </p>
                            </div>

                        ) : (

                            <>
                                <label className="mt-6 block text-sm font-medium text-slate-300">
                                    Select resume
                                </label>

                                <select
                                    value={selectedResume}
                                    onChange={(event) => {
                                        setSelectedResume(
                                            event.target.value
                                        );

                                        setMatch(null);
                                        setSuccess('');
                                    }}
                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500"
                                >
                                    {resumes.map(
                                        (resume) => (
                                            <option
                                                key={
                                                    resume.id ||
                                                    resume._id
                                                }
                                                value={
                                                    resume.id ||
                                                    resume._id
                                                }
                                            >
                                                {resume.fileName}
                                            </option>
                                        )
                                    )}
                                </select>

                                {!existingApplication && (
                                    <button
                                        onClick={
                                            handleCalculateMatch
                                        }
                                        disabled={matching}
                                        className="mt-4 w-full rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {matching
                                            ? 'Analyzing...'
                                            : 'Calculate AI Match'}
                                    </button>
                                )}
                            </>

                        )}

                        {error && (
                            <div className="mt-5 rounded-xl border border-red-900/50 bg-red-950/20 p-4">
                                <p className="text-sm text-red-400">
                                    {error}
                                </p>
                            </div>
                        )}

                        {success && (
                            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                                <p className="text-sm font-medium text-emerald-400">
                                    ✓ {success}
                                </p>
                            </div>
                        )}

                        {/* Existing application status */}
                        {existingApplication && (
                            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">

                                <div className="flex items-center justify-between gap-4">

                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-slate-500">
                                            Application status
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-emerald-400">
                                            {statusText}
                                        </p>
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                                        ✓
                                    </div>

                                </div>

                                {existingApplication.appliedAt && (
                                    <p className="mt-3 text-xs text-slate-500">
                                        Applied{' '}
                                        {new Date(
                                            existingApplication.appliedAt
                                        ).toLocaleDateString()}
                                    </p>
                                )}

                            </div>
                        )}

                        {/* Match */}
                        {match && (
                            <div className="mt-6">

                                <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-6 text-center">

                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Match score
                                    </p>

                                    <p className="mt-2 text-6xl font-bold tracking-tight text-blue-400">
                                        {match.score}%
                                    </p>

                                    <p className="mt-2 text-sm text-slate-400">
                                        Resume compatibility
                                    </p>

                                </div>

                                {match.required && (
                                    <div className="mt-4 grid grid-cols-2 gap-3">

                                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                                            <p className="text-xs text-slate-500">
                                                Required
                                            </p>

                                            <p className="mt-1 text-lg font-semibold">
                                                {match.required.matched}/
                                                {match.required.total}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {match.required.coverage}%
                                                coverage
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                                            <p className="text-xs text-slate-500">
                                                Preferred
                                            </p>

                                            <p className="mt-1 text-lg font-semibold">
                                                {match.preferred.matched}/
                                                {match.preferred.total}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {match.preferred.coverage}%
                                                coverage
                                            </p>
                                        </div>

                                    </div>
                                )}

                                {match.required?.missingSkills?.length > 0 && (
                                    <div className="mt-5">

                                        <p className="text-xs font-medium text-slate-500">
                                            Missing required skills
                                        </p>

                                        <div className="mt-2 flex flex-wrap gap-2">

                                            {match.required.missingSkills.map(
                                                (skill, index) => {
                                                    const label = getSkillLabel(skill);

                                                    return (
                                                        <span
                                                            key={getSkillKey(skill, index)}
                                                            className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs text-red-400"
                                                        >
                                                            {label}
                                                        </span>
                                                    );
                                                }
                                            )}

                                        </div>

                                    </div>
                                )}

                                {/* Apply only if not already applied */}
                                {!existingApplication && !success && (
                                    <button
                                        onClick={handleApply}
                                        disabled={applying}
                                        className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {applying
                                            ? 'Submitting...'
                                            : 'Apply now'}
                                    </button>
                                )}

                            </div>
                        )}

                    </aside>

                </div>

            </main>

        </div>
    );
}

export default JobDetails;
