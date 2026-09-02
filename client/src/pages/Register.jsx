import { useState } from 'react';

import { useAuth } from '../context/AuthContext';

function Register() {
    const { register } = useAuth();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'candidate',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

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
            await register(form);

            setSuccess(
                'Account created successfully. You can now sign in.'
            );

            setForm({
                name: '',
                email: '',
                password: '',
                role: 'candidate',
            });
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

            <main className="auth-layout auth-register-layout">
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
                            BUILD YOUR WORKSPACE
                        </span>

                        <h1>
                            Start your
                            <br />
                            <span>next move.</span>
                        </h1>

                        <p>
                            Create your account and use intelligent
                            resume matching to make better hiring
                            decisions.
                        </p>
                    </div>

                    <div className="auth-brand-footer">
                        <span>Candidate matching</span>
                        <span>•</span>
                        <span>Recruiter intelligence</span>
                        <span>•</span>
                        <span>One workspace</span>
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
                                GET STARTED
                            </span>

                            <h2>Create your account</h2>

                            <p>
                                Choose your workspace and start using
                                Smart Resume Matcher.
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="auth-form"
                        >
                            <div className="auth-field">
                                <label htmlFor="name">Full name</label>

                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Your full name"
                                    autoComplete="name"
                                    required
                                />
                            </div>

                            <div className="auth-field">
                                <label htmlFor="email">
                                    Email address
                                </label>

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
                                <label htmlFor="password">
                                    Password
                                </label>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Minimum 8 characters"
                                    minLength={8}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            <div className="auth-field">
                                <label>I am joining as</label>

                                <div className="role-selector">
                                    <label
                                        className={`role-option ${form.role === 'candidate'
                                                ? 'selected'
                                                : ''
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value="candidate"
                                            checked={
                                                form.role === 'candidate'
                                            }
                                            onChange={handleChange}
                                        />

                                        <span className="role-option-icon">
                                            ◇
                                        </span>

                                        <span>
                                            <strong>Candidate</strong>
                                            <small>
                                                Find matching opportunities
                                            </small>
                                        </span>
                                    </label>

                                    <label
                                        className={`role-option ${form.role === 'recruiter'
                                                ? 'selected'
                                                : ''
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value="recruiter"
                                            checked={
                                                form.role === 'recruiter'
                                            }
                                            onChange={handleChange}
                                        />

                                        <span className="role-option-icon">
                                            ◎
                                        </span>

                                        <span>
                                            <strong>Recruiter</strong>
                                            <small>
                                                Find qualified candidates
                                            </small>
                                        </span>
                                    </label>
                                </div>
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
                                        Creating account...
                                    </>
                                ) : (
                                    'Create account →'
                                )}
                            </button>
                        </form>

                        <div className="auth-divider">
                            <span />
                            <small>ALREADY HAVE AN ACCOUNT?</small>
                            <span />
                        </div>

                        <a
                            href="/"
                            className="auth-secondary-link"
                        >
                            Sign in instead
                        </a>

                        <p className="auth-legal">
                            Your account role determines which workspace
                            and features you can access.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Register;