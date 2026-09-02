import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyJobs } from '../api/jobs';
import { getJobApplicants, updateApplicationStatus } from '../api/applications';
import { WorkspaceShell } from '../components/WorkspaceShell';

function getInitials(name = '') { return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'C'; }
function getSkillName(skill) { return typeof skill === 'string' ? skill : skill?.name || skill?.skill || ''; }
function formatSkill(skill) {
    const name = getSkillName(skill); if (!name) return '';
    const normalized = name.toLowerCase().trim().replace(/[.\\s_-]+/g, '');
    const labels = { nodejs: 'Node.js', nextjs: 'Next.js', mongodb: 'MongoDB', mysql: 'MySQL', javascript: 'JavaScript', typescript: 'TypeScript', tailwindcss: 'Tailwind CSS', restapi: 'REST API' };
    return labels[normalized] || name;
}
function formatDate(date) { if (!date) return '—'; const parsed = new Date(date); if (Number.isNaN(parsed.getTime())) return '—'; return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

function Candidates() {
    const { token } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [loadingApplicants, setLoadingApplicants] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const loadJobs = async () => {
            if (!token) { setLoadingJobs(false); return; }
            try {
                setLoadingJobs(true); setError('');
                const data = await getMyJobs(token);
                if (cancelled) return;
                const recruiterJobs = data.jobs || [];
                setJobs(recruiterJobs);
                if (recruiterJobs.length > 0) {
                    setSelectedJob(cur => cur ? (recruiterJobs.find(j => j._id === cur._id) || recruiterJobs[0]) : recruiterJobs[0]);
                } else setSelectedJob(null);
            } catch (err) { if (!cancelled) setError(err.message || 'Unable to load your jobs.'); }
            finally { if (!cancelled) setLoadingJobs(false); }
        };
        void loadJobs();
        return () => { cancelled = true; };
    }, [token]);

    useEffect(() => {
        let cancelled = false;
        const loadApplicants = async () => {
            if (!token || !selectedJob?._id) { setApplications([]); setLoadingApplicants(false); return; }
            try {
                setLoadingApplicants(true); setError('');
                const data = await getJobApplicants(token, selectedJob._id);
                if (!cancelled) setApplications(data.applications || []);
            } catch (err) { if (!cancelled) setError(err.message || 'Unable to load applicants'); }
            finally { if (!cancelled) setLoadingApplicants(false); }
        };
        void loadApplicants();
        return () => { cancelled = true; };
    }, [token, selectedJob]);

    const averageMatch = useMemo(() => {
        if (!applications.length) return 0;
        const scores = applications.map(a => Number(a.matchScore)).filter(Number.isFinite); if (!scores.length) return 0;
        return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
    }, [applications]);
    const shortlisted = applications.filter(a => a.status === 'shortlisted').length;
    const interviews = applications.filter(a => a.status === 'interview').length;
    const hired = applications.filter(a => a.status === 'hired').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    const activeCandidates = applications.length - rejected - hired;

    const handleStatusChange = async (applicationId, status) => {
        try { setUpdatingId(applicationId); setError(''); await updateApplicationStatus(token, applicationId, status); setApplications(cur => cur.map(a => a._id === applicationId ? { ...a, status } : a)); }
        catch (err) { setError(err.message || 'Unable to update candidate status.'); }
        finally { setUpdatingId(null); }
    };
    const navigate = (path) => { window.location.href = path; };

    if (loadingJobs) {
        return (
            <WorkspaceShell title="Candidates" subtitle="Review applicants ranked by AI compatibility and manage your hiring pipeline." action={<button onClick={() => navigate('/recruiter/jobs')} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>← Job listings</button>}>
                <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: 50, margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} /><div style={{ fontWeight: 700, color: '#0f172a' }}>Loading your jobs</div></div>
            </WorkspaceShell>
        );
    }

    return (
        <WorkspaceShell
            title="Candidates"
            subtitle="Review applicants ranked by AI compatibility and manage your hiring pipeline."
            action={<button onClick={() => navigate('/recruiter/jobs')} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>← Job listings</button>}
        >
            {error && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12, marginBottom: 12 }}>{error}</div>}

            {jobs.length === 0 ? (
                <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: '#64748b' }}>◎</div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>No jobs yet</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Create a job to start receiving candidates.</div>
                    <button onClick={() => navigate('/recruiter/jobs/create')} style={{ marginTop: 12, padding: '8px 14px', borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Create a job</button>
                </div>
            ) : (
                <>
                    <div className="pro-card" style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 12 }}>
                        <div style={{ flex: 1, minWidth: 260 }}>
                            <label htmlFor="job-select" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Select job</label>
                            <select id="job-select" value={selectedJob?._id || ''} onChange={e => { const found = jobs.find(j => j._id === e.target.value); setSelectedJob(found || null); }} style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 10px', fontSize: 13, background: '#fff', outline: 'none' }}>
                                {jobs.map(job => <option key={job._id} value={job._id}>{job.title} — {job.company}</option>)}
                            </select>
                        </div>
                        {selectedJob && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9', minWidth: 180 }}><div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{selectedJob.location || 'Remote'} • {selectedJob.employmentType || 'Full-time'}</div><div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{applications.length} {applications.length === 1 ? 'applicant' : 'applicants'}</div></div>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 12 }}>
                        {[
                            ['Applicants', applications.length, 'Total'],
                            ['Avg match', `${averageMatch}%`, 'AI score'],
                            ['Active', activeCandidates, 'In pipeline'],
                            ['Interviews', interviews, 'Interview'],
                            ['Hired', hired, 'Placed'],
                        ].map(([label, value, detail]) => (
                            <div key={label} className="pro-card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontSize: 13, color: '#0f172a' }}>◎</div>
                                <div><div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</div><div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{value}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{detail}</div></div>
                            </div>
                        ))}
                    </div>

                    {loadingApplicants ? (
                        <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: 50, margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} /><div style={{ fontWeight: 700, color: '#0f172a' }}>Loading applicants</div></div>
                    ) : applications.length === 0 ? (
                        <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: '#64748b' }}>⌕</div><div style={{ fontWeight: 700, color: '#0f172a' }}>No applicants yet</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Share this opportunity to start receiving applications.</div></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[...applications].sort((a, b) => Number(b.matchScore ?? 0) - Number(a.matchScore ?? 0)).map(app => {
                                const candidate = app.candidate; const score = Math.max(0, Math.min(100, Math.round(Number(app.matchScore ?? 0))));
                                const matched = (app.matchAnalysis?.required?.matchedSkills ?? []).map(getSkillName).filter(Boolean);
                                return (
                                    <div key={app._id} className="pro-card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#0f172a' }}>{getInitials(candidate?.name)}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{candidate?.name || 'Candidate'}</span><span style={{ padding: '4px 8px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 10, fontWeight: 600 }}>{app.status || 'applied'}</span></div>
                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{candidate?.email || ''} • Applied {formatDate(app.appliedAt || app.createdAt)}</div>
                                            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>{matched.slice(0, 4).map(s => <span key={s} style={{ fontSize: 10, padding: '3px 7px', borderRadius: 999, background: '#f0fdf4', border: '1px solid #bbf7d0', fontWeight: 600, color: '#065f46' }}>✓ {formatSkill(s)}</span>)}{matched.length > 4 && <span style={{ fontSize: 10, padding: '3px 7px', borderRadius: 999, background: '#fff', border: '1px solid #e2e8f0', color: '#64748b' }}>+{matched.length - 4}</span>}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                                            <div style={{ width: 56, height: 56, borderRadius: 50, display: 'grid', placeItems: 'center', background: `conic-gradient(#0f172a ${score}%, #f1f5f9 0)`, position: 'relative' }}><div style={{ position: 'absolute', inset: 4, borderRadius: 50, background: '#fff', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>{score}%</span></div></div>
                                            <select value={app.status || 'applied'} onChange={e => handleStatusChange(app._id, e.target.value)} disabled={updatingId === app._id} style={{ height: 36, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 8px', fontSize: 12, background: '#fff', outline: 'none' }}>
                                                <option value="applied">Applied</option><option value="shortlisted">Shortlisted</option><option value="interview">Interview</option><option value="hired">Hired</option><option value="rejected">Rejected</option>
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </WorkspaceShell>
    );
}
export default Candidates;
