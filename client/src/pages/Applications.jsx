import { useEffect, useMemo, useState } from 'react';
import { getMyApplications } from '../api/applications';
import { StatusPill, WorkspaceShell } from '../components/WorkspaceShell';
import { useAuth } from '../context/AuthContext';

const timelineSteps = ['applied', 'shortlisted', 'interview', 'hired'];
const statusConfig = {
    applied: { label: 'Application submitted', description: 'Your application is waiting for the recruiter to review.', next: 'The recruiter may shortlist your application.', tone: 'blue' },
    shortlisted: { label: 'You are shortlisted', description: 'The recruiter has shortlisted your profile.', next: 'The next step may be an interview.', tone: 'green' },
    interview: { label: 'Interview stage', description: 'Your application has progressed to the interview stage.', next: 'Check your email for interview details.', tone: 'purple' },
    hired: { label: 'You are hired', description: 'Congratulations! You have been marked as hired.', next: 'Follow the recruiter’s onboarding instructions.', tone: 'green' },
    rejected: { label: 'Application closed', description: 'The recruiter has closed this application.', next: 'Keep exploring other opportunities.', tone: 'red' },
};
function getTimelineState(status, step) {
    if (status === 'rejected') return { completed: step === 'applied', current: false };
    const cur = timelineSteps.indexOf(status); const idx = timelineSteps.indexOf(step);
    return { completed: cur !== -1 && idx < cur, current: cur !== -1 && idx === cur };
}
function formatDate(d) { if (!d) return 'Recently applied'; const date = new Date(d); if (Number.isNaN(date.getTime())) return 'Recently applied'; return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function formatEmploymentType(v) { if (!v) return ''; return v.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
function formatSkillName(skill) { if (typeof skill === 'string') return skill; return skill?.name || 'Unknown skill'; }

function Applications() {
    const { token } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const navigate = (path) => { window.location.href = path; };

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try { setLoading(true); setError(''); const data = await getMyApplications(token); if (!cancelled) setApplications(data.applications ?? []); }
            catch (e) { if (!cancelled) setError(e.message || 'Unable to load applications'); } finally { if (!cancelled) setLoading(false); }
        }
        if (token) void load(); else setLoading(false);
        return () => { cancelled = true; };
    }, [token]);

    const stats = useMemo(() => {
        const total = applications.length;
        const shortlisted = applications.filter(a => a.status === 'shortlisted').length;
        const interviews = applications.filter(a => a.status === 'interview').length;
        const hired = applications.filter(a => a.status === 'hired').length;
        const rejected = applications.filter(a => a.status === 'rejected').length;
        const active = applications.filter(a => !['rejected', 'hired'].includes(a.status)).length;
        const scores = applications.map(a => Number(a.matchScore)).filter(Number.isFinite);
        const avg = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
        return { total, shortlisted, interviews, hired, rejected, active, averageMatch: avg };
    }, [applications]);

    const filteredApplications = useMemo(() => activeFilter === 'all' ? applications : applications.filter(a => a.status === activeFilter), [applications, activeFilter]);

    return (
        <WorkspaceShell
            title="Applications"
            subtitle="Track every opportunity, match score, and hiring-stage update in one place."
            action={<button onClick={() => navigate('/jobs')} style={{ padding: '9px 16px', borderRadius: 10, background: '#0f172a', color: '#fff', border: '1px solid #0f172a', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Discover jobs →</button>}
        >
            {error && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12, marginBottom: 12 }}>{error}</div>}

            {loading ? (
                <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: 50, margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} /><div style={{ fontWeight: 700, color: '#0f172a' }}>Loading your applications</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Gathering your latest updates.</div></div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
                        {[
                            ['Applications', stats.total, 'Total applications'],
                            ['Shortlisted', stats.shortlisted, 'Recruiter selections'],
                            ['Interviews', stats.interviews, 'Interview stage'],
                            ['Hired', stats.hired, 'Successful'],
                        ].map(([label, value, sub]) => (
                            <div key={label} className="pro-card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontSize: 13, color: '#0f172a' }}>◎</div>
                                <div><div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</div><div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{value}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</div></div>
                            </div>
                        ))}
                    </div>

                    {applications.length === 0 ? (
                        <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: '#64748b' }}>◎</div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>No applications yet</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, maxWidth: 400, margin: '6px auto 0' }}>Discover open roles and submit your resume to start building your pipeline.</div>
                            <button onClick={() => navigate('/jobs')} style={{ marginTop: 14, padding: '8px 14px', borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Discover jobs →</button>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr', gap: 12, marginBottom: 12 }}>
                                <div className="pro-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                                    <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>APPLICATION PIPELINE</div><h2 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Your progress</h2><p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>Overview of where your applications stand.</p>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                            {[
                                                ['Active', stats.active],
                                                ['Rejected', stats.rejected],
                                                ['Avg match', `${stats.averageMatch}%`],
                                            ].map(([k, v]) => (
                                                <div key={k} style={{ padding: '8px 10px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9', minWidth: 80 }}><div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>{k.toUpperCase()}</div><div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{v}</div></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ width: 80, height: 80, borderRadius: 50, display: 'grid', placeItems: 'center', background: `conic-gradient(#0f172a ${stats.averageMatch}%, #f1f5f9 0)`, position: 'relative', flexShrink: 0 }}><div style={{ position: 'absolute', inset: 6, borderRadius: 50, background: '#fff', display: 'grid', placeItems: 'center' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{stats.averageMatch}%</div><div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>AVG MATCH</div></div></div></div>
                                </div>
                                <div className="pro-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>CURRENT STATUS</div>
                                    <h2 style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{stats.hired > 0 ? 'Congratulations!' : stats.interviews > 0 ? 'Interview stage' : stats.shortlisted > 0 ? 'You are shortlisted' : 'Keep applying'}</h2>
                                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{stats.hired > 0 ? 'One or more applications reached hired.' : stats.interviews > 0 ? 'You currently have an interview progressing.' : stats.shortlisted > 0 ? 'Recruiters have shortlisted you.' : 'Explore more roles that match your skills.'}</p>
                                    <button onClick={() => navigate('/jobs')} style={{ marginTop: 12, padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', width: 'fit-content' }}>Find more roles</button>
                                </div>
                            </div>

                            <div className="pro-card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                                <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>APPLICATION STATUS</div><h2 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Track your applications</h2></div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {[
                                        ['all', 'All', applications.length],
                                        ['applied', 'Applied', applications.filter(a => a.status === 'applied').length],
                                        ['shortlisted', 'Shortlisted', stats.shortlisted],
                                        ['interview', 'Interview', stats.interviews],
                                        ['hired', 'Hired', stats.hired],
                                        ['rejected', 'Rejected', stats.rejected],
                                    ].map(([key, label, count]) => (
                                        <button key={key} onClick={() => setActiveFilter(key)} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', padding: '6px 10px', borderRadius: 10, border: `1px solid ${activeFilter === key ? '#0f172a' : '#e2e8f0'}`, background: activeFilter === key ? '#0f172a' : '#fff', color: activeFilter === key ? '#fff' : '#334155', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>{label} <span style={{ padding: '2px 6px', borderRadius: 999, background: activeFilter === key ? 'rgba(255,255,255,0.15)' : '#f1f5f9', fontSize: 10 }}>{count}</span></button>
                                    ))}
                                </div>
                            </div>

                            <div className="pro-card" style={{ padding: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}>
                                    <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>APPLICATIONS</div><h2 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Your applications</h2><p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>Status, progress and match details for each opportunity.</p></div>
                                    <span style={{ padding: '6px 10px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, height: 'fit-content' }}>{filteredApplications.length} {filteredApplications.length === 1 ? 'application' : 'applications'}</span>
                                </div>

                                {filteredApplications.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 32 }}><div style={{ width: 40, height: 40, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', margin: '0 auto 10px', color: '#64748b' }}>⌕</div><div style={{ fontWeight: 700, color: '#0f172a' }}>No applications in this stage</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>You don't have any applications with this status.</div></div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {filteredApplications.map(application => {
                                            const status = application.status || 'applied'; const score = Number(application.matchScore); const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
                                            const company = application.job?.company || 'Company'; const title = application.job?.title || 'Job opportunity'; const location = application.job?.location || 'Remote';
                                            const config = statusConfig[status] || statusConfig.applied; const matchAnalysis = application.matchAnalysis; const required = matchAnalysis?.required; const preferred = matchAnalysis?.preferred;
                                            return (
                                                <div key={application._id || application.id} style={{ padding: 16, borderRadius: 14, border: '1px solid #f1f5f9', background: '#fff' }}>
                                                    <div style={{ display: 'flex', gap: 12, alignItems: 'start' }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>{company[0]?.toUpperCase()}</div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                                                <div><h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{title}</h3><p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{company} • {location}</p></div>
                                                                <StatusPill status={status} />
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                                                                <span style={{ padding: '4px 8px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11, color: '#64748b' }}>Applied {formatDate(application.appliedAt || application.createdAt)}</span>
                                                                {application.job?.employmentType && <span style={{ padding: '4px 8px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11, color: '#64748b' }}>{formatEmploymentType(application.job.employmentType)}</span>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, padding: 12, marginTop: 12 }}>
                                                        <div style={{ width: 28, height: 28, borderRadius: 50, background: '#fff', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>{status === 'rejected' ? '!' : status === 'hired' ? '✓' : '→'}</div>
                                                        <div style={{ flex: 1 }}><strong style={{ fontSize: 12, color: '#0f172a' }}>{config.label}</strong><p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{config.description}</p><small style={{ fontSize: 11, color: '#64748b' }}><b>Next:</b> {config.next}</small></div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8' }}>APPLICATION PROGRESS</div>
                                                            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                                                                {timelineSteps.map((step, idx) => {
                                                                    const state = getTimelineState(status, step);
                                                                    return (
                                                                        <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                                <div style={{ width: 20, height: 20, borderRadius: 50, display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 800, border: `1px solid ${state.completed || state.current ? '#0f172a' : '#e2e8f0'}`, background: state.completed ? '#0f172a' : state.current ? '#fff' : '#fff', color: state.completed ? '#fff' : state.current ? '#0f172a' : '#94a3b8' }}>{state.completed ? '✓' : state.current ? '●' : idx + 1}</div>
                                                                                {idx < timelineSteps.length - 1 && <div style={{ flex: 1, height: 1, background: state.completed ? '#0f172a' : '#e2e8f0' }} />}
                                                                            </div>
                                                                            <span style={{ fontSize: 10, fontWeight: 600, color: state.completed || state.current ? '#0f172a' : '#94a3b8', textTransform: 'capitalize' }}>{step}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div style={{ width: 56, height: 56, borderRadius: 50, display: 'grid', placeItems: 'center', background: `conic-gradient(#0f172a ${safeScore}%, #f1f5f9 0)`, position: 'relative', flexShrink: 0 }}><div style={{ position: 'absolute', inset: 4, borderRadius: 50, background: '#fff', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>{safeScore}%</span></div></div>
                                                    </div>

                                                    {matchAnalysis && (
                                                        <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                                                <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: '#94a3b8' }}>AI MATCH ANALYSIS</div><h4 style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Why this role matches your profile</h4></div>
                                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{safeScore}% match</span>
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                                                                {[
                                                                    ['Required', required],
                                                                    ['Preferred', preferred],
                                                                ].map(([label, data]) => (
                                                                    <div key={label} style={{ padding: 10, borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#334155' }}><span>{label} skills</span><strong style={{ color: '#0f172a' }}>{data?.matched ?? 0}/{data?.total ?? 0} matched</strong></div>
                                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>{data?.matchedSkills?.length ? data.matchedSkills.map((s, i) => <span key={`${s}-${i}`} style={{ padding: '3px 7px', borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 10, fontWeight: 600, color: '#065f46' }}>✓ {formatSkillName(s)}</span>) : <span style={{ fontSize: 11, color: '#94a3b8' }}>No skills matched.</span>}</div>
                                                                        {data?.missingSkills?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6, alignItems: 'center' }}><span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: '#94a3b8' }}>Missing</span>{data.missingSkills.map((s, i) => <span key={`${s}-${i}`} style={{ padding: '3px 7px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 10, color: '#991b1b' }}>× {formatSkillName(s)}</span>)}</div>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {status === 'rejected' && <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}><strong style={{ fontSize: 11, color: '#991b1b' }}>Application closed</strong><div style={{ fontSize: 11, color: '#b91c1c' }}>This opportunity is no longer progressing. Your other applications are not affected.</div></div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </WorkspaceShell>
    );
}
export default Applications;
