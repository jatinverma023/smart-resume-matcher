import { API_BASE_URL } from './config';

export async function applyToJob(token, jobId, resumeId) {
    const response = await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            jobId,
            resumeId,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Unable to submit application'
        );
    }

    return data;
}

export async function getMyApplications(token) {
    const response = await fetch(`${API_BASE_URL}/applications/my`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Unable to fetch applications'
        );
    }

    return data;
}

export async function getJobApplicants(token, jobId) {
    const response = await fetch(
        `${API_BASE_URL}/applications/job/${jobId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Unable to fetch applicants'
        );
    }

    return data;
}

export async function updateApplicationStatus(
    token,
    applicationId,
    status
) {
    const response = await fetch(
        `${API_BASE_URL}/applications/${applicationId}/status`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                status,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Unable to update application status'
        );
    }

    return data;
}