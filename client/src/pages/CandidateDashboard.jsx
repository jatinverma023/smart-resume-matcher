// CandidateDashboard.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

import { getCandidateDashboard } from '../api/dashboard';
import { getMyResumes, uploadResume } from '../api/resumes';
import {
    EmptyState,
    MatchRing,
    MetricCard,
    StatusPill,
    WorkspaceShell,
} from '../components/WorkspaceShell';



/* ────────────────────── helpers ────────────────────── */

function getSkillName(skill) {
    return typeof skill === 'string' ? skill : skill?.name;
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

const chipColors = [
    { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
    { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
    { bg: '#fce7f3', text: '#be185d', border: '#fbcfe8' },
    { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
    { bg: '#faf5ff', text: '#7c3aed', border: '#ddd6fe' },
    { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
    { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
];

/* ────────────────── animated counter ───────────────── */

function useCountUp(target, duration = 1200) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (target === 0) {
            setCount(0);
            return;
        }

        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [target, duration]);

    return count;
}

/* ────────────────── skeleton loader ────────────────── */

function DashboardSkeleton() {
    return (
        <div className="cd-skeleton-wrap">
            <div className="cd-skeleton-hero">
                <div className="cd-skeleton-circle cd-shimmer" />
                <div className="cd-skeleton-hero-text">
                    <div className="cd-skeleton-line cd-w60 cd-shimmer" />
                    <div className="cd-skeleton-line cd-w90 cd-shimmer" />
                    <div className="cd-skeleton-line cd-w40 cd-shimmer" />
                </div>
            </div>

            <div className="cd-skeleton-metrics">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="cd-skeleton-card cd-shimmer" />
                ))}
            </div>

            <div className="cd-skeleton-grid">
                <div className="cd-skeleton-panel cd-shimmer" />
                <div className="cd-skeleton-panel cd-shimmer" />
            </div>
        </div>
    );
}

/* ────────────────── animation variants ─────────────── */

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const staggerItem = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const chipVariant = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
};

/* ──────────────── main dashboard component ─────────── */

function CandidateDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    /* ── data fetching (untouched backend logic) ── */

    useEffect(() => {
        let cancelled = false;

        async function loadDashboard() {
            try {
                const token = localStorage.getItem('token');
                const data = await getCandidateDashboard(token);
                if (!cancelled) setDashboard(data.dashboard);
            } catch (requestError) {
                if (!cancelled) setError(requestError.message || 'Unable to load dashboard');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadDashboard();
        return () => { cancelled = true; };
    }, []);

    /* ── derived data ── */

    const applications = useMemo(() => dashboard?.applications ?? [], [dashboard]);
    const resumes = useMemo(() => dashboard?.resumes ?? [], [dashboard]);
    const latestResume = resumes[0];

    const detectedSkills = useMemo(
        () => (latestResume?.skills ?? []).map(getSkillName).filter(Boolean),
        [latestResume]
    );

    const profileStrength = resumes.length
        ? Math.min(100, 55 + Math.min(detectedSkills.length * 5, 45))
        : 0;

    const averageMatch = Math.round(Number(dashboard?.averageMatchScore ?? 0));

    /* ── animated counters ── */
    const animatedResumes = useCountUp(resumes.length);
    const animatedApps = useCountUp(applications.length);
    const animatedMatch = useCountUp(averageMatch);

    /* ── resume upload (backend logic untouched) ── */

    const processFile = useCallback(async (file) => {
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Please upload a PDF resume.');
            return;
        }

        try {
            setUploading(true);
            setError('');

            const token = localStorage.getItem('token');
            await uploadResume(token, file);
            const resumesData = await getMyResumes(token);

            setDashboard((current) =>
                current && ({
                    ...current,
                    resumes: resumesData.resumes ?? [],
                    resumeCount: resumesData.count ?? 0,
                })
            );

            toast.success('Resume uploaded & skills extracted!');
        } catch (uploadError) {
            toast.error(uploadError.message || 'Unable to upload resume');
        } finally {
            setUploading(false);
        }
    }, []);

    const handleUploadResume = async (event) => {
        const file = event.target.files?.[0];
        await processFile(file);
        event.target.value = '';
    };

    /* ── drag and drop handlers ── */

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        await processFile(file);
    };

    const goToJobs = () => { window.location.href = '/jobs'; };
    const goToApplications = () => { window.location.href = '/applications'; };

    /* ── strength status ── */

    const strengthLabel = profileStrength >= 80
        ? 'Excellent'
        : profileStrength >= 60
            ? 'Strong'
            : profileStrength >= 30
                ? 'Building up'
                : 'Just starting';

    const strengthColor = profileStrength >= 80
        ? '#10b981'
        : profileStrength >= 60
            ? '#6366f1'
            : profileStrength >= 30
                ? '#f59e0b'
                : '#94a3b8';

    /* ────────────────── JSX ────────────────── */

    return (
        <WorkspaceShell
            title={`${getGreeting()} 👋`}
            subtitle="Keep your resume strong and track every opportunity in one place."
            action={
                <button className="cd-header-action" type="button" onClick={goToJobs}>
                    <span>Discover jobs</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>
            }
        >
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1e293b',
                        color: '#f8fafc',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        padding: '12px 20px',
                    },
                    success: { iconTheme: { primary: '#10b981', secondary: '#f8fafc' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
                }}
            />

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    >
                        <DashboardSkeleton />
                    </motion.div>
                ) : error && !dashboard ? (
                    <motion.div
                        key="error"
                        className="cd-error-state"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="cd-error-icon">⚠️</div>
                        <h2>We couldn't load your dashboard</h2>
                        <p>{error}</p>
                        <button className="cd-btn cd-btn-secondary" type="button" onClick={() => window.location.reload()}>
                            Try again
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* ── HERO SECTION ── */}
                        <motion.section
                            className="cd-hero"
                            custom={0}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                        >
                            <div className="cd-hero-left">
                                <MatchRing score={profileStrength} label="Profile" />
                                <div className="cd-hero-copy">
                                    <div className="cd-strength-badge" style={{ color: strengthColor, borderColor: strengthColor, background: `${strengthColor}10` }}>
                                        <span className="cd-strength-dot" style={{ background: strengthColor }} />
                                        {strengthLabel}
                                    </div>
                                    <h2>Profile Strength</h2>
                                    <p>
                                        {resumes.length
                                            ? 'Your resume is ready for matching. Keep improving it as you gain new skills and experience.'
                                            : 'Upload your first resume to build a skill profile and receive match insights.'}
                                    </p>
                                </div>
                            </div>

                            <div
                                className={`cd-dropzone ${isDragging ? 'cd-dropzone-active' : ''} ${uploading ? 'cd-dropzone-uploading' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => !uploading && fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={handleUploadResume}
                                    hidden
                                />

                                {uploading ? (
                                    <div className="cd-dropzone-uploading-content">
                                        <div className="cd-upload-spinner" />
                                        <span>Analyzing your resume…</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="cd-dropzone-icon">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                                <polyline points="14,2 14,8 20,8" />
                                                <line x1="12" y1="18" x2="12" y2="12" />
                                                <polyline points="9,15 12,12 15,15" />
                                            </svg>
                                        </div>
                                        <strong>Drop your resume here</strong>
                                        <span className="cd-dropzone-hint">or click to browse · PDF only</span>
                                    </>
                                )}
                            </div>
                        </motion.section>

                        {/* ── METRICS ── */}
                        <motion.section
                            className="cd-metrics"
                            custom={1}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                        >
                            <div className="cd-metric-card cd-metric-green">
                                <div className="cd-metric-icon-wrap cd-metric-icon-green">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                        <polyline points="14,2 14,8 20,8" />
                                    </svg>
                                </div>
                                <div className="cd-metric-data">
                                    <span className="cd-metric-value">{animatedResumes}</span>
                                    <span className="cd-metric-label">Resumes</span>
                                </div>
                            </div>

                            <div className="cd-metric-card cd-metric-blue">
                                <div className="cd-metric-icon-wrap cd-metric-icon-blue">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                                    </svg>
                                </div>
                                <div className="cd-metric-data">
                                    <span className="cd-metric-value">{animatedApps}</span>
                                    <span className="cd-metric-label">Applications</span>
                                </div>
                            </div>

                            <div className="cd-metric-card cd-metric-purple">
                                <div className="cd-metric-icon-wrap cd-metric-icon-purple">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
                                        <polyline points="17,6 23,6 23,12" />
                                    </svg>
                                </div>
                                <div className="cd-metric-data">
                                    <span className="cd-metric-value">{animatedMatch}%</span>
                                    <span className="cd-metric-label">Avg. Match</span>
                                </div>
                            </div>
                        </motion.section>

                        {/* ── MAIN GRID ── */}
                        <motion.section
                            className="cd-main-grid"
                            custom={2}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                        >
                            {/* ── Applications Panel ── */}
                            <article className="cd-panel">
                                <div className="cd-panel-header">
                                    <div>
                                        <h2>Recent Applications</h2>
                                        <p className="cd-panel-subtitle">Track where you stand in each hiring process</p>
                                    </div>
                                    {applications.length > 0 && (
                                        <button className="cd-btn cd-btn-ghost" type="button" onClick={goToApplications}>
                                            View all
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="9,18 15,12 9,6" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {applications.length ? (
                                    <motion.div
                                        className="cd-application-list"
                                        variants={staggerContainer}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        {applications.slice(0, 5).map((application) => {
                                            const job = application.job ?? {};
                                            const initial = job.company?.charAt(0)?.toUpperCase() || 'J';

                                            return (
                                                <motion.div
                                                    className="cd-app-row"
                                                    key={application._id}
                                                    variants={staggerItem}
                                                    whileHover={{ x: 4, backgroundColor: '#f8fafc' }}
                                                    transition={{ duration: 0.15 }}
                                                >
                                                    <span className="cd-company-avatar">
                                                        {initial}
                                                    </span>

                                                    <div className="cd-app-info">
                                                        <strong className="cd-app-title">
                                                            {job.title || 'Job opportunity'}
                                                        </strong>
                                                        <span className="cd-app-meta">
                                                            {job.company || 'Company'}
                                                            <span className="cd-dot">·</span>
                                                            {job.location || 'Remote'}
                                                        </span>
                                                    </div>

                                                    <div className="cd-app-right">
                                                        <MatchRing
                                                            score={application.matchScore ?? 0}
                                                            label=""
                                                            size="small"
                                                        />
                                                        <StatusPill status={application.status} />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                ) : (
                                    <div className="cd-empty">
                                        <div className="cd-empty-illustration">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                                            </svg>
                                        </div>
                                        <h3>No applications yet</h3>
                                        <p>Discover roles that match your skills and apply with confidence.</p>
                                        <button className="cd-btn cd-btn-primary" type="button" onClick={goToJobs}>
                                            Browse open roles
                                        </button>
                                    </div>
                                )}
                            </article>

                            {/* ── Skills Panel ── */}
                            <article className="cd-panel">
                                <div className="cd-panel-header">
                                    <div>
                                        <h2>Detected Skills</h2>
                                        <p className="cd-panel-subtitle">
                                            {latestResume
                                                ? `From ${latestResume.fileName}`
                                                : 'Upload a resume to begin'}
                                        </p>
                                    </div>
                                    {detectedSkills.length > 0 && (
                                        <span className="cd-skill-count">
                                            {detectedSkills.length} skills
                                        </span>
                                    )}
                                </div>

                                {detectedSkills.length ? (
                                    <motion.div
                                        className="cd-skill-chips"
                                        variants={staggerContainer}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        {detectedSkills.map((skill, i) => {
                                            const color = chipColors[i % chipColors.length];
                                            return (
                                                <motion.span
                                                    className="cd-chip"
                                                    key={skill}
                                                    variants={chipVariant}
                                                    whileHover={{ scale: 1.06, y: -2 }}
                                                    style={{
                                                        background: color.bg,
                                                        color: color.text,
                                                        borderColor: color.border,
                                                    }}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20,6 9,17 4,12" />
                                                    </svg>
                                                    {skill}
                                                </motion.span>
                                            );
                                        })}
                                    </motion.div>
                                ) : (
                                    <div className="cd-empty">
                                        <div className="cd-empty-illustration">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M12 6v6l4 2" />
                                            </svg>
                                        </div>
                                        <h3>Your skills will appear here</h3>
                                        <p>We automatically extract skills after you upload a resume.</p>
                                    </div>
                                )}
                            </article>
                        </motion.section>

                        {/* ── QUICK TIP FOOTER ── */}
                        <motion.section
                            className="cd-tip"
                            custom={3}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                        >
                            <span className="cd-tip-icon">💡</span>
                            <p>
                                <strong>Tip:</strong> Update your resume regularly with new projects and skills.
                                Employers love candidates who show continuous learning.
                            </p>
                        </motion.section>
                    </motion.div>
                )}
            </AnimatePresence>
        </WorkspaceShell>
    );
}

export default CandidateDashboard;