import { useEffect, useState } from 'react';
import { checkHealth } from './api/api';

function App() {
  const [status, setStatus] = useState('Checking backend...');
  const [error, setError] = useState('');

  useEffect(() => {
    checkHealth()
      .then((data) => {
        setStatus(data.message);
      })
      .catch((err) => {
        setError(err.message);
        setStatus('');
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white">
          Smart Resume Matcher
        </h1>

        <div className="mt-6">
          {status && (
            <p className="text-green-400">
              ✓ {status}
            </p>
          )}

          {error && (
            <p className="text-red-400">
              ✕ {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;