import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { 
  AlertTriangle, CheckCircle, Clock, MessageSquare, TrendingUp, 
  Users, Filter, Download, RefreshCw, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { getDashboardAnalytics, getPriorityAlerts } from '../services/analyticsService';
import { getMyFeedback, getFeedbackStats } from '../services/feedbackService';
import toast from 'react-hot-toast';

const COLORS = ['#22c55e', '#94a3b8', '#ef4444']; // Green, Gray, Red

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (user?.role === 'admin' || user?.role === 'moderator') {
        const [analyticsRes, alertsRes] = await Promise.all([
          getDashboardAnalytics({ days: parseDateRange(dateRange) }),
          getPriorityAlerts({ limit: 5 })
        ]);
        setAnalytics(analyticsRes.data);
        setAlerts(alertsRes.data.alerts || []);
      } else {
        const [myFeedbackRes, statsRes] = await Promise.all([
          getMyFeedback({ limit: 100 }),
          getFeedbackStats()
        ]);

        setAnalytics(buildMemberAnalytics(myFeedbackRes.data.feedback || [], statsRes.data || {}));
        setAlerts([]);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sentimentData = analytics ? [
    { name: 'Positive', value: analytics.sentiment.positive, color: COLORS[0] },
    { name: 'Neutral', value: analytics.sentiment.neutral, color: COLORS[1] },
    { name: 'Negative', value: analytics.sentiment.negative, color: COLORS[2] },
  ] : [];

  const trendData = analytics?.trends?.slice(-14).map(t => ({
    date: t.date.slice(5),
    total: t.total,
    sentiment: t.sentimentScore
  })) || [];

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
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
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600">Welcome back, {user?.name} 👋</p>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button variant="primary" size="sm">
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Feedback" 
            value={analytics?.overview?.totalFeedback || 0}
            change="+12%"
            trend="up"
            icon={<MessageSquare className="w-6 h-6 text-indigo-600" />}
          />
          <StatCard 
            title="Sentiment Score" 
            value={`${analytics?.overview?.sentimentScore || 0}%`}
            change="+8%"
            trend="up"
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          />
          <StatCard 
            title="Pending Issues" 
            value={analytics?.status?.pending || 0}
            change="-15%"
            trend="down"
            icon={<Clock className="w-6 h-6 text-orange-600" />}
          />
          <StatCard 
            title="Response Rate" 
            value={`${analytics?.overview?.responseRate || 0}%`}
            change="+5%"
            trend="up"
            icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Sentiment Pie Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Sentiment Breakdown</h3>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Trend Line Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Sentiment Trend</h3>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="sentiment" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Priority Alerts */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Priority Alerts</h3>
              <Badge variant="danger">{alerts.length} require attention</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p>No priority issues. Great job!</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert._id} className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="danger">{alert.category}</Badge>
                            <span className="text-sm text-slate-500">{new Date(alert.submittedAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-700 mb-2">{alert.content}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center text-red-600">
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              {alert.upvoteCount} upvotes
                            </span>
                            <span className="text-slate-500">
                              Sentiment: {alert.sentiment.score.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full">
                View All Alerts <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-900">By Category</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.categories?.slice(0, 5).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <span className="text-slate-700">{cat.name}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-slate-500">{cat.count}</span>
                      <Badge variant={cat.sentiment > 0 ? 'success' : cat.sentiment < 0 ? 'danger' : 'neutral'}>
                        {cat.sentiment > 0 ? '+' : ''}{Math.round(cat.sentiment * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

const parseDateRange = (value) => {
  const parsed = parseInt(String(value).replace(/\D/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 30;
};

const buildMemberAnalytics = (feedbackItems, stats) => {
  const sentiment = { positive: 0, neutral: 0, negative: 0 };
  const status = { pending: 0, in_progress: 0, resolved: 0, dismissed: 0 };
  const categoryMap = new Map();
  const trendMap = new Map();
  const recentThreshold = new Date();

  recentThreshold.setDate(recentThreshold.getDate() - 7);

  feedbackItems.forEach((item) => {
    const sentimentLabel = item.sentiment?.label || 'NEUTRAL';

    if (sentimentLabel === 'POSITIVE') sentiment.positive += 1;
    else if (sentimentLabel === 'NEGATIVE') sentiment.negative += 1;
    else sentiment.neutral += 1;

    const statusKey = (item.status || 'Pending').toLowerCase().replace(' ', '_');
    status[statusKey] = (status[statusKey] || 0) + 1;

    const category = item.category || 'Other';
    const currentCategory = categoryMap.get(category) || {
      name: category,
      count: 0,
      totalSentiment: 0
    };

    currentCategory.count += 1;
    currentCategory.totalSentiment +=
      sentimentLabel === 'POSITIVE' ? 1 : sentimentLabel === 'NEGATIVE' ? -1 : 0;
    categoryMap.set(category, currentCategory);

    const dateKey = new Date(item.submittedAt).toISOString().slice(0, 10);
    const currentTrend = trendMap.get(dateKey) || {
      date: dateKey,
      total: 0,
      positive: 0,
      neutral: 0,
      negative: 0
    };

    currentTrend.total += 1;
    if (sentimentLabel === 'POSITIVE') currentTrend.positive += 1;
    else if (sentimentLabel === 'NEGATIVE') currentTrend.negative += 1;
    else currentTrend.neutral += 1;

    trendMap.set(dateKey, currentTrend);
  });

  const totalFeedback = feedbackItems.length;

  return {
    overview: {
      totalFeedback,
      recentActivity: feedbackItems.filter((item) => new Date(item.submittedAt) >= recentThreshold).length,
      sentimentScore:
        totalFeedback > 0
          ? Math.round(((sentiment.positive - sentiment.negative) / totalFeedback) * 100)
          : 0,
      responseRate:
        totalFeedback > 0
          ? Math.round((((status.resolved || 0) + (status.in_progress || 0)) / totalFeedback) * 100)
          : 0,
      communityTotalFeedback: stats.total || 0
    },
    sentiment,
    categories: Array.from(categoryMap.values()).map((item) => ({
      name: item.name,
      count: item.count,
      sentiment: item.count > 0 ? item.totalSentiment / item.count : 0
    })),
    status,
    trends: Array.from(trendMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        ...item,
        sentimentScore:
          item.total > 0 ? Math.round(((item.positive - item.negative) / item.total) * 100) : 0
      }))
  };
};

// Stat Card Component
const StatCard = ({ title, value, change, trend, icon }) => (
  <Card hover className="p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-indigo-50 rounded-xl">{icon}</div>
      <Badge variant={trend === 'up' ? 'success' : 'danger'}>
        {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
        {change}
      </Badge>
    </div>
    <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
    <p className="text-sm text-slate-500">{title}</p>
  </Card>
);

export default Dashboard;
