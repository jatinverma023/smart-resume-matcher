import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    getMyApplications,
} from '../api/applications';

import {
    EmptyState,
    MatchRing,
    StatusPill,
    WorkspaceShell,
} from '../components/WorkspaceShell';

import { useAuth } from '../context/AuthContext';


/*
|--------------------------------------------------------------------------
| Application pipeline
|--------------------------------------------------------------------------
*/

const timelineSteps = [
    'applied',
    'shortlisted',
    'interview',
    'hired',
];


/*
|--------------------------------------------------------------------------
| Status configuration
|--------------------------------------------------------------------------
*/

const statusConfig = {
    applied: {
        label: 'Application submitted',

        description:
            'Your application has been submitted successfully and is waiting for the recruiter to review.',

        next:
            'The recruiter may shortlist your application for the next stage.',

        tone: 'blue',
    },

    shortlisted: {
        label: 'You are shortlisted',

        description:
            'The recruiter has shortlisted your application and moved your profile forward.',

        next:
            'The next step may be an interview or further evaluation.',

        tone: 'green',
    },

    interview: {
        label: 'Interview stage',

        description:
            'Your application has progressed to the interview stage.',

        next:
            'Check your communication channels for interview details or further instructions from the recruiter.',

        tone: 'purple',
    },

    hired: {
        label: 'You are hired',

        description:
            'Congratulations! The recruiter has marked this application as hired.',

        next:
            'Follow the recruiter’s instructions for the next steps and onboarding.',

        tone: 'green',
    },

    rejected: {
        label: 'Application closed',

        description:
            'The recruiter has decided not to progress this application to the next stage.',

        next:
            'Keep exploring other opportunities that match your skills and experience.',

        tone: 'red',
    },
};


/*
|--------------------------------------------------------------------------
| Timeline helpers
|--------------------------------------------------------------------------
*/

function getTimelineState(
    status,
    step
) {
    if (status === 'rejected') {
        return {
            completed:
                step === 'applied',

            current: false,
        };
    }

    const currentIndex =
        timelineSteps.indexOf(
            status
        );

    const stepIndex =
        timelineSteps.indexOf(
            step
        );

    return {
        completed:
            currentIndex !== -1 &&
            stepIndex < currentIndex,

        current:
            currentIndex !== -1 &&
            stepIndex === currentIndex,
    };
}


/*
|--------------------------------------------------------------------------
| Formatting helpers
|--------------------------------------------------------------------------
*/

function formatDate(
    dateValue
) {
    if (!dateValue) {
        return 'Recently applied';
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 'Recently applied';
    }

    return date.toLocaleDateString(
        'en-IN',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    );
}


function formatEmploymentType(
    value
) {
    if (!value) {
        return '';
    }

    return value
        .replace(
            /-/g,
            ' '
        )
        .replace(
            /\b\w/g,
            (letter) =>
                letter.toUpperCase()
        );
}


function formatSkillName(
    skill
) {
    if (
        typeof skill === 'string'
    ) {
        return skill;
    }

    return (
        skill?.name ||
        'Unknown skill'
    );
}


/*
|--------------------------------------------------------------------------
| Main component
|--------------------------------------------------------------------------
*/

