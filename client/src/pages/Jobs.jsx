import { useEffect, useMemo, useState } from 'react';
import { getJobs } from '../api/jobs';
import { WorkspaceShell } from '../components/WorkspaceShell';
import { useAuth } from '../context/AuthContext';

function getSkillName(skill) { return typeof skill === 'string' ? skill : skill?.name || ''; }

function Jobs() {
    const { token } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [location, setLocation] = useState('all');
    const [selectedJobId, setSelectedJobId] = useState('');

    useEffect(() => {
        let cancelled = false;
        async function loadJobs() {
            try { setLoading(true); setError(''); const data = await getJobs(token); if (!cancelled) setJobs(data.jobs ?? []); }
            catch (e) { if (!cancelled) setError(e.message || 'Unable to load jobs'); }
            finally { if (!cancelled) setLoading(false); }
        }
        if (token) void loadJobs(); else setLoading(false);
        return () => { cancelled = true; };
    }, [token]);

    const locations = useMemo(() => {
        const uniq = [...new Set(jobs.map(j => j.location).filter(Boolean))];
        return ['all', ...uniq];
    }, [jobs]);

    const filteredJobs = useMemo(() => {
        const q = search.trim().toLowerCase();
        return jobs.filter(job => {
            const req = (job.requiredSkills ?? []).map(getSkillName).filter(Boolean);
            const pref = (job.preferredSkills ?? []).map(getSkillName).filter(Boolean);
            const matchesSearch = !q || job.title?.toLowerCase().includes(q) || job.company?.toLowerCase().includes(q) || job.description?.toLowerCase().includes(q) || req.some(s => s.toLowerCase().includes(q)) || pref.some(s => s.toLowerCase().includes(q));
            const matchesLocation = location === 'all' || job.location === location;
            return matchesSearch && matchesLocation;
        });
    }, [jobs, location, search]);

    const selectedJob = filteredJobs.find(j => j._id === selectedJobId) ?? filteredJobs[0] ?? null;

    useEffect(() => {
        if (filteredJobs.length > 0 && !filteredJobs.some(j => j._id === selectedJobId)) setSelectedJobId(filteredJobs[0]._id);
        if (!filteredJobs.length) setSelectedJobId('');
    }, [filteredJobs, selectedJobId]);

    const openJob = (jobId) => { window.location.href = `/jobs/${jobId}`; };
    const goToApplications = () => { window.location.href = '/applications'; };

    return (
        <WorkspaceShell
            title="Discover jobs"
            subtitle="Explore open opportunities and preview the skills each role needs."
            action={<button onClick={goToApplications} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>My applications</button>}
        >
            {/* Filter */}
            <div className="pro-card" style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 180px', gap: 10, marginBottom: 12 }}>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 14 }}>⌕</span>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, skill, company…" aria-label="Search jobs"
                        style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 12px 0 36px', background: '#fff', fontSize: 13, outline: 'none' }} />
                </div>
                <select value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Filter by location"
                    style={{ height: 40, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 10px', background: '#fff', fontSize: 13, outline: 'none' }}>
                    {locations.map(item => <option key={item} value={item}>{item === 'all' ? 'All locations' : item}</option>)}
                </select>
            </div>

            {!loading && !error && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                    <span>{filteredJobs.length} {filteredJobs.length === 1 ? 'opportunity' : 'opportunities'}</span>
                    {(search || location !== 'all') && <button onClick={() => { setSearch(''); setLocation('all'); }} style={{ background: 'transparent', border: 'none', color: '#0f172a', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Clear filters</button>}
                </div>
            )}

            {loading ? (
                <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: 50, margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Finding open opportunities</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Loading the latest roles for you.</div>
                </div>
            ) : error ? (
                <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>We could not load jobs</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>{error}</div>
                    <button onClick={() => window.location.reload()} style={{ marginTop: 14, padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Try again</button>
                </div>
            ) : !filteredJobs.length ? (
                <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: '#64748b' }}>⌕</div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>No jobs found</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Try changing your search terms or location filter.</div>
                    {(search || location !== 'all') && <button onClick={() => { setSearch(''); setLocation('all'); }} style={{ marginTop: 14, padding: '8px 14px', borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Clear filters</button>}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,0.72fr) minmax(0,1.28fr)', gap: 16, alignItems: 'start' }}>
                    {/* List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {filteredJobs.map((job) => {
                            const isSelected = selectedJob?._id === job._id;
                            const req = (job.requiredSkills ?? []).map(getSkillName).filter(Boolean);
                            return (
                                <button key={job._id} onClick={() => setSelectedJobId(job._id)} style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, border: `1px solid ${isSelected ? '#0f172a' : '#e2e8f0'}`, background: isSelected ? '#f8fafc' : '#fff', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s'
                                }}>
                                    <span style={{ width: 40, height: 40, borderRadius: 10, background: isSelected ? '#0f172a' : '#f8fafc', color: isSelected ? '#fff' : '#0f172a', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{job.company?.charAt(0)?.toUpperCase() || 'J'}</span>
                                    <span style={{ flex: 1, minWidth: 0 }}>
                                        <strong style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title || 'Untitled role'}</strong>
                                        <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 2 }}>{job.company || 'Company'}</span>
                                        <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{job.location || 'Remote'} • {job.employmentType || 'Full-time'}</span>
                                        {req.length > 0 && (
                                            <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                                                {req.slice(0, 3).map(s => <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}>{s}</span>)}
                                                {req.length > 3 && <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 999, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b' }}>+{req.length - 3}</span>}
                                            </span>
                                        )}
                                    </span>
                                    <span style={{ color: '#94a3b8', fontSize: 18 }}>›</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Detail */}
                    {selectedJob && (
                        <div className="pro-card" style={{ padding: 20, position: 'sticky', top: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'start', flex: 1, minWidth: 0 }}>
                                    <span style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>{selectedJob.company?.[0]?.toUpperCase() || 'J'}</span>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>OPEN OPPORTUNITY</div>
                                        <h2 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', lineHeight: 1.2 }}>{selectedJob.title || 'Untitled role'}</h2>
                                        <div style={{ fontSize: 13, color: '#334155', fontWeight: 600, marginTop: 4 }}>{selectedJob.company || 'Company'}</div>
                                    </div>
                                </div>
                                <span style={{ padding: '6px 10px', borderRadius: 999, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#065f46', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>Open role</span>
                            </div>

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                                {[
                                    ['LOC', selectedJob.location || 'Remote'],
                                    ['TYPE', selectedJob.employmentType || 'Full-time'],
                                    ['EXP', selectedJob.experienceLevel || 'Any level'],
                                ].map(([k, v]) => (
                                    <span key={k} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', padding: '6px 10px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11, fontWeight: 600, color: '#334155' }}><small style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.06em' }}>{k}</small>{v}</span>
                                ))}
                            </div>

                            {selectedJob.description && (
                                <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                                    <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>About the role</h3>
                                    <p style={{ margin: '8px 0 0', fontSize: 12, lineHeight: 1.7, color: '#475569' }}>{selectedJob.description}</p>
                                </div>
                            )}

                            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Required skills</h3><span style={{ fontSize: 11, color: '#94a3b8' }}>{(selectedJob.requiredSkills ?? []).length} skills</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {(selectedJob.requiredSkills ?? []).length ? (selectedJob.requiredSkills.map(getSkillName).filter(Boolean).map(s => <span key={s} style={{ padding: '6px 10px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#334155' }}>{s}</span>)) : <span style={{ fontSize: 11, color: '#94a3b8' }}>No required skills listed.</span>}
                                </div>
                            </div>

                            {(selectedJob.preferredSkills ?? []).length > 0 && (
                                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Preferred skills</h3><span style={{ fontSize: 11, color: '#94a3b8' }}>{selectedJob.preferredSkills.length} skills</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {selectedJob.preferredSkills.map(getSkillName).filter(Boolean).map(s => <span key={s} style={{ padding: '6px 10px', borderRadius: 999, background: '#fff', border: '1px solid #e2e8f0', fontSize: 11, color: '#64748b' }}>{s}</span>)}
                                    </div>
                                </div>
                            )}

                            <button onClick={() => openJob(selectedJob._id)} style={{ width: '100%', marginTop: 18, height: 42, borderRadius: 10, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Check your match →</button>
                        </div>
                    )}
                </div>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </WorkspaceShell>
    );
}
export default Jobs;
