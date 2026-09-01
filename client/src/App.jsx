import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import CreateJob from './pages/CreateJob';
import RecruiterJobs from './pages/RecruiterJobs';
import ManageJob from './pages/ManageJob';
import Applications from './pages/Applications';
import Resumes from './pages/Resumes';
import Candidates from './pages/Candidates';

function App() {
  const { user, loading } = useAuth();

  const path = window.location.pathname;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050814] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />

          <p className="mt-4 text-sm text-slate-400">
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (path === '/register') {
      return <Register />;
    }

    return <Login />;
  }

  /*
   * CANDIDATE ROUTES
   */
  if (user.role === 'candidate') {
    if (path.startsWith('/jobs/')) {
      return <JobDetails />;
    }

    if (path === '/jobs') {
      return <Jobs />;
    }

    if (path === '/applications') {
      return <Applications />;
    }
    if (path === '/resumes') {
      return <Resumes />;
    }

    return <CandidateDashboard />;
  }

  /*
   * RECRUITER ROUTES
   */
  if (user.role === 'recruiter') {

    if (
      path.startsWith('/recruiter/jobs/') &&
      path !== '/recruiter/jobs/create'
    ) {
      return <ManageJob />;
    }

    if (path === '/recruiter/jobs/create') {
      return <CreateJob />;
    }

    if (path === '/recruiter/jobs') {
      return <RecruiterJobs />;
    }

    if (path === '/candidates') {
      return <Candidates />;
    }

    return <RecruiterDashboard />;
  }

  return <CandidateDashboard />;
}

export default App;