import { useState } from 'react';
import { createJob } from '../api/jobs';
import { WorkspaceShell } from '../components/WorkspaceShell';
import { useAuth } from '../context/AuthContext';

function CreateJob() {
    const { token } = useAuth();
    const [form, setForm] = useState({
        title: '', company: '', location: '', employmentType: 'full-time', experienceLevel: 'mid', description: '', requiredSkills: '', preferredSkills: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            const payload = {
                title: form.title, company: form.company, location: form.location, employmentType: form.employmentType, experienceLevel: form.experienceLevel, description: form.description,
                requiredSkills: form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
                preferredSkills: form.preferredSkills.split(',').map(s => s.trim()).filter(Boolean),
            };
            const data = await createJob(token, payload);
            setSuccess(data.message || 'Job created successfully.');
            setForm({ title: '', company: '', location: '', employmentType: 'full-time', experienceLevel: 'mid', description: '', requiredSkills: '', preferredSkills: '' });
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };

    return (
        <WorkspaceShell
            title="Create a new job"
            subtitle="Define the role details and skills needed for the best match."
            action={<button onClick={() => window.location.href = '/recruiter/jobs'} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>← Back to jobs</button>}
        >
            {error && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12, marginBottom: 12 }}>{error}</div>}
            {success && <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#065f46', fontSize: 12, marginBottom: 12 }}>{success}</div>}

            <form onSubmit={handleSubmit} className="pro-card" style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div><label htmlFor="title" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Job title *</label><input id="title" name="title" value={form.title} onChange={handleChange} placeholder="e.g., Frontend Developer" required style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 12px', fontSize: 13, outline: 'none' }} /></div>
                    <div><label htmlFor="company" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Company *</label><input id="company" name="company" value={form.company} onChange={handleChange} placeholder="e.g., Acme Inc." required style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 12px', fontSize: 13, outline: 'none' }} /></div>
                    <div><label htmlFor="location" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Location</label><input id="location" name="location" value={form.location} onChange={handleChange} placeholder="e.g., Remote, New Delhi" style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 12px', fontSize: 13, outline: 'none' }} /></div>
                    <div><label htmlFor="employmentType" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Employment type</label><select id="employmentType" name="employmentType" value={form.employmentType} onChange={handleChange} style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 10px', fontSize: 13, background: '#fff', outline: 'none' }}><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="internship">Internship</option></select></div>
                    <div style={{ gridColumn: '1 / span 2' }}><label htmlFor="experienceLevel" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Experience level</label><select id="experienceLevel" name="experienceLevel" value={form.experienceLevel} onChange={handleChange} style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 10px', fontSize: 13, background: '#fff', outline: 'none', maxWidth: 300 }}><option value="entry">Entry level</option><option value="mid">Mid level</option><option value="senior">Senior level</option><option value="lead">Lead</option></select></div>
                </div>

                <div style={{ marginTop: 14 }}><label htmlFor="description" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Job description</label><textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Describe the role, responsibilities, and what success looks like..." rows={5} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, fontSize: 13, outline: 'none', resize: 'vertical' }} /></div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
                    <div><label htmlFor="requiredSkills" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Required skills (comma separated)</label><input id="requiredSkills" name="requiredSkills" value={form.requiredSkills} onChange={handleChange} placeholder="e.g., React, Node.js, MongoDB" style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 12px', fontSize: 13, outline: 'none' }} /><div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Weighted at 70% of the match score.</div></div>
                    <div><label htmlFor="preferredSkills" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Preferred skills (comma separated)</label><input id="preferredSkills" name="preferredSkills" value={form.preferredSkills} onChange={handleChange} placeholder="e.g., TypeScript, Docker, AWS" style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 12px', fontSize: 13, outline: 'none' }} /><div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Weighted at 30% — helps differentiate strong matches.</div></div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => window.location.href = '/recruiter/jobs'} style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" disabled={loading} style={{ padding: '9px 20px', borderRadius: 10, background: '#0f172a', color: '#fff', border: '1px solid #0f172a', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{loading ? 'Creating…' : 'Create job →'}</button>
                </div>
            </form>
        </WorkspaceShell>
    );
}
export default CreateJob;
