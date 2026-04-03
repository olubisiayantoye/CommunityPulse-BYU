import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { forgotPassword } from '../services/authService';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await forgotPassword(email);
      setSubmitted(true);
      toast.success('Password reset link sent! Check your email.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-slide-up">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Check Your Email</h1>
            <p className="text-slate-600 mt-2">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-indigo-50 rounded-xl text-sm text-indigo-800">
              <p>Didn't receive the email?</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Check your spam folder</li>
                <li>Verify the email address is correct</li>
                <li>Wait a few minutes and try again</li>
              </ul>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSubmitted(false)}
            >
              Try Another Email
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-slide-up">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Forgot Password?</h1>
          <p className="text-slate-600 mt-2">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Send Reset Link
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;