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
      <div className="light-loading-state" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f9fc' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="light-loading-spinner" aria-hidden="true" />

          <p style={{ marginTop: '1rem', color: '#687895', fontSize: '0.875rem' }}>
            Loading workspace…
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