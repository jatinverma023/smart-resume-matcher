import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../context/AuthContext';

import { getMyJobs } from '../api/jobs';

import {
    getJobApplicants,
    updateApplicationStatus,
} from '../api/applications';

import {
    EmptyState,
    MatchRing,
    MetricCard,
    StatusPill,
    WorkspaceShell,
} from '../components/WorkspaceShell';

function getInitials(name = '') {
    return (
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'C'
    );
}

function getSkillName(skill) {
    if (typeof skill === 'string') {
        return skill;
    }

    return skill?.name || skill?.skill || '';
}

function formatSkill(skill) {
    const name = getSkillName(skill);

    if (!name) return '';

    const normalized = name
        .toLowerCase()
        .trim()
        .replace(/[.\s_-]+/g, '');

    const labels = {
        nodejs: 'Node.js',
        nextjs: 'Next.js',
        mongodb: 'MongoDB',
        mysql: 'MySQL',
        javascript: 'JavaScript',
        typescript: 'TypeScript',
        tailwindcss: 'Tailwind CSS',
        restapi: 'REST API',
    };

    return labels[normalized] || name;
}

function formatDate(date) {
    if (!date) return '—';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function Candidates() {
    const { token } = useAuth();

    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applications, setApplications] = useState([]);

    const [loadingJobs, setLoadingJobs] = useState(true);
    const [loadingApplicants, setLoadingApplicants] =
        useState(false);

    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadJobs = async () => {
            if (!token) {
                setLoadingJobs(false);
                return;
            }

            try {
                setLoadingJobs(true);
                setError('');

                const data = await getMyJobs(token);

                if (cancelled) return;

                const recruiterJobs = data.jobs || [];

                setJobs(recruiterJobs);

                if (recruiterJobs.length > 0) {
                    setSelectedJob((current) => {
                        if (!current) {
                            return recruiterJobs[0];
                        }

                        return (
                            recruiterJobs.find(
                                (job) =>
                                    job._id === current._id
                            ) || recruiterJobs[0]
                        );
                    });
                } else {
                    setSelectedJob(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message ||
                        'Unable to load your jobs.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingJobs(false);
                }
            }
        };

        void loadJobs();

        return () => {
            cancelled = true;
        };
    }, [token]);

    useEffect(() => {
        let cancelled = false;

        const loadApplicants = async () => {
            if (!token || !selectedJob?._id) {
                setApplications([]);
                setLoadingApplicants(false);
                return;
            }

            try {
                setLoadingApplicants(true);
                setError('');

                const data = await getJobApplicants(
                    token,
                    selectedJob._id
                );

                if (!cancelled) {
                    setApplications(
                        data.applications || []
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message ||
                        'Unable to load applicants.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingApplicants(false);
                }
            }
        };

        void loadApplicants();

        return () => {
            cancelled = true;
        };
    }, [token, selectedJob?._id]);

    const averageMatch = useMemo(() => {
        if (!applications.length) {
            return 0;
        }

        const scores = applications
            .map((application) =>
                Number(application.matchScore)
            )
            .filter((score) => Number.isFinite(score));

        if (!scores.length) {
            return 0;
        }

        return Math.round(
            scores.reduce(
                (sum, score) => sum + score,
                0
            ) / scores.length
        );
    }, [applications]);

    const shortlisted = applications.filter(
        (application) =>
            application.status === 'shortlisted'
    ).length;

    const interviews = applications.filter(
        (application) =>
            application.status === 'interview'
    ).length;

    const hired = applications.filter(
        (application) =>
            application.status === 'hired'
    ).length;

    const rejected = applications.filter(
        (application) =>
            application.status === 'rejected'
    ).length;

    const activeCandidates =
        applications.length - rejected - hired;

    const handleStatusChange = async (
        applicationId,
        status
    ) => {
        try {
            setUpdatingId(applicationId);
            setError('');

            await updateApplicationStatus(
                token,
                applicationId,
                status
            );

            setApplications((current) =>
                current.map((application) =>
                    application._id === applicationId
                        ? {
                            ...application,
                            status,
                        }
                        : application
                )
            );
        } catch (err) {
            setError(
                err.message ||
                'Unable to update candidate status.'
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const navigate = (path) => {
        window.location.href = path;
    };

    if (loadingJobs) {
        return (
            <WorkspaceShell
                role="recruiter"
                title="Candidates"
                subtitle="Review applicants ranked by AI compatibility and manage your hiring pipeline."
                action={
                    <button
                        className="secondary-light-button"
                        type="button"
                        onClick={() =>
                            navigate('/recruiter/jobs')
                        }
                    >
                        ← Job listings
                    </button>
                }
            >
                <div className="light-loading-state">
                    <span
                        className="light-loading-spinner"
                        aria-hidden="true"
                    />

                    <h2>
                        Loading candidate intelligence
                    </h2>

                    <p>
                        Preparing your hiring workspace.
                    </p>
                </div>
            </WorkspaceShell>
        );
    }

    return (
        <WorkspaceShell
            role="recruiter"
            title="Candidates"
            subtitle="Review applicants ranked by AI compatibility and manage your hiring pipeline."
            action={
                <button
                    className="secondary-light-button"
                    type="button"
                    onClick={() =>
                        navigate('/recruiter/jobs')
                    }
                >
                    ← Job listings
                </button>
            }
        >
            {error && (
                <div className="ui-message ui-message-error">
                    {error}
                </div>
            )}

            {/* JOB SELECTOR */}

            <section className="light-panel candidate-job-selector">
                <div>
                    <span className="eyebrow-text">
                        REVIEWING APPLICATIONS FOR
                    </span>

                    <h2>
                        {selectedJob?.title ||
                            'Select a job'}
                    </h2>

                    {selectedJob?.company && (
                        <p>
                            {selectedJob.company}
                        </p>
                    )}
                </div>

                <select
                    value={selectedJob?._id || ''}
                    onChange={(event) => {
                        const job = jobs.find(
                            (item) =>
                                item._id ===
                                event.target.value
                        );

                        setSelectedJob(
                            job || null
                        );
                    }}
                    disabled={
                        loadingJobs ||
                        jobs.length === 0
                    }
                    className="light-field candidate-job-select"
                >
                    {jobs.length === 0 ? (
                        <option value="">
                            No jobs available
                        </option>
                    ) : (
                        jobs.map((job) => (
                            <option
                                key={job._id}
                                value={job._id}
                            >
                                {job.title}
                            </option>
                        ))
                    )}
                </select>
            </section>

            {/* METRICS */}

            <section className="metrics-grid candidate-metrics">
                <MetricCard
                    icon="▣"
                    label="Applicants"
                    value={applications.length}
                    detail="Total candidates"
                    tone="blue"
                />

                <MetricCard
                    icon="✓"
                    label="Shortlisted"
                    value={shortlisted}
                    detail="Recruiter selections"
                    tone="green"
                />

                <MetricCard
                    icon="◇"
                    label="Interviews"
                    value={interviews}
                    detail="Interview stage"
                    tone="purple"
                />

                <MetricCard
                    icon="◆"
                    label="Hired"
                    value={hired}
                    detail="Successful applications"
                    tone="orange"
                />
            </section>

            {/* PIPELINE */}

            <section className="light-panel candidates-pipeline-panel">
                <div className="candidates-pipeline-header">
                    <div>
                        <span className="eyebrow-text">
                            APPLICATION PIPELINE
                        </span>

                        <h2>
                            Candidate progress
                        </h2>

                        <p>
                            A quick overview of where
                            applicants currently stand.
                        </p>
                    </div>

                    <MatchRing
                        score={averageMatch}
                        label="AVG MATCH"
                    />
                </div>

                <div className="candidates-pipeline">
                    <CandidatePipelineStage
                        label="Applied"
                        value={applications.length}
                        active={
                            applications.length > 0
                        }
                    />

                    <div
                        className="candidate-pipeline-line"
                        aria-hidden="true"
                    />

                    <CandidatePipelineStage
                        label="Shortlisted"
                        value={shortlisted}
                        active={shortlisted > 0}
                    />

                    <div
                        className="candidate-pipeline-line"
                        aria-hidden="true"
                    />

                    <CandidatePipelineStage
                        label="Interview"
                        value={interviews}
                        active={interviews > 0}
                    />

                    <div
                        className="candidate-pipeline-line"
                        aria-hidden="true"
                    />

                    <CandidatePipelineStage
                        label="Hired"
                        value={hired}
                        active={hired > 0}
                    />
                </div>

                <div className="candidate-secondary-stats">
                    <div>
                        <span>
                            Active candidates
                        </span>

                        <strong>
                            {Math.max(
                                0,
                                activeCandidates
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Rejected</span>

                        <strong>
                            {rejected}
                        </strong>
                    </div>

                    <div>
                        <span>Average match</span>

                        <strong>
                            {averageMatch}%
                        </strong>
                    </div>
                </div>
            </section>

            {/* APPLICANTS */}

            <section className="light-panel candidates-list-panel">
                <div className="candidates-list-header">
                    <div>
                        <span className="eyebrow-text">
                            LATEST INTELLIGENCE
                        </span>

                        <h2>
                            Applicant pipeline
                        </h2>

                        <p>
                            Candidates ranked by AI
                            compatibility score.
                        </p>
                    </div>

                    {applications.length > 0 && (
                        <span className="ai-analyzed-badge">
                            AI analyzed
                        </span>
                    )}
                </div>

                {loadingApplicants ? (
                    <div className="light-loading-state candidates-inline-loading">
                        <span
                            className="light-loading-spinner"
                            aria-hidden="true"
                        />

                        <h2>
                            Loading candidates
                        </h2>

                        <p>
                            Calculating candidate
                            intelligence.
                        </p>
                    </div>
                ) : applications.length === 0 ? (
                    <EmptyState
                        title="No applicants yet"
                        detail="Applications for this opportunity will appear here."
                    />
                ) : (
                    <div className="candidates-list">
                        {applications.map(
                            (application, index) => (
                                <CandidateCard
                                    key={
                                        application._id
                                    }
                                    application={
                                        application
                                    }
                                    index={index}
                                    updating={
                                        updatingId ===
                                        application._id
                                    }
                                    onStatusChange={
                                        handleStatusChange
                                    }
                                />
                            )
                        )}
                    </div>
                )}
            </section>
        </WorkspaceShell>
    );
}

function CandidateCard({
    application,
    index,
    updating,
    onStatusChange,
}) {
    const candidate =
        application.candidate || {};

    const resume =
        application.resume || {};

    const score = Number.isFinite(
        Number(application.matchScore)
    )
        ? Math.max(
            0,
            Math.min(
                100,
                Number(application.matchScore)
            )
        )
        : 0;

    const skills = resume.skills || [];

    const matchAnalysis =
        application.matchAnalysis || null;

    const required =
        matchAnalysis?.required || null;

    const preferred =
        matchAnalysis?.preferred || null;

    return (
        <article className="candidate-card">
            <div className="candidate-card-top">
                <div className="candidate-identity">
                    <div className="candidate-avatar">
                        {getInitials(
                            candidate.name
                        )}
                    </div>

                    <div className="candidate-info">
                        <div className="candidate-name-row">
                            <h3>
                                {candidate.name ||
                                    'Unknown candidate'}
                            </h3>

                            {index === 0 && (
                                <span className="top-match-badge">
                                    TOP MATCH
                                </span>
                            )}
                        </div>

                        <p>
                            {candidate.email ||
                                'Email not available'}
                        </p>

                        {resume.fileName && (
                            <span>
                                Resume ·{' '}
                                {resume.fileName}
                            </span>
                        )}
                    </div>
                </div>

                <div className="candidate-score-area">
                    <div>
                        <span>AI MATCH</span>

                        <strong>
                            {score}%
                        </strong>
                    </div>

                    <MatchRing
                        score={score}
                        label=""
                        size="small"
                    />
                </div>
            </div>

            {/* MATCH BREAKDOWN */}

            <div className="candidate-analysis">
                <div className="candidate-analysis-heading">
                    <div>
                        <span className="eyebrow-text">
                            MATCH ANALYSIS
                        </span>

                        <h4>
                            Compatibility breakdown
                        </h4>
                    </div>

                    <strong>
                        {score}% overall
                    </strong>
                </div>

                <div className="candidate-analysis-grid">
                    <CandidateAnalysisBlock
                        label="Required"
                        analysis={required}
                    />

                    <CandidateAnalysisBlock
                        label="Preferred"
                        analysis={preferred}
                    />
                </div>
            </div>

            {/* DETECTED SKILLS */}

            <div className="candidate-skills">
                <div className="candidate-section-heading">
                    <span>
                        DETECTED SKILLS
                    </span>

                    <small>
                        {skills.length}{' '}
                        {skills.length === 1
                            ? 'skill'
                            : 'skills'}
                    </small>
                </div>

                {skills.length > 0 ? (
                    <div className="skill-chip-wrap">
                        {skills.map(
                            (skill, skillIndex) => {
                                const skillName =
                                    formatSkill(
                                        skill
                                    );

                                if (!skillName) {
                                    return null;
                                }

                                return (
                                    <span
                                        className="skill-chip"
                                        key={
                                            skill?._id ||
                                            `${skillName}-${skillIndex}`
                                        }
                                    >
                                        ✓ {skillName}
                                    </span>
                                );
                            }
                        )}
                    </div>
                ) : (
                    <p className="detail-muted">
                        No extracted skills.
                    </p>
                )}
            </div>

            {/* FOOTER */}

            <div className="candidate-card-footer">
                <p>
                    Applied{' '}
                    {formatDate(
                        application.appliedAt
                    )}
                </p>

                <div className="candidate-status-actions">
                    <StatusPill
                        status={
                            application.status ||
                            'applied'
                        }
                    />

                    <select
                        value={
                            application.status ||
                            'applied'
                        }
                        disabled={updating}
                        onChange={(event) =>
                            onStatusChange(
                                application._id,
                                event.target.value
                            )
                        }
                        aria-label={`Change status for ${candidate.name ||
                            'candidate'
                            }`}
                    >
                        <option value="applied">
                            Applied
                        </option>

                        <option value="shortlisted">
                            Shortlisted
                        </option>

                        <option value="interview">
                            Interview
                        </option>

                        <option value="hired">
                            Hired
                        </option>

                        <option value="rejected">
                            Rejected
                        </option>
                    </select>
                </div>
            </div>
        </article>
    );
}

function CandidateAnalysisBlock({
    label,
    analysis,
}) {
    if (!analysis) {
        return (
            <div className="candidate-analysis-block">
                <div className="candidate-analysis-block-header">
                    <span>{label}</span>
                    <strong>—</strong>
                </div>

                <p className="candidate-analysis-empty">
                    Match breakdown will appear for
                    newly submitted applications.
                </p>
            </div>
        );
    }

    const coverage = Number.isFinite(
        Number(analysis.coverage)
    )
        ? Number(analysis.coverage)
        : 0;

    const matched =
        analysis.matchedSkills || [];

    const missing =
        analysis.missingSkills || [];

    return (
        <div className="candidate-analysis-block">
            <div className="candidate-analysis-block-header">
                <span>{label}</span>

                <strong>
                    {analysis.matched || 0}/
                    {analysis.total || 0}
                </strong>
            </div>

            <div className="candidate-analysis-progress">
                <span
                    style={{
                        width: `${Math.max(
                            0,
                            Math.min(
                                100,
                                coverage
                            )
                        )}%`,
                    }}
                />
            </div>

            <div className="candidate-analysis-coverage">
                {coverage}%
                <small>coverage</small>
            </div>

            {matched.length > 0 && (
                <div className="candidate-analysis-skills">
                    <span>Matched</span>

                    <div>
                        {matched.map(
                            (skill, index) => (
                                <em
                                    key={`${skill}-${index}`}
                                >
                                    ✓{' '}
                                    {formatSkill(
                                        skill
                                    )}
                                </em>
                            )
                        )}
                    </div>
                </div>
            )}

            {missing.length > 0 && (
                <div className="candidate-analysis-skills missing">
                    <span>Missing</span>

                    <div>
                        {missing.map(
                            (skill, index) => (
                                <em
                                    key={`${skill}-${index}`}
                                >
                                    {formatSkill(
                                        skill
                                    )}
                                </em>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function CandidatePipelineStage({
    label,
    value,
    active,
}) {
    return (
        <div
            className={`candidate-pipeline-stage ${active ? 'active' : ''
                }`}
        >
            <div className="candidate-pipeline-number">
                {value}
            </div>

            <span>{label}</span>
        </div>
    );
}

export default Candidates;