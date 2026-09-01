import { useAuth } from '../context/AuthContext';

function Dashboard() {
    const {
        user,
        logout,
    } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <header className="border-b border-slate-800">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <h1 className="text-xl font-bold">
                        Smart Resume Matcher
                    </h1>

                    <button
                        onClick={logout}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    >
                        Sign out
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-6 py-12">
                <div className="mb-10">
                    <p className="text-sm font-medium uppercase tracking-wider text-blue-400">
                        {user.role}
                    </p>

                    <h2 className="mt-2 text-4xl font-bold">
                        Welcome, {user.name}
                    </h2>

                    <p className="mt-3 text-slate-400">
                        You are successfully authenticated.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <p className="text-sm text-slate-400">
                            Account
                        </p>

                        <p className="mt-2 text-lg font-semibold">
                            {user.email}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <p className="text-sm text-slate-400">
                            Role
                        </p>

                        <p className="mt-2 text-lg font-semibold capitalize">
                            {user.role}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <p className="text-sm text-slate-400">
                            Authentication
                        </p>

                        <p className="mt-2 text-lg font-semibold text-green-400">
                            Active
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;