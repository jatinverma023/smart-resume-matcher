import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { getMyJobs } from '../api/jobs';
import {
    getJobApplicants,
    updateApplicationStatus,
} from '../api/applications';

function Candidates() {
    const { token } = useAuth();

    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applications, setApplications] = useState([]);

    const [loadingJobs, setLoadingJobs] = useState(true);
    const [loadingApplicants, setLoadingApplicants] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);

    const [error, setError] = useState('');

    useEffect(() => {
        const loadJobs = async () => {
            try {
                setLoadingJobs(true);
                setError('');

                const data = await getMyJobs(token);

                setJobs(data.jobs || []);

                if (data.jobs?.length > 0) {
                    setSelectedJob(data.jobs[0]);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoadingJobs(false);
            }
        };

        loadJobs();
    }, [token]);

    useEffect(() => {
        if (!selectedJob) {
            setApplications([]);
            return;
        }

        const loadApplicants = async () => {
            try {
                setLoadingApplicants(true);
                setError('');

                const data = await getJobApplicants(
                    token,
                    selectedJob._id
                );

                setApplications(data.applications || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoadingApplicants(false);
            }
        };

        loadApplicants();
    }, [token, selectedJob]);

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
            setError(err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const getScoreClass = (score) => {
        if (score >= 80) {
            return 'text-emerald-400';
        }

        if (score >= 60) {
            return 'text-blue-400';
        }

        if (score >= 40) {
            return 'text-amber-400';
        }

        return 'text-red-400';
    };

    const getStatusClass = (status) => {
        const classes = {
            applied:
                'border-blue-500/30 bg-blue-500/10 text-blue-400',

            shortlisted:
                'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',

            interview:
                'border-purple-500/30 bg-purple-500/10 text-purple-400',

            hired:
                'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',

            rejected:
                'border-red-500/30 bg-red-500/10 text-red-400',
        };

        return (
            classes[status] ||
            'border-slate-700 bg-slate-800 text-slate-300'
        );
    };

    const averageMatch =
        applications.length > 0
            ? Math.round(
                applications.reduce(
                    (sum, application) =>
                        sum + (application.matchScore || 0),
                    0
                ) / applications.length
            )
            : 0;

    return (
        <div className="min-h-screen bg-[#050914] text-white">
            <main className="mx-auto max-w-7xl px-6 py-10">

                {/* Header */}
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">
                            Candidate intelligence
                        </p>

                        <h1 className="mt-3 text-4xl font-bold tracking-tight">
                            Candidates
                        </h1>

                        <p className="mt-3 max-w-2xl text-slate-400">
                            Review applicants ranked by AI compatibility
                            and manage your hiring pipeline.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-4">
                            <p className="text-xs uppercase tracking-wider text-slate-500">
                                Applicants
                            </p>

                            <p className="mt-1 text-2xl font-bold">
                                {applications.length}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-4">
                            <p className="text-xs uppercase tracking-wider text-slate-500">
                                Avg. match
                            </p>

                            <p className="mt-1 text-2xl font-bold text-blue-400">
                                {averageMatch}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Job selector */}
                <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/50 p-6">

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                Reviewing applications for
                            </p>

                            <h2 className="mt-2 text-xl font-semibold">
                                {selectedJob?.title || 'Select a job'}
                            </h2>

                            {selectedJob && (
                                <p className="mt-1 text-sm text-slate-500">
                                    {selectedJob.company}
                                </p>
                            )}
                        </div>

                        <select
                            value={selectedJob?._id || ''}
                            onChange={(event) => {
                                const job = jobs.find(
                                    (item) =>
                                        item._id === event.target.value
                                );

                                setSelectedJob(job || null);
                            }}
                            disabled={loadingJobs || jobs.length === 0}
                            className="min-w-[280px] rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-blue-500"
                        >
                            {jobs.length === 0 && (
                                <option value="">
                                    No jobs available
                                </option>
                            )}

                            {jobs.map((job) => (
                                <option
                                    key={job._id}
                                    value={job._id}
                                >
                                    {job.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* Error */}
                {error && (
                    <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Applicants */}
                <section className="mt-8">

                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                                Latest intelligence
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold">
                                Applicant pipeline
                            </h2>
                        </div>

                        {applications.length > 0 && (
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                                AI analyzed
                            </span>
                        )}
                    </div>

                    {loadingApplicants ? (
                        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center">
                            <p className="text-slate-400">
                                Loading candidate intelligence...
                            </p>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
                            <p className="text-lg font-medium">
                                No applicants yet
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                                Applications for this opportunity will
                                appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">

                            {applications.map(
                                (application, index) => {
                                    const candidate =
                                        application.candidate;

                                    const resume =
                                        application.resume;

                                    return (
                                        <article
                                            key={application._id}
                                            className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700"
                                        >

                                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                                                {/* Candidate */}
                                                <div className="flex gap-4">

                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-sm font-bold text-blue-400">
                                                        {candidate?.name
                                                            ?.split(' ')
                                                            .map(
                                                                (part) =>
                                                                    part[0]
                                                            )
                                                            .join('')
                                                            .slice(
                                                                0,
                                                                2
                                                            )
                                                            .toUpperCase() ||
                                                            'C'}
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-lg font-semibold">
                                                                {candidate?.name ||
                                                                    'Unknown candidate'}
                                                            </h3>

                                                            {index ===
                                                                0 && (
                                                                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                                                                        Top match
                                                                    </span>
                                                                )}
                                                        </div>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {candidate?.email}
                                                        </p>

                                                        {resume?.fileName && (
                                                            <p className="mt-3 text-xs text-slate-600">
                                                                Resume ·{' '}
                                                                {resume.fileName}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Score */}
                                                <div className="flex items-center gap-5">

                                                    <div className="text-right">
                                                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                                            AI match
                                                        </p>

                                                        <p
                                                            className={`mt-1 text-3xl font-bold ${getScoreClass(
                                                                application.matchScore
                                                            )}`}
                                                        >
                                                            {application.matchScore ??
                                                                0}
                                                            %
                                                        </p>
                                                    </div>

                                                    <div
                                                        className={`flex h-14 w-14 items-center justify-center rounded-full border-4 border-slate-800 ${getScoreClass(
                                                            application.matchScore
                                                        )}`}
                                                    >
                                                        <span className="text-xs font-semibold">
                                                            {application.matchScore ??
                                                                0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Skills */}
                                            {resume?.skills?.length >
                                                0 && (
                                                    <div className="mt-6 border-t border-slate-800 pt-5">

                                                        <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">
                                                            Detected skills
                                                        </p>

                                                        <div className="flex flex-wrap gap-2">
                                                            {resume.skills.map(
                                                                (
                                                                    skill
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            skill._id ||
                                                                            skill.name
                                                                        }
                                                                        className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300"
                                                                    >
                                                                        {
                                                                            skill.name
                                                                        }
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Footer */}
                                            <div className="mt-6 flex flex-col gap-4 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">

                                                <div>
                                                    <p className="text-xs text-slate-600">
                                                        Applied{' '}
                                                        {application.appliedAt
                                                            ? new Date(
                                                                application.appliedAt
                                                            ).toLocaleDateString()
                                                            : '—'}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3">

                                                    <span
                                                        className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${getStatusClass(
                                                            application.status
                                                        )}`}
                                                    >
                                                        {application.status}
                                                    </span>

                                                    <select
                                                        value={
                                                            application.status
                                                        }
                                                        disabled={
                                                            updatingId ===
                                                            application._id
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleStatusChange(
                                                                application._id,
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500"
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
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default Candidates;