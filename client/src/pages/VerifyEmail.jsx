import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { verifyEmail } from '../services/authService';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState({
    loading: true,
    error: '',
    message: ''
  });

  useEffect(() => {
    const runVerification = async () => {
      try {
        const response = await verifyEmail(token);
        setStatus({
          loading: false,
          error: '',
          message: response.message || 'Email verified successfully.'
        });
      } catch (err) {
        setStatus({
          loading: false,
          error: err.response?.data?.message || 'Unable to verify this email link.',
          message: ''
        });
      }
    };

    runVerification();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        {status.loading ? (
          <>
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying your email</h1>
            <p className="text-slate-600">Please wait while we confirm your link.</p>
          </>
        ) : status.error ? (
          <>
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification failed</h1>
            <p className="text-slate-600 mb-6">{status.error}</p>
            <Link
              to="/resend-verification"
              className="block w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition"
            >
              Request a new link
            </Link>
          </>
        ) : (
          <>
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Email verified</h1>
            <p className="text-slate-600 mb-6">{status.message}</p>
            <Link
              to="/login"
              className="block w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition"
            >
              Continue to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
