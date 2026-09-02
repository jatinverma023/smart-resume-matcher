import { API_BASE_URL } from './config';


export async function getJobs(token) {
    const response = await fetch(
        `${API_BASE_URL}/jobs`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Unable to fetch jobs'
        );
    }

    return data;
}


export async function getJob(token, jobId) {
    const response = await fetch(
        `${API_BASE_URL}/jobs/${jobId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Unable to fetch job'
        );
    }

    return data;
}


export async function createJob(
    token,
    jobData
) {
    const response = await fetch(
        `${API_BASE_URL}/jobs`,
        {
            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json',

                Authorization:
                    `Bearer ${token}`,
            },

            body: JSON.stringify(jobData),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Unable to create job'
        );
    }

    return data;
}


export async function publishJob(
    token,
    jobId
) {
    const response = await fetch(
        `${API_BASE_URL}/jobs/${jobId}/publish`,
        {
            method: 'PATCH',

            headers: {
                Authorization:
                    `Bearer ${token}`,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Unable to publish job'
        );
    }

    return data;
}


export async function calculateMatch(
    token,
    resumeId,
    jobId
) {
    const response = await fetch(
        `${API_BASE_URL}/matches/calculate`,
        {
            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json',

                Authorization:
                    `Bearer ${token}`,
            },

            body: JSON.stringify({
                resumeId,
                jobId,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Unable to calculate match'
        );
    }

    return data;
}


export async function getMyJobs(token) {
    const response = await fetch(
        `${API_BASE_URL}/jobs/my`,
        {
            headers: {
                Authorization:
                    `Bearer ${token}`,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Unable to fetch your jobs'
        );
    }

    return data;
}


export async function getJobStats(
    token,
    jobId
) {
    const response = await fetch(
        `${API_BASE_URL}/jobs/${jobId}/stats`,
        {
            headers: {
                Authorization:
                    `Bearer ${token}`,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Unable to fetch job statistics'
        );
    }

    return data;
}