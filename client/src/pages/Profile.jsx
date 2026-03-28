import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Building2, Save, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { getMe, updateProfile, logout } from '../services/authService';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user: authUser, login: authLogin, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    bio: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getMe();
      const user = response.data.user;
      setFormData({
        name: user.name || '',
        email: user.email || '',
        organization: user.organization || '',
        bio: user.bio || ''
      });
    } catch (error) {
      toast.error('Failed to load profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await updateProfile(formData);
      authLogin(response.data.user, null); // Update context with new user data
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    authLogout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-600">Manage your account settings</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Account Information</h3>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your name"
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Organization */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Organization
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your organization"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
                <p className="text-xs text-slate-500 mt-1 text-right">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Role Badge */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm font-medium text-slate-700 mb-1">Account Role</p>
                <Badge variant={
                  authUser?.role === 'admin' ? 'danger' :
                  authUser?.role === 'moderator' ? 'warning' : 'primary'
                }>
                  {authUser?.role?.charAt(0).toUpperCase() + authUser?.role?.slice(1)}
                </Badge>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Security Notice */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Your data is encrypted and stored securely. Changes take effect immediately.
        </p>
      </div>
    </div>
  );
};

export default Profile;