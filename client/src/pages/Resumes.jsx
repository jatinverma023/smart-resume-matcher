import { useEffect, useRef, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import {
    getMyResumes,
    uploadResume,
} from '../api/resumes';

function Resumes() {
    const { user, logout } = useAuth();

    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const fileInputRef = useRef(null);

    const navigate = (path) => {
        window.location.href = path;
    };

    const loadResumes = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            const data = await getMyResumes(token);

            setResumes(data.resumes || []);
        } catch (err) {
            setError(
                err.message || 'Unable to load resumes'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadResumes();
    }, []);

    const handleUpload = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (
            file.type !== 'application/pdf' &&
            !file.name.toLowerCase().endsWith('.pdf')
        ) {
            setError('Please upload a PDF resume.');
            event.target.value = '';
            return;
        }

        try {
            setUploading(true);
            setError('');

            const token = localStorage.getItem('token');

            await uploadResume(token, file);

            await loadResumes();
        } catch (err) {
            setError(
                err.message || 'Unable to upload resume'
            );
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const latestResume = resumes[0];

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

                    <button
                        className="nav-item"
                        onClick={() => navigate('/applications')}
                    >
                        <span className="nav-icon">□</span>
                        Applications
                    </button>

                    <button className="nav-item active">
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
                            Manage your resume profiles
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
                                RESUME INTELLIGENCE
                            </div>

                            <h1>
                                Build your strongest profile.
                            </h1>

                            <p>
                                Upload multiple resume versions and
                                let Smart Resume Matcher analyze the
                                skills available for your applications.
                            </p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleUpload}
                            style={{ display: 'none' }}
                        />

                        <button
                            className="hero-action"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            disabled={uploading}
                        >
                            {uploading
                                ? 'Uploading...'
                                : '+ Upload Resume'}
                        </button>
                    </section>

                    <section className="metrics-grid">
                        <div className="metric-card featured">
                            <div className="metric-header">
                                <span>RESUMES</span>
                                <div className="metric-icon">
                                    △
                                </div>
                            </div>

                            <strong>{resumes.length}</strong>

                            <small>
                                Uploaded profiles
                            </small>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <span>SKILLS DETECTED</span>
                                <div className="metric-icon">
                                    ◇
                                </div>
                            </div>

                            <strong>
                                {latestResume?.skills?.length || 0}
                            </strong>

                            <small>
                                From latest resume
                            </small>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <span>FORMAT</span>
                                <div className="metric-icon">
                                    □
                                </div>
                            </div>

                            <strong>
                                {latestResume
                                    ? latestResume.fileType
                                        ?.includes('pdf')
                                        ? 'PDF'
                                        : 'FILE'
                                    : '—'}
                            </strong>

                            <small>
                                Latest resume format
                            </small>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <span>PROFILE</span>
                                <div className="metric-icon">
                                    ✦
                                </div>
                            </div>

                            <strong className="blue-number">
                                {latestResume ? 'ACTIVE' : 'EMPTY'}
                            </strong>

                            <small>
                                Resume availability
                            </small>
                        </div>
                    </section>

                    {error && (
                        <div className="panel">
                            <div className="empty-state">
                                <span>!</span>
                                <p>{error}</p>
                            </div>
                        </div>
                    )}

                    <section className="panel recent-panel">
                        <div className="panel-header">
                            <div>
                                <span className="panel-label">
                                    RESUME LIBRARY
                                </span>

                                <h2>
                                    Your resume profiles
                                </h2>
                            </div>

                            <span className="ai-badge">
                                AI PARSED
                            </span>
                        </div>

                        {loading ? (
                            <div className="empty-state">
                                <span>◌</span>

                                <p>
                                    Loading resumes...
                                </p>
                            </div>
                        ) : resumes.length === 0 ? (
                            <div className="empty-state">
                                <span>△</span>

                                <p>
                                    No resumes uploaded yet.
                                </p>

                                <button
                                    className="primary-button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                >
                                    Upload your first resume
                                </button>
                            </div>
                        ) : (
                            <div className="application-list">
                                {resumes.map((resume, index) => (
                                    <div
                                        className="application-row"
                                        key={resume.id || resume._id}
                                    >
                                        <div className="company-avatar">
                                            PDF
                                        </div>

                                        <div className="application-info">
                                            <strong>
                                                {resume.fileName}
                                            </strong>

                                            <span>
                                                {resume.skills?.length || 0}{' '}
                                                skills detected
                                                {' · '}
                                                {resume.fileType ||
                                                    'PDF'}
                                            </span>
                                        </div>

                                        <div className="application-match">
                                            <span>
                                                {index === 0
                                                    ? 'LATEST'
                                                    : 'PROFILE'}
                                            </span>

                                            <strong>
                                                {resume.skills?.length || 0}
                                            </strong>
                                        </div>

                                        <span className="status-badge status-shortlisted">
                                            AI PARSED
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {latestResume && (
                        <section className="panel intelligence-panel">
                            <div className="panel-header">
                                <div>
                                    <span className="panel-label">
                                        LATEST PROFILE
                                    </span>

                                    <h2>
                                        Detected skills
                                    </h2>
                                </div>
                            </div>

                            <div className="skill-list">
                                {latestResume.skills?.length > 0 ? (
                                    latestResume.skills.map(
                                        (skill, index) => {
                                            const name =
                                                typeof skill ===
                                                'string'
                                                    ? skill
                                                    : skill?.name ||
                                                      'Unknown';

                                            return (
                                                <div
                                                    className="skill-row"
                                                    key={
                                                        skill?._id ||
                                                        `${name}-${index}`
                                                    }
                                                >
                                                    <div>
                                                        <span>
                                                            {skill?.category?.toUpperCase() ||
                                                                'SKILL'}
                                                        </span>

                                                        <strong>
                                                            {name}
                                                        </strong>
                                                    </div>

                                                    <div className="skill-bar">
                                                        <div
                                                            style={{
                                                                width: '75%',
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )
                                ) : (
                                    <div className="empty-state">
                                        <p>
                                            No skills detected.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Resumes;
