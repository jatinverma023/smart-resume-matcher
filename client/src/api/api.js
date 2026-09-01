import { API_BASE_URL } from './config';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers,
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'API request failed'
        );
    }

    return data;
}

export async function checkHealth() {
    return request('/health');
}

export async function getCandidateDashboard() {
    return request('/dashboard/candidate');
}

export async function getMyResumes() {
    return request('/resumes/my');
}

export async function getJobs() {
    return request('/jobs');
}

export async function calculateMatch(
    resumeId,
    jobId
) {
    return request('/matches/calculate', {
        method: 'POST',
        body: JSON.stringify({
            resumeId,
            jobId,
        }),
    });
}

export async function applyToJob(
    jobId,
    resumeId
) {
    return request('/applications', {
        method: 'POST',
        body: JSON.stringify({
            jobId,
            resumeId,
        }),
    });
}

export async function getMyApplications() {
    return request('/applications/my');
}

export async function getRecruiterJobs() {
    return request('/jobs/my');
}

export async function getJobApplicants(jobId) {
    return request(
        `/applications/job/${jobId}`
    );
}

export async function getJobStats(jobId) {
    return request(
        `/jobs/${jobId}/stats`
    );
}

export async function updateApplicationStatus(
    applicationId,
    status
) {
    return request(
        `/applications/${applicationId}/status`,
        {
            method: 'PATCH',
            body: JSON.stringify({
                status,
            }),
        }
    );
}