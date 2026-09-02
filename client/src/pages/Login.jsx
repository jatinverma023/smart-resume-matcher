import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Login() {
    const { login } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            const data = await login(form);
            setSuccess(`Welcome back, ${data.user.name}!`);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(380px,0.9fr) minmax(420px,1.1fr)', background: '#f8fafc' }}>
            <style>{`@media(max-width:900px){ .auth-grid{grid-template-columns:1fr !important} .auth-left{display:none !important} }`}</style>
            <div className="auth-grid" style={{ display: 'contents' }}>
                {/* LEFT — brand */}
                <div className="auth-left" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 56px', background: '#fff', borderRight: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: '#0f172a', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>SR</span>
                        <div><div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em', color: '#0f172a' }}>Smart Resume</div><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: '#64748b' }}>MATCHER</div></div>
                    </div>
                    <div style={{ maxWidth: 460 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: '#64748b' }}>PROFESSIONAL HIRING</div>
                        <h1 style={{ margin: '14px 0 0', fontSize: 44, lineHeight: 0.95, letterSpacing: '-0.04em', color: '#0f172a', fontWeight: 800 }}>Find the right<br /><span style={{ color: '#64748b', fontWeight: 600 }}>match.</span></h1>
                        <p style={{ marginTop: 18, color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>Connect candidates and recruiters through a clean, explainable 70/30 matching engine — no black box.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                        <span>Resume intelligence</span><span>•</span><span>Skill matching</span><span>•</span><span>Hiring workflow</span>
                    </div>
                </div>

                {/* RIGHT — form */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
                    <div style={{ width: '100%', maxWidth: 420, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 28, boxShadow: '0 8px 24px rgba(15,23,42,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, display: 'none' }} className="mobile-only">
                            <span style={{ width: 32, height: 32, borderRadius: 10, background: '#0f172a', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800 }}>SR</span>
                            <span style={{ fontWeight: 800, color: '#0f172a' }}>Smart Resume Matcher</span>
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: '#64748b' }}>WELCOME BACK</div>
                        <h2 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>Sign in to your workspace</h2>
                        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Continue managing applications, resumes and opportunities.</p>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                            <div>
                                <label htmlFor="email" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Email address</label>
                                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required
                                    style={{ width: '100%', height: 42, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 12px', fontSize: 13, outline: 'none' }} />
                            </div>
                            <div>
                                <label htmlFor="password" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Password</label>
                                <input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Enter your password" autoComplete="current-password" required
                                    style={{ width: '100%', height: 42, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 12px', fontSize: 13, outline: 'none' }} />
                            </div>
                            {error && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12 }}>{error}</div>}
                            {success && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#065f46', fontSize: 12 }}>{success}</div>}
                            <button type="submit" disabled={loading} style={{ height: 42, borderRadius: 10, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {loading ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: 50, display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Signing in…</> : 'Sign in →'}
                            </button>
                            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        </form>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
                            <span style={{ flex: 1, height: 1, background: '#e2e8f0' }} /><span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8' }}>NEW TO SMART RESUME?</span><span style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                        </div>
                        <a href="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Create an account</a>
                        <p style={{ marginTop: 16, fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>By continuing, you agree to use the platform responsibly and securely.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Login;
