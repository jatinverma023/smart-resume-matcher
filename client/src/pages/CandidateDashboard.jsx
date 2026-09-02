// CandidateDashboard.jsx — SIMPLE PROFESSIONAL EDITION
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

import { getCandidateDashboard } from '../api/dashboard';
import { getMyResumes, uploadResume } from '../api/resumes';
import {
    StatusPill,
    WorkspaceShell,
} from '../components/WorkspaceShell';

/* helpers */
function getSkillName(skill) { return typeof skill === 'string' ? skill : skill?.name; }
function getSkillCategory(skill) { return typeof skill === 'object' && skill?.category ? skill.category : 'General'; }
function getGreeting() { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; }

function useCountUp(target, duration = 1000) {
    const [c, setC] = useState(0);
    useEffect(() => {
        if (target === 0) { setC(0); return; }
        let s = 0; const step = target / (duration / 16);
        const t = setInterval(() => { s += step; if (s >= target) { setC(target); clearInterval(t); } else setC(Math.floor(s)); }, 16);
        return () => clearInterval(t);
    }, [target, duration]);
    return c;
}

function DashboardSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ height: 180, borderRadius: 16, background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: 90, borderRadius: 12, background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
                {[1, 2].map(i => <div key={i} style={{ height: 300, borderRadius: 16, background: '#f1f5f9' }} />)}
            </div>
        </div>
    );
}

