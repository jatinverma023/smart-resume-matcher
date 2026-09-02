import { useState } from 'react';

import { API_BASE_URL } from '../api/config';
import { useAuth } from '../context/AuthContext';
import { WorkspaceShell } from '../components/WorkspaceShell';

function CreateJob() {
    const { token } = useAuth();

    const [form, setForm] = useState({
        title: '',
        company: '',
        description: '',
        requiredSkills: '',
        preferredSkills: '',
        location: '',
        employmentType: 'full-time',
        experienceLevel: 'entry',
        status: 'open',
        applicationDeadline: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const navigate = (path) => {
        window.location.href = path;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');
        setSuccess('');

        if (!form.title.trim()) {
            setError('Job title is required.');
            return;
        }

        if (!form.company.trim()) {
            setError('Company name is required.');
            return;
        }

        if (!form.description.trim()) {
            setError('Job description is required.');
            return;
        }

        if (!form.requiredSkills.trim()) {
            setError('At least one required skill is required.');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${API_BASE_URL}/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: form.title.trim(),
                    company: form.company.trim(),
                    description: form.description.trim(),
                    requiredSkills: parseSkills(
                        form.requiredSkills
                    ),
                    preferredSkills: parseSkills(
                        form.preferredSkills
                    ),
                    location: form.location.trim(),
                    employmentType: form.employmentType,
                    experienceLevel: form.experienceLevel,
                    status: form.status,
                    applicationDeadline:
                        form.applicationDeadline || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Unable to create job'
                );
            }

            setSuccess('Job created successfully.');

            setTimeout(() => {
                navigate('/recruiter/jobs');
            }, 700);
        } catch (err) {
            console.error('Create job error:', err);

            setError(
                err.message || 'Unable to create job.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <WorkspaceShell
            role="recruiter"
            title="Create a job"
            subtitle="Publish a role and start building your AI-ranked candidate pipeline."
            action={
                <button
                    className="secondary-light-button"
                    type="button"
                    onClick={() =>
                        navigate('/recruiter/jobs')
                    }
                >
                    ← Back to jobs
                </button>
            }
        >
            <form
                className="create-job-form"
                onSubmit={handleSubmit}
            >
                {/* ROLE INFORMATION */}

                <section className="light-panel create-job-section">
                    <SectionHeader
                        number="01"
                        title="Role information"
                        description="Define the position and company."
                    />

                    <div className="create-job-fields">
                        <Field
                            label="Job title"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="e.g. Junior Full Stack Developer"
                            required
                        />

                        <Field
                            label="Company"
                            name="company"
                            value={form.company}
                            onChange={handleChange}
                            placeholder="e.g. SmartTech Solutions"
                            required
                        />

                        <Field
                            label="Location"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="e.g. Bangalore"
                        />

                        <SelectField
                            label="Employment type"
                            name="employmentType"
                            value={form.employmentType}
                            onChange={handleChange}
                            options={[
                                ['full-time', 'Full-time'],
                                ['part-time', 'Part-time'],
                                ['contract', 'Contract'],
                                ['internship', 'Internship'],
                            ]}
                        />

                        <SelectField
                            label="Experience level"
                            name="experienceLevel"
                            value={form.experienceLevel}
                            onChange={handleChange}
                            options={[
                                ['entry', 'Entry level'],
                                ['mid', 'Mid level'],
                                ['senior', 'Senior level'],
                                ['lead', 'Lead'],
                            ]}
                        />

                        <SelectField
                            label="Publishing status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            options={[
                                ['draft', 'Draft'],
                                ['open', 'Open'],
                            ]}
                        />
                    </div>
                </section>

                {/* DESCRIPTION */}

                <section className="light-panel create-job-section">
                    <SectionHeader
                        number="02"
                        title="Role description"
                        description="Explain what the candidate will be doing."
                    />

                    <div className="create-job-full-field">
                        <label className="light-form-label">
                            Description
                            <span>*</span>
                        </label>

                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={8}
                            placeholder="Describe the role, responsibilities, team, and what the candidate will work on..."
                            className="light-textarea"
                            required
                        />

                        <p className="light-field-help">
                            Include responsibilities, technologies,
                            team context, and expectations for the
                            role.
                        </p>
                    </div>
                </section>

                {/* AI MATCHING */}

                <section className="light-panel create-job-section">
                    <SectionHeader
                        number="03"
                        title="AI matching criteria"
                        description="These skills are used by the matching engine to rank candidates."
                    />

                    <div className="create-job-fields">
                        <SkillField
                            label="Required skills"
                            name="requiredSkills"
                            value={form.requiredSkills}
                            onChange={handleChange}
                            placeholder="JavaScript, React, Node.js, MongoDB"
                            required
                            accent="required"
                        />

                        <SkillField
                            label="Preferred skills"
                            name="preferredSkills"
                            value={form.preferredSkills}
                            onChange={handleChange}
                            placeholder="Express, Git, REST API"
                            accent="preferred"
                        />
                    </div>

                    <div className="create-job-tip">
                        <span>TIP</span>

                        <p>
                            Separate skills with commas.
                            Required skills have a stronger
                            influence on the compatibility
                            score.
                        </p>
                    </div>
                </section>

                {/* APPLICATION SETTINGS */}

                <section className="light-panel create-job-section">
                    <SectionHeader
                        number="04"
                        title="Application settings"
                        description="Optionally define when applications should close."
                    />

                    <div className="create-job-deadline">
                        <label className="light-form-label">
                            Application deadline
                        </label>

                        <input
                            type="date"
                            name="applicationDeadline"
                            value={form.applicationDeadline}
                            onChange={handleChange}
                            className="light-field"
                        />

                        <p className="light-field-help">
                            Leave this blank if applications
                            should remain open indefinitely.
                        </p>
                    </div>
                </section>

                {/* FEEDBACK */}

                {error && (
                    <div className="create-job-message create-job-error">
                        <strong>Unable to create job</strong>
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="create-job-message create-job-success">
                        <strong>Job created successfully</strong>
                        <span>
                            Redirecting to your job listings...
                        </span>
                    </div>
                )}

                {/* ACTIONS */}

                <div className="create-job-actions">
                    <button
                        type="button"
                        className="secondary-light-button"
                        onClick={() =>
                            navigate('/recruiter/jobs')
                        }
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="primary-light-button create-job-submit"
                        disabled={loading}
                    >
                        {loading
                            ? 'Creating...'
                            : form.status === 'open'
                                ? 'Publish job →'
                                : 'Save draft →'}
                    </button>
                </div>
            </form>
        </WorkspaceShell>
    );
}

