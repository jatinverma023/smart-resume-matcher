import { API_BASE_URL } from './config';

export async function getCandidateDashboard(token) {
    const response = await fetch(
        `${API_BASE_URL}/dashboard/candidate`,
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
            'Unable to load dashboard'
        );
    }

    return data;
}
