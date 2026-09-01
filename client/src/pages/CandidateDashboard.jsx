import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/config';
import { getMyResumes, uploadResume } from '../api/resumes';

function CandidateDashboard() {
    const { user, logout } = useAuth();

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const navigate = (path) => {
        window.location.href = path;
    };

    const handleUploadResume = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF resume.');
            event.target.value = '';
            return;
        }

        try {
            setUploading(true);
            setError('');

            const token = localStorage.getItem('token');

            await uploadResume(token, file);

            const resumesData = await getMyResumes(token);

            setDashboard((current) => ({
                ...current,
                resumes: resumesData.resumes || [],
                resumeCount: resumesData.count || 0,
            }));
        } catch (err) {
            setError(err.message || 'Unable to upload resume');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    useEffect(() => {
        async function loadDashboard() {
            try {
                const token = localStorage.getItem('token');

                const response = await fetch(
                    `${API_BASE_URL}/dashboard/candidate`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Unable to load dashboard');
                }

                setDashboard(data.dashboard);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    const applications = dashboard?.applications || [];
    const resumes = dashboard?.resumes || [];

    const skillGroups = useMemo(() => {
        const skills = resumes[0]?.skills || [];

        const groups = {
            programming: [],
            frontend: [],
            backend: [],
            database: [],
            ai: [],
            devops: [],
            security: [],
            tools: [],
        };

        skills.forEach((skill) => {
            if (groups[skill.category]) {
                groups[skill.category].push(skill.name);
            }
        });

        return groups;
    }, [resumes]);

    const applicationStats = useMemo(() => {
        const stats = {
            applied: 0,
            shortlisted: 0,
            interview: 0,
            hired: 0,
            rejected: 0,
        };

        applications.forEach((application) => {
            if (stats[application.status] !== undefined) {
                stats[application.status]++;
            }
        });

        return stats;
    }, [applications]);

    const profileStrength = resumes.length
        ? Math.min(100, 55 + Math.min((resumes[0]?.skills?.length || 0) * 1.6, 45))
        : 0;

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
                <span>Loading workspace...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-loading">
                <div>
                    <p className="error-text">{error}</p>
                    <button className="primary-button" onClick={() => window.location.reload()}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="candidate-app">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-mark">S</div>
                    <div>
                        <div className="brand-name">Smart Resume</div>
                        <div className="brand-subtitle">MATCHER</div>
                    </div>
                </div>

                <div className="sidebar-section">
                    <span className="sidebar-label">WORKSPACE</span>

                    <button className="nav-item active">
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

                    <button
                        className="nav-item"
                        onClick={() => navigate('/applications')}
                    >
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
                    <span className="sidebar-label">ACCOUNT</span>

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
                        <strong>{user?.name || 'Candidate'}</strong>
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

            {/* MAIN */}
            <main className="dashboard-main">
                {/* TOPBAR */}
                <header className="topbar">
                    <div>
                        <div className="eyebrow">CANDIDATE WORKSPACE</div>
                        <p>Your career intelligence overview</p>
                    </div>

                    <div className="topbar-actions">
                        <button className="search-button">
                            <span>⌕</span>
                            Search
                        </button>

                        <button className="icon-button">♧</button>

                        <button className="top-avatar">
                            {user?.name?.charAt(0)?.toUpperCase() || 'J'}
                        </button>
                    </div>
                </header>

                <div className="dashboard-content">
                    {/* HERO */}
                    <section className="hero-card">
                        <div className="hero-glow" />

                        <div className="hero-content">
                            <div className="status-pill">
                                <span />
                                AI career workspace
                            </div>

                            <h1>
                                Welcome back,{' '}
                                <span>{user?.name?.split(' ')[0] || 'Jatin'}.</span>
                            </h1>

                            <p>
                                Your profile is being evaluated against opportunities
                                using your resume, skills, and application history.
                            </p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleUploadResume}
                            style={{ display: 'none' }}
                        />

                        <button
                            className="hero-action"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : '+ Upload Resume'}
                        </button>
                    </section>

                    {/* METRICS */}
                    <section className="metrics-grid">
                        <div className="metric-card featured">
                            <div className="metric-header">
                                <span>PROFILE STRENGTH</span>
                                <div className="metric-icon">◇</div>
                            </div>

                            <strong>{Math.round(profileStrength)}%</strong>

                            <div className="progress-track">
                                <div
                                    className="progress-value"
                                    style={{ width: `${profileStrength}%` }}
                                />
                            </div>

                            <small>Based on your latest resume</small>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <span>RESUMES</span>
                                <div className="metric-icon">△</div>
                            </div>

                            <strong>{dashboard?.resumeCount || 0}</strong>
                            <small>Uploaded profiles</small>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <span>APPLICATIONS</span>
                                <div className="metric-icon">□</div>
                            </div>

                            <strong>{dashboard?.applicationCount || 0}</strong>
                            <small>Active career opportunities</small>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <span>AVG. MATCH</span>
                                <div className="metric-icon">✦</div>
                            </div>

                            <strong className="blue-number">
                                {dashboard?.averageMatchScore || 0}%
                            </strong>
                            <small>AI compatibility score</small>
                        </div>
                    </section>

                    {/* ANALYTICS ROW */}
                    <section className="analytics-grid">
                        <div className="panel large-panel">
                            <div className="panel-header">
                                <div>
                                    <span className="panel-label">LATEST INTELLIGENCE</span>
                                    <h2>Your strongest application</h2>
                                </div>

                                <span className="ai-badge">AI ANALYZED</span>
                            </div>

                            {applications.length > 0 ? (
                                <div className="strongest-application">
                                    <div>
                                        <span className="company-name">
                                            {applications[0]?.job?.company}
                                        </span>

                                        <h3>{applications[0]?.job?.title}</h3>

                                        <p>
                                            {applications[0]?.job?.location ||
                                                'Location not specified'}
                                            {' · '}
                                            {applications[0]?.job?.employmentType ||
                                                'Full-time'}
                                        </p>
                                    </div>

                                    <div className="score-block">
                                        <div className="score-ring">
                                            <span>
                                                {applications[0]?.matchScore || 0}%
                                            </span>
                                        </div>

                                        <div>
                                            <small>Match score</small>
                                            <strong>Excellent fit</strong>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <span>✦</span>
                                    <p>Apply to a job to see your match intelligence.</p>
                                </div>
                            )}

                            <div className="application-insight">
                                <div>
                                    <span>Application status</span>
                                    <strong>
                                        {applications[0]?.status || 'No applications'}
                                    </strong>
                                </div>

                                <div>
                                    <span>Resume used</span>
                                    <strong>
                                        {applications[0]?.resume?.fileName || '—'}
                                    </strong>
                                </div>

                                <div>
                                    <span>Applications</span>
                                    <strong>{applications.length}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="panel intelligence-panel">
                            <div className="panel-header">
                                <div>
                                    <span className="panel-label">RESUME INTELLIGENCE</span>
                                    <h2>Latest profile</h2>
                                </div>
                            </div>

                            {resumes.length > 0 ? (
                                <>
                                    <div className="resume-summary">
                                        <div className="pdf-icon">PDF</div>

                                        <div>
                                            <strong>{resumes[0].fileName}</strong>
                                            <span>
                                                {resumes[0].skills?.length || 0} skills
                                                detected
                                            </span>
                                        </div>
                                    </div>

                                    <div className="skill-list">
                                        {Object.entries(skillGroups)
                                            .filter(([, skills]) => skills.length)
                                            .slice(0, 5)
                                            .map(([category, skills]) => (
                                                <div className="skill-row" key={category}>
                                                    <div>
                                                        <span>
                                                            {category.toUpperCase()}
                                                        </span>
                                                        <strong>
                                                            {skills.slice(0, 3).join(' · ')}
                                                        </strong>
                                                    </div>

                                                    <div className="skill-bar">
                                                        <div
                                                            style={{
                                                                width: `${Math.min(
                                                                    100,
                                                                    45 + skills.length * 15
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </>
                            ) : (
                                <div className="empty-state">
                                    <span>△</span>
                                    <p>Upload your first resume.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* APPLICATION PIPELINE + RECENT APPLICATIONS */}
                    <section className="bottom-grid">
                        <div className="panel pipeline-panel">
                            <div className="panel-header">
                                <div>
                                    <span className="panel-label">APPLICATION PIPELINE</span>
                                    <h2>Hiring progress</h2>
                                </div>
                            </div>

                            <div className="pipeline">
                                {[
                                    ['applied', 'Applied'],
                                    ['shortlisted', 'Shortlisted'],
                                    ['interview', 'Interview'],
                                    ['hired', 'Hired'],
                                    ['rejected', 'Rejected'],
                                ].map(([key, label]) => (
                                    <div className="pipeline-item" key={key}>
                                        <span>{label}</span>
                                        <strong>{applicationStats[key]}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="panel recent-panel">
                            <div className="panel-header">
                                <div>
                                    <span className="panel-label">RECENT ACTIVITY</span>
                                    <h2>Applications</h2>
                                </div>

                                <button className="text-button">View all →</button>
                            </div>

                            {applications.length > 0 ? (
                                <div className="application-list">
                                    {applications.slice(0, 4).map((application) => (
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
                                                    {application.job?.title}
                                                </strong>
                                                <span>
                                                    {application.job?.company}
                                                </span>
                                            </div>

                                            <span className="status-badge">
                                                {application.status}
                                            </span>

                                            <strong className="match-score">
                                                {application.matchScore}%
                                            </strong>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <span>□</span>
                                    <p>No applications yet.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default CandidateDashboard;