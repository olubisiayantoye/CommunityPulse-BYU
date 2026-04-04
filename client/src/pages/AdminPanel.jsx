import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, MessageSquare, AlertTriangle, Settings, 
  Download, RefreshCw, Eye, ScrollText, UserCircle2, Clock3, Filter, ArrowUpDown,
  Search, ShieldAlert, FileText, Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { getAuditLogs, getDashboardAnalytics, getPriorityAlerts, exportAnalytics } from '../services/analyticsService';
import { getFeedback, updateFeedback } from '../services/feedbackService';
import toast from 'react-hot-toast';

const DEFAULT_AUDIT_FILTERS = {
  action: '',
  targetType: '',
  severity: '',
  actor: '',
  hasNote: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [adminLoading, setAdminLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [pendingFeedback, setPendingFeedback] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [filters, setFilters] = useState({ category: '', status: 'Pending' });
  const [auditFilters, setAuditFilters] = useState(DEFAULT_AUDIT_FILTERS);

  useEffect(() => {
    // Redirect if not admin
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchAdminData();
  }, [user, navigate]);

  useEffect(() => {
    if (!adminLoading && !auditLoading && location.hash === '#audit-activity') {
      document.getElementById('audit-activity')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [adminLoading, auditLoading, location.hash]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAuditLogs();
    }
  }, [user, auditFilters]);

  const fetchAdminData = async () => {
    setAdminLoading(true);
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
      setAdminLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const requestParams = {
        limit: 12,
        hasNote: auditFilters.hasNote,
        sortBy: auditFilters.sortBy,
        sortOrder: auditFilters.sortOrder
      };

      if (auditFilters.action) requestParams.action = auditFilters.action;
      if (auditFilters.targetType) requestParams.targetType = auditFilters.targetType;
      if (auditFilters.severity) requestParams.severity = auditFilters.severity;

      const trimmedActor = auditFilters.actor.trim();
      if (trimmedActor) requestParams.actor = trimmedActor;

      const auditRes = await getAuditLogs(requestParams);
      setAuditLogs(auditRes.data.auditLogs || []);
      setAuditTotal(auditRes.data.total || 0);
    } catch (error) {
      toast.error('Failed to load audit log');
      console.error(error);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const adminNote = window.prompt(
        'Add an optional admin note for the audit log. Leave blank to skip.',
        ''
      );

      if (adminNote === null) {
        return;
      }

      await updateFeedback(id, {
        status: newStatus,
        adminNote: adminNote.trim() || undefined
      });
      // Update local state
      setPendingFeedback(prev => prev.filter(fb => fb._id !== id));
      setAlerts(prev => prev.filter(a => a._id !== id));
      await Promise.all([fetchAdminData(), fetchAuditLogs()]);
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

  const filteredPendingFeedback = pendingFeedback.filter((fb) => (
    !filters.category || fb.category === filters.category
  ));

  if (adminLoading) {
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('audit-activity')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <ScrollText className="w-4 h-4 mr-1" /> Audit Log
            </Button>
            <Button variant="outline" size="sm" onClick={() => { fetchAdminData(); fetchAuditLogs(); }}>
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
                {filteredPendingFeedback.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">All caught up! 🎉</p>
                ) : (
                  filteredPendingFeedback.map((fb) => (
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

        <Card className="mt-6 overflow-hidden border-slate-200/80 shadow-sm" id="audit-activity">
          <CardHeader className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 text-white border-b-0">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <ScrollText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Audit Activity</h3>
                <p className="text-sm text-slate-200">Recent admin and user actions across the platform</p>
              </div>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/15">
              {auditTotal} matching events
            </div>
          </CardHeader>
          <CardContent className="bg-slate-50/80">
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Filter Audit Trail</p>
                  <p className="text-xs text-slate-500">Refine entries by action, person, note, or severity.</p>
                </div>
                <Button variant="ghost" className="border border-slate-200 bg-slate-50 hover:bg-slate-100" onClick={() => setAuditFilters(DEFAULT_AUDIT_FILTERS)}>
                  Clear Filters
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Action
                </span>
                <select
                  value={auditFilters.action}
                  onChange={(e) => setAuditFilters((prev) => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">All Actions</option>
                  <option value="feedback.status_updated">Status Updates</option>
                  <option value="feedback.created">Feedback Created</option>
                  <option value="feedback.updated">Feedback Updated</option>
                  <option value="feedback.archived">Feedback Archived</option>
                  <option value="user.registered">User Registered</option>
                  <option value="user.login">User Login</option>
                  <option value="user.profile_updated">Profile Updated</option>
                  <option value="user.deleted">User Deleted</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">Target</span>
                <select
                  value={auditFilters.targetType}
                  onChange={(e) => setAuditFilters((prev) => ({ ...prev, targetType: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">All Targets</option>
                  <option value="Feedback">Feedback</option>
                  <option value="User">User</option>
                  <option value="System">System</option>
                  <option value="Analytics">Analytics</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">Note</span>
                <select
                  value={auditFilters.hasNote}
                  onChange={(e) => setAuditFilters((prev) => ({ ...prev, hasNote: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="all">All Entries</option>
                  <option value="with-note">With Note</option>
                  <option value="without-note">Without Note</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">Severity</span>
                <select
                  value={auditFilters.severity}
                  onChange={(e) => setAuditFilters((prev) => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">All Severity</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-3 mb-5">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5" />
                  Changed By
                </span>
                <input
                  type="text"
                  value={auditFilters.actor}
                  onChange={(e) => setAuditFilters((prev) => ({ ...prev, actor: e.target.value }))}
                  placeholder="Filter by name or email"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sort
                </span>
                <select
                  value={`${auditFilters.sortBy}:${auditFilters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split(':');
                    setAuditFilters((prev) => ({ ...prev, sortBy, sortOrder }));
                  }}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="createdAt:desc">Newest First</option>
                  <option value="createdAt:asc">Oldest First</option>
                  <option value="action:asc">Action A-Z</option>
                  <option value="severity:desc">Highest Severity</option>
                  <option value="targetType:asc">Target A-Z</option>
                </select>
              </label>
            </div>
            </div>

            <div className="space-y-4">
              {auditLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-500">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                    <RefreshCw className="w-6 h-6 animate-spin text-slate-500" />
                  </div>
                  <p className="font-medium text-slate-700">Loading audit activity...</p>
                  <p className="mt-1 text-sm text-slate-500">Pulling the latest admin and user actions.</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-500">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                    <ScrollText className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-700">No audit entries match the current filters.</p>
                  <p className="mt-1 text-sm text-slate-500">Try clearing a filter or widening the search.</p>
                </div>
              ) : (
                auditLogs.map((entry) => (
                  <div key={entry._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant={entry.details?.newStatus ? 'warning' : 'neutral'}>
                            {formatActionLabel(entry.action)}
                          </Badge>
                          {entry.details?.previousStatus || entry.details?.newStatus ? (
                            <Badge variant="primary">
                              {(entry.details?.previousStatus || 'Pending')} to {entry.details?.newStatus || 'Pending'}
                            </Badge>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <UserCircle2 className="w-4 h-4" />
                          <span>{entry.changedBy?.name || entry.changedBy?.email || 'System'}</span>
                        </div>

                        {entry.note ? (
                          <div className="mb-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Note</p>
                            <p className="text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2">
                              {entry.note}
                            </p>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock3 className="w-3.5 h-3.5" />
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                          <span>{entry.targetType}</span>
                          {entry.details?.category ? <span>{entry.details.category}</span> : null}
                          {entry.severity ? <span className="capitalize">{entry.severity}</span> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

const formatActionLabel = (action = '') =>
  String(action)
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getAuditSeverityAccent = (severity = 'info') => {
  if (severity === 'error') return 'bg-gradient-to-r from-rose-500 to-red-500';
  if (severity === 'warning') return 'bg-gradient-to-r from-amber-400 to-orange-500';
  return 'bg-gradient-to-r from-sky-500 to-indigo-500';
};

const getAuditSeverityPill = (severity = 'info') => {
  if (severity === 'error') return 'bg-rose-50 text-rose-700 ring-rose-100';
  if (severity === 'warning') return 'bg-amber-50 text-amber-700 ring-amber-100';
  return 'bg-sky-50 text-sky-700 ring-sky-100';
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
