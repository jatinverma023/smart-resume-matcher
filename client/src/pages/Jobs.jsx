import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getJobs } from '../api/jobs';

function Jobs() {
    const { token } = useAuth();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [location, setLocation] = useState('all');

    useEffect(() => {
        const loadJobs = async () => {
            try {
                setLoading(true);
                setError('');

                const data = await getJobs(token);
                setJobs(data.jobs || []);
            } catch (err) {
                setError(err.message || 'Unable to load jobs');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            loadJobs();
        }
    }, [token]);

    const locations = useMemo(() => {
        return [
            'all',
            ...new Set(
                jobs
                    .map((job) => job.location)
                    .filter(Boolean)
            ),
        ];
    }, [jobs]);

    const filteredJobs = useMemo(() => {
        const query = search.trim().toLowerCase();

        return jobs.filter((job) => {
            const matchesSearch =
                !query ||
                job.title?.toLowerCase().includes(query) ||
                job.company?.toLowerCase().includes(query) ||
                job.description?.toLowerCase().includes(query) ||
                job.requiredSkills?.some((skill) =>
                    skill.toLowerCase().includes(query)
                );

            const matchesLocation =
                location === 'all' ||
                job.location === location;

            return matchesSearch && matchesLocation;
        });
    }, [jobs, search, location]);

    return (
        <div className="min-h-screen bg-[#050814] text-white">

            <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">

                {/* Header */}
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
                            Opportunity discovery
                        </p>

                        <h1 className="mt-3 text-4xl font-bold tracking-tight">
                            Discover jobs
                        </h1>

                        <p className="mt-3 max-w-2xl text-slate-400">
                            Explore open opportunities and find roles that
                            align with your resume and technical skills.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4">
                        <p className="text-xs uppercase tracking-wider text-slate-500">
                            Open opportunities
                        </p>

                        <p className="mt-1 text-2xl font-semibold">
                            {jobs.length}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">

                    <div className="flex flex-col gap-4 md:flex-row">

                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search jobs, companies, or skills..."
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                            />
                        </div>

                        <select
                            value={location}
                            onChange={(event) =>
                                setLocation(event.target.value)
                            }
                            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500"
                        >
                            {locations.map((item) => (
                                <option
                                    key={item}
                                    value={item}
                                >
                                    {item === 'all'
                                        ? 'All locations'
                                        : item}
                                </option>
                            ))}
                        </select>

                    </div>
                </div>

                {/* Content */}
                <div className="mt-8">

                    {loading && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center">
                            <p className="text-slate-400">
                                Loading opportunities...
                            </p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6">
                            <p className="text-sm text-red-400">
                                {error}
                            </p>
                        </div>
                    )}

                    {!loading &&
                        !error &&
                        filteredJobs.length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center">
                                <p className="text-lg font-semibold">
                                    No jobs found
                                </p>

                                <p className="mt-2 text-sm text-slate-500">
                                    Try changing your search or location
                                    filter.
                                </p>
                            </div>
                        )}

                    {!loading &&
                        !error &&
                        filteredJobs.length > 0 && (
                            <div className="grid gap-5 lg:grid-cols-2">

                                {filteredJobs.map((job) => (
                                    <article
                                        key={job._id}
                                        className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900"
                                    >

                                        <div className="flex items-start justify-between gap-5">

                                            <div className="flex gap-4">

                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-lg font-bold text-blue-400">
                                                    {job.company
                                                        ?.charAt(0)
                                                        ?.toUpperCase() || 'J'}
                                                </div>

                                                <div>
                                                    <h2 className="text-xl font-semibold">
                                                        {job.title}
                                                    </h2>

                                                    <p className="mt-1 text-sm text-slate-400">
                                                        {job.company}
                                                    </p>
                                                </div>

                                            </div>

                                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                                                {job.status || 'open'}
                                            </span>

                                        </div>

                                        <p className="mt-6 line-clamp-3 text-sm leading-6 text-slate-400">
                                            {job.description}
                                        </p>

                                        <div className="mt-5 flex flex-wrap gap-2">

                                            {job.requiredSkills?.map(
                                                (skill) => (
                                                    <span
                                                        key={skill}
                                                        className="rounded-lg border border-blue-500/10 bg-blue-500/5 px-2.5 py-1 text-xs text-blue-300"
                                                    >
                                                        {skill}
                                                    </span>
                                                )
                                            )}

                                        </div>

                                        <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-800 pt-5 text-xs text-slate-500">

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

                                        <button
                                            onClick={() => {
                                                window.location.href = `/jobs/${job._id}`;
                                            }}
                                            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold transition hover:bg-blue-500"
                                        >
                                            View opportunity
                                        </button>

                                    </article>
                                ))}

                            </div>
                        )}

                </div>

            </div>
        </div>
    );
}

export default Jobs;