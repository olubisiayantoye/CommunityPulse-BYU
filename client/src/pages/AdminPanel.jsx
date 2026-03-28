import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, MessageSquare, AlertTriangle, Settings, 
  Download, Filter, RefreshCw, Search, Eye
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { getDashboardAnalytics, getPriorityAlerts, exportAnalytics } from '../services/analyticsService';
import { getFeedback, updateFeedback } from '../services/feedbackService';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [pendingFeedback, setPendingFeedback] = useState([]);
  const [filters, setFilters] = useState({ category: '', status: 'Pending' });

  useEffect(() => {
    // Redirect if not admin
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, alertsRes, feedbackRes] = await Promise.all([
        getDashboardAnalytics({ days: 30 }),
        getPriorityAlerts({ limit: 10 }),
        getFeedback({ status: 'Pending', limit: 10 })
      ]);
      setAnalytics(analyticsRes.data);
      setAlerts(alertsRes.data.alerts);
      setPendingFeedback(feedbackRes.data.feedback);
    } catch (error) {
      toast.error('Failed to load admin data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateFeedback(id, { status: newStatus });
      // Update local state
      setPendingFeedback(prev => prev.filter(fb => fb._id !== id));
      setAlerts(prev => prev.filter(a => a._id !== id));
      toast.success(`Marked as ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const response = await exportAnalytics({ format });
      // Create download link
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `community-pulse-export-${Date.now()}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-slate-600">Manage community feedback and settings</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Users" 
            value={analytics?.overview?.totalUsers || 0}
            icon={<Users className="w-6 h-6 text-indigo-600" />}
          />
          <StatCard 
            title="Total Feedback" 
            value={analytics?.overview?.totalFeedback || 0}
            icon={<MessageSquare className="w-6 h-6 text-indigo-600" />}
          />
          <StatCard 
            title="Pending Issues" 
            value={alerts.length}
            variant="warning"
            icon={<AlertTriangle className="w-6 h-6 text-orange-600" />}
          />
          <StatCard 
            title="Response Rate" 
            value={`${analytics?.overview?.responseRate || 0}%`}
            variant="success"
            icon={<Settings className="w-6 h-6 text-green-600" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Priority Alerts */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Priority Alerts</h3>
              <Badge variant="danger">{alerts.length} urgent</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">No urgent issues</p>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert._id} className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="danger">{alert.category}</Badge>
                            <span className="text-xs text-slate-500">
                              {new Date(alert.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 mb-2 line-clamp-2">{alert.content}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>👍 {alert.upvoteCount} upvotes</span>
                            <span>Score: {alert.sentiment?.score?.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/feedback/${alert._id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" onClick={() => handleStatusUpdate(alert._id, 'In Progress')}>
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Feedback */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Pending Feedback</h3>
              <div className="flex items-center gap-2">
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="px-2 py-1 text-sm border border-slate-300 rounded"
                >
                  <option value="">All Categories</option>
                  <option value="Facilities">Facilities</option>
                  <option value="Leadership">Leadership</option>
                  <option value="Safety">Safety</option>
                  <option value="Events">Events</option>
                  <option value="Communication">Communication</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingFeedback.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">All caught up! 🎉</p>
                ) : (
                  pendingFeedback.map((fb) => (
                    <div key={fb._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              fb.sentiment?.label === 'NEGATIVE' ? 'danger' :
                              fb.sentiment?.label === 'POSITIVE' ? 'success' : 'neutral'
                            }>
                              {fb.sentiment?.label}
                            </Badge>
                            <span className="text-xs text-slate-500">{fb.category}</span>
                          </div>
                          <p className="text-sm text-slate-700 mb-2 line-clamp-2">{fb.content}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>👍 {fb.upvoteCount}</span>
                            <span>{new Date(fb.submittedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(fb._id, 'Resolved')}>
                            Resolve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(fb._id, 'Dismissed')}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/feedback?status=Pending')}>
                View All Pending <Eye className="w-4 h-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>

        </div>

        {/* Sentiment Overview */}
        <Card className="mt-6">
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Sentiment Overview (Last 30 Days)</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <p className="text-3xl font-bold text-green-700">{analytics?.sentiment?.positive || 0}</p>
                <p className="text-sm text-green-600">Positive</p>
              </div>
              <div className="p-4 bg-slate-100 rounded-xl text-center">
                <p className="text-3xl font-bold text-slate-700">{analytics?.sentiment?.neutral || 0}</p>
                <p className="text-sm text-slate-600">Neutral</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl text-center">
                <p className="text-3xl font-bold text-red-700">{analytics?.sentiment?.negative || 0}</p>
                <p className="text-sm text-red-600">Negative</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

// Stat Card Component (consistent with Dashboard.jsx)
const StatCard = ({ title, value, icon, variant = 'default' }) => {
  const variants = {
    default: 'bg-white',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-orange-50 border-orange-200',
    danger: 'bg-red-50 border-red-200'
  };
  
  return (
    <Card className={`p-6 ${variants[variant]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-indigo-50 rounded-xl">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-sm text-slate-500">{title}</p>
    </Card>
  );
};

export default AdminPanel;