import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/config';

function RecruiterDashboard() {
    const { user, token, logout } = useAuth();

    const [jobs, setJobs] = useState([]);
    const [jobStats, setJobStats] = useState({});
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const apiFetch = async (url) => {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    };

    useEffect(() => {
        const loadDashboard = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');

                // 1. Get all jobs belonging to recruiter
                const jobsData = await apiFetch('/jobs/my');
                const recruiterJobs = jobsData.jobs || [];

                setJobs(recruiterJobs);

                if (recruiterJobs.length === 0) {
                    setJobStats({});
                    setApplications([]);
                    return;
                }

                // 2. Get stats + applications for EVERY job
                const results = await Promise.all(
                    recruiterJobs.map(async (job) => {
                        const jobId = job._id || job.id;

                        try {
                            const [statsData, applicationsData] =
                                await Promise.all([
                                    apiFetch(`/jobs/${jobId}/stats`),
                                    apiFetch(`/applications/job/${jobId}`),
                                ]);

                            return {
                                jobId,
                                stats: statsData.stats || null,
                                applications:
                                    applicationsData.applications || [],
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

                // 3. Store stats by job ID
                const statsMap = {};

                results.forEach((result) => {
                    statsMap[result.jobId] = result.stats;
                });

                setJobStats(statsMap);

                // 4. Combine applications from ALL jobs
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

    /*
     * DASHBOARD TOTALS
     */

    const openJobs = jobs.filter(
        (job) => job.status === 'open'
    ).length;

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

        const total = scores.reduce(
            (sum, score) => sum + score,
            0
        );

        return Math.round((total / scores.length) * 100) / 100;
    }, [applications]);

    const shortlisted = applications.filter(
        (application) =>
            application.status === 'shortlisted'
    ).length;

    const interviewed = applications.filter(
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

    const applied = applications.filter(
        (application) =>
            application.status === 'applied'
    ).length;

    /*
     * RECENT APPLICATIONS
     */

    const recentApplications = useMemo(() => {
        return [...applications]
            .sort((a, b) => {
                const dateA = new Date(
                    a.appliedAt || a.createdAt || 0
                );

                const dateB = new Date(
                    b.appliedAt || b.createdAt || 0
                );

                return dateB - dateA;
            })
            .slice(0, 5);
    }, [applications]);

    /*
     * HELPERS
     */

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

    const getInitials = (name = '') => {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();
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

    const goTo = (path) => {
        window.location.href = path;
    };

    /*
     * LOADING
     */

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050814] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />

                    <p className="mt-4 text-sm text-slate-400">
                        Loading recruiter workspace...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050814] text-white">
            <div className="flex min-h-screen">

                {/* SIDEBAR */}

                <aside className="hidden w-[272px] shrink-0 border-r border-slate-800/80 bg-[#070b16] lg:flex lg:flex-col">

                    {/* BRAND */}

                    <div className="flex h-[104px] items-center border-b border-slate-800/70 px-8">
                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-lg font-bold shadow-lg shadow-blue-500/20">
                                S
                            </div>

                            <div>
                                <p className="text-sm font-bold tracking-tight">
                                    Smart Resume
                                </p>

                                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                                    Matcher
                                </p>
                            </div>

                        </div>
                    </div>

                    <div className="flex-1 px-4 py-8">

                        <p className="px-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                            Workspace
                        </p>

                        <nav className="mt-4 space-y-2">

                            <NavItem
                                active={window.location.pathname === '/'}
                                icon="◆"
                                label="Dashboard"
                                href="/"
                            />

                            <NavItem
                                active={
                                    window.location.pathname ===
                                    '/recruiter/jobs'
                                }
                                icon="○"
                                label="Job listings"
                                href="/recruiter/jobs"
                            />

                            <NavItem
                                active={
                                    window.location.pathname ===
                                    '/candidates'
                                }
                                icon="□"
                                label="Candidates"
                                href="/candidates"
                            />

                        </nav>

                        <p className="mt-10 px-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                            Account
                        </p>

                        <nav className="mt-4">

                            <NavItem
                                active={
                                    window.location.pathname ===
                                    '/settings'
                                }
                                icon="⚙"
                                label="Settings"
                                href="/settings"
                            />

                        </nav>
                    </div>

                    {/* USER */}

                    <div className="border-t border-slate-800/70 p-5">
                        <div className="flex items-center gap-3 rounded-xl p-2">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold">
                                {getInitials(user?.name)}
                            </div>

                            <div className="min-w-0 flex-1">

                                <p className="truncate text-sm font-medium">
                                    {user?.name}
                                </p>

                                <p className="truncate text-xs text-slate-500">
                                    Recruiter
                                </p>

                            </div>

                            <button
                                onClick={logout}
                                className="text-slate-500 transition hover:text-white"
                                title="Sign out"
                            >
                                ↪
                            </button>

                        </div>
                    </div>
                </aside>

                {/* MAIN */}

                <main className="min-w-0 flex-1">

                    {/* TOP BAR */}

                    <header className="flex h-[104px] items-center justify-between border-b border-slate-800/70 px-6 lg:px-10">

                        <div>

                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-400">
                                Recruiter workspace
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Hiring intelligence overview
                            </p>

                        </div>

                        <div className="flex items-center gap-3">

                            <button
                                onClick={() =>
                                    goTo('/candidates')
                                }
                                className="hidden rounded-xl border border-slate-700 bg-slate-900/50 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 sm:block"
                            >
                                Browse candidates
                            </button>

                            <button
                                onClick={() =>
                                    goTo('/recruiter/jobs/create')
                                }
                                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
                            >
                                + Post job
                            </button>

                            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold lg:hidden">
                                {getInitials(user?.name)}
                            </div>

                        </div>
                    </header>

                    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10 lg:py-10">

                        {/* HERO */}

                        <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#111b35] via-[#0c1428] to-[#080d1c] p-8 lg:p-10">

                            <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

                            <div className="relative">

                                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300">

                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />

                                    AI hiring workspace

                                </div>

                                <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">

                                    Welcome back,{' '}

                                    <span className="text-slate-400">
                                        {user?.name?.split(' ')[0]}.
                                    </span>

                                </h1>

                                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                                    Review your hiring pipeline, monitor candidate
                                    quality, and identify the strongest matches
                                    for your open roles.
                                </p>

                            </div>
                        </section>

                        {/* STATS */}

                        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

                            <StatCard
                                label="Open jobs"
                                value={openJobs}
                                description="Active opportunities"
                                icon="◇"
                            />

                            <StatCard
                                label="Applicants"
                                value={totalApplicants}
                                description="Candidates across all jobs"
                                icon="□"
                            />

                            <StatCard
                                label="Avg. match"
                                value={`${averageMatch}%`}
                                description="AI compatibility score"
                                icon="✦"
                                highlight
                            />

                            <StatCard
                                label="Shortlisted"
                                value={shortlisted}
                                description="Candidates progressing"
                                icon="✓"
                            />

                            <StatCard
                                label="Hired"
                                value={hired}
                                description="Successful placements"
                                icon="◆"
                            />

                        </section>

                        {/* ERROR */}

                        {error && (
                            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        {/* HIRING PIPELINE */}

                        <section className="mt-6 rounded-[24px] border border-slate-800 bg-[#090f1f] overflow-hidden">
                            <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-5">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600">
                                        Hiring intelligence
                                    </p>

                                    <h2 className="mt-1 text-lg font-semibold">
                                        Hiring pipeline
                                    </h2>
                                </div>

                                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400">
                                    Live data
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-px bg-slate-800/70 sm:grid-cols-2 lg:grid-cols-5">
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

                        {/* CONTENT GRID */}

                        <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">

                            {/* RECENT APPLICATIONS */}

                            <div className="overflow-hidden rounded-[24px] border border-slate-800 bg-[#090f1f]">

                                <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-5">

                                    <div>

                                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600">
                                            Latest intelligence
                                        </p>

                                        <h2 className="mt-1 text-lg font-semibold">
                                            Recent applications
                                        </h2>

                                    </div>

                                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                                        AI analyzed
                                    </span>

                                </div>

                                <div className="divide-y divide-slate-800/70">

                                    {recentApplications.length === 0 ? (

                                        <div className="px-6 py-12 text-center">

                                            <p className="text-sm text-slate-500">
                                                No applications yet.
                                            </p>

                                        </div>

                                    ) : (

                                        recentApplications.map(
                                            (application) => {

                                                const candidate =
                                                    application.candidate;

                                                const job =
                                                    application.job;

                                                return (
                                                    <div
                                                        key={
                                                            application._id
                                                        }
                                                        className="flex flex-col gap-5 px-6 py-5 transition hover:bg-slate-800/20 sm:flex-row sm:items-center sm:justify-between"
                                                    >

                                                        <div className="flex items-center gap-4">

                                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-semibold text-blue-400">
                                                                {getInitials(
                                                                    candidate?.name
                                                                )}
                                                            </div>

                                                            <div>

                                                                <p className="font-semibold">
                                                                    {candidate?.name ||
                                                                        'Candidate'}
                                                                </p>

                                                                <p className="mt-1 text-sm text-slate-500">
                                                                    {job?.title ||
                                                                        'Job application'}
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-600">
                                                                    Applied{' '}
                                                                    {formatDate(
                                                                        application.appliedAt ||
                                                                        application.createdAt
                                                                    )}
                                                                </p>

                                                            </div>

                                                        </div>

                                                        <div className="flex items-center gap-3 sm:justify-end">

                                                            <div className="text-right">

                                                                <p className="text-xl font-bold text-blue-400">
                                                                    {application.matchScore ??
                                                                        0}%
                                                                </p>

                                                                <p className="text-[10px] uppercase tracking-wider text-slate-600">
                                                                    Match
                                                                </p>

                                                            </div>

                                                            <StatusBadge
                                                                status={
                                                                    application.status
                                                                }
                                                            />

                                                        </div>

                                                    </div>
                                                );
                                            }
                                        )

                                    )}

                                </div>
                            </div>

                            {/* JOB POSTINGS */}

                            <div className="overflow-hidden rounded-[24px] border border-slate-800 bg-[#090f1f]">

                                <div className="border-b border-slate-800/80 px-6 py-5">

                                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600">
                                        Your opportunities
                                    </p>

                                    <h2 className="mt-1 text-lg font-semibold">
                                        Job postings
                                    </h2>

                                </div>

                                <div className="space-y-4 p-5">

                                    {jobs.length === 0 ? (

                                        <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">

                                            <p className="text-sm text-slate-500">
                                                You haven't posted any jobs yet.
                                            </p>

                                            <button
                                                onClick={() =>
                                                    goTo(
                                                        '/recruiter/jobs/create'
                                                    )
                                                }
                                                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium transition hover:bg-blue-500"
                                            >
                                                Create your first job
                                            </button>

                                        </div>

                                    ) : (

                                        jobs.map((job) => {

                                            const stats =
                                                getJobStats(job);

                                            const jobId =
                                                job._id || job.id;

                                            return (
                                                <div
                                                    key={jobId}
                                                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
                                                >

                                                    <div className="flex items-start justify-between gap-4">

                                                        <div className="flex items-start gap-3">

                                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-lg font-bold text-blue-400">
                                                                {job.company?.[0] ||
                                                                    'S'}
                                                            </div>

                                                            <div>

                                                                <h3 className="font-semibold">
                                                                    {job.title}
                                                                </h3>

                                                                <p className="mt-1 text-sm text-slate-500">
                                                                    {job.company}
                                                                </p>

                                                            </div>

                                                        </div>

                                                        <span
                                                            className={`rounded-full px-3 py-1 text-[11px] font-medium ${job.status ===
                                                                    'open'
                                                                    ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                                                    : 'border border-slate-700 bg-slate-800 text-slate-400'
                                                                }`}
                                                        >
                                                            {job.status}
                                                        </span>

                                                    </div>

                                                    <div className="mt-5 grid grid-cols-2 gap-3">

                                                        <div className="rounded-xl bg-slate-900/80 p-3">

                                                            <p className="text-[10px] uppercase tracking-wider text-slate-600">
                                                                Applicants
                                                            </p>

                                                            <p className="mt-1 text-lg font-semibold">
                                                                {stats.totalApplicants ??
                                                                    0}
                                                            </p>

                                                        </div>

                                                        <div className="rounded-xl bg-slate-900/80 p-3">

                                                            <p className="text-[10px] uppercase tracking-wider text-slate-600">
                                                                Avg. match
                                                            </p>

                                                            <p className="mt-1 text-lg font-semibold text-blue-400">
                                                                {stats.averageMatchScore ??
                                                                    0}
                                                                %
                                                            </p>

                                                        </div>

                                                    </div>

                                                    <button
                                                        onClick={() =>
                                                            goTo(
                                                                `/recruiter/jobs/${jobId}`
                                                            )
                                                        }
                                                        className="mt-4 w-full rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
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

                    </div>
                </main>
            </div>
        </div>
    );
}

/*
 * SIDEBAR NAV ITEM
 */

function NavItem({
    icon,
    label,
    href,
    active = false,
}) {
    const handleClick = () => {
        window.location.href = href;
    };

    return (
        <button
            onClick={handleClick}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${active
                    ? 'bg-blue-500/10 text-blue-300'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
        >
            <span
                className={`w-5 text-center ${active
                        ? 'text-blue-400'
                        : 'text-slate-600'
                    }`}
            >
                {icon}
            </span>

            {label}
        </button>
    );
}

/*
 * STAT CARD
 */

function StatCard({
    label,
    value,
    description,
    icon,
    highlight = false,
}) {
    return (
        <div className="rounded-[22px] border border-slate-800 bg-[#090f1f] p-6">

            <div className="flex items-start justify-between">

                <div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                        {label}
                    </p>

                    <p
                        className={`mt-4 text-3xl font-bold tracking-tight ${highlight
                                ? 'text-blue-400'
                                : 'text-white'
                            }`}
                    >
                        {value}
                    </p>

                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-sm text-slate-500">
                    {icon}
                </div>

            </div>

            <p className="mt-5 text-xs text-slate-600">
                {description}
            </p>

        </div>
    );
}

/*
 * APPLICATION STATUS
 */

function StatusBadge({ status }) {
    const styles = {
        applied:
            'border-blue-500/20 bg-blue-500/10 text-blue-400',

        shortlisted:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',

        interview:
            'border-purple-500/20 bg-purple-500/10 text-purple-400',

        rejected:
            'border-red-500/20 bg-red-500/10 text-red-400',

        hired:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    };

    return (
        <span
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${styles[status] ||
                'border-slate-700 bg-slate-800 text-slate-400'
                }`}
        >
            {status || 'applied'}
        </span>
    );
}

function PipelineStage({ label, value, total, icon }) {
    const percentage =
        total > 0
            ? Math.min(100, (value / total) * 100)
            : 0;

    return (
        <div className="bg-[#090f1f] px-6 py-6">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                    {label}
                </p>

                <span className="text-sm text-slate-500">
                    {icon}
                </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-white">
                {value}
            </p>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export default RecruiterDashboard;