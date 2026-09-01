import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { getMyJobs } from '../api/jobs';

function RecruiterJobs() {
    const { user, token } = useAuth();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadJobs = async () => {
            if (!token) return;

            try {
                setLoading(true);
                setError('');

                const data = await getMyJobs(token);

                setJobs(data.jobs || []);
            } catch (err) {
                console.error('Recruiter jobs error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadJobs();
    }, [token]);

    const openJobs = jobs.filter(
        (job) => job.status === 'open'
    ).length;

    const draftJobs = jobs.filter(
        (job) => job.status === 'draft'
    ).length;

    const closedJobs = jobs.filter(
        (job) => job.status !== 'open' && job.status !== 'draft'
    ).length;

    const formatDate = (date) => {
        if (!date) return '';

        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handlePostJob = () => {
        window.location.href = '/recruiter/jobs/create';
    };

    const handleManageJob = (jobId) => {
        window.location.href = `/recruiter/jobs/${jobId}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050814] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />

                    <p className="mt-4 text-sm text-slate-400">
                        Loading job listings...
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

                    <div className="flex h-[104px] items-center border-b border-slate-800/70 px-8">
                        <button
                            onClick={() => {
                                window.location.href = '/';
                            }}
                            className="flex items-center gap-3"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-lg font-bold shadow-lg shadow-blue-500/20">
                                S
                            </div>

                            <div className="text-left">
                                <p className="text-sm font-bold tracking-tight">
                                    Smart Resume
                                </p>

                                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                                    Matcher
                                </p>
                            </div>
                        </button>
                    </div>

                    <div className="flex-1 px-4 py-8">

                        <p className="px-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                            Workspace
                        </p>

                        <nav className="mt-4 space-y-2">

                            <NavItem
                                icon="◆"
                                label="Dashboard"
                                href="/"
                            />

                            <NavItem
                                active
                                icon="○"
                                label="Job listings"
                                href="/recruiter/jobs"
                            />

                            <NavItem
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
                                icon="⚙"
                                label="Settings"
                                href="/settings"
                            />
                        </nav>
                    </div>

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
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    window.location.href = '/';
                                }}
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

                    <header className="flex min-h-[104px] items-center justify-between border-b border-slate-800/70 px-6 lg:px-10">

                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-400">
                                Recruiter workspace
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage your opportunities
                            </p>
                        </div>

                        <button
                            onClick={handlePostJob}
                            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
                        >
                            + Post job
                        </button>
                    </header>

                    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10 lg:py-10">

                        {/* PAGE HEADER */}

                        <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">

                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-400">
                                    Opportunity management
                                </p>

                                <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                                    Job listings
                                </h1>

                                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                                    Create, manage, and monitor the opportunities
                                    you're hiring for.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">

                                <MiniStat
                                    label="Total"
                                    value={jobs.length}
                                />

                                <MiniStat
                                    label="Open"
                                    value={openJobs}
                                    highlight
                                />

                                <MiniStat
                                    label="Drafts"
                                    value={draftJobs}
                                />

                            </div>
                        </section>

                        {/* ERROR */}

                        {error && (
                            <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        {/* JOB LIST */}

                        <section className="mt-8">

                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600">
                                        Your opportunities
                                    </p>

                                    <h2 className="mt-1 text-xl font-semibold">
                                        All job postings
                                    </h2>
                                </div>

                                <span className="text-sm text-slate-500">
                                    {jobs.length} {jobs.length === 1 ? 'posting' : 'postings'}
                                </span>
                            </div>

                            {jobs.length === 0 ? (

                                <div className="rounded-[24px] border border-dashed border-slate-700 bg-[#090f1f] px-6 py-16 text-center">

                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl text-blue-400">
                                        +
                                    </div>

                                    <h3 className="mt-5 text-lg font-semibold">
                                        No job postings yet
                                    </h3>

                                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                        Create your first opportunity and start
                                        building your candidate pipeline.
                                    </p>

                                    <button
                                        onClick={handlePostJob}
                                        className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
                                    >
                                        + Create your first job
                                    </button>

                                </div>

                            ) : (

                                <div className="space-y-4">

                                    {jobs.map((job) => (
                                        <JobCard
                                            key={job._id}
                                            job={job}
                                            onManage={handleManageJob}
                                            formatDate={formatDate}
                                        />
                                    ))}

                                </div>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}

function JobCard({
    job,
    onManage,
    formatDate,
}) {
    const isOpen = job.status === 'open';

    return (
        <article className="group overflow-hidden rounded-[24px] border border-slate-800 bg-[#090f1f] transition hover:border-slate-700">

            <div className="p-6 lg:p-7">

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                    <div className="flex items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-lg font-bold text-blue-400">
                            {job.company?.[0]?.toUpperCase() || 'S'}
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-3">

                                <h3 className="text-xl font-semibold tracking-tight">
                                    {job.title}
                                </h3>

                                <span
                                    className={
                                        isOpen
                                            ? 'rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400'
                                            : 'rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-400'
                                    }
                                >
                                    {job.status}
                                </span>

                            </div>

                            <p className="mt-2 text-sm text-slate-500">
                                {job.company}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => onManage(job._id)}
                        className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
                    >
                        Manage job →
                    </button>
                </div>

                <p className="mt-6 max-w-4xl text-sm leading-6 text-slate-400">
                    {job.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">

                    {(job.requiredSkills || []).map(
                        (skill, index) => (
                            <span
                                key={`${skill}-${index}`}
                                className="rounded-lg border border-blue-500/15 bg-blue-500/5 px-3 py-1.5 text-xs font-medium text-blue-300"
                            >
                                {skill}
                            </span>
                        )
                    )}

                </div>

                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-800/80 pt-5 text-xs text-slate-500">

                    <span>
                        📍 {job.location || 'Location not specified'}
                    </span>

                    <span>
                        💼 {job.employmentType || 'Not specified'}
                    </span>

                    <span>
                        ◇ {job.experienceLevel || 'Not specified'}
                    </span>

                    <span>
                        Posted {formatDate(job.createdAt)}
                    </span>

                </div>
            </div>
        </article>
    );
}

function NavItem({
    icon,
    label,
    href,
    active = false,
}) {
    return (
        <button
            onClick={() => {
                window.location.href = href;
            }}
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

function MiniStat({
    label,
    value,
    highlight = false,
}) {
    return (
        <div className="min-w-[82px] rounded-2xl border border-slate-800 bg-[#090f1f] px-4 py-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                {label}
            </p>

            <p
                className={`mt-1 text-xl font-bold ${highlight
                        ? 'text-blue-400'
                        : 'text-white'
                    }`}
            >
                {value}
            </p>
        </div>
    );
}

function getInitials(name = '') {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

export default RecruiterJobs;