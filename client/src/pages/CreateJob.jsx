import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/config';

function CreateJob() {
    const { user, token } = useAuth();

    const [form, setForm] = useState({
        title: '',
        company: '',
        description: '',
        requiredSkills: '',
        preferredSkills: '',
        location: '',
        employmentType: 'full-time',
        experienceLevel: 'entry',
        status: 'draft',
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

                    employmentType:
                        form.employmentType,

                    experienceLevel:
                        form.experienceLevel,

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
                window.location.href = '/recruiter/jobs';
            }, 700);

        } catch (err) {
            console.error('Create job error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050814] text-white">
            <div className="flex min-h-screen">

                {/* SIDEBAR */}

                <aside className="hidden w-[272px] shrink-0 border-r border-slate-800/80 bg-[#070b16] lg:flex lg:flex-col">

                    <div className="flex h-[104px] items-center border-b border-slate-800/70 px-8">
                        <button
                            onClick={() => {
                                window.location.href = '/';
                            }}
                            className="flex items-center gap-3"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-lg font-bold shadow-lg shadow-blue-500/20">
                                S
                            </div>

                            <div className="text-left">
                                <p className="text-sm font-bold">
                                    Smart Resume
                                </p>

                                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                                    Matcher
                                </p>
                            </div>
                        </button>
                    </div>

                    <div className="flex-1 px-4 py-8">

                        <p className="px-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                            Workspace
                        </p>

                        <nav className="mt-4 space-y-2">

                            <NavItem
                                icon="◆"
                                label="Dashboard"
                                href="/"
                            />

                            <NavItem
                                active
                                icon="○"
                                label="Job listings"
                                href="/recruiter/jobs"
                            />

                            <NavItem
                                icon="□"
                                label="Candidates"
                                href="/candidates"
                            />

                        </nav>

                        <p className="mt-10 px-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                            Account
                        </p>

                        <nav className="mt-4">
                            <NavItem
                                icon="⚙"
                                label="Settings"
                                href="/settings"
                            />
                        </nav>
                    </div>

                    <div className="border-t border-slate-800/70 p-5">
                        <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold">
                                {getInitials(user?.name)}
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {user?.name}
                                </p>

                                <p className="text-xs text-slate-500">
                                    Recruiter
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MAIN */}

                <main className="min-w-0 flex-1">

                    {/* TOP BAR */}

                    <header className="flex min-h-[104px] items-center justify-between border-b border-slate-800/70 px-6 lg:px-10">

                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-400">
                                Recruiter workspace
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Create a new opportunity
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                window.location.href =
                                    '/recruiter/jobs';
                            }}
                            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-900"
                        >
                            ← Back to jobs
                        </button>
                    </header>

                    <div className="mx-auto max-w-[1100px] px-6 py-10 lg:px-10">

                        {/* HEADER */}

                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-400">
                                New opportunity
                            </p>

                            <h1 className="mt-3 text-4xl font-bold tracking-tight">
                                Create a job
                            </h1>

                            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
                                Publish a role and start building your
                                AI-ranked candidate pipeline.
                            </p>
                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={handleSubmit}
                            className="mt-8 space-y-6"
                        >

                            {/* BASIC INFO */}

                            <section className="rounded-[24px] border border-slate-800 bg-[#090f1f] p-6 lg:p-8">

                                <SectionHeader
                                    number="01"
                                    title="Role information"
                                    description="Define the position and company."
                                />

                                <div className="mt-8 grid gap-5 md:grid-cols-2">

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

                            <section className="rounded-[24px] border border-slate-800 bg-[#090f1f] p-6 lg:p-8">

                                <SectionHeader
                                    number="02"
                                    title="Role description"
                                    description="Explain what the candidate will be doing."
                                />

                                <div className="mt-8">

                                    <label className="text-sm font-medium text-slate-300">
                                        Description
                                        <span className="ml-1 text-blue-400">
                                            *
                                        </span>
                                    </label>

                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        rows={7}
                                        placeholder="Describe the role, responsibilities, team, and what the candidate will work on..."
                                        className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-[#050814] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                                        required
                                    />

                                </div>
                            </section>

                            {/* SKILLS */}

                            <section className="rounded-[24px] border border-slate-800 bg-[#090f1f] p-6 lg:p-8">

                                <SectionHeader
                                    number="03"
                                    title="AI matching criteria"
                                    description="These skills are used by the matching engine to rank candidates."
                                />

                                <div className="mt-8 grid gap-6 md:grid-cols-2">

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

                                <div className="mt-5 rounded-xl border border-blue-500/10 bg-blue-500/5 px-4 py-3">
                                    <p className="text-xs leading-5 text-slate-400">
                                        <span className="font-semibold text-blue-400">
                                            Tip:
                                        </span>{' '}
                                        Separate skills with commas. Required
                                        skills have a stronger influence on
                                        the compatibility score.
                                    </p>
                                </div>
                            </section>

                            {/* DEADLINE */}

                            <section className="rounded-[24px] border border-slate-800 bg-[#090f1f] p-6 lg:p-8">

                                <SectionHeader
                                    number="04"
                                    title="Application settings"
                                    description="Optionally define when applications should close."
                                />

                                <div className="mt-8 max-w-md">

                                    <label className="text-sm font-medium text-slate-300">
                                        Application deadline
                                    </label>

                                    <input
                                        type="date"
                                        name="applicationDeadline"
                                        value={form.applicationDeadline}
                                        onChange={handleChange}
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-[#050814] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                                    />

                                </div>
                            </section>

                            {/* FEEDBACK */}

                            {error && (
                                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-sm text-emerald-300">
                                    {success}
                                </div>
                            )}

                            {/* ACTIONS */}

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={() => {
                                        window.location.href =
                                            '/recruiter/jobs';
                                    }}
                                    className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-900"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading
                                        ? 'Creating...'
                                        : form.status === 'open'
                                            ? 'Publish job'
                                            : 'Save draft'}
                                </button>

                            </div>

                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}