function SectionHeader({
    number,
    title,
    description,
}) {
    return (
        <div className="create-job-section-header">
            <div className="create-job-section-number">
                {number}
            </div>

            <div>
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
        </div>
    );
}

function Field({
    label,
    name,
    value,
    onChange,
    placeholder,
    required = false,
}) {
    return (
        <div className="create-job-field">
            <label className="light-form-label">
                {label}

                {required && <span>*</span>}
            </label>

            <input
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="light-field"
            />
        </div>
    );
}

function SelectField({
    label,
    name,
    value,
    onChange,
    options,
}) {
    return (
        <div className="create-job-field">
            <label className="light-form-label">
                {label}
            </label>

            <select
                name={name}
                value={value}
                onChange={onChange}
                className="light-field light-select"
            >
                {options.map(
                    ([optionValue, optionLabel]) => (
                        <option
                            key={optionValue}
                            value={optionValue}
                        >
                            {optionLabel}
                        </option>
                    )
                )}
            </select>
        </div>
    );
}

function SkillField({
    label,
    name,
    value,
    onChange,
    placeholder,
    required = false,
    accent,
}) {
    return (
        <div className="create-job-field">
            <label className="light-form-label">
                {label}

                {required && <span>*</span>}
            </label>

            <input
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="light-field"
            />

            <p
                className={`create-job-skill-help ${accent === 'required'
                        ? 'required'
                        : 'preferred'
                    }`}
            >
                {accent === 'required'
                    ? 'Strongly influences AI compatibility.'
                    : 'Improves ranking when candidates have these skills.'}
            </p>
        </div>
    );
}

function parseSkills(value) {
    return value
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);
}

export default CreateJob;