const fade = { hidden: { opacity: 0, y: 12 }, visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } }) };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function CandidateDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const fileRef = useRef(null);
    const [filter, setFilter] = useState('All');

    const MOCK = {
        applications: [
            { _id: 'a1', job: { title: 'Senior Frontend Engineer', company: 'Flipkart', location: 'Bengaluru · Remote', type: 'Full-time' }, matchScore: 91, status: 'shortlisted', date: '12 Aug 2026' },
            { _id: 'a2', job: { title: 'Full-Stack Developer', company: 'Swiggy', location: 'Remote', type: 'Full-time' }, matchScore: 84, status: 'interview', date: '10 Aug 2026' },
            { _id: 'a3', job: { title: 'React Developer', company: 'PhonePe', location: 'Pune', type: 'Full-time' }, matchScore: 76, status: 'applied', date: '08 Aug 2026' },
        ],
        resumes: [{ _id: 'r1', fileName: 'Alex_Candidate_Resume.pdf', skills: [{ name: 'React', category: 'Frontend' }, { name: 'TypeScript', category: 'Programming' }, { name: 'Node.js', category: 'Backend' }, { name: 'Tailwind CSS', category: 'Frontend' }, { name: 'MongoDB', category: 'Databases' }, { name: 'PostgreSQL', category: 'Databases' }, { name: 'Docker', category: 'DevOps & Cloud' }, { name: 'AWS', category: 'DevOps & Cloud' }, { name: 'Python', category: 'Programming' }, { name: 'Git', category: 'Tools' }] }],
        averageMatchScore: 83,
    };

    useEffect(() => {
        let off = false;
        async function load() {
            const isPreview = typeof window !== 'undefined' && window.location.search.includes('preview');
            try {
                const token = localStorage.getItem('token');
                if (!token && isPreview) { await new Promise(r => setTimeout(r, 600)); if (!off) setDashboard(MOCK); return; }
                const data = await getCandidateDashboard(token);
                if (!off) setDashboard(data.dashboard);
            } catch (e) {
                if (!off) {
                    if (typeof window !== 'undefined' && window.location.search.includes('preview')) { setDashboard(MOCK); setError(''); }
                    else setError(e.message || 'Unable to load dashboard');
                }
            } finally { if (!off) setLoading(false); }
        }
        void load(); return () => { off = true; };
    }, []);

    const apps = useMemo(() => dashboard?.applications ?? [], [dashboard]);
    const resumes = useMemo(() => dashboard?.resumes ?? [], [dashboard]);
    const latest = resumes[0];
    const skills = useMemo(() => (latest?.skills ?? []).map(s => ({ name: getSkillName(s), cat: getSkillCategory(s) })).filter(s => s.name), [latest]);
    const cats = useMemo(() => ['All', ...Array.from(new Set(skills.map(s => s.cat)))], [skills]);
    const filtered = useMemo(() => filter === 'All' ? skills : skills.filter(s => s.cat === filter), [skills, filter]);

    const strength = resumes.length ? Math.min(100, 55 + Math.min(skills.length * 5, 45)) : 0;
    const avg = Math.round(Number(dashboard?.averageMatchScore ?? 0));
    const cResumes = useCountUp(resumes.length);
    const cApps = useCountUp(apps.length);
    const cAvg = useCountUp(avg);
    const cStr = useCountUp(strength, 1200);

    const processFile = useCallback(async (file) => {
        if (!file) return;
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) { toast.error('Please upload a PDF.'); return; }
        try { setUploading(true); setError(''); const token = localStorage.getItem('token'); await uploadResume(token, file); const r = await getMyResumes(token); setDashboard(c => c && ({ ...c, resumes: r.resumes ?? [] })); toast.success('Resume uploaded'); } catch (e) { toast.error(e.message || 'Upload failed'); } finally { setUploading(false); }
    }, []);
    const onUpload = async (e) => { await processFile(e.target.files?.[0]); e.target.value = ''; };
    const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
    const onDragLeave = (e) => { e.preventDefault(); setDragging(false); };
    const onDrop = async (e) => { e.preventDefault(); setDragging(false); await processFile(e.dataTransfer.files?.[0]); };
    const goJobs = () => window.location.href = '/jobs';
    const goApps = () => window.location.href = '/applications';

    const label = strength >= 80 ? 'Excellent' : strength >= 60 ? 'Strong' : strength >= 30 ? 'In progress' : 'Get started';
    const next = strength < 60 ? 60 : strength < 80 ? 80 : 100;

    return (
        <WorkspaceShell
            title={`${getGreeting()} 👋`}
            subtitle="Track applications, keep your resume sharp, and find roles that fit."
            action={
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={goApps} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Applications</button>
                    <button onClick={goJobs} style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Find jobs →</button>
                </div>
            }
        >
            <Toaster position="top-right" toastOptions={{ style: { background: '#0f172a', color: '#fff', borderRadius: 12, fontSize: 13 } }} />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&display=swap');
                *{ font-family: Inter, system-ui, -apple-system, sans-serif; }
                .pro-card{ background:#fff; border:1px solid #e2e8f0; border-radius:16px; }
                .pro-shadow{ box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04); }
                .pro-ring{ --v: 0; --c: #0f172a; width:96px; height:96px; border-radius:50%; display:grid; place-items:center; background: conic-gradient(var(--c) calc(var(--v)*1%), #f1f5f9 0); position:relative; flex-shrink:0; }
                .pro-ring::before{ content:''; position:absolute; inset:8px; border-radius:50%; background:#fff; }
                .pro-ring > span{ position:relative; z-index:1; text-align:center; line-height:1; }
                .pro-grid{ display:grid; grid-template-columns: 1.35fr 0.85fr; gap:16px; }
                .pro-bento{ display:grid; grid-template-columns: 1.45fr 1fr; gap:16px; }
                .pro-metric{ display:flex; align-items:center; gap:12px; padding:16px; }
                .pro-icon{ width:40px; height:40px; border-radius:10px; display:grid; place-items:center; font-size:14px; flex-shrink:0; border:1px solid #e2e8f0; background:#f8fafc; color:#0f172a; }
                .pro-chip{ display:inline-flex; align-items:center; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:600; border:1px solid #e2e8f0; background:#f8fafc; color:#334155; }
                .pro-chip-dark{ background:#0f172a; color:#fff; border-color:#0f172a; }
                @media(max-width: 980px){ .pro-grid, .pro-bento{ grid-template-columns:1fr; } }
            `}</style>

            <AnimatePresence mode="wait">
                {loading ? <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><DashboardSkeleton /></motion.div>
                    : error && !dashboard ? <motion.div key="e" style={{ textAlign: 'center', padding: 40, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16 }}><p>{error}</p><button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Retry</button></motion.div>
                        : (
                            <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                                {/* HERO — clean, professional */}
                                <motion.section className="pro-card pro-shadow" custom={0} initial="hidden" animate="visible" variants={fade} style={{ padding: 22, display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                                    <div className="pro-grid">
                                        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                                            <div className="pro-ring" style={{ '--v': cStr, '--c': '#0f172a' }}>
                                                <span>
                                                    <strong style={{ display: 'block', fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>{cStr}%</strong>
                                                    <small style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#64748b' }}>STRENGTH</small>
                                                </span>
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#0f172a', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '5px 8px', borderRadius: 999 }}>
                                                    <span style={{ width: 6, height: 6, borderRadius: 50, background: '#10b981', display: 'inline-block' }} /> {label.toUpperCase()}
                                                </div>
                                                <h2 style={{ margin: '10px 0 6px', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', lineHeight: 1.2 }}>Your profile is {label.toLowerCase()}</h2>
                                                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#64748b', maxWidth: 520 }}>
                                                    {resumes.length ? <>Based on <b style={{ color: '#0f172a' }}>{skills.length} skills</b> from <b style={{ color: '#0f172a' }}>{latest?.fileName}</b>. Avg. match <b style={{ color: '#0f172a' }}>{avg}%</b> across applications.</> : 'Upload a PDF resume to get a strength score and instant job matches.'}
                                                </p>
                                                <div style={{ marginTop: 12, height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', maxWidth: 420 }}>
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${strength}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: '#0f172a', borderRadius: 999 }} />
                                                </div>
                                                <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>{strength}% • {next - strength > 0 ? `${next - strength}% to ${next}%` : 'All set'} • {resumes.length} resume{resumes.length !== 1 ? 's' : ''}</div>
                                            </div>
                                        </div>

                                        <div
                                            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                                            onClick={() => !uploading && fileRef.current?.click()}
                                            style={{
                                                border: `1px dashed ${dragging ? '#0f172a' : '#cbd5e1'}`, borderRadius: 14, background: dragging ? '#f8fafc' : '#fff',
                                                padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer', minHeight: 160, transition: 'all 0.15s'
                                            }}>
                                            <input ref={fileRef} type="file" accept=".pdf,application/pdf" onChange={onUpload} hidden />
                                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', marginBottom: 10 }}>
                                                {uploading ? <span style={{ width: 18, height: 18, border: '2px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: 50, display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> : <span style={{ fontSize: 18 }}>＋</span>}
                                            </div>
                                            <strong style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{uploading ? 'Analyzing…' : 'Upload resume'}</strong>
                                            <span style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{uploading ? 'Extracting skills' : 'Drag & drop PDF, or click to browse'}</span>
                                            <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, background: '#f8fafc', border: '1px solid #f1f5f9', padding: '4px 8px', borderRadius: 999 }}>PDF • 5 MB max</span>
                                            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                                        </div>
                                    </div>
                                </motion.section>

                                {/* METRICS */}
                                <motion.section custom={1} initial="hidden" animate="visible" variants={fade} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 12 }}>
                                    {[
                                        { k: 'Resumes', v: cResumes, sub: 'Ready to match', icon: '▤' },
                                        { k: 'Applications', v: cApps, sub: 'In progress', icon: '◎' },
                                        { k: 'Average match', v: `${cAvg}%`, sub: 'Across all roles', icon: '✦' },
                                    ].map((m, i) => (
                                        <motion.div key={m.k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }} className="pro-card pro-metric pro-shadow" whileHover={{ y: -1 }}>
                                            <div className="pro-icon">{m.icon}</div>
                                            <div><div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', lineHeight: 1 }}>{m.v}</div><div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#64748b', marginTop: 2 }}>{m.k.toUpperCase()}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{m.sub}</div></div>
                                        </motion.div>
                                    ))}
                                </motion.section>

                                {/* BENTO */}
                                <motion.section className="pro-bento" custom={2} initial="hidden" animate="visible" variants={fade} style={{ marginTop: 12 }}>
                                    {/* Applications */}
                                    <div className="pro-card" style={{ padding: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, marginBottom: 12 }}>
                                            <div><h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Recent applications</h3><p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Your latest 3 submissions</p></div>
                                            {apps.length > 0 && <button onClick={goApps} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>View all →</button>}
                                        </div>
                                        {apps.length ? (
                                            <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {apps.slice(0, 3).map(a => {
                                                    const j = a.job ?? {};
                                                    return (
                                                        <motion.div key={a._id} variants={item} whileHover={{ y: -1 }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, border: '1px solid #f1f5f9', background: '#fff', transition: 'all 0.15s' }}>
                                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, color: '#0f172a', flexShrink: 0 }}>{j.company?.[0]?.toUpperCase() || 'J'}</div>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title || 'Job opportunity'}</div>
                                                                <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.company} • {j.location}</div>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 7px', borderRadius: 999 }}>{a.matchScore ?? 0}%</span>
                                                                <StatusPill status={a.status} />
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </motion.div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '22px 12px', border: '1px dashed #e2e8f0', borderRadius: 12, background: '#f8fafc' }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>No applications yet</div>
                                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Apply to a job to see it here.</div>
                                                <button onClick={goJobs} style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Browse jobs</button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Skills */}
                                    <div className="pro-card" style={{ padding: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, marginBottom: 10 }}>
                                            <div><h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Your skills</h3><p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{latest ? latest.fileName : 'No resume yet'}</p></div>
                                            {skills.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, background: '#0f172a', color: '#fff', padding: '4px 8px', borderRadius: 999 }}>{skills.length}</span>}
                                        </div>
                                        {skills.length ? (
                                            <>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                                                    {cats.map(c => (
                                                        <button key={c} onClick={() => setFilter(c)} style={{ padding: '5px 9px', borderRadius: 999, border: '1px solid', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: filter === c ? '#0f172a' : '#fff', color: filter === c ? '#fff' : '#334155', borderColor: filter === c ? '#0f172a' : '#e2e8f0' }}>{c}</button>
                                                    ))}
                                                </div>
                                                <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                    <AnimatePresence mode="popLayout">
                                                        {filtered.map((s, i) => (
                                                            <motion.span key={`${s.name}-${i}`} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }} className="pro-chip">{s.name}</motion.span>
                                                        ))}
                                                    </AnimatePresence>
                                                </motion.div>
                                                <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <span style={{ fontSize: 11, color: '#64748b' }}>{filtered.length} shown</span>
                                                    <button onClick={() => window.location.href = '/resumes'} style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Manage resumes</button>
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '22px 12px', border: '1px dashed #e2e8f0', borderRadius: 12, background: '#f8fafc' }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>No skills yet</div>
                                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Upload a resume — skills appear automatically.</div>
                                            </div>
                                        )}
                                    </div>
                                </motion.section>

                                {/* Footer tip — minimal */}
                                <motion.div custom={3} initial="hidden" animate="visible" variants={fade} style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', padding: 14, borderRadius: 14, background: '#fff', border: '1px solid #e2e8f0' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 14 }}>✦</div>
                                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Keep it sharp</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.5 }}>Add projects with your top 3 skills — recruiters filter by them and your match improves.</div></div>
                                    <button onClick={goJobs} style={{ padding: '8px 12px', borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>Find roles</button>
                                </motion.div>

                            </motion.div>
                        )}
            </AnimatePresence>
        </WorkspaceShell>
    );
}
