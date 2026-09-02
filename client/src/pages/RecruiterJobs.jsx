import { useEffect, useMemo, useState } from 'react';
import { getMyJobs } from '../api/jobs';
import { WorkspaceShell } from '../components/WorkspaceShell';
import { useAuth } from '../context/AuthContext';

function formatDate(date) {
    if (!date) return 'Not available';
    const parsed = new Date(date); if (Number.isNaN(parsed.getTime())) return 'Not available';
    return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function getSkillName(skill) { return typeof skill === 'string' ? skill : skill?.name || ''; }
function formatSkill(skill) {
    const name = getSkillName(skill); if (!name) return '';
    const normalized = name.toLowerCase().trim().replace(/[.\\s_-]+/g, '');
    const labels = { nodejs: 'Node.js', nextjs: 'Next.js', mongodb: 'MongoDB', mysql: 'MySQL', javascript: 'JavaScript', typescript: 'TypeScript', tailwindcss: 'Tailwind CSS', restapi: 'REST API' };
    return labels[normalized] || name;
}

function RecruiterJobs() {
    const { token } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadJobs = async () => {
        if (!token) { setJobs([]); setLoading(false); return; }
        try { setLoading(true); setError(''); const data = await getMyJobs(token); setJobs(data.jobs || []); }
        catch (e) { setError(e.message || 'Unable to load job listings.'); } finally { setLoading(false); }
    };
    useEffect(() => { void loadJobs(); }, [token]);

    const stats = useMemo(() => {
        const open = jobs.filter(j => j.status === 'open').length;
        const drafts = jobs.filter(j => j.status === 'draft').length;
        const closed = jobs.filter(j => j.status !== 'open' && j.status !== 'draft').length;
        return { total: jobs.length, open, drafts, closed };
    }, [jobs]);
    const navigate = (path) => { window.location.href = path; };

    if (loading) {
        return (
            <WorkspaceShell title="Job listings" subtitle="Create, manage, and monitor your hiring opportunities." action={<button onClick={() => navigate('/recruiter/jobs/create')} style={{ padding: '9px 16px', borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>＋ Post job</button>}>
                <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: 50, margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} /><div style={{ fontWeight: 700, color: '#0f172a' }}>Loading job listings</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Gathering your latest opportunities.</div></div>
            </WorkspaceShell>
        );
    }

    return (
        <WorkspaceShell
            title="Job listings"
            subtitle="Create, manage, and monitor the opportunities you're hiring for."
            action={<button onClick={() => navigate('/recruiter/jobs/create')} style={{ padding: '9px 16px', borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>＋ Post job</button>}
        >
            {error && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12, marginBottom: 12 }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
                {[
                    ['Total jobs', stats.total, 'All postings'],
                    ['Open', stats.open, 'Accepting applications'],
                    ['Drafts', stats.drafts, 'Not published'],
                    ['Closed', stats.closed, 'Inactive'],
                ].map(([label, value, detail]) => (
                    <div key={label} className="pro-card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontSize: 13, color: '#0f172a' }}>◎</div>
                        <div><div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</div><div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{value}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{detail}</div></div>
                    </div>
                ))}
            </div>

            <div className="pro-card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>OPPORTUNITY MANAGEMENT</div><h2 style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Manage your hiring pipeline.</h2><p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b', maxWidth: 520 }}>Create new roles, update existing postings, and review opportunities.</p></div>
                <button onClick={() => navigate('/candidates')} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>View candidates →</button>
            </div>

            <div className="pro-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}>
                    <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>YOUR OPPORTUNITIES</div><h2 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>All job postings</h2><p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>Review the roles you are currently managing.</p></div>
                    <span style={{ padding: '6px 10px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, height: 'fit-content' }}>{jobs.length} {jobs.length === 1 ? 'posting' : 'postings'}</span>
                </div>

                {jobs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 32 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: '#64748b' }}>＋</div><div style={{ fontWeight: 700, color: '#0f172a' }}>No jobs yet</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Create your first opening to start receiving applications.</div><button onClick={() => navigate('/recruiter/jobs/create')} style={{ marginTop: 12, padding: '8px 14px', borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Post a job</button></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {jobs.map((job, idx) => {
                            const req = (job.requiredSkills ?? []).map(getSkillName).filter(Boolean);
                            return (
                                <div key={job._id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: idx === jobs.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>{job.title?.[0]?.toUpperCase() || 'J'}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title || 'Untitled role'}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{job.company || 'Company'} • {job.location || 'Remote'} • {job.employmentType || 'Full-time'} • {formatDate(job.createdAt)}</div>
                                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>{req.slice(0, 3).map(s => <span key={s} style={{ fontSize: 10, padding: '3px 7px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontWeight: 600 }}>{formatSkill(s)}</span>)}{req.length > 3 && <span style={{ fontSize: 10, padding: '3px 7px', borderRadius: 999, background: '#fff', border: '1px solid #e2e8f0', color: '#64748b' }}>+{req.length - 3}</span>}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                                        <span style={{ padding: '6px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, border: '1px solid #e2e8f0', background: job.status === 'open' ? '#f0fdf4' : job.status === 'draft' ? '#fef9c3' : '#f1f5f9', color: job.status === 'open' ? '#065f46' : '#334155' }}>{job.status || 'open'}</span>
                                        <button onClick={() => navigate(`/recruiter/jobs/${job._id}`)} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Manage</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </WorkspaceShell>
    );
}
export default RecruiterJobs;
