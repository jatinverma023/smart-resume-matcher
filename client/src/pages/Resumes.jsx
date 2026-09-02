import { useEffect, useMemo, useRef, useState } from 'react';
import { deleteResume, getMyResumes, uploadResume } from '../api/resumes';
import { WorkspaceShell } from '../components/WorkspaceShell';
import { useAuth } from '../context/AuthContext';

function getResumeId(r) { return r?.id ?? r?._id ?? ''; }
function getSkillName(s) { if (typeof s === 'string') return s; return s?.name || ''; }
function getSkillCategory(s) { if (typeof s === 'object' && s?.category) return String(s.category); return 'Skill'; }
function formatSkillName(skill) {
    const n = getSkillName(skill); if (!n) return 'Unknown skill';
    const norm = n.toLowerCase().trim().replace(/[.\\s_-]+/g, '');
    const labels = { nodejs: 'Node.js', nextjs: 'Next.js', tailwindcss: 'Tailwind CSS', restapi: 'REST APIs', mongodb: 'MongoDB', mysql: 'MySQL', javascript: 'JavaScript', typescript: 'TypeScript' };
    return labels[norm] || n;
}
function getFileType(resume) {
    const ft = String(resume?.fileType || '').toLowerCase();
    const fn = String(resume?.fileName || '').toLowerCase();
    if (ft.includes('pdf') || fn.endsWith('.pdf')) return 'PDF';
    if (ft.includes('word') || ft.includes('officedocument') || fn.endsWith('.docx')) return 'DOCX';
    return ft ? ft.split('/').pop().toUpperCase() : 'FILE';
}
function formatDate(d) {
    if (!d) return 'Recently uploaded';
    const date = new Date(d); if (Number.isNaN(date.getTime())) return 'Recently uploaded';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function getFileUrl(fileUrl) {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
    const apiBase = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    const serverBase = apiBase.replace(/\/api\/v1$/, '').replace(/\/api$/, '');
    const norm = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    return `${serverBase}${norm}`;
}

function Resumes() {
    const { token } = useAuth();
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef(null);

    const loadResumes = async () => {
        if (!token) { setResumes([]); setLoading(false); return; }
        try { setLoading(true); setError(''); const data = await getMyResumes(token); setResumes(data.resumes ?? []); }
        catch (e) { setError(e.message || 'Unable to load resumes'); } finally { setLoading(false); }
    };
    useEffect(() => { void loadResumes(); }, [token]);

    const handleUpload = async (event) => {
        const file = event.target.files?.[0]; if (!file) return;
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) { setError('Please upload a PDF resume.'); setSuccess(''); event.target.value = ''; return; }
        try { setUploading(true); setError(''); setSuccess(''); await uploadResume(token, file); await loadResumes(); setSuccess('Resume uploaded and analyzed successfully.'); }
        catch (e) { setError(e.message || 'Unable to upload resume'); } finally { setUploading(false); event.target.value = ''; }
    };
    const handleDelete = async (resume) => {
        const id = getResumeId(resume); if (!id) { setError('Unable to identify this resume.'); return; }
        const ok = window.confirm(`Delete "${resume.fileName}"? This resume will be permanently removed.`); if (!ok) return;
        try { setDeletingId(id); setError(''); setSuccess(''); await deleteResume(token, id); setResumes(cur => cur.filter(item => getResumeId(item) !== id)); setSuccess('Resume deleted successfully.'); }
        catch (e) { setError(e.message || 'Unable to delete resume'); } finally { setDeletingId(null); }
    };
    const handleViewResume = (resume) => {
        if (!resume?.fileUrl) { setError('Resume file is not available.'); return; }
        const url = getFileUrl(resume.fileUrl); if (!url) { setError('Unable to create resume file URL.'); return; }
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const latestResume = resumes[0] ?? null;
    const latestSkills = useMemo(() => latestResume?.skills ?? [], [latestResume]);
    const uniqueSkills = useMemo(() => { const names = latestSkills.map(getSkillName).filter(Boolean).map(n => n.toLowerCase().trim()); return new Set(names).size; }, [latestSkills]);

    return (
        <WorkspaceShell
            title="My Resumes"
            subtitle="Manage your resume profiles and keep your skills ready for matching."
            action={<><input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleUpload} hidden /><button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ padding: '9px 16px', borderRadius: 10, background: '#0f172a', color: '#fff', border: '1px solid #0f172a', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{uploading ? 'Uploading…' : '＋ Upload resume'}</button></>}
        >
            {error && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12, marginBottom: 12 }}>{error}</div>}
            {success && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#065f46', fontSize: 12, marginBottom: 12 }}>{success}</div>}

            {loading ? (
                <div className="pro-card" style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: 50, margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} /><div style={{ fontWeight: 700, color: '#0f172a' }}>Loading your resumes</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Preparing your resume profiles and detected skills.</div></div>
            ) : (
                <>
                    {/* Intro */}
                    <div className="pro-card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                        <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>RESUME INTELLIGENCE</div><h2 style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>Build your strongest profile.</h2><p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.6, maxWidth: 640 }}>Upload multiple versions for different opportunities. Your resume is automatically parsed for matching.</p></div>
                        <div style={{ width: 80, height: 80, borderRadius: 50, border: '1px solid #e2e8f0', background: '#f8fafc', display: 'grid', placeItems: 'center', flexShrink: 0 }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{resumes.length}</div><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#64748b' }}>{resumes.length === 1 ? 'RESUME' : 'RESUMES'}</div></div></div>
                    </div>

                    {/* Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
                        {[
                            ['Resumes', resumes.length, 'Uploaded profiles'],
                            ['Skills detected', uniqueSkills, 'From latest resume'],
                            ['Format', latestResume ? getFileType(latestResume) : '—', 'Latest resume format'],
                            ['Profile', latestResume ? 'ACTIVE' : 'EMPTY', 'Resume availability'],
                        ].map(([label, value, sub]) => (
                            <div key={label} className="pro-card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontSize: 13, color: '#0f172a' }}>◎</div>
                                <div><div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</div><div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{value}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>{sub}</div></div>
                            </div>
                        ))}
                    </div>

                    {/* Library */}
                    <div className="pro-card" style={{ padding: 16, marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}>
                            <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>RESUME LIBRARY</div><h2 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Your resume profiles</h2><p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>Keep different versions available for different jobs.</p></div>
                            <span style={{ padding: '6px 10px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#334155', height: 'fit-content' }}>{resumes.length} {resumes.length === 1 ? 'profile' : 'profiles'}</span>
                        </div>

                        {resumes.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 28, border: '1px dashed #e2e8f0', borderRadius: 12, background: '#f8fafc' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>No resumes uploaded yet</div>
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Upload your first PDF resume and we'll extract the skills automatically.</div>
                                <button onClick={() => fileInputRef.current?.click()} style={{ marginTop: 12, padding: '8px 14px', borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>＋ Upload your first resume</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {resumes.map((resume, idx) => {
                                    const id = getResumeId(resume); const count = resume.skills?.length || 0; const isLatest = idx === 0; const isDeleting = deletingId === id;
                                    return (
                                        <div key={id || `${resume.fileName}-${idx}`} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 0', borderBottom: idx === resumes.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>{getFileType(resume)}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resume.fileName || 'Untitled resume'}</span>{isLatest && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 999, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#065f46' }}>LATEST</span>}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Uploaded {formatDate(resume.createdAt)} • {count} {count === 1 ? 'skill' : 'skills'} detected • AI parsed</div>
                                            </div>
                                            <div style={{ textAlign: 'right', minWidth: 60 }}><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#94a3b8' }}>SKILLS</div><div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{count}</div></div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => handleViewResume(resume)} disabled={isDeleting} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>View</button>
                                                <button onClick={() => handleDelete(resume)} disabled={isDeleting} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fff', color: '#991b1b', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>{isDeleting ? 'Deleting…' : 'Delete'}</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Detected skills */}
                    {latestResume && (
                        <div className="pro-card" style={{ padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}>
                                <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>LATEST PROFILE</div><h2 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Detected skills</h2><p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>From <b style={{ color: '#0f172a' }}>{latestResume.fileName}</b></p></div>
                                <span style={{ padding: '6px 10px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#334155', height: 'fit-content' }}>{latestSkills.length} detected</span>
                            </div>
                            {latestSkills.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 8 }}>
                                    {latestSkills.map((skill, i) => {
                                        const name = getSkillName(skill); if (!name) return null;
                                        return (
                                            <div key={skill?._id || `${name}-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 10, borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>✓</div>
                                                <div style={{ minWidth: 0 }}><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#94a3b8' }}>{getSkillCategory(skill).toUpperCase()}</div><div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatSkillName(skill)}</div></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 28 }}><div style={{ fontWeight: 600, color: '#0f172a' }}>No skills detected</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Try uploading a more detailed resume with your technical experience.</div></div>
                            )}
                        </div>
                    )}
                </>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </WorkspaceShell>
    );
}
export default Resumes;
