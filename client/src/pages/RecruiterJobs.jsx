import { useEffect, useMemo, useState } from 'react';

import { getMyJobs } from '../api/jobs';

import {
    EmptyState,
    MetricCard,
    StatusPill,
    WorkspaceShell,
} from '../components/WorkspaceShell';

import { useAuth } from '../context/AuthContext';


function formatDate(date) {
    if (!date) return 'Not available';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return 'Not available';
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


function getSkillName(skill) {
    if (typeof skill === 'string') {
        return skill;
    }

    return skill?.name || '';
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


function RecruiterJobs() {
    const { token } = useAuth();

    const [jobs, setJobs] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');


    const loadJobs = async () => {
        if (!token) {
            setJobs([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');

            const data =
                await getMyJobs(token);

            setJobs(data.jobs || []);
        } catch (requestError) {
            console.error(
                'Recruiter jobs error:',
                requestError
            );

            setError(
                requestError.message ||
                'Unable to load job listings.'
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        void loadJobs();
    }, [token]);


    const stats = useMemo(() => {
        const open = jobs.filter(
            (job) =>
                job.status === 'open'
        ).length;

        const drafts = jobs.filter(
            (job) =>
                job.status === 'draft'
        ).length;

        const closed = jobs.filter(
            (job) =>
                job.status !== 'open' &&
                job.status !== 'draft'
        ).length;

        return {
            total: jobs.length,
            open,
            drafts,
            closed,
        };
    }, [jobs]);


    const navigate = (path) => {
        window.location.href = path;
    };


    if (loading) {
        return (
            <WorkspaceShell
                role="recruiter"
                title="Job listings"
                subtitle="Create, manage, and monitor your hiring opportunities."
                action={
                    <button
                        className="primary-light-button"
                        type="button"
                        onClick={() =>
                            navigate(
                                '/recruiter/jobs/create'
                            )
                        }
                    >
                        ＋ Post job
                    </button>
                }
            >
                <div className="light-loading-state">
                    <span
                        className="light-loading-spinner"
                        aria-hidden="true"
                    />

                    <h2>
                        Loading job listings
                    </h2>

                    <p>
                        Gathering your latest
                        opportunities.
                    </p>
                </div>
            </WorkspaceShell>
        );
    }


    return (
        <WorkspaceShell
            role="recruiter"
            title="Job listings"
            subtitle="Create, manage, and monitor the opportunities you're hiring for."
            action={
                <button
                    className="primary-light-button"
                    type="button"
                    onClick={() =>
                        navigate(
                            '/recruiter/jobs/create'
                        )
                    }
                >
                    ＋ Post job
                </button>
            }
        >
            {error && (
                <div className="ui-message ui-message-error">
                    {error}
                </div>
            )}


            <section className="metrics-grid recruiter-job-metrics">
                <MetricCard
                    icon="▣"
                    label="Total jobs"
                    value={stats.total}
                    detail="All job postings"
                    tone="blue"
                />

                <MetricCard
                    icon="✓"
                    label="Open"
                    value={stats.open}
                    detail="Currently accepting applications"
                    tone="green"
                />

                <MetricCard
                    icon="◇"
                    label="Drafts"
                    value={stats.drafts}
                    detail="Not published yet"
                    tone="purple"
                />

                <MetricCard
                    icon="□"
                    label="Closed"
                    value={stats.closed}
                    detail="Inactive opportunities"
                    tone="orange"
                />
            </section>


            <section className="light-panel recruiter-jobs-intro">
                <div>
                    <span className="eyebrow-text">
                        OPPORTUNITY MANAGEMENT
                    </span>

                    <h2>
                        Manage your hiring pipeline.
                    </h2>

                    <p>
                        Create new roles, update
                        existing postings, and
                        review the opportunities
                        currently available to
                        candidates.
                    </p>
                </div>

                <button
                    className="secondary-light-button"
                    type="button"
                    onClick={() =>
                        navigate('/candidates')
                    }
                >
                    View candidates →
                </button>
            </section>


            <section className="light-panel recruiter-jobs-list-panel">
                <div className="recruiter-jobs-list-header">
                    <div>
                        <span className="eyebrow-text">
                            YOUR OPPORTUNITIES
                        </span>

                        <h2>
                            All job postings
                        </h2>

                        <p>
                            Review the roles you
                            are currently
                            managing.
                        </p>
                    </div>

                    <span className="recruiter-jobs-count">
                        {jobs.length}{' '}
                        {jobs.length === 1
                            ? 'posting'
                            : 'postings'}
                    </span>
                </div>


                {jobs.length === 0 ? (
                    <EmptyState
                        title="No job postings yet"
                        detail="Create your first opportunity and start building your candidate pipeline."
                        action={
                            <button
                                className="primary-light-button"
                                type="button"
                                onClick={() =>
                                    navigate(
                                        '/recruiter/jobs/create'
                                    )
                                }
                            >
                                ＋ Create your first job
                            </button>
                        }
                    />
                ) : (
                    <div className="recruiter-job-list">
                        {jobs.map((job) => (
                            <RecruiterJobCard
                                key={job._id}
                                job={job}
                                onManage={(jobId) =>
                                    navigate(
                                        `/recruiter/jobs/${jobId}`
                                    )
                                }
                            />
                        ))}
                    </div>
                )}
            </section>
        </WorkspaceShell>
    );
}


function RecruiterJobCard({
    job,
    onManage,
}) {
    const isOpen =
        job.status === 'open';

    const isDraft =
        job.status === 'draft';

    const requiredSkills = (
        job.requiredSkills || []
    )
        .map(formatSkill)
        .filter(Boolean);

    const visibleSkills =
        requiredSkills.slice(0, 5);

    const remainingSkills =
        requiredSkills.length > 5
            ? requiredSkills.length - 5
            : 0;

    const companyInitial =
        job.company
            ?.charAt(0)
            ?.toUpperCase() || 'J';


    return (
        <article className="recruiter-job-card">

            <div className="recruiter-job-card-top">

                <div className="recruiter-job-identity">

                    <div className="recruiter-company-avatar">
                        {companyInitial}
                    </div>

                    <div className="recruiter-job-title-block">

                        <div className="recruiter-job-title-row">

                            <h3>
                                {job.title ||
                                    'Untitled position'}
                            </h3>

                            <StatusPill
                                status={
                                    job.status ||
                                    'draft'
                                }
                            />

                        </div>

                        <p className="recruiter-job-company">
                            {job.company ||
                                'Company not specified'}
                        </p>

                    </div>
                </div>


                <button
                    className="secondary-light-button recruiter-manage-button"
                    type="button"
                    onClick={() =>
                        onManage(job._id)
                    }
                >
                    {isDraft
                        ? 'Open draft →'
                        : 'Manage job →'}
                </button>

            </div>


            {job.description && (
                <p className="recruiter-job-description">
                    {job.description}
                </p>
            )}


            {visibleSkills.length > 0 && (
                <div className="recruiter-job-skills">

                    <div className="recruiter-job-section-label">
                        <span>
                            REQUIRED SKILLS
                        </span>

                        <small>
                            {requiredSkills.length}{' '}
                            {requiredSkills.length === 1
                                ? 'skill'
                                : 'skills'}
                        </small>
                    </div>

                    <div className="skill-chip-wrap">

                        {visibleSkills.map(
                            (skill, index) => (
                                <span
                                    className="skill-chip"
                                    key={`${skill}-${index}`}
                                >
                                    ✓ {skill}
                                </span>
                            )
                        )}

                        {remainingSkills > 0 && (
                            <span className="skill-chip muted">
                                +{remainingSkills}
                            </span>
                        )}

                    </div>
                </div>
            )}


            <div className="recruiter-job-meta">

                <span>
                    <small>LOC</small>
                    {job.location ||
                        'Location not specified'}
                </span>

                <span>
                    <small>TYPE</small>
                    {job.employmentType ||
                        'Not specified'}
                </span>

                <span>
                    <small>EXP</small>
                    {job.experienceLevel ||
                        'Not specified'}
                </span>

                <span>
                    <small>POSTED</small>
                    {formatDate(
                        job.createdAt
                    )}
                </span>

                <span
                    className={
                        isOpen
                            ? 'recruiter-job-state open'
                            : 'recruiter-job-state'
                    }
                >
                    {isOpen
                        ? 'Accepting applications'
                        : 'Not accepting applications'}
                </span>

            </div>

        </article>
    );
}


export default RecruiterJobs;