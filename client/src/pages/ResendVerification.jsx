import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Mail } from 'lucide-react';
import { resendVerification } from '../services/authService';

const ResendVerification = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await resendVerification({ email });
      setSuccess(response);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Link to="/login" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Resend verification email</h1>
        <p className="text-slate-600 mb-6">
          We&apos;ll send you a fresh verification link for your account.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-sm text-green-700">{success.message}</p>
            </div>

            {success.data?.verificationUrl && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-medium text-amber-900 mb-2">Development preview</p>
                <a href={success.data.verificationUrl} className="text-sm text-indigo-600 break-all hover:text-indigo-500">
                  {success.data.verificationUrl}
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend email'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResendVerification;
