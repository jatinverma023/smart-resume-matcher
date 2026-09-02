import { useEffect, useMemo, useState } from 'react';

import { getJobs } from '../api/jobs';
import { EmptyState, WorkspaceShell } from '../components/WorkspaceShell';
import { useAuth } from '../context/AuthContext';

function getSkillName(skill) {
    return typeof skill === 'string' ? skill : skill?.name || '';
}

function Jobs() {
    const { token } = useAuth();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [location, setLocation] = useState('all');
    const [selectedJobId, setSelectedJobId] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadJobs() {
            try {
                setLoading(true);
                setError('');

                const data = await getJobs(token);

                if (!cancelled) {
                    setJobs(data.jobs ?? []);
                }
            } catch (requestError) {
                if (!cancelled) {
                    setError(requestError.message || 'Unable to load jobs');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        if (token) {
            void loadJobs();
        } else {
            setLoading(false);
        }

        return () => {
            cancelled = true;
        };
    }, [token]);

    const locations = useMemo(() => {
        const uniqueLocations = [
            ...new Set(
                jobs
                    .map((job) => job.location)
                    .filter(Boolean)
            ),
        ];

        return ['all', ...uniqueLocations];
    }, [jobs]);

    const filteredJobs = useMemo(() => {
        const query = search.trim().toLowerCase();

        return jobs.filter((job) => {
            const requiredSkills = (job.requiredSkills ?? [])
                .map(getSkillName)
                .filter(Boolean);

            const preferredSkills = (job.preferredSkills ?? [])
                .map(getSkillName)
                .filter(Boolean);

            const matchesSearch =
                !query ||
                job.title?.toLowerCase().includes(query) ||
                job.company?.toLowerCase().includes(query) ||
                job.description?.toLowerCase().includes(query) ||
                requiredSkills.some((skill) =>
                    skill.toLowerCase().includes(query)
                ) ||
                preferredSkills.some((skill) =>
                    skill.toLowerCase().includes(query)
                );

            const matchesLocation =
                location === 'all' || job.location === location;

            return matchesSearch && matchesLocation;
        });
    }, [jobs, location, search]);

    const selectedJob =
        filteredJobs.find((job) => job._id === selectedJobId) ??
        filteredJobs[0] ??
        null;

    useEffect(() => {
        if (
            filteredJobs.length > 0 &&
            !filteredJobs.some((job) => job._id === selectedJobId)
        ) {
            setSelectedJobId(filteredJobs[0]._id);
        }

        if (!filteredJobs.length) {
            setSelectedJobId('');
        }
    }, [filteredJobs, selectedJobId]);

    const openJob = (jobId) => {
        window.location.href = `/jobs/${jobId}`;
    };

    const goToApplications = () => {
        window.location.href = '/applications';
    };

    return (
        <WorkspaceShell
            title="Discover jobs"
            subtitle="Explore open opportunities and preview the skills each role needs."
            action={
                <button
                    className="secondary-light-button"
                    type="button"
                    onClick={goToApplications}
                >
                    My applications
                </button>
            }
        >
            <section
                className="light-filter-bar"
                aria-label="Job filters"
            >
                <div className="filter-field-wrap">
                    <span className="filter-field-icon" aria-hidden="true">
                        ⌕
                    </span>

                    <input
                        className="light-field"
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by title, skill, company…"
                        aria-label="Search jobs"
                    />
                </div>

                <select
                    className="light-field light-select"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    aria-label="Filter by location"
                >
                    {locations.map((item) => (
                        <option key={item} value={item}>
                            {item === 'all' ? 'All locations' : item}
                        </option>
                    ))}
                </select>
            </section>

            {!loading && !error && (
                <div className="jobs-result-summary">
                    <span>
                        {filteredJobs.length}{' '}
                        {filteredJobs.length === 1 ? 'opportunity' : 'opportunities'}
                    </span>

                    {(search || location !== 'all') && (
                        <button
                            className="quiet-light-button"
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setLocation('all');
                            }}
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {loading ? (
                <div className="light-loading-state jobs-state">
                    <span
                        className="light-loading-spinner"
                        aria-hidden="true"
                    />

                    <h2>Finding open opportunities</h2>

                    <p>
                        Loading the latest roles for you.
                    </p>
                </div>
            ) : error ? (
                <div className="light-error-state jobs-state">
                    <h2>We could not load jobs</h2>

                    <p>{error}</p>

                    <button
                        className="secondary-light-button"
                        type="button"
                        onClick={() => window.location.reload()}
                    >
                        Try again
                    </button>
                </div>
            ) : !filteredJobs.length ? (
                <div className="jobs-state">
                    <EmptyState
                        title="No jobs found"
                        detail="Try changing your search terms or location filter."
                        action={
                            search || location !== 'all' ? (
                                <button
                                    className="primary-light-button"
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        setLocation('all');
                                    }}
                                >
                                    Clear filters
                                </button>
                            ) : null
                        }
                    />
                </div>
            ) : (
                <section className="job-discovery-grid">
                    <div
                        className="job-list"
                        aria-label="Available jobs"
                    >
                        {filteredJobs.map((job) => {
                            const requiredSkills = (
                                job.requiredSkills ?? []
                            )
                                .map(getSkillName)
                                .filter(Boolean);

                            const preferredSkills = (
                                job.preferredSkills ?? []
                            )
                                .map(getSkillName)
                                .filter(Boolean);

                            const isSelected =
                                selectedJob?._id === job._id;

                            return (
                                <button
                                    className={`job-card ${isSelected ? 'selected' : ''
                                        }`}
                                    type="button"
                                    key={job._id}
                                    onClick={() =>
                                        setSelectedJobId(job._id)
                                    }
                                >
                                    <span className="company-initial">
                                        {job.company
                                            ?.charAt(0)
                                            ?.toUpperCase() || 'J'}
                                    </span>

                                    <span className="job-card-content">
                                        <strong>
                                            {job.title || 'Untitled role'}
                                        </strong>

                                        <span>
                                            {job.company || 'Company'}
                                        </span>

                                        <span className="job-card-meta">
                                            {job.location || 'Remote'} ·{' '}
                                            {job.employmentType ||
                                                'Full-time'}
                                        </span>

                                        {requiredSkills.length > 0 && (
                                            <span className="job-card-skills">
                                                {requiredSkills
                                                    .slice(0, 3)
                                                    .map((skill) => (
                                                        <span
                                                            className="mini-skill-chip"
                                                            key={skill}
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}

                                                {requiredSkills.length > 3 && (
                                                    <span className="mini-skill-chip">
                                                        +
                                                        {requiredSkills.length -
                                                            3}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </span>

                                    <span
                                        className="job-card-arrow"
                                        aria-hidden="true"
                                    >
                                        ›
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {selectedJob && (
                        <article className="light-panel job-detail-panel">
                            <div className="job-detail-heading">
                                <div>
                                    <span className="eyebrow-text">
                                        OPEN OPPORTUNITY
                                    </span>

                                    <h2>
                                        {selectedJob.title ||
                                            'Untitled role'}
                                    </h2>

                                    <p>
                                        {selectedJob.company ||
                                            'Company'}
                                    </p>
                                </div>

                                <span className="open-job-badge">
                                    Open role
                                </span>
                            </div>

                            <div className="job-detail-meta">
                                <span>
                                    <b aria-hidden="true">LOC</b>
                                    {selectedJob.location || 'Remote'}
                                </span>

                                <span>
                                    <b aria-hidden="true">TYPE</b>
                                    {selectedJob.employmentType || 'Full-time'}
                                </span>

                                <span>
                                    <b aria-hidden="true">EXP</b>
                                    {selectedJob.experienceLevel || 'Any level'}
                                </span>
                            </div>

                            {selectedJob.description && (
                                <section className="detail-section">
                                    <h3>About the role</h3>

                                    <p className="job-description">
                                        {selectedJob.description}
                                    </p>
                                </section>
                            )}

                            <section className="detail-section">
                                <div className="detail-section-heading">
                                    <h3>Required skills</h3>

                                    <span>
                                        {(
                                            selectedJob.requiredSkills ??
                                            []
                                        ).length}{' '}
                                        skills
                                    </span>
                                </div>

                                <div className="skill-chip-wrap">
                                    {(
                                        selectedJob.requiredSkills ?? []
                                    ).length ? (
                                        selectedJob.requiredSkills
                                            .map(getSkillName)
                                            .filter(Boolean)
                                            .map((skill) => (
                                                <span
                                                    className="skill-chip"
                                                    key={skill}
                                                >
                                                    ✓ {skill}
                                                </span>
                                            ))
                                    ) : (
                                        <span className="detail-muted">
                                            No required skills listed.
                                        </span>
                                    )}
                                </div>
                            </section>

                            {(
                                selectedJob.preferredSkills ?? []
                            ).length > 0 && (
                                    <section className="detail-section">
                                        <div className="detail-section-heading">
                                            <h3>Preferred skills</h3>

                                            <span>
                                                {
                                                    selectedJob
                                                        .preferredSkills
                                                        .length
                                                }{' '}
                                                skills
                                            </span>
                                        </div>

                                        <div className="skill-chip-wrap">
                                            {selectedJob.preferredSkills
                                                .map(getSkillName)
                                                .filter(Boolean)
                                                .map((skill) => (
                                                    <span
                                                        className="skill-chip optional"
                                                        key={skill}
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                        </div>
                                    </section>
                                )}

                            <button
                                className="primary-light-button full-width-action"
                                type="button"
                                onClick={() =>
                                    openJob(selectedJob._id)
                                }
                            >
                                Check your match →
                            </button>
                        </article>
                    )}
                </section>
            )}
        </WorkspaceShell>
    );
}

export default Jobs;