function Applications() {
    const { token } =
        useAuth();

    const [
        applications,
        setApplications,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState('');

    const [
        activeFilter,
        setActiveFilter,
    ] = useState('all');


    /*
    |--------------------------------------------------------------------------
    | Navigation
    |--------------------------------------------------------------------------
    */

    const navigate = (
        path
    ) => {
        window.location.href =
            path;
    };


    /*
    |--------------------------------------------------------------------------
    | Load applications
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        let cancelled = false;

        async function loadApplications() {
            try {
                setLoading(true);
                setError('');

                const data =
                    await getMyApplications(
                        token
                    );

                if (!cancelled) {
                    setApplications(
                        data.applications ??
                        []
                    );
                }
            } catch (
                requestError
            ) {
                if (!cancelled) {
                    setError(
                        requestError.message ||
                        'Unable to load applications'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        if (token) {
            void loadApplications();
        } else {
            setLoading(false);
        }

        return () => {
            cancelled = true;
        };
    }, [token]);


    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    const stats =
        useMemo(() => {
            const total =
                applications.length;

            const shortlisted =
                applications.filter(
                    (application) =>
                        application.status ===
                        'shortlisted'
                ).length;

            const interviews =
                applications.filter(
                    (application) =>
                        application.status ===
                        'interview'
                ).length;

            const hired =
                applications.filter(
                    (application) =>
                        application.status ===
                        'hired'
                ).length;

            const rejected =
                applications.filter(
                    (application) =>
                        application.status ===
                        'rejected'
                ).length;

            const active =
                applications.filter(
                    (application) =>
                        ![
                            'rejected',
                            'hired',
                        ].includes(
                            application.status
                        )
                ).length;

            const scores =
                applications
                    .map(
                        (application) =>
                            Number(
                                application.matchScore
                            )
                    )
                    .filter(
                        (score) =>
                            Number.isFinite(
                                score
                            )
                    );

            const averageMatch =
                scores.length
                    ? Math.round(
                        scores.reduce(
                            (
                                sum,
                                score
                            ) =>
                                sum +
                                score,
                            0
                        ) /
                        scores.length
                    )
                    : 0;

            return {
                total,
                shortlisted,
                interviews,
                hired,
                rejected,
                active,
                averageMatch,
            };
        }, [applications]);


    /*
    |--------------------------------------------------------------------------
    | Filtered applications
    |--------------------------------------------------------------------------
    */

    const filteredApplications =
        useMemo(() => {
            if (
                activeFilter ===
                'all'
            ) {
                return applications;
            }

            return applications.filter(
                (application) =>
                    application.status ===
                    activeFilter
            );
        }, [
            applications,
            activeFilter,
        ]);


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <WorkspaceShell
            title="Applications"
            subtitle="Track every opportunity, match score, and hiring-stage update in one place."
            action={
                <button
                    className="primary-light-button"
                    type="button"
                    onClick={() =>
                        navigate('/jobs')
                    }
                >
                    Discover jobs →
                </button>
            }
        >

            {/* =========================================================
                ERROR
               ========================================================= */}

            {error && (
                <div className="ui-message ui-message-error">
                    {error}
                </div>
            )}


            {/* =========================================================
                LOADING
               ========================================================= */}

            {loading ? (
                <div className="light-loading-state">

                    <span
                        className="light-loading-spinner"
                        aria-hidden="true"
                    />

                    <h2>
                        Loading your applications
                    </h2>

                    <p>
                        Gathering your latest
                        application updates.
                    </p>

                </div>
            ) : (
                <>

                    {/* =================================================
                        METRICS
                       ================================================= */}

                    <section className="metrics-grid applications-metrics">

                        <article className="metric-card metric-card-blue">

                            <div className="metric-card-icon">
                                ▣
                            </div>

                            <div className="metric-card-content">

                                <p>
                                    Applications
                                </p>

                                <strong>
                                    {stats.total}
                                </strong>

                                <small>
                                    Total applications
                                </small>

                            </div>

                        </article>


                        <article className="metric-card metric-card-green">

                            <div className="metric-card-icon">
                                ✓
                            </div>

                            <div className="metric-card-content">

                                <p>
                                    Shortlisted
                                </p>

                                <strong>
                                    {stats.shortlisted}
                                </strong>

                                <small>
                                    Recruiter selections
                                </small>

                            </div>

                        </article>


                        <article className="metric-card metric-card-purple">

                            <div className="metric-card-icon">
                                ◇
                            </div>

                            <div className="metric-card-content">

                                <p>
                                    Interviews
                                </p>

                                <strong>
                                    {stats.interviews}
                                </strong>

                                <small>
                                    Interview stage
                                </small>

                            </div>

                        </article>


                        <article className="metric-card metric-card-orange">

                            <div className="metric-card-icon">
                                ✦
                            </div>

                            <div className="metric-card-content">

                                <p>
                                    Hired
                                </p>

                                <strong>
                                    {stats.hired}
                                </strong>

                                <small>
                                    Successful applications
                                </small>

                            </div>

                        </article>

                    </section>


                    {/* =================================================
                        NO APPLICATIONS
                       ================================================= */}

                    {applications.length === 0 ? (

                        <section className="light-panel applications-empty-panel">

                            <EmptyState
                                title="No applications yet"
                                detail="Discover open roles and submit your resume to start building your application pipeline."
                                action={
                                    <button
                                        className="primary-light-button"
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                '/jobs'
                                            )
                                        }
                                    >
                                        Discover jobs →
                                    </button>
                                }
                            />

                        </section>

                    ) : (

                        <>

                            {/* =========================================
                                OVERVIEW
                               ========================================= */}

                            <section className="applications-overview-grid">

                                <article className="light-panel applications-summary-panel">

                                    <div className="light-panel-header">

                                        <div>

                                            <span className="eyebrow-text">
                                                APPLICATION PIPELINE
                                            </span>

                                            <h2>
                                                Your progress
                                            </h2>

                                            <p>
                                                A quick overview
                                                of where your
                                                applications
                                                currently stand.
                                            </p>

                                        </div>

                                        <MatchRing
                                            score={
                                                stats.averageMatch
                                            }
                                            label="Avg match"
                                        />

                                    </div>


                                    <div className="application-summary-stats">

                                        <div>
                                            <span>
                                                Active
                                            </span>

                                            <strong>
                                                {stats.active}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Rejected
                                            </span>

                                            <strong>
                                                {stats.rejected}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                Average match
                                            </span>

                                            <strong>
                                                {
                                                    stats.averageMatch
                                                }
                                                %
                                            </strong>
                                        </div>

                                    </div>

                                </article>


                                <article className="light-panel application-status-panel">

                                    <span className="eyebrow-text">
                                        CURRENT STATUS
                                    </span>

                                    <h2>
                                        {stats.hired > 0
                                            ? 'Congratulations!'
                                            : stats.interviews >
                                                0
                                                ? 'Interview stage'
                                                : stats.shortlisted >
                                                    0
                                                    ? 'You are shortlisted'
                                                    : 'Keep applying'}
                                    </h2>

                                    <p>
                                        {stats.hired > 0
                                            ? 'One or more applications have reached the hired stage.'
                                            : stats.interviews >
                                                0
                                                ? 'You currently have an application progressing through interviews.'
                                                : stats.shortlisted >
                                                    0
                                                    ? 'Recruiters have shortlisted one or more of your applications.'
                                                    : 'Explore more roles that match your skills and experience.'}
                                    </p>

                                    <button
                                        className="secondary-light-button"
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                '/jobs'
                                            )
                                        }
                                    >
                                        Find more roles
                                    </button>

                                </article>

                            </section>


                            {/* =========================================
                                FILTERS
                               ========================================= */}

                            <section className="light-panel application-filter-panel">

                                <div>

                                    <span className="eyebrow-text">
                                        APPLICATION STATUS
                                    </span>

                                    <h2>
                                        Track your applications
                                    </h2>

                                </div>


                                <div className="application-filter-tabs">

                                    <button
                                        type="button"
                                        className={
                                            activeFilter ===
                                            'all'
                                                ? 'active'
                                                : ''
                                        }
                                        onClick={() =>
                                            setActiveFilter(
                                                'all'
                                            )
                                        }
                                    >
                                        All
                                        <span>
                                            {
                                                applications.length
                                            }
                                        </span>
                                    </button>


                                    <button
                                        type="button"
                                        className={
                                            activeFilter ===
                                            'applied'
                                                ? 'active'
                                                : ''
                                        }
                                        onClick={() =>
                                            setActiveFilter(
                                                'applied'
                                            )
                                        }
                                    >
                                        Applied
                                        <span>
                                            {
                                                applications.filter(
                                                    (
                                                        application
                                                    ) =>
                                                        application.status ===
                                                        'applied'
                                                ).length
                                            }
                                        </span>
                                    </button>


                                    <button
                                        type="button"
                                        className={
                                            activeFilter ===
                                            'shortlisted'
                                                ? 'active'
                                                : ''
                                        }
                                        onClick={() =>
                                            setActiveFilter(
                                                'shortlisted'
                                            )
                                        }
                                    >
                                        Shortlisted
                                        <span>
                                            {
                                                stats.shortlisted
                                            }
                                        </span>
                                    </button>


                                    <button
                                        type="button"
                                        className={
                                            activeFilter ===
                                            'interview'
                                                ? 'active'
                                                : ''
                                        }
                                        onClick={() =>
                                            setActiveFilter(
                                                'interview'
                                            )
                                        }
                                    >
                                        Interview
                                        <span>
                                            {
                                                stats.interviews
                                            }
                                        </span>
                                    </button>


                                    <button
                                        type="button"
                                        className={
                                            activeFilter ===
                                            'hired'
                                                ? 'active'
                                                : ''
                                        }
                                        onClick={() =>
                                            setActiveFilter(
                                                'hired'
                                            )
                                        }
                                    >
                                        Hired
                                        <span>
                                            {
                                                stats.hired
                                            }
                                        </span>
                                    </button>


                                    <button
                                        type="button"
                                        className={
                                            activeFilter ===
                                            'rejected'
                                                ? 'active'
                                                : ''
                                        }
                                        onClick={() =>
                                            setActiveFilter(
                                                'rejected'
                                            )
                                        }
                                    >
                                        Rejected
                                        <span>
                                            {
                                                stats.rejected
                                            }
                                        </span>
                                    </button>

                                </div>

                            </section>


                            {/* =========================================
                                APPLICATION LIST
                               ========================================= */}

                            <section className="light-panel applications-list-panel">

                                <div className="applications-list-header">

                                    <div>

                                        <span className="eyebrow-text">
                                            APPLICATIONS
                                        </span>

                                        <h2>
                                            Your applications
                                        </h2>

                                        <p>
                                            See the current
                                            status, progress,
                                            and match details
                                            for every opportunity.
                                        </p>

                                    </div>


                                    <span className="applications-count">
                                        {
                                            filteredApplications.length
                                        }{' '}
                                        {
                                            filteredApplications.length ===
                                            1
                                                ? 'application'
                                                : 'applications'
                                        }
                                    </span>

                                </div>


                                {filteredApplications.length ===
                                0 ? (

                                    <div className="application-filter-empty">

                                        <div className="application-filter-empty-icon">
                                            ⌕
                                        </div>

                                        <h3>
                                            No applications
                                            in this stage
                                        </h3>

                                        <p>
                                            You don't have any
                                            applications with
                                            this status yet.
                                        </p>

                                    </div>

                                ) : (

                                    <div className="applications-list">

                                        {filteredApplications.map(
                                            (
                                                application
                                            ) => {

                                                const status =
                                                    application.status ||
                                                    'applied';

                                                const score =
                                                    Number(
                                                        application.matchScore
                                                    );

                                                const safeScore =
                                                    Number.isFinite(
                                                        score
                                                    )
                                                        ? Math.max(
                                                            0,
                                                            Math.min(
                                                                100,
                                                                score
                                                            )
                                                        )
                                                        : 0;

                                                const company =
                                                    application
                                                        .job
                                                        ?.company ||
                                                    'Company';

                                                const title =
                                                    application
                                                        .job
                                                        ?.title ||
                                                    'Job opportunity';

                                                const location =
                                                    application
                                                        .job
                                                        ?.location ||
                                                    'Remote';

                                                const config =
                                                    statusConfig[
                                                        status
                                                    ] ||
                                                    statusConfig.applied;

                                                const matchAnalysis =
                                                    application.matchAnalysis;

                                                const required =
                                                    matchAnalysis
                                                        ?.required;

                                                const preferred =
                                                    matchAnalysis
                                                        ?.preferred;

                                                const matchedRequired =
                                                    required
                                                        ?.matched ??
                                                    0;

                                                const totalRequired =
                                                    required
                                                        ?.total ??
                                                    0;

                                                const matchedPreferred =
                                                    preferred
                                                        ?.matched ??
                                                    0;

                                                const totalPreferred =
                                                    preferred
                                                        ?.total ??
                                                    0;

                                                return (

                                                    <article
                                                        className={`application-card application-card-${config.tone}`}
                                                        key={
                                                            application._id ||
                                                            application.id
                                                        }
                                                    >

                                                        {/* =====================================
                                                            CARD HEADER
                                                           ===================================== */}

                                                        <div className="application-card-main">

                                                            <div className="application-company-avatar">
                                                                {company
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>


                                                            <div className="application-card-info">

                                                                <div className="application-card-title-row">

                                                                    <div>

                                                                        <h3>
                                                                            {
                                                                                title
                                                                            }
                                                                        </h3>

                                                                        <p>
                                                                            {
                                                                                company
                                                                            }
                                                                            {' '}
                                                                            ·{' '}
                                                                            {
                                                                                location
                                                                            }
                                                                        </p>

                                                                    </div>


                                                                    <div className="application-card-status">

                                                                        <StatusPill
                                                                            status={
                                                                                status
                                                                            }
                                                                        />

                                                                    </div>

                                                                </div>


                                                                <div className="application-card-meta">

                                                                    <span>
                                                                        Applied{' '}
                                                                        {formatDate(
                                                                            application.appliedAt ||
                                                                            application.createdAt
                                                                        )}
                                                                    </span>


                                                                    {application
                                                                        .job
                                                                        ?.employmentType && (

                                                                            <span>
                                                                                {
                                                                                    formatEmploymentType(
                                                                                        application
                                                                                            .job
                                                                                            .employmentType
                                                                                    )
                                                                                }
                                                                            </span>

                                                                        )}

                                                                </div>

                                                            </div>

                                                        </div>


                                                        {/* =====================================
                                                            STATUS EXPLANATION
                                                           ===================================== */}

                                                        <div className="application-status-explanation">

                                                            <div className="application-status-icon">
                                                                {status ===
                                                                'rejected'
                                                                    ? '!'
                                                                    : status ===
                                                                        'hired'
                                                                        ? '✓'
                                                                        : '→'}
                                                            </div>


                                                            <div>

                                                                <strong>
                                                                    {
                                                                        config.label
                                                                    }
                                                                </strong>

                                                                <p>
                                                                    {
                                                                        config.description
                                                                    }
                                                                </p>

                                                                <small>
                                                                    <b>
                                                                        Next:
                                                                    </b>{' '}
                                                                    {
                                                                        config.next
                                                                    }
                                                                </small>

                                                            </div>

                                                        </div>


                                                        {/* =====================================
                                                            TIMELINE + MATCH
                                                           ===================================== */}

                                                        <div className="application-card-bottom">

                                                            <div className="application-progress-block">

                                                                <span className="application-section-label">
                                                                    APPLICATION PROGRESS
                                                                </span>


                                                                <div className="application-timeline">

                                                                    {timelineSteps.map(
                                                                        (
                                                                            step,
                                                                            index
                                                                        ) => {

                                                                            const state =
                                                                                getTimelineState(
                                                                                    status,
                                                                                    step
                                                                                );

                                                                            return (

                                                                                <div
                                                                                    className={`timeline-step ${
                                                                                        state.completed
                                                                                            ? 'completed'
                                                                                            : ''
                                                                                    } ${
                                                                                        state.current
                                                                                            ? 'current'
                                                                                            : ''
                                                                                    }`}
                                                                                    key={
                                                                                        step
                                                                                    }
                                                                                >

                                                                                    <div className="timeline-node">

                                                                                        {state.completed
                                                                                            ? '✓'
                                                                                            : state.current
                                                                                                ? '●'
                                                                                                : index +
                                                                                                1}

                                                                                    </div>


                                                                                    <span className="timeline-label">
                                                                                        {
                                                                                            step
                                                                                                .charAt(
                                                                                                    0
                                                                                                )
                                                                                                .toUpperCase() +
                                                                                            step.slice(
                                                                                                1
                                                                                            )
                                                                                        }
                                                                                    </span>


                                                                                    {index <
                                                                                        timelineSteps.length -
                                                                                        1 && (

                                                                                            <div
                                                                                                className={`timeline-line ${
                                                                                                    state.completed
                                                                                                        ? 'completed'
                                                                                                        : ''
                                                                                                }`}
                                                                                            />

                                                                                        )}

                                                                                </div>

                                                                            );
                                                                        }
                                                                    )}

                                                                </div>

                                                            </div>


                                                            <div className="application-card-match">

                                                                <MatchRing
                                                                    score={
                                                                        safeScore
                                                                    }
                                                                    label="Match"
                                                                    size="small"
                                                                />

                                                            </div>

                                                        </div>


                                                        {/* =====================================
                                                            MATCH ANALYSIS
                                                           ===================================== */}

                                                        {matchAnalysis && (

                                                            <div className="application-match-analysis">

                                                                <div className="application-match-header">

                                                                    <div>

                                                                        <span className="application-section-label">
                                                                            AI MATCH ANALYSIS
                                                                        </span>

                                                                        <h4>
                                                                            Why this role matches your profile
                                                                        </h4>

                                                                    </div>


                                                                    <span className="application-match-score-text">
                                                                        {
                                                                            safeScore
                                                                        }%
                                                                        match
                                                                    </span>

                                                                </div>


                                                                <div className="application-match-columns">

                                                                    {/* REQUIRED */}

                                                                    <div className="application-match-group">

                                                                        <div className="application-match-group-header">

                                                                            <span>
                                                                                Required skills
                                                                            </span>

                                                                            <strong>
                                                                                {
                                                                                    matchedRequired
                                                                                }
                                                                                /
                                                                                {
                                                                                    totalRequired
                                                                                }
                                                                                {' '}
                                                                                matched
                                                                            </strong>

                                                                        </div>


                                                                        {required
                                                                            ?.matchedSkills
                                                                            ?.length >
                                                                        0 ? (

                                                                            <div className="application-skill-list">

                                                                                {required.matchedSkills.map(
                                                                                    (
                                                                                        skill,
                                                                                        index
                                                                                    ) => (

                                                                                        <span
                                                                                            className="application-skill matched"
                                                                                            key={
                                                                                                `required-matched-${skill}-${index}`
                                                                                            }
                                                                                        >
                                                                                            ✓{' '}
                                                                                            {
                                                                                                formatSkillName(
                                                                                                    skill
                                                                                                )
                                                                                            }
                                                                                        </span>

                                                                                    )
                                                                                )}

                                                                            </div>

                                                                        ) : (

                                                                            <p className="application-no-match-text">
                                                                                No required skills
                                                                                were matched.
                                                                            </p>

                                                                        )}


                                                                        {required
                                                                            ?.missingSkills
                                                                            ?.length >
                                                                        0 && (

                                                                            <div className="application-missing-skills">

                                                                                <span>
                                                                                    Missing
                                                                                </span>

                                                                                {required.missingSkills.map(
                                                                                    (
                                                                                        skill,
                                                                                        index
                                                                                    ) => (

                                                                                        <span
                                                                                            className="application-skill missing"
                                                                                            key={
                                                                                                `required-missing-${skill}-${index}`
                                                                                            }
                                                                                        >
                                                                                            ×{' '}
                                                                                            {
                                                                                                formatSkillName(
                                                                                                    skill
                                                                                                )
                                                                                            }
                                                                                        </span>

                                                                                    )
                                                                                )}

                                                                            </div>

                                                                        )}

                                                                    </div>


                                                                    {/* PREFERRED */}

                                                                    <div className="application-match-group">

                                                                        <div className="application-match-group-header">

                                                                            <span>
                                                                                Preferred skills
                                                                            </span>

                                                                            <strong>
                                                                                {
                                                                                    matchedPreferred
                                                                                }
                                                                                /
                                                                                {
                                                                                    totalPreferred
                                                                                }
                                                                                {' '}
                                                                                matched
                                                                            </strong>

                                                                        </div>


                                                                        {preferred
                                                                            ?.matchedSkills
                                                                            ?.length >
                                                                        0 ? (

                                                                            <div className="application-skill-list">

                                                                                {preferred.matchedSkills.map(
                                                                                    (
                                                                                        skill,
                                                                                        index
                                                                                    ) => (

                                                                                        <span
                                                                                            className="application-skill matched"
                                                                                            key={
                                                                                                `preferred-matched-${skill}-${index}`
                                                                                            }
                                                                                        >
                                                                                            ✓{' '}
                                                                                            {
                                                                                                formatSkillName(
                                                                                                    skill
                                                                                                )
                                                                                            }
                                                                                        </span>

                                                                                    )
                                                                                )}

                                                                            </div>

                                                                        ) : (

                                                                            <p className="application-no-match-text">
                                                                                No preferred skills
                                                                                were matched.
                                                                            </p>

                                                                        )}


                                                                        {preferred
                                                                            ?.missingSkills
                                                                            ?.length >
                                                                        0 && (

                                                                            <div className="application-missing-skills">

                                                                                <span>
                                                                                    Missing
                                                                                </span>

                                                                                {preferred.missingSkills.map(
                                                                                    (
                                                                                        skill,
                                                                                        index
                                                                                    ) => (

                                                                                        <span
                                                                                            className="application-skill missing"
                                                                                            key={
                                                                                                `preferred-missing-${skill}-${index}`
                                                                                            }
                                                                                        >
                                                                                            ×{' '}
                                                                                            {
                                                                                                formatSkillName(
                                                                                                    skill
                                                                                                )
                                                                                            }
                                                                                        </span>

                                                                                    )
                                                                                )}

                                                                            </div>

                                                                        )}

                                                                    </div>

                                                                </div>

                                                            </div>

                                                        )}


                                                        {/* =====================================
                                                            REJECTED NOTE
                                                           ===================================== */}

                                                        {status ===
                                                            'rejected' && (

                                                                <div className="application-rejected-note">

                                                                    <strong>
                                                                        Application closed
                                                                    </strong>

                                                                    <span>
                                                                        This opportunity is no longer
                                                                        progressing. Your other applications
                                                                        are not affected.
                                                                    </span>

                                                                </div>

                                                            )}

                                                    </article>

                                                );
                                            }
                                        )}

                                    </div>

                                )}

                            </section>

                        </>

                    )}

                </>

            )}

        </WorkspaceShell>
    );
}


export default Applications;