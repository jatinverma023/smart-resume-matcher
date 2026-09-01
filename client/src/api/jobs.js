import { API_BASE_URL } from './config';

export async function getJobs(token) {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch jobs');
    }

    return data;
}

export async function getJob(token, jobId) {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch job');
    }

    return data;
}

export async function calculateMatch(token, resumeId, jobId) {
    const response = await fetch(`${API_BASE_URL}/matches/calculate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            resumeId,
            jobId,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Unable to calculate match');
    }

    return data;
}

export async function getMyJobs(token) {
    const response = await fetch(`${API_BASE_URL}/jobs/my`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Unable to fetch your jobs'
        );
    }

    return data;
}

export async function getJobStats(token, jobId) {
    const response = await fetch(
        `${API_BASE_URL}/jobs/${jobId}/stats`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Unable to fetch job statistics'
        );
    }

    return data;
}