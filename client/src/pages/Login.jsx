import { useState } from 'react';

import { useAuth } from '../context/AuthContext';

function Login() {
    const { login } = useAuth();

    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const data = await login(form);
            setSuccess(`Welcome back, ${data.user.name}!`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-background-orb auth-orb-one" />
            <div className="auth-background-orb auth-orb-two" />

            <main className="auth-layout">
                <section className="auth-brand-panel">
                    <div className="auth-brand">
                        <span className="brand-leaf" aria-hidden="true">
                            <i />
                            <b />
                            <em />
                        </span>

                        <span>
                            <strong>Smart Resume</strong>
                            <small>MATCHER</small>
                        </span>
                    </div>

                    <div className="auth-brand-content">
                        <span className="eyebrow-text">
                            AI-POWERED HIRING
                        </span>

                        <h1>
                            Find the right
                            <br />
                            <span>match.</span>
                        </h1>

                        <p>
                            Connect candidates and opportunities through
                            intelligent resume-to-job matching.
                        </p>
                    </div>

                    <div className="auth-brand-footer">
                        <span>Resume intelligence</span>
                        <span>•</span>
                        <span>Skill matching</span>
                        <span>•</span>
                        <span>Hiring workflow</span>
                    </div>
                </section>

                <section className="auth-form-panel">
                    <div className="auth-form-container">
                        <div className="auth-mobile-brand">
                            <span className="brand-leaf" aria-hidden="true">
                                <i />
                                <b />
                                <em />
                            </span>

                            <span>
                                <strong>Smart Resume</strong>
                                <small>MATCHER</small>
                            </span>
                        </div>

                        <div className="auth-heading">
                            <span className="eyebrow-text">
                                WELCOME BACK
                            </span>

                            <h2>Sign in to your workspace</h2>

                            <p>
                                Continue managing your applications,
                                resumes, and opportunities.
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="auth-form"
                        >
                            <div className="auth-field">
                                <label htmlFor="email">Email address</label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="auth-field">
                                <div className="auth-field-label-row">
                                    <label htmlFor="password">
                                        Password
                                    </label>
                                </div>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="auth-message auth-message-error">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="auth-message auth-message-success">
                                    {success}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="auth-submit-button"
                            >
                                {loading ? (
                                    <>
                                        <span className="auth-button-spinner" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign in →'
                                )}
                            </button>
                        </form>

                        <div className="auth-divider">
                            <span />
                            <small>NEW TO SMART RESUME?</small>
                            <span />
                        </div>

                        <a
                            href="/register"
                            className="auth-secondary-link"
                        >
                            Create an account
                        </a>

                        <p className="auth-legal">
                            By continuing, you agree to use the platform
                            responsibly and securely.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Login;