function SectionHeader({
    number,
    title,
    description,
}) {
    return (
        <div className="flex items-start gap-4">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-xs font-semibold text-blue-400">
                {number}
            </div>

            <div>
                <h2 className="text-xl font-semibold">
                    {title}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    {description}
                </p>
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
        <div>
            <label className="text-sm font-medium text-slate-300">
                {label}

                {required && (
                    <span className="ml-1 text-blue-400">
                        *
                    </span>
                )}
            </label>

            <input
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-[#050814] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
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
        <div>
            <label className="text-sm font-medium text-slate-300">
                {label}
            </label>

            <select
                name={name}
                value={value}
                onChange={onChange}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-[#050814] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
            >
                {options.map(([optionValue, optionLabel]) => (
                    <option
                        key={optionValue}
                        value={optionValue}
                    >
                        {optionLabel}
                    </option>
                ))}
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
        <div>
            <label className="text-sm font-medium text-slate-300">
                {label}

                {required && (
                    <span className="ml-1 text-blue-400">
                        *
                    </span>
                )}
            </label>

            <input
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-[#050814] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />

            <p
                className={`mt-2 text-xs ${accent === 'required'
                        ? 'text-blue-400'
                        : 'text-slate-500'
                    }`}
            >
                {accent === 'required'
                    ? 'Strongly influences AI compatibility.'
                    : 'Improves ranking when candidates have these skills.'}
            </p>
        </div>
    );
}

function NavItem({
    icon,
    label,
    href,
    active = false,
}) {
    return (
        <button
            onClick={() => {
                window.location.href = href;
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${active
                    ? 'bg-blue-500/10 text-blue-300'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
        >
            <span
                className={`w-5 text-center ${active
                        ? 'text-blue-400'
                        : 'text-slate-600'
                    }`}
            >
                {icon}
            </span>

            {label}
        </button>
    );
}

function parseSkills(value) {
    return value
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);
}

function getInitials(name = '') {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

export default CreateJob;