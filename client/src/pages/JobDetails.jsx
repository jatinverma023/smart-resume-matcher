import { useEffect, useMemo, useState } from 'react';
import { applyToJob, getMyApplications } from '../api/applications';
import { calculateMatch, getJob } from '../api/jobs';
import { getMyResumes } from '../api/resumes';
import { MatchRing, StatusPill, WorkspaceShell } from '../components/WorkspaceShell';
import { useAuth } from '../context/AuthContext';

const skillLabels = { nodejs: 'Node.js', nextjs: 'Next.js', tailwindcss: 'Tailwind CSS', restapi: 'REST APIs' };
function getSkillName(skill) { if (typeof skill === 'string') return skill; return skill?.name || ''; }
function formatSkill(skill) { const n = getSkillName(skill); const norm = n.toLowerCase().trim().replace(/[.\\s_-]+/g, ''); return skillLabels[norm] || n; }
function getResumeId(r) { return r?.id ?? r?._id ?? ''; }

function JobDetails() {
    const { token } = useAuth();
    const jobId = window.location.pathname.split('/')[2];
    const [job, setJob] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [selectedResume, setSelectedResume] = useState('');
    const [match, setMatch] = useState(null);
    const [existingApplication, setExistingApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [matching, setMatching] = useState(false);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        let cancelled = false;
        async function loadData() {
            try {
                setLoading(true); setError('');
                const [jobData, resumeData, applicationData] = await Promise.all([getJob(token, jobId), getMyResumes(token), getMyApplications(token)]);
                const availableResumes = resumeData.resumes ?? [];
                const applications = applicationData.applications ?? [];
                const existing = applications.find(a => String(a.job?._id ?? a.job) === String(jobId));
                const appResumeId = existing?.resume?._id ?? existing?.resume;
                const preferred = availableResumes.find(r => String(getResumeId(r)) === String(appResumeId)) ?? availableResumes[0];
                if (!cancelled) {
                    setJob(jobData.job); setResumes(availableResumes); setExistingApplication(existing ?? null);
                    setSelectedResume(getResumeId(preferred));
                    if (existing && existing.matchScore != null) setMatch({ score: Number(existing.matchScore), required: existing.matchAnalysis?.required ?? null, preferred: existing.matchAnalysis?.preferred ?? null });
                }
            } catch (e) { if (!cancelled) setError(e.message || 'Unable to load this job'); }
            finally { if (!cancelled) setLoading(false); }
        }
        if (token && jobId) void loadData(); else setLoading(false);
        return () => { cancelled = true; };
    }, [jobId, token]);

    const resumeOptions = useMemo(() => resumes.map(r => ({ id: getResumeId(r), label: r.fileName || 'Untitled resume' })).filter(r => r.id), [resumes]);
    const requiredSkills = useMemo(() => (job?.requiredSkills ?? []).map(getSkillName).filter(Boolean), [job]);
    const preferredSkills = useMemo(() => (job?.preferredSkills ?? []).map(getSkillName).filter(Boolean), [job]);
    const matchedSkills = useMemo(() => { const s = [...(match?.required?.matchedSkills ?? []), ...(match?.preferred?.matchedSkills ?? [])]; return [...new Set(s.map(getSkillName).filter(Boolean))]; }, [match]);
    const missingRequired = useMemo(() => (match?.required?.missingSkills ?? []).map(getSkillName).filter(Boolean), [match]);
    const missingPreferred = useMemo(() => (match?.preferred?.missingSkills ?? []).map(getSkillName).filter(Boolean), [match]);

    const handleCalculateMatch = async () => {
        if (!selectedResume) { setError('Please select a resume first.'); return; }
        try { setMatching(true); setError(''); setSuccess(''); const data = await calculateMatch(token, selectedResume, jobId); setMatch(data.match ?? null); }
        catch (e) { setError(e.message || 'Unable to calculate your match'); } finally { setMatching(false); }
    };
    const handleApply = async () => {
        if (!selectedResume) { setError('Please select a resume first.'); return; }
        try {
            setApplying(true); setError(''); setSuccess('');
            const data = await applyToJob(token, jobId, selectedResume);
            const app = data.application ?? { status: 'applied', matchScore: match?.score ?? 0 };
            setExistingApplication(app);
            if (app.matchScore != null) setMatch(c => ({ ...(c ?? {}), score: Number(app.matchScore) }));
            setSuccess(data.message || 'Application submitted successfully.');
        } catch (e) { setError(e.message || 'Unable to submit your application'); } finally { setApplying(false); }
    };
    const goToJobs = () => { window.location.href = '/jobs'; };
    const goToResumes = () => { window.location.href = '/resumes'; };

    return (
        <WorkspaceShell
            title={loading ? 'Job match' : job?.title || 'Job match'}
            subtitle={loading ? 'Loading job details…' : `${job?.company || 'Company'} · ${job?.location || 'Remote'}`}
            action={<button onClick={goToJobs} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>← All jobs</button>}
        >
            {loading ? (
                <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: 50, margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} /><div style={{ fontWeight: 700, color: '#0f172a' }}>Loading role details</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Preparing the information needed to check your match.</div></div>
            ) : error && !job ? (
                <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}><div style={{ fontWeight: 700, color: '#0f172a' }}>We could not open this job</div><div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>{error}</div><button onClick={goToJobs} style={{ marginTop: 14, padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Back to jobs</button></div>
            ) : (
                <>
                    {error && job && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12, marginBottom: 12 }}>{error}</div>}
                    {success && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#065f46', fontSize: 12, marginBottom: 12 }}>{success}</div>}

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(340px,0.65fr)', gap: 16, alignItems: 'start' }}>
                        {/* Left — job info */}
                        <div className="pro-card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'start', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
                                    <span style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>{job?.company?.[0]?.toUpperCase() || 'J'}</span>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>OPEN OPPORTUNITY</div>
                                        <h2 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>{job?.title || 'Job opportunity'}</h2>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginTop: 4 }}>{job?.company || 'Company'}</div>
                                    </div>
                                </div>
                                <span style={{ padding: '6px 10px', borderRadius: 999, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#065f46', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>Open role</span>
                            </div>

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                                {[['LOC', job?.location || 'Remote'], ['TYPE', job?.employmentType || 'Full-time'], ['EXP', job?.experienceLevel || 'Any level']].map(([k, v]) => (
                                    <span key={k} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', padding: '6px 10px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11, fontWeight: 600, color: '#334155' }}><small style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8' }}>{k}</small>{v}</span>
                                ))}
                            </div>

                            {job?.description && <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}><h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>About the role</h3><p style={{ margin: '8px 0 0', fontSize: 12, lineHeight: 1.7, color: '#475569' }}>{job.description}</p></div>}

                            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Required skills</h3><span style={{ fontSize: 11, color: '#94a3b8' }}>{requiredSkills.length} skills</span></div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{requiredSkills.length ? requiredSkills.map(s => <span key={s} style={{ padding: '6px 10px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#334155' }}>{formatSkill(s)}</span>) : <span style={{ fontSize: 11, color: '#94a3b8' }}>No required skills listed.</span>}</div>
                            </div>
                            {preferredSkills.length > 0 && (
                                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Preferred skills</h3><span style={{ fontSize: 11, color: '#94a3b8' }}>{preferredSkills.length} skills</span></div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{preferredSkills.map(s => <span key={s} style={{ padding: '6px 10px', borderRadius: 999, background: '#fff', border: '1px solid #e2e8f0', fontSize: 11, color: '#64748b' }}>{formatSkill(s)}</span>)}</div>
                                </div>
                            )}
                        </div>

                        {/* Right — match */}
                        <div className="pro-card" style={{ padding: 20, position: 'sticky', top: 16 }}>
                            {!resumeOptions.length ? (
                                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: '#64748b' }}>＋</div>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Add a resume to continue</div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.5 }}>Upload a resume first, then we can show the exact skills that match this role.</div>
                                    <button onClick={goToResumes} style={{ marginTop: 14, padding: '8px 14px', borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Upload a resume</button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, marginBottom: 16 }}>
                                        <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>MATCH ANALYSIS</div><h2 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Your match</h2><div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Compare your resume against this role.</div></div>
                                        {match && <div style={{ width: 56, height: 56, borderRadius: 50, display: 'grid', placeItems: 'center', background: `conic-gradient(#0f172a ${match.score ?? 0}%, #f1f5f9 0)`, position: 'relative' }}><div style={{ position: 'absolute', inset: 4, borderRadius: 50, background: '#fff', display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{Math.round(match.score ?? 0)}%</span></div></div>}
                                    </div>

                                    <label htmlFor="resume-select" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Resume to compare</label>
                                    <select id="resume-select" value={selectedResume} onChange={(e) => { setSelectedResume(e.target.value); setMatch(null); setError(''); setSuccess(''); }} disabled={Boolean(existingApplication)} style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 10px', fontSize: 12, background: '#fff', outline: 'none' }}>
                                        {resumeOptions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    </select>

                                    {existingApplication ? (
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                            <StatusPill status={existingApplication.status || 'applied'} />
                                            <div><strong style={{ fontSize: 12, color: '#0f172a' }}>Application submitted</strong><div style={{ fontSize: 11, color: '#64748b' }}>You have already applied for this role.</div></div>
                                        </div>
                                    ) : (
                                        <button onClick={handleCalculateMatch} disabled={matching} style={{ width: '100%', marginTop: 12, height: 40, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{matching ? 'Analyzing…' : '✦ Calculate match'}</button>
                                    )}

                                    {match && (
                                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, padding: 12 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#64748b' }}>OVERALL COMPATIBILITY</span><strong style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{Math.round(Number(match.score ?? 0))}%</strong>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                                                {[
                                                    ['Required', match.required],
                                                    ['Preferred', match.preferred],
                                                ].map(([title, data]) => (
                                                    <div key={title} style={{ padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#334155' }}><span>{title}</span><span style={{ color: '#64748b' }}>{data ? `${data.matched ?? 0}/${data.total ?? 0}` : '—'}</span></div>
                                                        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}><div style={{ height: '100%', width: `${Math.min(100, Number(data?.coverage ?? 0))}%`, background: '#0f172a', borderRadius: 999 }} /></div>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginTop: 6, textAlign: 'right' }}>{Math.round(Number(data?.coverage ?? 0))}%</div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                                                <div><h4 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#334155' }}>Matched skills</h4><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{matchedSkills.length ? matchedSkills.map(s => <span key={s} style={{ padding: '5px 9px', borderRadius: 999, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 10, fontWeight: 600, color: '#065f46' }}>{formatSkill(s)}</span>) : <span style={{ fontSize: 11, color: '#94a3b8' }}>No matching skills yet.</span>}</div></div>
                                                <div><h4 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#334155' }}>Missing required</h4><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{missingRequired.length ? missingRequired.map(s => <span key={s} style={{ padding: '5px 9px', borderRadius: 999, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 10, fontWeight: 600, color: '#991b1b' }}>{formatSkill(s)}</span>) : <span style={{ fontSize: 11, color: '#94a3b8' }}>None missing.</span>}</div></div>
                                            </div>
                                            {missingPreferred.length > 0 && <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}><h4 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#334155' }}>Missing preferred</h4><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{missingPreferred.map(s => <span key={s} style={{ padding: '5px 9px', borderRadius: 999, background: '#fff', border: '1px solid #e2e8f0', fontSize: 10, color: '#64748b' }}>{formatSkill(s)}</span>)}</div></div>}
                                            {!existingApplication && <button onClick={handleApply} disabled={applying} style={{ width: '100%', marginTop: 16, height: 42, borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{applying ? 'Submitting…' : 'Apply with this resume →'}</button>}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </WorkspaceShell>
    );
}
function MatchBreakdown() { return null; }
export default JobDetails;
