import { API_BASE_URL } from './config';


export async function getMyResumes(token) {
    const response = await fetch(
        `${API_BASE_URL}/resumes/my`,
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
            'Unable to fetch resumes'
        );
    }

    return data;
}


export async function uploadResume(
    token,
    file
) {
    const formData = new FormData();

    formData.append(
        'resume',
        file
    );

    const response = await fetch(
        `${API_BASE_URL}/resumes/upload`,
        {
            method: 'POST',

            headers: {
                Authorization:
                    `Bearer ${token}`,
            },

            body: formData,
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Unable to upload resume'
        );
    }

    return data;
}


export async function deleteResume(
    token,
    resumeId
) {
    const response = await fetch(
        `${API_BASE_URL}/resumes/${resumeId}`,
        {
            method: 'DELETE',

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
            'Unable to delete resume'
        );
    }

    return data;
}