import { useEffect, useMemo, useState } from 'react';

import {
    applyToJob,
    getMyApplications,
} from '../api/applications';

import {
    calculateMatch,
    getJob,
} from '../api/jobs';

import { getMyResumes } from '../api/resumes';

import {
    EmptyState,
    MatchRing,
    StatusPill,
    WorkspaceShell,
} from '../components/WorkspaceShell';

import { useAuth } from '../context/AuthContext';

const skillLabels = {
    nodejs: 'Node.js',
    nextjs: 'Next.js',
    tailwindcss: 'Tailwind CSS',
    restapi: 'REST APIs',
};

function getSkillName(skill) {
    if (typeof skill === 'string') {
        return skill;
    }

    return skill?.name || '';
}

function formatSkill(skill) {
    const skillName = getSkillName(skill);

    const normalized = skillName
        .toLowerCase()
        .trim()
        .replace(/[.\s_-]+/g, '');

    return skillLabels[normalized] || skillName;
}

function getResumeId(resume) {
    return resume?.id ?? resume?._id ?? '';
}

function JobDetails() {
    const { token } = useAuth();

    const pathParts = window.location.pathname.split('/');
    const jobId = pathParts[2];

    const [job, setJob] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [selectedResume, setSelectedResume] = useState('');
    const [match, setMatch] = useState(null);
    const [existingApplication, setExistingApplication] =
        useState(null);

    const [loading, setLoading] = useState(true);
    const [matching, setMatching] = useState(false);
    const [applying, setApplying] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadData() {
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

                const availableResumes = resumeData.resumes ?? [];
                const applications = applicationData.applications ?? [];

                const existing = applications.find(
                    (application) =>
                        String(
                            application.job?._id ?? application.job
                        ) === String(jobId)
                );

                const applicationResumeId =
                    existing?.resume?._id ?? existing?.resume;

                const preferredResume =
                    availableResumes.find(
                        (resume) =>
                            String(getResumeId(resume)) ===
                            String(applicationResumeId)
                    ) ?? availableResumes[0];

                if (!cancelled) {
                    setJob(jobData.job);
                    setResumes(availableResumes);
                    setExistingApplication(existing ?? null);

                    setSelectedResume(
                        getResumeId(preferredResume)
                    );

                    // Preserve the stored score for an existing application.
                    if (
                        existing &&
                        existing.matchScore !== undefined &&
                        existing.matchScore !== null
                    ) {
                        setMatch({
                            score: Number(existing.matchScore),
                            required:
                                existing.matchAnalysis?.required ?? null,
                            preferred:
                                existing.matchAnalysis?.preferred ?? null,
                        });
                    }
                }
            } catch (requestError) {
                if (!cancelled) {
                    setError(
                        requestError.message ||
                        'Unable to load this job'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        if (token && jobId) {
            void loadData();
        } else {
            setLoading(false);
        }

        return () => {
            cancelled = true;
        };
    }, [jobId, token]);

    const resumeOptions = useMemo(
        () =>
            resumes
                .map((resume) => ({
                    id: getResumeId(resume),
                    label:
                        resume.fileName || 'Untitled resume',
                }))
                .filter((resume) => resume.id),
        [resumes]
    );

    const requiredSkills = useMemo(
        () =>
            (job?.requiredSkills ?? [])
                .map(getSkillName)
                .filter(Boolean),
        [job]
    );

    const preferredSkills = useMemo(
        () =>
            (job?.preferredSkills ?? [])
                .map(getSkillName)
                .filter(Boolean),
        [job]
    );

    const matchedSkills = useMemo(() => {
        const skills = [
            ...(match?.required?.matchedSkills ?? []),
            ...(match?.preferred?.matchedSkills ?? []),
        ];

        return [
            ...new Set(
                skills
                    .map(getSkillName)
                    .filter(Boolean)
            ),
        ];
    }, [match]);

    const missingRequiredSkills = useMemo(
        () =>
            (match?.required?.missingSkills ?? [])
                .map(getSkillName)
                .filter(Boolean),
        [match]
    );

    const missingPreferredSkills = useMemo(
        () =>
            (match?.preferred?.missingSkills ?? [])
                .map(getSkillName)
                .filter(Boolean),
        [match]
    );

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

            setMatch(data.match ?? null);
        } catch (matchError) {
            setError(
                matchError.message ||
                'Unable to calculate your match'
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

        try {
            setApplying(true);
            setError('');
            setSuccess('');

            const data = await applyToJob(
                token,
                jobId,
                selectedResume
            );

            const application =
                data.application ?? {
                    status: 'applied',
                    matchScore: match?.score ?? 0,
                };

            setExistingApplication(application);

            // Preserve calculated score after applying.
            if (
                application.matchScore !== undefined &&
                application.matchScore !== null
            ) {
                setMatch((currentMatch) => ({
                    ...(currentMatch ?? {}),
                    score: Number(application.matchScore),
                }));
            }

            setSuccess(
                data.message ||
                'Application submitted successfully.'
            );
        } catch (applicationError) {
            setError(
                applicationError.message ||
                'Unable to submit your application'
            );
        } finally {
            setApplying(false);
        }
    };

    const goToJobs = () => {
        window.location.href = '/jobs';
    };

    const goToResumes = () => {
        window.location.href = '/resumes';
    };

    return (
        <WorkspaceShell
            title={
                loading
                    ? 'Job match'
                    : job?.title || 'Job match'
            }
            subtitle={
                loading
                    ? 'Loading job details…'
                    : `${job?.company || 'Company'} · ${job?.location || 'Remote'
                    }`
            }
            action={
                <button
                    className="secondary-light-button"
                    type="button"
                    onClick={goToJobs}
                >
                    ← All jobs
                </button>
            }
        >
            {loading ? (
                <div className="light-loading-state">
                    <span
                        className="light-loading-spinner"
                        aria-hidden="true"
                    />

                    <h2>Loading role details</h2>

                    <p>
                        Preparing the information needed to
                        check your match.
                    </p>
                </div>
            ) : error && !job ? (
                <div className="light-error-state">
                    <h2>We could not open this job</h2>

                    <p>{error}</p>

                    <button
                        className="secondary-light-button"
                        type="button"
                        onClick={goToJobs}
                    >
                        Back to jobs
                    </button>
                </div>
            ) : (
                <>
                    {error && job && (
                        <p className="ui-message ui-message-error">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p className="ui-message ui-message-success">
                            {success}
                        </p>
                    )}

                    <section className="light-page-grid two-columns job-match-layout">
                        {/* Job information */}
                        <article className="light-panel role-overview-panel">
                            <div className="role-title-row">
                                <span className="company-initial">
                                    {job?.company
                                        ?.charAt(0)
                                        ?.toUpperCase() || 'J'}
                                </span>

                                <div className="role-title-content">
                                    <span className="eyebrow-text">
                                        OPEN OPPORTUNITY
                                    </span>

                                    <h2>
                                        {job?.title || 'Job opportunity'}
                                    </h2>

                                    <p>
                                        {job?.company || 'Company'}
                                    </p>
                                </div>

                                <span className="open-job-badge">
                                    Open role
                                </span>
                            </div>

                            <section className="detail-section job-detail-meta">
                                <span>
                                    <b aria-hidden="true">LOC</b>
                                    {job?.location || 'Remote'}
                                </span>

                                <span>
                                    <b aria-hidden="true">TYPE</b>
                                    {job?.employmentType || 'Full-time'}
                                </span>

                                <span>
                                    <b aria-hidden="true">EXP</b>
                                    {job?.experienceLevel || 'Any level'}
                                </span>
                            </section>

                            {job?.description && (
                                <section className="detail-section">
                                    <h3>About the role</h3>

                                    <p className="job-description">
                                        {job.description}
                                    </p>
                                </section>
                            )}

                            <section className="detail-section">
                                <div className="detail-section-heading">
                                    <h3>Required skills</h3>

                                    <span>
                                        {requiredSkills.length} skills
                                    </span>
                                </div>

                                <div className="skill-chip-wrap">
                                    {requiredSkills.length ? (
                                        requiredSkills.map((skill) => (
                                            <span
                                                className="skill-chip"
                                                key={skill}
                                            >
                                                ✓ {formatSkill(skill)}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="detail-muted">
                                            No required skills listed.
                                        </span>
                                    )}
                                </div>
                            </section>

                            {preferredSkills.length > 0 && (
                                <section className="detail-section">
                                    <div className="detail-section-heading">
                                        <h3>Preferred skills</h3>

                                        <span>
                                            {preferredSkills.length} skills
                                        </span>
                                    </div>

                                    <div className="skill-chip-wrap">
                                        {preferredSkills.map((skill) => (
                                            <span
                                                className="skill-chip optional"
                                                key={skill}
                                            >
                                                {formatSkill(skill)}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </article>

                        {/* Match analysis */}
                        <aside className="light-panel match-action-panel">
                            {!resumeOptions.length ? (
                                <EmptyState
                                    title="Add a resume to continue"
                                    detail="Upload a resume first, then we can show the exact skills that match this role."
                                    action={
                                        <button
                                            className="primary-light-button"
                                            type="button"
                                            onClick={goToResumes}
                                        >
                                            Upload a resume
                                        </button>
                                    }
                                />
                            ) : (
                                <>
                                    <div className="light-panel-header">
                                        <div>
                                            <span className="eyebrow-text">
                                                MATCH ANALYSIS
                                            </span>

                                            <h2>Your match</h2>

                                            <p>
                                                Compare your resume against
                                                this role.
                                            </p>
                                        </div>

                                        {match && (
                                            <MatchRing
                                                score={match.score ?? 0}
                                                label="Match"
                                            />
                                        )}
                                    </div>

                                    <label
                                        className="field-label"
                                        htmlFor="resume-select"
                                    >
                                        Resume to compare
                                    </label>

                                    <select
                                        id="resume-select"
                                        className="light-field"
                                        value={selectedResume}
                                        onChange={(event) => {
                                            setSelectedResume(
                                                event.target.value
                                            );
                                            setMatch(null);
                                            setError('');
                                            setSuccess('');
                                        }}
                                        disabled={Boolean(
                                            existingApplication
                                        )}
                                    >
                                        {resumeOptions.map((resume) => (
                                            <option
                                                value={resume.id}
                                                key={resume.id}
                                            >
                                                {resume.label}
                                            </option>
                                        ))}
                                    </select>

                                    {existingApplication ? (
                                        <div className="existing-application">
                                            <StatusPill
                                                status={
                                                    existingApplication.status ||
                                                    'applied'
                                                }
                                            />

                                            <div>
                                                <strong>
                                                    Application submitted
                                                </strong>

                                                <p>
                                                    You have already applied
                                                    for this role.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            className="secondary-light-button full-width-action"
                                            type="button"
                                            onClick={handleCalculateMatch}
                                            disabled={matching}
                                        >
                                            {matching
                                                ? 'Analyzing your resume…'
                                                : '✦ Calculate match'}
                                        </button>
                                    )}

                                    {match && (
                                        <section className="detail-section match-result-section">
                                            <div className="match-result-summary">
                                                <div>
                                                    <span className="match-result-label">
                                                        Overall compatibility
                                                    </span>

                                                    <strong>
                                                        {Math.round(
                                                            Number(match.score ?? 0)
                                                        )}
                                                        %
                                                    </strong>
                                                </div>
                                            </div>

                                            {/* Score breakdown */}
                                            <div className="match-explanation-grid">
                                                <MatchBreakdown
                                                    title="Required"
                                                    data={match.required}
                                                />

                                                <MatchBreakdown
                                                    title="Preferred"
                                                    data={match.preferred}
                                                />
                                            </div>

                                            {/* Matched / missing skills */}
                                            <div className="match-explanation-grid">
                                                <div>
                                                    <h4>Matched skills</h4>

                                                    <div className="skill-chip-wrap">
                                                        {matchedSkills.length ? (
                                                            matchedSkills.map((skill) => (
                                                                <span
                                                                    className="skill-chip"
                                                                    key={skill}
                                                                >
                                                                    ✓ {formatSkill(skill)}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="detail-muted">
                                                                No matching skills
                                                                detected yet.
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4>
                                                        Missing required skills
                                                    </h4>

                                                    <div className="skill-chip-wrap">
                                                        {missingRequiredSkills.length ? (
                                                            missingRequiredSkills.map(
                                                                (skill) => (
                                                                    <span
                                                                        className="skill-chip missing"
                                                                        key={skill}
                                                                    >
                                                                        {formatSkill(skill)}
                                                                    </span>
                                                                )
                                                            )
                                                        ) : (
                                                            <span className="detail-muted">
                                                                No required skills
                                                                missing.
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Missing preferred skills */}
                                            {missingPreferredSkills.length >
                                                0 && (
                                                    <div className="detail-section">
                                                        <h4>
                                                            Missing preferred skills
                                                        </h4>

                                                        <div className="skill-chip-wrap">
                                                            {missingPreferredSkills.map(
                                                                (skill) => (
                                                                    <span
                                                                        className="skill-chip optional missing"
                                                                        key={skill}
                                                                    >
                                                                        {formatSkill(skill)}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Apply */}
                                            {!existingApplication && (
                                                <button
                                                    className="primary-light-button full-width-action"
                                                    type="button"
                                                    onClick={handleApply}
                                                    disabled={applying}
                                                >
                                                    {applying
                                                        ? 'Submitting application…'
                                                        : 'Apply with this resume →'}
                                                </button>
                                            )}
                                        </section>
                                    )}
                                </>
                            )}
                        </aside>
                    </section>
                </>
            )}
        </WorkspaceShell>
    );
}

function MatchBreakdown({ title, data }) {
    if (!data) {
        return (
            <div className="match-breakdown-card">
                <div className="match-breakdown-heading">
                    <h4>{title}</h4>
                    <span>No data</span>
                </div>
            </div>
        );
    }

    const coverage = Math.min(
        100,
        Number(data.coverage ?? 0)
    );

    return (
        <div className="match-breakdown-card">
            <div className="match-breakdown-heading">
                <h4>{title}</h4>

                <span>
                    {data.matched ?? 0} / {data.total ?? 0}
                </span>
            </div>

            <div className="match-coverage">
                <div className="match-coverage-track">
                    <span
                        style={{
                            width: `${coverage}%`,
                        }}
                    />
                </div>

                <strong>{coverage}%</strong>
            </div>
        </div>
    );
}

export default JobDetails;