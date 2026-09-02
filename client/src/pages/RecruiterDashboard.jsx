import { useEffect, useMemo, useState } from 'react';
import { getJobStats, getMyJobs } from '../api/jobs';
import { getJobApplicants } from '../api/applications';
import { WorkspaceShell } from '../components/WorkspaceShell';
import { useAuth } from '../context/AuthContext';

function getInitials(name = '') {
    return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'C';
}

function RecruiterDashboard() {
    const { user, token } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [jobStats, setJobStatsMap] = useState({});
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadDashboard = async () => {
            if (!token) { setLoading(false); return; }
            try {
                setLoading(true); setError('');
                const jobsData = await getMyJobs(token);
                const recruiterJobs = jobsData.jobs || [];
                setJobs(recruiterJobs);
                if (recruiterJobs.length === 0) { setJobStatsMap({}); setApplications([]); return; }
                const results = await Promise.all(recruiterJobs.map(async (job) => {
                    const jobId = job._id || job.id;
                    try {
                        const [statsData, applicationsData] = await Promise.all([getJobStats(token, jobId), getJobApplicants(token, jobId)]);
                        return { jobId, stats: statsData.stats || null, applications: applicationsData.applications || [] };
                    } catch (e) { return { jobId, stats: null, applications: [] }; }
                }));
                const statsMap = {}; results.forEach(r => { statsMap[r.jobId] = r.stats; });
                setJobStatsMap(statsMap);
                setApplications(results.flatMap(r => r.applications));
            } catch (err) { setError(err.message || 'Unable to load recruiter dashboard'); }
            finally { setLoading(false); }
        };
        void loadDashboard();
    }, [token]);

    const openJobs = jobs.filter(j => j.status === 'open').length;
    const totalApplicants = applications.length;
    const averageMatch = useMemo(() => {
        if (!applications.length) return 0;
        const scores = applications.map(a => Number(a.matchScore)).filter(Number.isFinite);
        if (!scores.length) return 0;
        return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length * 100) / 100;
    }, [applications]);
    const shortlisted = applications.filter(a => a.status === 'shortlisted').length;
    const interviewed = applications.filter(a => a.status === 'interview').length;
    const hired = applications.filter(a => a.status === 'hired').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    const applied = applications.filter(a => a.status === 'applied').length;
    const recentApplications = useMemo(() => [...applications].sort((a, b) => new Date(b.appliedAt || b.createdAt || 0) - new Date(a.appliedAt || a.createdAt || 0)).slice(0, 5), [applications]);
    const navigate = (path) => { window.location.href = path; };

    if (loading) {
        return (
            <WorkspaceShell title="Recruiter overview" subtitle="Loading your hiring intelligence...">
                <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: 50, margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} /><div style={{ fontWeight: 700, color: '#0f172a' }}>Loading recruiter workspace…</div></div>
            </WorkspaceShell>
        );
    }

    return (
        <WorkspaceShell
            title={`Welcome, ${user?.name?.split(' ')?.[0] || 'Recruiter'}`}
            subtitle="Hiring intelligence across your active opportunities."
            action={<button onClick={() => navigate('/recruiter/jobs/create')} style={{ padding: '9px 16px', borderRadius: 10, background: '#0f172a', color: '#fff', border: '1px solid #0f172a', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>＋ Post a job</button>}
        >
            {error && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12, marginBottom: 12 }}>{error}</div>}

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 12 }}>
                {[
                    ['Open jobs', openJobs, 'Active'],
                    ['Applicants', totalApplicants, 'Across all jobs'],
                    ['Avg match', `${averageMatch}%`, 'AI score'],
                    ['Shortlisted', shortlisted, 'Progressing'],
                    ['Hired', hired, 'Placed'],
                ].map(([label, value, detail]) => (
                    <div key={label} className="pro-card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontSize: 13, color: '#0f172a' }}>◎</div>
                        <div><div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</div><div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{value}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{detail}</div></div>
                    </div>
                ))}
            </div>

            {/* Hero */}
            <div className="pro-card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>RECRUITER INTELLIGENCE</div><h2 style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>Drive hiring outcomes today.</h2><p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', maxWidth: 520 }}>Review your hiring pipeline, monitor candidate quality, and identify the strongest matches.</p></div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => navigate('/candidates')} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Browse candidates</button>
                    <button onClick={() => navigate('/recruiter/jobs/create')} style={{ padding: '9px 16px', borderRadius: 10, background: '#0f172a', color: '#fff', border: '1px solid #0f172a', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Create job</button>
                </div>
            </div>

            {/* Pipeline */}
            <div className="pro-card" style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}>
                    <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>HIRING INTELLIGENCE</div><h3 style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Hiring pipeline</h3></div><span style={{ padding: '6px 10px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600 }}>Live data</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                    {[
                        ['Applied', applied],
                        ['Shortlisted', shortlisted],
                        ['Interview', interviewed],
                        ['Hired', hired],
                        ['Rejected', rejected],
                    ].map(([label, value]) => {
                        const pct = totalApplicants ? Math.round((value / totalApplicants) * 100) : 0;
                        return (
                            <div key={label} style={{ padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#94a3b8' }}>{label.toUpperCase()}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{value}</div>
                                <div style={{ height: 4, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}><div style={{ height: '100%', width: `${pct}%`, background: '#0f172a', borderRadius: 999 }} /></div>
                                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{pct}%</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent apps + jobs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
                <div className="pro-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}>
                        <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>LATEST INTELLIGENCE</div><h3 style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recent applications</h3></div><span style={{ padding: '6px 10px', borderRadius: 999, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#065f46', fontSize: 11, fontWeight: 700 }}>AI analyzed</span>
                    </div>
                    {recentApplications.length === 0 ? <div style={{ textAlign: 'center', padding: 32 }}><div style={{ fontWeight: 600, color: '#0f172a' }}>No applications yet</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Applications will appear here once candidates apply.</div></div> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {recentApplications.map(app => {
                                const candidate = app.candidate; const job = app.job;
                                return (
                                    <div key={app._id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, color: '#0f172a' }}>{getInitials(candidate?.name)}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{candidate?.name || 'Candidate'}</div><div style={{ fontSize: 11, color: '#64748b' }}>{job?.title || 'Role'} • {Math.round(Number(app.matchScore ?? 0))}% match</div></div>
                                        <span style={{ padding: '4px 8px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 10, fontWeight: 600 }}>{app.status}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="pro-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}>
                        <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>YOUR OPENINGS</div><h3 style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Active jobs</h3></div><span style={{ padding: '6px 10px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600 }}>{jobs.length} total</span>
                    </div>
                    {jobs.length === 0 ? <div style={{ textAlign: 'center', padding: 32 }}><div style={{ fontWeight: 600, color: '#0f172a' }}>No jobs yet</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Create your first opening to start receiving applicants.</div></div> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {jobs.slice(0, 5).map(job => (
                                <div key={job._id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, color: '#0f172a' }}>{job.title?.[0]?.toUpperCase() || 'J'}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{job.location || 'Remote'} • {job.status}</div></div>
                                    <button onClick={() => navigate(`/recruiter/jobs/${job._id}`)} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>Manage</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </WorkspaceShell>
    );
}
export default RecruiterDashboard;
