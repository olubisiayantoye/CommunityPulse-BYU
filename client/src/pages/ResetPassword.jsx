import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { resetPassword } from '../services/authService';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, formData.password);
      toast.success('Password reset successful! Please log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-slide-up">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
          <p className="text-slate-600 mt-2">Enter your new password below</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Reset Password
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-500">
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword;