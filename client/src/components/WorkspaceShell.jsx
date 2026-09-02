import { useAuth } from '../context/AuthContext';

const candidateNavigation = [
    { label: 'Dashboard', href: '/', icon: '⌂' },
    { label: 'Discover Jobs', href: '/jobs', icon: '⌕' },
    { label: 'Applications', href: '/applications', icon: '▣' },
    { label: 'My Resumes', href: '/resumes', icon: '▤' },
];

const recruiterNavigation = [
    { label: 'Overview', href: '/', icon: '⌂' },
    { label: 'Job Posts', href: '/recruiter/jobs', icon: '▣' },
    { label: 'Candidates', href: '/candidates', icon: '◎' },
];

function getInitials(name = '') {
    return (
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'SR'
    );
}

function isActivePath(href, path) {
    if (href === '/') {
        return path === '/';
    }

    return path === href || path.startsWith(`${href}/`);
}

export function WorkspaceShell({
    role = 'candidate',
    title,
    subtitle,
    action,
    children,
}) {
    const { user, logout } = useAuth();

    const navigation =
        role === 'recruiter'
            ? recruiterNavigation
            : candidateNavigation;

    const path = window.location.pathname;

    const navigate = (href) => {
        window.location.href = href;
    };

    return (
        <div className="workspace-shell">
            <aside className="workspace-sidebar">
                <button
                    className="workspace-brand"
                    type="button"
                    onClick={() => navigate('/')}
                    aria-label="Go to dashboard"
                >
                    <span
                        className="brand-leaf"
                        aria-hidden="true"
                    >
                        <i />
                        <b />
                        <em />
                    </span>

                    <span className="workspace-brand-text">
                        <strong>Smart Resume</strong>
                        <small>MATCHER</small>
                    </span>
                </button>

                <nav
                    className="workspace-nav"
                    aria-label="Workspace navigation"
                >
                    {navigation.map((item) => {
                        const active = isActivePath(
                            item.href,
                            path
                        );

                        return (
                            <button
                                className={`workspace-nav-item ${active ? 'active' : ''
                                    }`}
                                type="button"
                                onClick={() =>
                                    navigate(item.href)
                                }
                                aria-current={
                                    active ? 'page' : undefined
                                }
                                key={item.href}
                            >
                                <span
                                    className="workspace-nav-icon"
                                    aria-hidden="true"
                                >
                                    {item.icon}
                                </span>

                                <span>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                <div className="workspace-sidebar-footer">
                    <div className="workspace-user-avatar">
                        {getInitials(user?.name)}
                    </div>

                    <div className="workspace-user-details">
                        <strong>
                            {user?.name ||
                                'Smart Resume User'}
                        </strong>

                        <span>
                            {role === 'recruiter'
                                ? 'Recruiter'
                                : 'Candidate'}
                        </span>
                    </div>

                    <button
                        className="workspace-logout"
                        type="button"
                        onClick={logout}
                        title="Sign out"
                        aria-label="Sign out"
                    >
                        ↗
                    </button>
                </div>
            </aside>

            <main className="workspace-main">
                <header className="workspace-header">
                    <div className="workspace-header-copy">
                        <p className="workspace-kicker">
                            {role === 'recruiter'
                                ? 'RECRUITER WORKSPACE'
                                : 'CANDIDATE WORKSPACE'}
                        </p>

                        <h1>{title}</h1>

                        {subtitle && (
                            <p className="workspace-subtitle">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {action && (
                        <div className="workspace-header-action">
                            {action}
                        </div>
                    )}
                </header>

                <div className="workspace-content">
                    {children}
                </div>
            </main>
        </div>
    );
}

export function MetricCard({
    icon,
    label,
    value,
    tone = 'blue',
    detail,
}) {
    return (
        <article
            className={`metric-card metric-card-${tone}`}
        >
            <div className="metric-card-icon">
                <span aria-hidden="true">{icon}</span>
            </div>

            <div className="metric-card-content">
                <p>{label}</p>

                <strong>{value}</strong>

                {detail && <small>{detail}</small>}
            </div>
        </article>
    );
}

export function MatchRing({
    score = 0,
    label = 'Match',
    size = 'default',
}) {
    const numericScore = Number.isFinite(Number(score))
        ? Math.max(0, Math.min(100, Number(score)))
        : 0;

    return (
        <div
            className={`match-ring match-ring-${size}`}
            style={{
                '--match-score': numericScore,
            }}
            aria-label={`${numericScore}% ${label}`}
        >
            <span>{numericScore}%</span>

            {label && <small>{label}</small>}
        </div>
    );
}

export function StatusPill({ status = 'applied' }) {
    const normalizedStatus = String(status || 'applied')
        .toLowerCase()
        .trim();

    const label =
        normalizedStatus.charAt(0).toUpperCase() +
        normalizedStatus.slice(1);

    return (
        <span
            className={`status-pill status-${normalizedStatus}`}
        >
            {label}
        </span>
    );
}

export function EmptyState({
    title,
    detail,
    action,
}) {
    return (
        <div className="light-empty-state">
            <span
                className="light-empty-icon"
                aria-hidden="true"
            >
                ✦
            </span>

            <h2>{title}</h2>

            {detail && <p>{detail}</p>}

            {action && (
                <div className="empty-state-action">
                    {action}
                </div>
            )}
        </div>
    );
}