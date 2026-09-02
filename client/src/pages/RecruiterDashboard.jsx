import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../context/AuthContext';

import { getMyJobs, getJobStats } from '../api/jobs';
import { getJobApplicants } from '../api/applications';

import {
    EmptyState,
    MetricCard,
    StatusPill,
    WorkspaceShell,
} from '../components/WorkspaceShell';

function RecruiterDashboard() {
    const { user, token } = useAuth();

    const [jobs, setJobs] = useState([]);
    const [jobStats, setJobStats] = useState({});
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');



    useEffect(() => {
        const loadDashboard = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');

                // Get all jobs belonging to recruiter
                const jobsData = await getMyJobs(token);
                const recruiterJobs = jobsData.jobs || [];

                setJobs(recruiterJobs);

                if (recruiterJobs.length === 0) {
                    setJobStats({});
                    setApplications([]);
                    return;
                }

                // Get stats and applications for every job
                const results = await Promise.all(
                    recruiterJobs.map(async (job) => {
                        const jobId = job._id || job.id;

                        try {
                            const [statsData, applicationsData] = await Promise.all([
                                getJobStats(token, jobId),
                                getJobApplicants(token, jobId),
                            ]);

                            return {
                                jobId,
                                stats: statsData.stats || null,
                                applications: applicationsData.applications || [],
                            };
                        } catch (jobError) {
                            console.error(
                                `Unable to load data for job ${jobId}:`,
                                jobError
                            );

                            return {
                                jobId,
                                stats: null,
                                applications: [],
                            };
                        }
                    })
                );

                const statsMap = {};

                results.forEach((result) => {
                    statsMap[result.jobId] = result.stats;
                });

                setJobStats(statsMap);

                const allApplications = results.flatMap(
                    (result) => result.applications
                );

                setApplications(allApplications);
            } catch (err) {
                console.error('Recruiter dashboard error:', err);
                setError(err.message || 'Unable to load recruiter dashboard');
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [token]);

    const openJobs = jobs.filter((job) => job.status === 'open').length;

    const totalApplicants = applications.length;

    const averageMatch = useMemo(() => {
        if (applications.length === 0) {
            return 0;
        }

        const scores = applications
            .map((application) => Number(application.matchScore))
            .filter((score) => Number.isFinite(score));

        if (scores.length === 0) {
            return 0;
        }

        const total = scores.reduce((sum, score) => sum + score, 0);

        return Math.round((total / scores.length) * 100) / 100;
    }, [applications]);

    const shortlisted = applications.filter(
        (application) => application.status === 'shortlisted'
    ).length;

    const interviewed = applications.filter(
        (application) => application.status === 'interview'
    ).length;

    const hired = applications.filter(
        (application) => application.status === 'hired'
    ).length;

    const rejected = applications.filter(
        (application) => application.status === 'rejected'
    ).length;

    const applied = applications.filter(
        (application) => application.status === 'applied'
    ).length;

    const recentApplications = useMemo(() => {
        return [...applications]
            .sort((a, b) => {
                const dateA = new Date(a.appliedAt || a.createdAt || 0);
                const dateB = new Date(b.appliedAt || b.createdAt || 0);

                return dateB - dateA;
            })
            .slice(0, 5);
    }, [applications]);

    const formatDate = (date) => {
        if (!date) {
            return '';
        }

        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getJobStats = (job) => {
        const jobId = job._id || job.id;

        return (
            jobStats[jobId] || {
                totalApplicants: 0,
                averageMatchScore: 0,
                statusCounts: {
                    applied: 0,
                    shortlisted: 0,
                    interview: 0,
                    rejected: 0,
                    hired: 0,
                },
            }
        );
    };

    const navigate = (path) => {
        window.location.href = path;
    };

    if (loading) {
        return (
            <WorkspaceShell
                role="recruiter"
                title="Recruiter overview"
                subtitle="Loading your hiring intelligence..."
            >
                <div className="light-loading-state">
                    <div className="light-loading-spinner" />
                    <p>Loading recruiter workspace...</p>
                </div>
            </WorkspaceShell>
        );
    }

    return (
        <WorkspaceShell
            role="recruiter"
            title="Recruiter overview"
            subtitle="Hiring intelligence across your active opportunities."
            action={
                <button
                    type="button"
                    className="primary-light-button"
                    onClick={() => navigate('/recruiter/jobs/create')}
                >
                    + Post a job
                </button>
            }
        >
            {error && (
                <div className="ui-message ui-message-error">
                    {error}
                </div>
            )}

            {/* Overview metrics */}
            <section className="recruiter-dashboard-metrics">
                <MetricCard
                    icon="◇"
                    label="Open jobs"
                    value={openJobs}
                    tone="blue"
                    detail="Active opportunities"
                />

                <MetricCard
                    icon="□"
                    label="Applicants"
                    value={totalApplicants}
                    tone="purple"
                    detail="Across all jobs"
                />

                <MetricCard
                    icon="✦"
                    label="Average match"
                    value={`${averageMatch}%`}
                    tone="green"
                    detail="AI compatibility score"
                />

                <MetricCard
                    icon="✓"
                    label="Shortlisted"
                    value={shortlisted}
                    tone="orange"
                    detail="Candidates progressing"
                />

                <MetricCard
                    icon="◆"
                    label="Hired"
                    value={hired}
                    tone="blue"
                    detail="Successful placements"
                />
            </section>

            {/* Welcome panel */}
            <section className="recruiter-dashboard-hero">
                <div>
                    <p className="eyebrow-text">RECRUITER INTELLIGENCE</p>

                    <h2>
                        Welcome back,{' '}
                        <span>{user?.name?.split(' ')[0] || 'Recruiter'}.</span>
                    </h2>

                    <p>
                        Review your hiring pipeline, monitor candidate quality, and
                        identify the strongest matches for your open roles.
                    </p>
                </div>

                <div className="recruiter-dashboard-hero-actions">
                    <button
                        type="button"
                        className="secondary-light-button"
                        onClick={() => navigate('/candidates')}
                    >
                        Browse candidates
                    </button>

                    <button
                        type="button"
                        className="primary-light-button"
                        onClick={() => navigate('/recruiter/jobs/create')}
                    >
                        Create job
                    </button>
                </div>
            </section>

            {/* Hiring pipeline */}
            <section className="recruiter-dashboard-panel">
                <div className="recruiter-dashboard-panel-header">
                    <div>
                        <p className="eyebrow-text">HIRING INTELLIGENCE</p>
                        <h2>Hiring pipeline</h2>
                    </div>

                    <span className="light-live-pill">
                        Live data
                    </span>
                </div>

                <div className="recruiter-pipeline-grid">
                    <PipelineStage
                        label="Applied"
                        value={applied}
                        total={totalApplicants}
                        icon="●"
                    />

                    <PipelineStage
                        label="Shortlisted"
                        value={shortlisted}
                        total={totalApplicants}
                        icon="◇"
                    />

                    <PipelineStage
                        label="Interview"
                        value={interviewed}
                        total={totalApplicants}
                        icon="△"
                    />

                    <PipelineStage
                        label="Hired"
                        value={hired}
                        total={totalApplicants}
                        icon="◆"
                    />

                    <PipelineStage
                        label="Rejected"
                        value={rejected}
                        total={totalApplicants}
                        icon="×"
                    />
                </div>
            </section>

            {/* Main dashboard content */}
            <section className="recruiter-dashboard-grid">
                {/* Recent applications */}
                <div className="recruiter-dashboard-panel">
                    <div className="recruiter-dashboard-panel-header">
                        <div>
                            <p className="eyebrow-text">LATEST INTELLIGENCE</p>
                            <h2>Recent applications</h2>
                        </div>

                        <span className="light-success-pill">
                            AI analyzed
                        </span>
                    </div>

                    <div className="recruiter-application-list">
                        {recentApplications.length === 0 ? (
                            <EmptyState
                                title="No applications yet"
                                detail="Applications from candidates will appear here."
                                action={
                                    <button
                                        type="button"
                                        className="secondary-light-button"
                                        onClick={() => navigate('/recruiter/jobs/create')}
                                    >
                                        Post a job
                                    </button>
                                }
                            />
                        ) : (
                            recentApplications.map((application) => {
                                const candidate = application.candidate;
                                const job = application.job;

                                return (
                                    <div
                                        key={application._id}
                                        className="recruiter-application-row"
                                    >
                                        <div className="recruiter-application-person">
                                            <div className="recruiter-candidate-avatar">
                                                {getInitials(candidate?.name)}
                                            </div>

                                            <div>
                                                <strong>
                                                    {candidate?.name || 'Candidate'}
                                                </strong>

                                                <span>
                                                    {job?.title || 'Job application'}
                                                </span>

                                                <small>
                                                    Applied{' '}
                                                    {formatDate(
                                                        application.appliedAt ||
                                                        application.createdAt
                                                    )}
                                                </small>
                                            </div>
                                        </div>

                                        <div className="recruiter-application-result">
                                            <div className="recruiter-match-score">
                                                <strong>
                                                    {application.matchScore ?? 0}%
                                                </strong>
                                                <span>Match</span>
                                            </div>

                                            <StatusPill
                                                status={application.status || 'applied'}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Job postings */}
                <div className="recruiter-dashboard-panel">
                    <div className="recruiter-dashboard-panel-header">
                        <div>
                            <p className="eyebrow-text">YOUR OPPORTUNITIES</p>
                            <h2>Job postings</h2>
                        </div>

                        <button
                            type="button"
                            className="light-text-button"
                            onClick={() => navigate('/recruiter/jobs')}
                        >
                            View all
                        </button>
                    </div>

                    <div className="recruiter-dashboard-job-list">
                        {jobs.length === 0 ? (
                            <EmptyState
                                title="No jobs posted"
                                detail="Create your first opportunity to start receiving applications."
                                action={
                                    <button
                                        type="button"
                                        className="primary-light-button"
                                        onClick={() =>
                                            navigate('/recruiter/jobs/create')
                                        }
                                    >
                                        Create your first job
                                    </button>
                                }
                            />
                        ) : (
                            jobs.slice(0, 4).map((job) => {
                                const stats = getJobStats(job);
                                const jobId = job._id || job.id;

                                return (
                                    <div
                                        key={jobId}
                                        className="recruiter-dashboard-job-card"
                                    >
                                        <div className="recruiter-dashboard-job-top">
                                            <div className="recruiter-dashboard-job-heading">
                                                <div className="recruiter-company-avatar">
                                                    {job.company?.[0]?.toUpperCase() || 'S'}
                                                </div>

                                                <div>
                                                    <h3>{job.title}</h3>
                                                    <p>{job.company || 'Company'}</p>
                                                </div>
                                            </div>

                                            <StatusPill
                                                status={job.status || 'draft'}
                                            />
                                        </div>

                                        <div className="recruiter-dashboard-job-stats">
                                            <div>
                                                <span>Applicants</span>
                                                <strong>
                                                    {stats.totalApplicants ?? 0}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Avg. match</span>
                                                <strong>
                                                    {stats.averageMatchScore ?? 0}%
                                                </strong>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="secondary-light-button recruiter-dashboard-manage-button"
                                            onClick={() =>
                                                navigate(`/recruiter/jobs/${jobId}`)
                                            }
                                        >
                                            Manage job
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>
        </WorkspaceShell>
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
            .toUpperCase() || 'SR'
    );
}

function PipelineStage({ label, value, total, icon }) {
    const percentage =
        total > 0 ? Math.min(100, (value / total) * 100) : 0;

    return (
        <div className="recruiter-pipeline-stage">
            <div className="recruiter-pipeline-stage-top">
                <span>{label}</span>
                <strong>{icon}</strong>
            </div>

            <p>{value}</p>

            <div className="recruiter-pipeline-bar">
                <span style={{ width: `${percentage}%` }} />
            </div>

            <small>
                {total > 0
                    ? `${Math.round(percentage)}% of applicants`
                    : 'No applicants'}
            </small>
        </div>
    );
}

export default RecruiterDashboard;