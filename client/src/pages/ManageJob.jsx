import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getJobStats, publishJob } from '../api/jobs';
import { getJobApplicants, updateApplicationStatus } from '../api/applications';
import { WorkspaceShell } from '../components/WorkspaceShell';

function getSkillName(skill) { if (typeof skill === 'string') return skill; return skill?.name || skill?.skill || ''; }
function formatSkill(skill) {
    const name = getSkillName(skill); if (!name) return '';
    const normalized = name.toLowerCase().trim().replace(/[.\\s_-]+/g, '');
    const labels = { nodejs: 'Node.js', nextjs: 'Next.js', mongodb: 'MongoDB', mysql: 'MySQL', javascript: 'JavaScript', typescript: 'TypeScript', tailwindcss: 'Tailwind CSS', restapi: 'REST API' };
    return labels[normalized] || name;
}
function formatDate(date) { if (!date) return '—'; const parsed = new Date(date); if (Number.isNaN(parsed.getTime())) return '—'; return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function getInitials(name = '') { return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'C'; }

function ManageJob() {
    const { token } = useAuth();
    const jobId = window.location.pathname.split('/').pop();
    const [stats, setStats] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(null);
    const [publishing, setPublishing] = useState(false);
    const [publishSuccess, setPublishSuccess] = useState('');
    const navigate = (path) => { window.location.href = path; };

    const loadData = async () => {
        if (!token || !jobId) return;
        try {
            setLoading(true); setError('');
            const [statsData, applicantsData] = await Promise.all([getJobStats(token, jobId), getJobApplicants(token, jobId)]);
            setStats(statsData);
            setApplications(applicantsData.applications || []);
        } catch (e) { setError(e.message || 'Unable to load job intelligence.'); }
        finally { setLoading(false); }
    };
    useEffect(() => { void loadData(); }, [token, jobId]);

    const handlePublishJob = async () => {
        if (!token || !jobId) return;
        try { setPublishing(true); setError(''); setPublishSuccess(''); await publishJob(token, jobId); setPublishSuccess('Job published successfully. Candidates can now discover and apply.'); await loadData(); }
        catch (e) { setError(e.message || 'Unable to publish this job.'); } finally { setPublishing(false); }
    };
    const handleStatusChange = async (applicationId, status) => {
        try { setUpdating(applicationId); setError(''); await updateApplicationStatus(token, applicationId, status); setApplications(cur => cur.map(a => a._id === applicationId ? { ...a, status } : a)); }
        catch (e) { setError(e.message || 'Unable to update status'); } finally { setUpdating(null); }
    };

    const averageMatch = useMemo(() => {
        if (!applications.length) return 0;
        const scores = applications.map(a => Number(a.matchScore)).filter(Number.isFinite); if (!scores.length) return 0;
        return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
    }, [applications]);
    const counts = useMemo(() => ({
        applied: applications.filter(a => a.status === 'applied').length,
        shortlisted: applications.filter(a => a.status === 'shortlisted').length,
        interview: applications.filter(a => a.status === 'interview').length,
        hired: applications.filter(a => a.status === 'hired').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    }), [applications]);

    if (loading) {
        return (
            <WorkspaceShell title="Manage job" subtitle="Loading job intelligence...">
                <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: 50, margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} /><div style={{ fontWeight: 700, color: '#0f172a' }}>Loading job intelligence</div></div>
            </WorkspaceShell>
        );
    }

    const job = stats?.job || {};

    return (
        <WorkspaceShell
            title={job.title || 'Manage job'}
            subtitle={`${job.company || 'Company'} • ${job.location || 'Remote'} • ${job.status || 'open'}`}
            action={<><button onClick={() => navigate('/recruiter/jobs')} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>← Jobs</button><button onClick={() => navigate(`/recruiter/jobs/${jobId}/candidates`)} style={{ padding: '9px 14px', borderRadius: 10, background: '#0f172a', color: '#fff', border: '1px solid #0f172a', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Candidates</button></>}
        >
            {error && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12, marginBottom: 12 }}>{error}</div>}
            {publishSuccess && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#065f46', fontSize: 12, marginBottom: 12 }}>{publishSuccess}</div>}

            {/* Job header */}
            <div className="pro-card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>JOB INTELLIGENCE</div>
                    <h2 style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{job.title || 'Job opportunity'}</h2>
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>{job.company || 'Company'} • {stats?.stats ? `${stats.stats.totalApplicants} applicants • Avg ${Math.round(stats.stats.averageMatchScore || 0)}% match` : `${applications.length} applicants • Avg ${averageMatch}% match`} • Created {formatDate(job.createdAt)}</p>
                </div>
                {job.status === 'draft' && <button onClick={handlePublishJob} disabled={publishing} style={{ padding: '9px 16px', borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{publishing ? 'Publishing…' : 'Publish job'}</button>}
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 12 }}>
                {[
                    ['Applicants', stats?.stats?.totalApplicants ?? applications.length, 'Total'],
                    ['Avg match', `${Math.round(stats?.stats?.averageMatchScore ?? averageMatch)}%`, 'AI score'],
                    ['Shortlisted', counts.shortlisted, 'Progressing'],
                    ['Interviews', counts.interview, 'Interview'],
                    ['Hired', counts.hired, 'Placed'],
                ].map(([label, value, detail]) => (
                    <div key={label} className="pro-card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontSize: 13, color: '#0f172a' }}>◎</div>
                        <div><div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</div><div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{value}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{detail}</div></div>
                    </div>
                ))}
            </div>

            {/* Pipeline */}
            <div className="pro-card" style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}>
                    <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>PIPELINE</div><h3 style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Application pipeline</h3></div><span style={{ padding: '6px 10px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600 }}>{applications.length} total</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                    {[
                        ['Applied', counts.applied],
                        ['Shortlisted', counts.shortlisted],
                        ['Interview', counts.interview],
                        ['Hired', counts.hired],
                        ['Rejected', counts.rejected],
                    ].map(([label, value]) => {
                        const total = applications.length || 1; const pct = Math.round((value / total) * 100);
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

            {/* Applicants */}
            <div className="pro-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}>
                    <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>APPLICANTS</div><h3 style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Candidates for this role</h3><p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>Sorted by AI match — update status to move forward.</p></div>
                    <span style={{ padding: '6px 10px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600 }}>{applications.length} {applications.length === 1 ? 'candidate' : 'candidates'}</span>
                </div>

                {applications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 32 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: '#64748b' }}>◎</div><div style={{ fontWeight: 700, color: '#0f172a' }}>No applicants yet</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Share this opportunity to start receiving applications.</div></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[...applications].sort((a, b) => Number(b.matchScore ?? 0) - Number(a.matchScore ?? 0)).map(app => {
                            const candidate = app.candidate; const score = Math.max(0, Math.min(100, Math.round(Number(app.matchScore ?? 0))));
                            return (
                                <div key={app._id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderRadius: 12, border: '1px solid #f1f5f9', background: '#fff' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#0f172a' }}>{getInitials(candidate?.name)}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{candidate?.name || 'Candidate'}</span><span style={{ fontSize: 11, color: '#94a3b8' }}>{candidate?.email || ''}</span></div>
                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Applied {formatDate(app.appliedAt || app.createdAt)} • {app.matchAnalysis?.required ? `${app.matchAnalysis.required.matched ?? 0}/${app.matchAnalysis.required.total ?? 0} required` : ''} {app.matchAnalysis?.preferred ? `• ${app.matchAnalysis.preferred.matched ?? 0}/${app.matchAnalysis.preferred.total ?? 0} preferred` : ''}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                                        <div style={{ width: 56, height: 56, borderRadius: 50, display: 'grid', placeItems: 'center', background: `conic-gradient(#0f172a ${score}%, #f1f5f9 0)`, position: 'relative' }}><div style={{ position: 'absolute', inset: 4, borderRadius: 50, background: '#fff', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>{score}%</span></div></div>
                                        <select value={app.status || 'applied'} onChange={e => handleStatusChange(app._id, e.target.value)} disabled={updating === app._id} style={{ height: 36, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 8px', fontSize: 12, background: '#fff', outline: 'none' }}>
                                            <option value="applied">Applied</option><option value="shortlisted">Shortlisted</option><option value="interview">Interview</option><option value="hired">Hired</option><option value="rejected">Rejected</option>
                                        </select>
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
export default ManageJob;
