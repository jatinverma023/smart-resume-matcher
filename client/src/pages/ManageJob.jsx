import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../context/AuthContext';

import {
    getJobStats,
    publishJob,
} from '../api/jobs';

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


function formatDate(date) {
    if (!date) return '—';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleDateString(
        'en-IN',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    );
}


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

    return (
        skill?.name ||
        skill?.skill ||
        ''
    );
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


function ManageJob() {
    const { token } = useAuth();

    const jobId = window.location.pathname
        .split('/')
        .pop();

    const [stats, setStats] =
        useState(null);

    const [applications, setApplications] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    const [updating, setUpdating] =
        useState(null);

    const [publishing, setPublishing] =
        useState(false);

    const [publishSuccess, setPublishSuccess] =
        useState('');


    const navigate = (path) => {
        window.location.href = path;
    };


    const loadData = async () => {
        if (!token || !jobId) {
            return;
        }

        try {
            setLoading(true);
            setError('');

            const [
                statsData,
                applicantsData,
            ] = await Promise.all([
                getJobStats(
                    token,
                    jobId
                ),

                getJobApplicants(
                    token,
                    jobId
                ),
            ]);

            setStats(statsData);

            setApplications(
                applicantsData.applications ||
                []
            );
        } catch (requestError) {
            console.error(
                'Manage job error:',
                requestError
            );

            setError(
                requestError.message ||
                'Unable to load job intelligence.'
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        void loadData();
    }, [token, jobId]);


    const handlePublishJob = async () => {
        if (!token || !jobId) {
            return;
        }

        try {
            setPublishing(true);
            setError('');
            setPublishSuccess('');

            await publishJob(
                token,
                jobId
            );

            setPublishSuccess(
                'Job published successfully. Candidates can now discover and apply to this job.'
            );

            await loadData();
        } catch (requestError) {
            console.error(
                'Publish job error:',
                requestError
            );

            setError(
                requestError.message ||
                'Unable to publish this job.'
            );
        } finally {
            setPublishing(false);
        }
    };


    const averageMatch = useMemo(() => {
        if (!applications.length) {
            return 0;
        }

        const scores = applications
            .map((application) =>
                Number(
                    application.matchScore
                )
            )
            .filter(
                (score) =>
                    Number.isFinite(score)
            );

        if (!scores.length) {
            return 0;
        }

        return Math.round(
            scores.reduce(
                (sum, score) =>
                    sum + score,
                0
            ) / scores.length
        );
    }, [applications]);


    const shortlistedCount =
        applications.filter(
            (application) =>
                application.status ===
                'shortlisted'
        ).length;


    const interviewCount =
        applications.filter(
            (application) =>
                application.status ===
                'interview'
        ).length;


    const hiredCount =
        applications.filter(
            (application) =>
                application.status ===
                'hired'
        ).length;


    const rejectedCount =
        applications.filter(
            (application) =>
                application.status ===
                'rejected'
        ).length;


    const appliedCount =
        applications.filter(
            (application) =>
                application.status ===
                'applied'
        ).length;


    const handleStatusChange = async (
        applicationId,
        status
    ) => {
        try {
            setUpdating(applicationId);
            setError('');

            await updateApplicationStatus(
                token,
                applicationId,
                status
            );

            setApplications((current) =>
                current.map(
                    (application) =>
                        application._id ===
                        applicationId
                            ? {
                                ...application,
                                status,
                            }
                            : application
                )
            );

            await loadData();
        } catch (requestError) {
            setError(
                requestError.message ||
                'Unable to update application status.'
            );
        } finally {
            setUpdating(null);
        }
    };


    if (loading) {
        return (
            <WorkspaceShell
                role="recruiter"
                title="Manage job"
                subtitle="Review candidates and manage your hiring pipeline."
                action={
                    <button
                        className="secondary-light-button"
                        type="button"
                        onClick={() =>
                            navigate(
                                '/recruiter/jobs'
                            )
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
                        Loading hiring intelligence
                    </h2>

                    <p>
                        Preparing candidates and
                        match analysis.
                    </p>
                </div>
            </WorkspaceShell>
        );
    }


    if (error && !stats) {
        return (
            <WorkspaceShell
                role="recruiter"
                title="Manage job"
                subtitle="Review candidates and manage your hiring pipeline."
                action={
                    <button
                        className="secondary-light-button"
                        type="button"
                        onClick={() =>
                            navigate(
                                '/recruiter/jobs'
                            )
                        }
                    >
                        ← Job listings
                    </button>
                }
            >
                <div className="light-error-state jobs-state">
                    <h2>
                        We could not load this job
                    </h2>

                    <p>{error}</p>

                    <button
                        className="secondary-light-button"
                        type="button"
                        onClick={() =>
                            navigate(
                                '/recruiter/jobs'
                            )
                        }
                    >
                        ← Back to jobs
                    </button>
                </div>
            </WorkspaceShell>
        );
    }


    const job = stats?.job;

    const isDraft =
        job?.status === 'draft';

    const isOpen =
        job?.status === 'open';


    return (
        <WorkspaceShell
            role="recruiter"
            title={
                job?.title ||
                'Manage job'
            }
            subtitle={
                job?.company
                    ? `${job.company} · Candidate intelligence`
                    : 'Review candidates and manage your hiring pipeline.'
            }
            action={
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}
                >
                    <button
                        className="secondary-light-button"
                        type="button"
                        onClick={() =>
                            navigate(
                                '/recruiter/jobs'
                            )
                        }
                    >
                        ← Job listings
                    </button>

                    {isDraft && (
                        <button
                            className="primary-light-button"
                            type="button"
                            disabled={publishing}
                            onClick={
                                handlePublishJob
                            }
                        >
                            {publishing
                                ? 'Publishing...'
                                : 'Publish job →'}
                        </button>
                    )}
                </div>
            }
        >
            {error && (
                <div className="ui-message ui-message-error">
                    {error}
                </div>
            )}

            {publishSuccess && (
                <div className="ui-message ui-message-success">
                    {publishSuccess}
                </div>
            )}


            {/* JOB SUMMARY */}

            <section className="light-panel manage-job-summary">

                <div className="manage-job-summary-main">

                    <div className="manage-company-avatar">
                        {job?.company
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            'S'}
                    </div>

                    <div>

                        <span className="eyebrow-text">
                            CANDIDATE INTELLIGENCE
                        </span>

                        <h2>
                            {job?.title ||
                                'Untitled position'}
                        </h2>

                        <p className="manage-job-company">
                            {job?.company ||
                                'Company not specified'}
                        </p>

                        <div className="manage-job-meta">

                            <span>
                                <small>LOC</small>
                                {job?.location ||
                                    'Remote'}
                            </span>

                            <span>
                                <small>TYPE</small>
                                {job?.employmentType ||
                                    'Full-time'}
                            </span>

                            <span>
                                <small>EXP</small>
                                {job?.experienceLevel ||
                                    'Any level'}
                            </span>

                            <span>
                                <small>STATUS</small>
                                {job?.status ||
                                    'open'}
                            </span>

                        </div>
                    </div>
                </div>


                <div className="manage-job-summary-side">

                    <StatusPill
                        status={
                            job?.status ||
                            'open'
                        }
                    />

                    <p>
                        {applications.length}{' '}
                        {applications.length === 1
                            ? 'candidate'
                            : 'candidates'}{' '}
                        analyzed
                    </p>

                </div>
            </section>


            {/* DRAFT PUBLISH PANEL */}

            {isDraft && (
                <section className="light-panel manage-job-publish-panel">

                    <div className="manage-job-publish-content">

                        <div className="manage-job-publish-icon">
                            ↑
                        </div>

                        <div>
                            <span className="eyebrow-text">
                                DRAFT JOB
                            </span>

                            <h2>
                                This job is not visible to candidates yet.
                            </h2>

                            <p>
                                Review the job details and publish it when you're ready. Once published, it will appear in the candidate Discover Jobs page and candidates can apply.
                            </p>
                        </div>

                    </div>

                    <button
                        className="primary-light-button"
                        type="button"
                        disabled={publishing}
                        onClick={
                            handlePublishJob
                        }
                    >
                        {publishing
                            ? 'Publishing...'
                            : 'Publish job →'}
                    </button>

                </section>
            )}


            {/* OPEN JOB CONFIRMATION */}

            {isOpen && (
                <section className="light-panel manage-job-live-panel">

                    <div className="manage-job-live-content">

                        <div className="manage-job-live-icon">
                            ✓
                        </div>

                        <div>
                            <span className="eyebrow-text">
                                JOB IS LIVE
                            </span>

                            <h2>
                                This job is visible to candidates.
                            </h2>

                            <p>
                                Candidates can discover this opportunity and submit applications.
                            </p>
                        </div>

                    </div>

                </section>
            )}


            {/* STATS */}

            <section className="metrics-grid manage-job-metrics">

                <MetricCard
                    icon="▣"
                    label="Applicants"
                    value={
                        applications.length
                    }
                    detail="Candidates in pipeline"
                    tone="blue"
                />

                <MetricCard
                    icon="✦"
                    label="Average match"
                    value={`${averageMatch}%`}
                    detail="AI compatibility score"
                    tone="purple"
                />

                <MetricCard
                    icon="✓"
                    label="Shortlisted"
                    value={
                        shortlistedCount
                    }
                    detail="Candidates progressing"
                    tone="green"
                />

                <MetricCard
                    icon="◆"
                    label="Hired"
                    value={
                        hiredCount
                    }
                    detail="Successful placements"
                    tone="orange"
                />

            </section>


            {/* PIPELINE */}

            <section className="light-panel recruiter-pipeline-panel">

                <div className="recruiter-pipeline-header">

                    <div>

                        <span className="eyebrow-text">
                            APPLICATION PIPELINE
                        </span>

                        <h2>
                            Hiring progress
                        </h2>

                        <p>
                            See where candidates
                            currently stand in the
                            recruitment process.
                        </p>

                    </div>

                    <MatchRing
                        score={averageMatch}
                        label="AVG MATCH"
                    />

                </div>


                <div className="recruiter-pipeline">

                    <PipelineStage
                        label="Applied"
                        value={appliedCount}
                        active={
                            appliedCount > 0
                        }
                    />

                    <PipelineLine />

                    <PipelineStage
                        label="Shortlisted"
                        value={
                            shortlistedCount
                        }
                        active={
                            shortlistedCount > 0
                        }
                    />

                    <PipelineLine />

                    <PipelineStage
                        label="Interview"
                        value={
                            interviewCount
                        }
                        active={
                            interviewCount > 0
                        }
                    />

                    <PipelineLine />

                    <PipelineStage
                        label="Hired"
                        value={hiredCount}
                        active={
                            hiredCount > 0
                        }
                    />

                </div>


                <div className="manage-job-secondary-stats">

                    <div>
                        <span>
                            Rejected
                        </span>

                        <strong>
                            {rejectedCount}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Active candidates
                        </span>

                        <strong>
                            {applications.length -
                                rejectedCount -
                                hiredCount}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Average match
                        </span>

                        <strong>
                            {averageMatch}%
                        </strong>
                    </div>

                </div>

            </section>


            {/* APPLICANTS */}

            <section className="light-panel applicant-pipeline-panel">

                <div className="applicant-pipeline-header">

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

                    <span className="ai-analyzed-badge">
                        AI analyzed
                    </span>

                </div>


                {applications.length === 0 ? (
                    <EmptyState
                        title="No applicants yet"
                        detail={
                            isDraft
                                ? 'Publish this job to make it visible to candidates.'
                                : 'Candidates who apply to this job will appear here.'
                        }
                    />
                ) : (
                    <div className="applicant-list">

                        {applications.map(
                            (
                                application,
                                index
                            ) => (
                                <ApplicantCard
                                    key={
                                        application._id
                                    }
                                    application={
                                        application
                                    }
                                    index={index}
                                    updating={
                                        updating ===
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


function ApplicantCard({
    application,
    index,
    updating,
    onStatusChange,
}) {
    const candidate =
        application.candidate || {};

    const resume =
        application.resume || {};

    const score =
        Number.isFinite(
            Number(
                application.matchScore
            )
        )
            ? Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        application.matchScore
                    )
                )
            )
            : 0;

    const skills =
        resume.skills || [];

    const matchAnalysis =
        application.matchAnalysis ||
        null;

    const required =
        matchAnalysis?.required ||
        null;

    const preferred =
        matchAnalysis?.preferred ||
        null;


    return (
        <article className="applicant-card">

            <div className="applicant-card-header">

                <div className="applicant-identity">

                    <div className="applicant-avatar">
                        {getInitials(
                            candidate.name
                        )}
                    </div>

                    <div className="applicant-info">

                        <div className="applicant-name-row">

                            <h3>
                                {candidate.name ||
                                    'Candidate'}
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

                        <span>
                            Resume ·{' '}
                            {resume.fileName ||
                                'Resume'}
                        </span>

                    </div>
                </div>


                <div className="applicant-match">

                    <MatchRing
                        score={score}
                        label="MATCH"
                        size="small"
                    />

                </div>

            </div>


            <div className="applicant-divider" />


            {/* MATCH ANALYSIS */}

            <div className="applicant-analysis">

                <div className="applicant-analysis-heading">

                    <div>

                        <span className="eyebrow-text">
                            MATCH ANALYSIS
                        </span>

                        <h4>
                            Candidate compatibility
                        </h4>

                    </div>

                    <strong>
                        {score}% overall
                    </strong>

                </div>


                <div className="applicant-analysis-grid">

                    <AnalysisBlock
                        label="Required"
                        analysis={required}
                    />

                    <AnalysisBlock
                        label="Preferred"
                        analysis={preferred}
                    />

                </div>

            </div>


            {/* SKILLS */}

            <div className="applicant-skills-section">

                <div className="applicant-section-heading">

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
                            (
                                skill,
                                skillIndex
                            ) => {
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


            {/* ACTIONS */}

            <div className="applicant-card-footer">

                <p>
                    Applied{' '}
                    {formatDate(
                        application.appliedAt
                    )}
                </p>

                <div className="applicant-actions">

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
                        aria-label={`Change status for ${
                            candidate.name ||
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

                        <option value="rejected">
                            Rejected
                        </option>

                        <option value="hired">
                            Hired
                        </option>
                    </select>

                </div>

            </div>

        </article>
    );
}


function AnalysisBlock({
    label,
    analysis,
}) {
    if (!analysis) {
        return (
            <div className="analysis-block">

                <div className="analysis-block-header">

                    <span>
                        {label}
                    </span>

                    <strong>
                        —
                    </strong>

                </div>

                <div className="analysis-empty">
                    Match breakdown will appear
                    for newly submitted
                    applications.
                </div>

            </div>
        );
    }


    const coverage =
        Number.isFinite(
            Number(analysis.coverage)
        )
            ? Number(
                analysis.coverage
            )
            : 0;

    const matched =
        analysis.matchedSkills || [];

    const missing =
        analysis.missingSkills || [];


    return (
        <div className="analysis-block">

            <div className="analysis-block-header">

                <span>
                    {label}
                </span>

                <strong>
                    {analysis.matched || 0}/
                    {analysis.total || 0}
                </strong>

            </div>


            <div className="analysis-progress">

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


            <div className="analysis-coverage">

                {coverage}%

                <span>
                    coverage
                </span>

            </div>


            {matched.length > 0 && (
                <div className="analysis-skill-group">

                    <span>
                        Matched
                    </span>

                    <div>

                        {matched.map(
                            (
                                skill,
                                index
                            ) => (
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
                <div className="analysis-skill-group missing">

                    <span>
                        Missing
                    </span>

                    <div>

                        {missing.map(
                            (
                                skill,
                                index
                            ) => (
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


function PipelineStage({
    label,
    value,
    active,
}) {
    return (
        <div
            className={`pipeline-stage ${
                active
                    ? 'active'
                    : ''
            }`}
        >
            <div className="pipeline-stage-number">
                {value}
            </div>

            <span>
                {label}
            </span>
        </div>
    );
}


function PipelineLine() {
    return (
        <div
            className="pipeline-line"
            aria-hidden="true"
        />
    );
}


export default ManageJob;