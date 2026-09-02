import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    deleteResume,
    getMyResumes,
    uploadResume,
} from '../api/resumes';

import {
    EmptyState,
    WorkspaceShell,
} from '../components/WorkspaceShell';

import { useAuth } from '../context/AuthContext';


function getResumeId(resume) {
    return (
        resume?.id ??
        resume?._id ??
        ''
    );
}


function getSkillName(skill) {
    if (typeof skill === 'string') {
        return skill;
    }

    return skill?.name || '';
}


function getSkillCategory(skill) {
    if (
        typeof skill === 'object' &&
        skill?.category
    ) {
        return String(
            skill.category
        );
    }

    return 'Skill';
}


function formatSkillName(skill) {
    const name =
        getSkillName(skill);

    if (!name) {
        return 'Unknown skill';
    }

    const normalized =
        name
            .toLowerCase()
            .trim()
            .replace(
                /[.\s_-]+/g,
                ''
            );

    const labels = {
        nodejs: 'Node.js',
        nextjs: 'Next.js',
        tailwindcss:
            'Tailwind CSS',
        restapi: 'REST APIs',
        mongodb: 'MongoDB',
        mysql: 'MySQL',
        javascript:
            'JavaScript',
        typescript:
            'TypeScript',
    };

    return (
        labels[normalized] ||
        name
    );
}


function getFileType(resume) {
    const fileType =
        String(
            resume?.fileType ||
            ''
        ).toLowerCase();

    const fileName =
        String(
            resume?.fileName ||
            ''
        ).toLowerCase();

    if (
        fileType.includes('pdf') ||
        fileName.endsWith('.pdf')
    ) {
        return 'PDF';
    }

    if (
        fileType.includes('word') ||
        fileType.includes(
            'officedocument'
        ) ||
        fileName.endsWith('.docx')
    ) {
        return 'DOCX';
    }

    return fileType
        ? fileType
            .split('/')
            .pop()
            .toUpperCase()
        : 'FILE';
}


function formatDate(dateValue) {
    if (!dateValue) {
        return 'Recently uploaded';
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 'Recently uploaded';
    }

    return date.toLocaleDateString(
        'en-IN',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    );
}

function getFileUrl(fileUrl) {
    if (!fileUrl) {
        return '';
    }

    // If backend already returned a complete URL,
    // use it directly.
    if (
        fileUrl.startsWith('http://') ||
        fileUrl.startsWith('https://')
    ) {
        return fileUrl;
    }

    const apiBaseUrl = String(
        import.meta.env.VITE_API_BASE_URL || ''
    ).replace(/\/+$/, '');

    // Remove /api or /api/v1 from the API base URL.
    const serverBaseUrl = apiBaseUrl
        .replace(/\/api\/v1$/, '')
        .replace(/\/api$/, '');

    const normalizedFileUrl =
        fileUrl.startsWith('/')
            ? fileUrl
            : `/${fileUrl}`;

    return `${serverBaseUrl}${normalizedFileUrl}`;
}

function Resumes() {
    const { token } =
        useAuth();

    const [
        resumes,
        setResumes,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        uploading,
        setUploading,
    ] = useState(false);

    const [
        deletingId,
        setDeletingId,
    ] = useState(null);

    const [
        error,
        setError,
    ] = useState('');

    const [
        success,
        setSuccess,
    ] = useState('');

    const fileInputRef =
        useRef(null);


    const navigate = (path) => {
        window.location.href =
            path;
    };


    const loadResumes =
        async () => {
            if (!token) {
                setResumes([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');

                const data =
                    await getMyResumes(
                        token
                    );

                setResumes(
                    data.resumes ??
                    []
                );
            } catch (
                requestError
            ) {
                console.error(
                    'Load resumes error:',
                    requestError
                );

                setError(
                    requestError.message ||
                    'Unable to load resumes'
                );
            } finally {
                setLoading(false);
            }
        };


    useEffect(() => {
        void loadResumes();
    }, [token]);


    const handleUpload =
        async (event) => {
            const file =
                event.target
                    .files?.[0];

            if (!file) {
                return;
            }

            const isPdf =
                file.type ===
                    'application/pdf' ||
                file.name
                    .toLowerCase()
                    .endsWith('.pdf');

            if (!isPdf) {
                setError(
                    'Please upload a PDF resume.'
                );

                setSuccess('');

                event.target.value =
                    '';

                return;
            }

            try {
                setUploading(true);
                setError('');
                setSuccess('');

                await uploadResume(
                    token,
                    file
                );

                await loadResumes();

                setSuccess(
                    'Resume uploaded and analyzed successfully.'
                );
            } catch (
                uploadError
            ) {
                console.error(
                    'Resume upload error:',
                    uploadError
                );

                setError(
                    uploadError.message ||
                    'Unable to upload resume'
                );
            } finally {
                setUploading(false);

                event.target.value =
                    '';
            }
        };


    const handleDelete =
        async (resume) => {
            const resumeId =
                getResumeId(
                    resume
                );

            if (!resumeId) {
                setError(
                    'Unable to identify this resume.'
                );

                return;
            }

            const confirmed =
                window.confirm(
                    `Delete "${resume.fileName}"?\n\nThis resume will be permanently removed from your resume library.`
                );

            if (!confirmed) {
                return;
            }

            try {
                setDeletingId(
                    resumeId
                );

                setError('');
                setSuccess('');

                await deleteResume(
                    token,
                    resumeId
                );

                setResumes(
                    (current) =>
                        current.filter(
                            (item) =>
                                getResumeId(
                                    item
                                ) !==
                                resumeId
                        )
                );

                setSuccess(
                    'Resume deleted successfully.'
                );
            } catch (
                deleteError
            ) {
                console.error(
                    'Delete resume error:',
                    deleteError
                );

                setError(
                    deleteError.message ||
                    'Unable to delete resume'
                );
            } finally {
                setDeletingId(null);
            }
        };


    const handleViewResume = (resume) => {
    if (!resume?.fileUrl) {
        setError(
            'Resume file is not available.'
        );
        return;
    }

    const fileUrl = getFileUrl(
        resume.fileUrl
    );

    if (!fileUrl) {
        setError(
            'Unable to create resume file URL.'
        );
        return;
    }

    window.open(
        fileUrl,
        '_blank',
        'noopener,noreferrer'
    );
};


    const latestResume =
        resumes[0] ?? null;


    const latestSkills =
        useMemo(
            () =>
                latestResume?.skills ??
                [],
            [latestResume]
        );


    const uniqueSkills =
        useMemo(() => {
            const names =
                latestSkills
                    .map(
                        getSkillName
                    )
                    .filter(Boolean)
                    .map(
                        (name) =>
                            name
                                .toLowerCase()
                                .trim()
                    );

            return new Set(
                names
            ).size;
        }, [latestSkills]);


    return (
        <WorkspaceShell
            title="My Resumes"
            subtitle="Manage your resume profiles and keep your skills ready for matching."
            action={
                <>
                    <input
                        ref={
                            fileInputRef
                        }
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={
                            handleUpload
                        }
                        hidden
                    />

                    <button
                        className="primary-light-button"
                        type="button"
                        onClick={() =>
                            fileInputRef.current?.click()
                        }
                        disabled={
                            uploading
                        }
                    >
                        {uploading
                            ? 'Uploading…'
                            : '＋ Upload resume'}
                    </button>
                </>
            }
        >
            {error && (
                <div className="ui-message ui-message-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="ui-message ui-message-success">
                    {success}
                </div>
            )}


            {loading ? (
                <div className="light-loading-state">

                    <span
                        className="light-loading-spinner"
                        aria-hidden="true"
                    />

                    <h2>
                        Loading your resumes
                    </h2>

                    <p>
                        Preparing your resume
                        profiles and detected
                        skills.
                    </p>

                </div>
            ) : (
                <>
                    {/* INTRO */}

                    <section className="resume-intro-panel light-panel">

                        <div className="resume-intro-copy">

                            <span className="eyebrow-text">
                                RESUME INTELLIGENCE
                            </span>

                            <h2>
                                Build your strongest
                                profile.
                            </h2>

                            <p>
                                Upload multiple resume
                                versions and keep them
                                ready for different job
                                opportunities. Your
                                resume is automatically
                                parsed for matching.
                            </p>

                        </div>


                        <div className="resume-intro-visual">

                            <div className="resume-intro-circle">

                                <span>
                                    {resumes.length}
                                </span>

                                <small>
                                    {resumes.length === 1
                                        ? 'RESUME'
                                        : 'RESUMES'}
                                </small>

                            </div>

                        </div>

                    </section>


                    {/* METRICS */}

                    <section className="metrics-grid resumes-metrics">

                        <article className="metric-card metric-card-green">

                            <div className="metric-card-icon">
                                ▤
                            </div>

                            <div className="metric-card-content">

                                <p>
                                    Resumes
                                </p>

                                <strong>
                                    {resumes.length}
                                </strong>

                                <small>
                                    Uploaded profiles
                                </small>

                            </div>

                        </article>


                        <article className="metric-card metric-card-blue">

                            <div className="metric-card-icon">
                                ✦
                            </div>

                            <div className="metric-card-content">

                                <p>
                                    Skills detected
                                </p>

                                <strong>
                                    {uniqueSkills}
                                </strong>

                                <small>
                                    From latest resume
                                </small>

                            </div>

                        </article>


                        <article className="metric-card metric-card-purple">

                            <div className="metric-card-icon">
                                □
                            </div>

                            <div className="metric-card-content">

                                <p>
                                    Format
                                </p>

                                <strong>
                                    {latestResume
                                        ? getFileType(
                                            latestResume
                                        )
                                        : '—'}
                                </strong>

                                <small>
                                    Latest resume format
                                </small>

                            </div>

                        </article>


                        <article className="metric-card metric-card-orange">

                            <div className="metric-card-icon">
                                ✓
                            </div>

                            <div className="metric-card-content">

                                <p>
                                    Profile
                                </p>

                                <strong>
                                    {latestResume
                                        ? 'ACTIVE'
                                        : 'EMPTY'}
                                </strong>

                                <small>
                                    Resume availability
                                </small>

                            </div>

                        </article>

                    </section>


                    {/* RESUME LIBRARY */}

                    <section className="light-panel resume-library-panel">

                        <div className="resume-section-header">

                            <div>

                                <span className="eyebrow-text">
                                    RESUME LIBRARY
                                </span>

                                <h2>
                                    Your resume profiles
                                </h2>

                                <p>
                                    Keep different versions
                                    available for different
                                    job opportunities.
                                </p>

                            </div>


                            <span className="resume-library-count">
                                {resumes.length}{' '}
                                {resumes.length === 1
                                    ? 'profile'
                                    : 'profiles'}
                            </span>

                        </div>


                        {resumes.length === 0 ? (
                            <EmptyState
                                title="No resumes uploaded yet"
                                detail="Upload your first PDF resume and we'll extract the skills automatically."
                                action={
                                    <button
                                        className="primary-light-button"
                                        type="button"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        ＋ Upload your first
                                        resume
                                    </button>
                                }
                            />
                        ) : (
                            <div className="resume-list">

                                {resumes.map(
                                    (
                                        resume,
                                        index
                                    ) => {
                                        const resumeId =
                                            getResumeId(
                                                resume
                                            );

                                        const skillCount =
                                            resume.skills
                                                ?.length ||
                                            0;

                                        const isLatest =
                                            index ===
                                            0;

                                        const isDeleting =
                                            deletingId ===
                                            resumeId;

                                        return (
                                            <article
                                                className={`resume-card ${
                                                    isLatest
                                                        ? 'latest'
                                                        : ''
                                                }`}
                                                key={
                                                    resumeId ||
                                                    `${resume.fileName}-${index}`
                                                }
                                            >

                                                <div className="resume-file-icon">
                                                    {getFileType(
                                                        resume
                                                    )}
                                                </div>


                                                <div className="resume-card-content">

                                                    <div className="resume-card-title-row">

                                                        <div>

                                                            <div className="resume-card-name-line">

                                                                <h3>
                                                                    {resume.fileName ||
                                                                        'Untitled resume'}
                                                                </h3>

                                                                {isLatest && (
                                                                    <span className="resume-latest-badge">
                                                                        LATEST
                                                                    </span>
                                                                )}

                                                            </div>

                                                            <p>
                                                                Uploaded{' '}
                                                                {formatDate(
                                                                    resume.createdAt
                                                                )}
                                                            </p>

                                                        </div>

                                                    </div>


                                                    <div className="resume-card-meta">

                                                        <span>
                                                            {skillCount}{' '}
                                                            {skillCount ===
                                                            1
                                                                ? 'skill'
                                                                : 'skills'}{' '}
                                                            detected
                                                        </span>

                                                        <span>
                                                            {getFileType(
                                                                resume
                                                            )}
                                                        </span>

                                                        <span>
                                                            AI parsed
                                                        </span>

                                                    </div>

                                                </div>


                                                <div className="resume-card-count">

                                                    <span>
                                                        SKILLS
                                                    </span>

                                                    <strong>
                                                        {skillCount}
                                                    </strong>

                                                </div>


                                                <div className="resume-card-actions">

                                                    <button
                                                        type="button"
                                                        className="resume-view-button"
                                                        onClick={() =>
                                                            handleViewResume(
                                                                resume
                                                            )
                                                        }
                                                        disabled={
                                                            isDeleting
                                                        }
                                                    >
                                                        View
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="resume-delete-button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                resume
                                                            )
                                                        }
                                                        disabled={
                                                            isDeleting
                                                        }
                                                    >
                                                        {isDeleting
                                                            ? 'Deleting…'
                                                            : 'Delete'}
                                                    </button>

                                                </div>

                                            </article>
                                        );
                                    }
                                )}

                            </div>
                        )}

                    </section>


                    {/* DETECTED SKILLS */}

                    {latestResume && (
                        <section className="light-panel detected-skills-panel">

                            <div className="resume-section-header">

                                <div>

                                    <span className="eyebrow-text">
                                        LATEST PROFILE
                                    </span>

                                    <h2>
                                        Detected skills
                                    </h2>

                                    <p>
                                        Skills extracted from{' '}
                                        <strong>
                                            {
                                                latestResume.fileName
                                            }
                                        </strong>
                                        .
                                    </p>

                                </div>


                                <span className="resume-library-count">
                                    {latestSkills.length}{' '}
                                    detected
                                </span>

                            </div>


                            {latestSkills.length > 0 ? (
                                <div className="detected-skill-grid">

                                    {latestSkills.map(
                                        (
                                            skill,
                                            index
                                        ) => {
                                            const name =
                                                getSkillName(
                                                    skill
                                                );

                                            if (!name) {
                                                return null;
                                            }

                                            return (
                                                <div
                                                    className="detected-skill-card"
                                                    key={
                                                        skill?._id ||
                                                        `${name}-${index}`
                                                    }
                                                >

                                                    <div className="detected-skill-icon">
                                                        ✓
                                                    </div>

                                                    <div>

                                                        <span>
                                                            {getSkillCategory(
                                                                skill
                                                            ).toUpperCase()}
                                                        </span>

                                                        <strong>
                                                            {formatSkillName(
                                                                skill
                                                            )}
                                                        </strong>

                                                    </div>

                                                </div>
                                            );
                                        }
                                    )}

                                </div>
                            ) : (
                                <div className="resume-no-skills">

                                    <span>
                                        No skills detected
                                    </span>

                                    <p>
                                        Try uploading a more
                                        detailed resume with
                                        your technical
                                        experience and skills.
                                    </p>

                                </div>
                            )}

                        </section>
                    )}

                </>
            )}

        </WorkspaceShell>
    );
}


export default Resumes;