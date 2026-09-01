import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

import { getJobStats } from '../api/jobs';
import {
    getJobApplicants,
    updateApplicationStatus,
} from '../api/applications';

function ManageJob() {
    const { user, token } = useAuth();

    const jobId = window.location.pathname.split('/').pop();

    const [stats, setStats] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            const [statsData, applicantsData] =
                await Promise.all([
                    getJobStats(token, jobId),
                    getJobApplicants(token, jobId),
                ]);

            setStats(statsData);
            setApplications(applicantsData.applications || []);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && jobId) {
            loadData();
        }
    }, [token, jobId]);

    const averageMatch = useMemo(() => {
        if (!applications.length) return 0;

        const scores = applications
            .map((application) => application.matchScore)
            .filter((score) => typeof score === 'number');

        if (!scores.length) return 0;

        return Math.round(
            scores.reduce((sum, score) => sum + score, 0) /
            scores.length
        );
    }, [applications]);

    const shortlistedCount = applications.filter(
        (application) =>
            application.status === 'shortlisted'
    ).length;

    const hiredCount = applications.filter(
        (application) =>
            application.status === 'hired'
    ).length;

    const handleStatusChange = async (
        applicationId,
        status
    ) => {
        try {
            setUpdating(applicationId);

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

            await loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050814] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

                    <p className="mt-4 text-sm text-slate-500">
                        Loading hiring intelligence...
                    </p>
                </div>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="min-h-screen bg-[#050814] text-white p-10">
                <div className="mx-auto max-w-4xl rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                    <p className="text-red-300">
                        {error}
                    </p>

                    <button
                        onClick={() => {
                            window.location.href =
                                '/recruiter/jobs';
                        }}
                        className="mt-5 rounded-xl border border-slate-700 px-5 py-3 text-sm"
                    >
                        ← Back to jobs
                    </button>
                </div>
            </div>
        );
    }

    const job = stats?.job;

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
                                <p className="text-sm font-bold">
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
                                label="Dashboard"
                                icon="◆"
                                href="/"
                            />

                            <NavItem
                                label="Job listings"
                                icon="○"
                                href="/recruiter/jobs"
                                active
                            />

                            <NavItem
                                label="Candidates"
                                icon="□"
                                href="/candidates"
                            />

                        </nav>

                        <p className="mt-10 px-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                            Account
                        </p>

                        <nav className="mt-4">
                            <NavItem
                                label="Settings"
                                icon="⚙"
                                href="/settings"
                            />
                        </nav>

                    </div>

                    <div className="border-t border-slate-800/70 p-5">
                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold">
                                {getInitials(user?.name)}
                            </div>

                            <div>
                                <p className="text-sm font-medium">
                                    {user?.name}
                                </p>

                                <p className="text-xs text-slate-500">
                                    Recruiter
                                </p>
                            </div>

                        </div>
                    </div>
                </aside>

                {/* MAIN */}

                <main className="min-w-0 flex-1">

                    <header className="flex min-h-[104px] items-center justify-between border-b border-slate-800/70 px-6 lg:px-10">

                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-400">
                                Candidate intelligence
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                AI-ranked hiring pipeline
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                window.location.href =
                                    '/recruiter/jobs';
                            }}
                            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-900"
                        >
                            ← Job listings
                        </button>

                    </header>

                    <div className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">

                        {/* JOB HEADER */}

                        <section className="rounded-[26px] border border-slate-800 bg-[#090f1f] p-7 lg:p-9">

                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                                <div>

                                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-400">
                                        Reviewing applications for
                                    </p>

                                    <h1 className="mt-3 text-3xl font-bold tracking-tight">
                                        {job?.title}
                                    </h1>

                                    <p className="mt-2 text-base text-slate-400">
                                        {job?.company}
                                    </p>

                                </div>

                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400">
                                        AI hiring pipeline
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-emerald-300">
                                        {applications.length} candidate
                                        {applications.length !== 1
                                            ? 's'
                                            : ''}{' '}
                                        analyzed
                                    </p>
                                </div>

                            </div>

                        </section>

                        {/* STATS */}

                        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                            <StatCard
                                label="Applicants"
                                value={applications.length}
                                description="Candidates in pipeline"
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
                                value={shortlistedCount}
                                description="Candidates progressing"
                                icon="✓"
                            />

                            <StatCard
                                label="Hired"
                                value={hiredCount}
                                description="Successful placements"
                                icon="◆"
                            />

                        </div>

                        {/* APPLICANTS */}

                        <div className="mt-10">

                            <div className="flex items-end justify-between">

                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                                        Latest intelligence
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold">
                                        Applicant pipeline
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Candidates ranked by AI compatibility.
                                    </p>
                                </div>

                                <div className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-xs font-medium text-emerald-400 sm:block">
                                    AI analyzed
                                </div>

                            </div>

                            {error && (
                                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
                                    {error}
                                </div>
                            )}

                            <div className="mt-6 space-y-4">

                                {applications.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-800 bg-[#090f1f] p-12 text-center">
                                        <p className="text-lg font-semibold">
                                            No applicants yet
                                        </p>

                                        <p className="mt-2 text-sm text-slate-500">
                                            Candidates who apply to this job will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    applications.map(
                                        (application, index) => (
                                            <ApplicantCard
                                                key={application._id}
                                                application={application}
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
                                    )
                                )}

                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
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
        typeof application.matchScore === 'number'
            ? application.matchScore
            : 0;

    const skills =
        resume.skills || [];

    return (
        <article className="rounded-[24px] border border-slate-800 bg-[#090f1f] p-6 transition hover:border-slate-700">

            {/* TOP */}

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex min-w-0 items-center gap-4">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-sm font-bold text-blue-400">
                        {getInitials(candidate.name)}
                    </div>

                    <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                            <h3 className="text-lg font-bold">
                                {candidate.name || 'Candidate'}
                            </h3>

                            {index === 0 && (
                                <span className="rounded-full border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                                    Top match
                                </span>
                            )}

                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                            {candidate.email}
                        </p>

                        <p className="mt-2 text-xs text-slate-600">
                            Resume · {resume.fileName || 'Resume'}
                        </p>

                    </div>
                </div>

                <div className="flex items-center gap-5">

                    <div className="text-right">

                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                            AI match
                        </p>

                        <p className="mt-1 text-3xl font-bold text-blue-400">
                            {score}%
                        </p>

                    </div>

                    <div
                        className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-slate-800 text-sm font-semibold text-emerald-400"
                        style={{
                            background: `conic-gradient(#3b82f6 ${score * 3.6}deg, transparent 0deg)`,
                        }}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#090f1f]">
                            {score}
                        </div>
                    </div>

                </div>

            </div>

            {/* DIVIDER */}

            <div className="my-6 border-t border-slate-800" />

            {/* SKILLS */}

            <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Detected skills
                </p>

                <div className="mt-3 flex flex-wrap gap-2">

                    {skills.length > 0 ? (
                        skills.map((skill, index) => {
                            const skillName =
                                typeof skill === 'string'
                                    ? skill
                                    : skill?.name || skill?.skill || 'Unknown skill';

                            return (
                                <span
                                    key={skill?._id || `${skillName}-${index}`}
                                    className="rounded-lg border border-slate-700 bg-[#050814] px-3 py-1.5 text-xs text-slate-300"
                                >
                                    {skillName}
                                </span>
                            );
                        })
                    ) : (
                        <span className="text-sm text-slate-600">
                            No extracted skills
                        </span>
                    )}

                </div>

            </div>

            {/* BOTTOM */}

            <div className="mt-6 flex flex-col gap-4 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-xs text-slate-600">
                    Applied{' '}
                    {formatDate(application.appliedAt)}
                </p>

                <div className="flex items-center gap-3">

                    <span
                        className={`rounded-full px-3 py-2 text-xs font-semibold ${getStatusStyle(
                            application.status
                        )
                            }`}
                    >
                        {capitalize(
                            application.status
                        )}
                    </span>

                    <select
                        value={application.status}
                        disabled={updating}
                        onChange={(event) =>
                            onStatusChange(
                                application._id,
                                event.target.value
                            )
                        }
                        className="rounded-xl border border-slate-700 bg-[#050814] px-4 py-2.5 text-xs font-medium text-slate-300 outline-none focus:border-blue-500 disabled:opacity-50"
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

function StatCard({
    label,
    value,
    description,
    icon,
    highlight = false,
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-[#090f1f] p-6">

            <div className="flex items-start justify-between">

                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                        {label}
                    </p>

                    <p
                        className={`mt-3 text-3xl font-bold ${highlight
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

function NavItem({
    label,
    icon,
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
                className={
                    active
                        ? 'text-blue-400'
                        : 'text-slate-600'
                }
            >
                {icon}
            </span>

            {label}
        </button>
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

function capitalize(value = '') {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(date) {
    if (!date) return '—';

    return new Date(date).toLocaleDateString(
        'en-IN',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    );
}

function getStatusStyle(status) {
    if (status === 'shortlisted') {
        return 'border border-emerald-500/20 bg-emerald-500/5 text-emerald-400';
    }

    if (status === 'interview') {
        return 'border border-blue-500/20 bg-blue-500/5 text-blue-400';
    }

    if (status === 'hired') {
        return 'border border-purple-500/20 bg-purple-500/5 text-purple-400';
    }

    if (status === 'rejected') {
        return 'border border-red-500/20 bg-red-500/5 text-red-400';
    }

    return 'border border-slate-700 bg-slate-900 text-slate-400';
}

export default ManageJob;