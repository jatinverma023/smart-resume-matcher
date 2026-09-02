import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Register() {
    const { register } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            await register(form);
            setSuccess('Account created successfully. You can now sign in.');
            setForm({ name: '', email: '', password: '', role: 'candidate' });
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(380px,0.9fr) minmax(420px,1.1fr)', background: '#f8fafc' }}>
            <style>{`@media(max-width:900px){ .auth-grid{grid-template-columns:1fr !important} .auth-left{display:none !important} }`}</style>
            <div className="auth-grid" style={{ display: 'contents' }}>
                <div className="auth-left" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 56px', background: '#fff', borderRight: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: '#0f172a', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>SR</span>
                        <div><div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em', color: '#0f172a' }}>Smart Resume</div><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: '#64748b' }}>MATCHER</div></div>
                    </div>
                    <div style={{ maxWidth: 460 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: '#64748b' }}>BUILD YOUR WORKSPACE</div>
                        <h1 style={{ margin: '14px 0 0', fontSize: 44, lineHeight: 0.95, letterSpacing: '-0.04em', color: '#0f172a', fontWeight: 800 }}>Start your<br /><span style={{ color: '#64748b', fontWeight: 600 }}>next move.</span></h1>
                        <p style={{ marginTop: 18, color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>Create your account and use explainable resume matching to make better hiring decisions.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                        <span>Candidate matching</span><span>•</span><span>Recruiter intelligence</span><span>•</span><span>One workspace</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
                    <div style={{ width: '100%', maxWidth: 420, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28, boxShadow: '0 8px 24px rgba(15,23,42,0.04)' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: '#64748b' }}>GET STARTED</div>
                        <h2 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>Create your account</h2>
                        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Choose your workspace and start using Smart Resume Matcher.</p>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                            <div>
                                <label htmlFor="name" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Full name</label>
                                <input id="name" name="name" type="text" value={form.name} onChange={handleChange} placeholder="Your full name" autoComplete="name" required style={{ width: '100%', height: 42, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 12px', fontSize: 13, outline: 'none' }} />
                            </div>
                            <div>
                                <label htmlFor="email" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Email address</label>
                                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required style={{ width: '100%', height: 42, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 12px', fontSize: 13, outline: 'none' }} />
                            </div>
                            <div>
                                <label htmlFor="password" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Password</label>
                                <input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 characters" minLength={8} autoComplete="new-password" required style={{ width: '100%', height: 42, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 12px', fontSize: 13, outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8 }}>I am joining as</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {[
                                        { id: 'candidate', label: 'Candidate', sub: 'Find matching jobs', icon: '◎' },
                                        { id: 'recruiter', label: 'Recruiter', sub: 'Find qualified talent', icon: '▣' },
                                    ].map(opt => (
                                        <label key={opt.id} style={{ position: 'relative', display: 'flex', gap: 10, padding: 12, border: `1px solid ${form.role === opt.id ? '#0f172a' : '#e2e8f0'}`, borderRadius: 12, background: form.role === opt.id ? '#f8fafc' : '#fff', cursor: 'pointer' }}>
                                            <input type="radio" name="role" value={opt.id} checked={form.role === opt.id} onChange={handleChange} style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
                                            <span style={{ width: 28, height: 28, borderRadius: 8, background: form.role === opt.id ? '#0f172a' : '#f1f5f9', color: form.role === opt.id ? '#fff' : '#334155', display: 'grid', placeItems: 'center', fontSize: 12, flexShrink: 0 }}>{opt.icon}</span>
                                            <span><strong style={{ display: 'block', fontSize: 12, color: '#0f172a' }}>{opt.label}</strong><small style={{ fontSize: 11, color: '#64748b' }}>{opt.sub}</small></span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {error && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12 }}>{error}</div>}
                            {success && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#065f46', fontSize: 12 }}>{success}</div>}
                            <button type="submit" disabled={loading} style={{ height: 42, borderRadius: 10, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {loading ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: 50, display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Creating account…</> : 'Create account →'}
                            </button>
                        </form>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
                            <span style={{ flex: 1, height: 1, background: '#e2e8f0' }} /><span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8' }}>ALREADY HAVE AN ACCOUNT?</span><span style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                        </div>
                        <a href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Sign in instead</a>
                        <p style={{ marginTop: 16, fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>Your role determines which workspace you can access.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Register;
