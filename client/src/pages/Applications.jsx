import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { getMyApplications } from '../api/applications';

function Applications() {
    const { user, logout } = useAuth();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadApplications() {
            try {
                const token = localStorage.getItem('token');

                const data = await getMyApplications(token);

                setApplications(data.applications || []);
            } catch (err) {
                setError(
                    err.message || 'Unable to load applications'
                );
            } finally {
                setLoading(false);
            }
        }

        loadApplications();
    }, []);

    const navigate = (path) => {
        window.location.href = path;
    };

    const statusClass = (status) => {
        switch (status) {
            case 'shortlisted':
                return 'status-shortlisted';

            case 'interview':
                return 'status-interview';

            case 'hired':
                return 'status-hired';

            case 'rejected':
                return 'status-rejected';

            default:
                return 'status-applied';
        }
    };

    const timelineSteps = [
        'applied',
        'shortlisted',
        'interview',
        'hired',
    ];

    const getTimelineState = (status, step) => {
        if (status === 'rejected') {
            return {
                completed: false,
                current: step === 'applied' || step === 'shortlisted',
            };
        }

        const currentIndex = timelineSteps.indexOf(status);
        const stepIndex = timelineSteps.indexOf(step);

        return {
            completed:
                currentIndex !== -1 &&
                stepIndex < currentIndex,

            current:
                currentIndex !== -1 &&
                stepIndex === currentIndex,
        };
    };

    return (
        <div className="candidate-app">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-mark">S</div>

                    <div>
                        <div className="brand-name">
                            Smart Resume
                        </div>

                        <div className="brand-subtitle">
                            MATCHER
                        </div>
                    </div>
                </div>

                <div className="sidebar-section">
                    <span className="sidebar-label">
                        WORKSPACE
                    </span>

                    <button
                        className="nav-item"
                        onClick={() => navigate('/')}
                    >
                        <span className="nav-icon">◆</span>
                        Dashboard
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate('/jobs')}
                    >
                        <span className="nav-icon">○</span>
                        Discover Jobs
                    </button>

                    <button className="nav-item active">
                        <span className="nav-icon">□</span>
                        Applications
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate('/resumes')}
                    >
                        <span className="nav-icon">△</span>
                        My Resumes
                    </button>
                </div>

                <div className="sidebar-section account-section">
                    <span className="sidebar-label">
                        ACCOUNT
                    </span>

                    <button className="nav-item">
                        <span className="nav-icon">⚙</span>
                        Settings
                    </button>
                </div>

                <div className="sidebar-profile">
                    <div className="avatar">
                        {user?.name?.charAt(0)?.toUpperCase() || 'J'}
                    </div>

                    <div className="profile-info">
                        <strong>
                            {user?.name || 'Candidate'}
                        </strong>

                        <span>Candidate</span>
                    </div>

                    <button
                        className="logout-icon"
                        onClick={logout}
                        title="Sign out"
                    >
                        ↪
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="topbar">
                    <div>
                        <div className="eyebrow">
                            CANDIDATE WORKSPACE
                        </div>

                        <p>
                            Track your career opportunities
                        </p>
                    </div>

                    <div className="topbar-actions">
                        <button
                            className="search-button"
                            onClick={() => navigate('/jobs')}
                        >
                            <span>⌕</span>
                            Search jobs
                        </button>

                        <button className="icon-button">
                            ♧
                        </button>

                        <button className="top-avatar">
                            {user?.name?.charAt(0)?.toUpperCase() || 'J'}
                        </button>
                    </div>
                </header>

                <div className="dashboard-content">
                    <section className="hero-card">
                        <div className="hero-glow" />

                        <div className="hero-content">
                            <div className="status-pill">
                                <span />
                                APPLICATION INTELLIGENCE
                            </div>

                            <h1>
                                Your applications.
                            </h1>

                            <p>
                                Track every opportunity, match score,
                                and hiring-stage update from one place.
                            </p>
                        </div>

                        <button
                            className="hero-action"
                            onClick={() => navigate('/jobs')}
                        >
                            Browse Jobs →
                        </button>
                    </section>

                    <section className="metrics-grid">
                        <div className="metric-card">
                            <div className="metric-header">
                                <span>APPLICATIONS</span>
                                <div className="metric-icon">□</div>
                            </div>

                            <strong>
                                {applications.length}
                            </strong>

                            <small>
                                Total applications
                            </small>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <span>SHORTLISTED</span>
                                <div className="metric-icon">◇</div>
                            </div>

                            <strong>
                                {
                                    applications.filter(
                                        (application) =>
                                            application.status ===
                                            'shortlisted'
                                    ).length
                                }
                            </strong>

                            <small>
                                Recruiter selections
                            </small>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <span>INTERVIEWS</span>
                                <div className="metric-icon">△</div>
                            </div>

                            <strong>
                                {
                                    applications.filter(
                                        (application) =>
                                            application.status ===
                                            'interview'
                                    ).length
                                }
                            </strong>

                            <small>
                                Interview stage
                            </small>
                        </div>

                        <div className="metric-card featured">
                            <div className="metric-header">
                                <span>HIRED</span>
                                <div className="metric-icon">✦</div>
                            </div>

                            <strong className="blue-number">
                                {
                                    applications.filter(
                                        (application) =>
                                            application.status ===
                                            'hired'
                                    ).length
                                }
                            </strong>

                            <small>
                                Successful applications
                            </small>
                        </div>
                    </section>

                    <section className="panel recent-panel">
                        <div className="panel-header">
                            <div>
                                <span className="panel-label">
                                    APPLICATION PIPELINE
                                </span>

                                <h2>
                                    Your applications
                                </h2>
                            </div>

                            <span className="ai-badge">
                                AI TRACKED
                            </span>
                        </div>

                        {loading ? (
                            <div className="empty-state">
                                <span>◌</span>

                                <p>
                                    Loading applications...
                                </p>
                            </div>
                        ) : error ? (
                            <div className="empty-state">
                                <span>!</span>

                                <p>
                                    {error}
                                </p>
                            </div>
                        ) : applications.length === 0 ? (
                            <div className="empty-state">
                                <span>□</span>

                                <p>
                                    You haven't applied to any jobs yet.
                                </p>

                                <button
                                    className="primary-button"
                                    onClick={() => navigate('/jobs')}
                                >
                                    Discover Jobs
                                </button>
                            </div>
                        ) : (
                            <div className="application-list">
                                {applications.map((application) => (
                                    <div
                                        className="application-row"
                                        key={application._id}
                                    >
                                        <div className="company-avatar">
                                            {application.job?.company
                                                ?.charAt(0)
                                                ?.toUpperCase() || 'C'}
                                        </div>

                                        <div className="application-info">
                                            <strong>
                                                {application.job?.title ||
                                                    'Job'}
                                            </strong>

                                            <span>
                                                {application.job?.company ||
                                                    'Company'}
                                                {' · '}
                                                {application.job?.location ||
                                                    'Location not specified'}
                                            </span>

                                            <div
                                                className={`application-timeline ${application.status ===
                                                        'rejected'
                                                        ? 'rejected'
                                                        : ''
                                                    }`}
                                            >
                                                {timelineSteps.map(
                                                    (step, index) => {
                                                        const state =
                                                            getTimelineState(
                                                                application.status,
                                                                step
                                                            );

                                                        return (
                                                            <div
                                                                className={`timeline-step ${state.completed
                                                                        ? 'completed'
                                                                        : ''
                                                                    } ${state.current
                                                                        ? 'current'
                                                                        : ''
                                                                    }`}
                                                                key={step}
                                                            >
                                                                <div className="timeline-node">
                                                                    {state.completed
                                                                        ? '✓'
                                                                        : state.current
                                                                            ? '●'
                                                                            : index + 1}
                                                                </div>

                                                                <span className="timeline-label">
                                                                    {step}
                                                                </span>

                                                                {index <
                                                                    timelineSteps.length -
                                                                    1 && (
                                                                        <div
                                                                            className={`timeline-line ${state.completed
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

                                        <div className="application-match">
                                            <span>
                                                AI MATCH
                                            </span>

                                            <strong>
                                                {application.matchScore || 0}%
                                            </strong>
                                        </div>

                                        <span
                                            className={`status-badge ${statusClass(
                                                application.status
                                            )}`}
                                        >
                                            {application.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

export default Applications;