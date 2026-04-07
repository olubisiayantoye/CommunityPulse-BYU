import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Download,
  Filter,
  Globe,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Users
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { exportAnalytics, getDashboardAnalytics } from '../services/analyticsService';
import { getFeedbackStats, getMyFeedback } from '../services/feedbackService';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7'];
const DATE_RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '180d', label: 'Last 6 months' }
];
const INTERVAL_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' }
];

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: '30d',
    category: 'all',
    platform: 'all',
    interval: 'week'
  });

  const isPrivilegedUser = user?.role === 'admin' || user?.role === 'moderator';

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dateRange, filters.category, filters.platform, filters.interval, isPrivilegedUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isPrivilegedUser) {
        const analyticsRes = await getDashboardAnalytics({
          days: parseDateRange(filters.dateRange),
          category: filters.category,
          platform: filters.platform,
          interval: filters.interval
        });

        setAnalytics(analyticsRes.data);
      } else {
        const [myFeedbackRes, statsRes] = await Promise.all([
          getMyFeedback({ limit: 100 }),
          getFeedbackStats()
        ]);

        setAnalytics(buildMemberAnalytics(myFeedbackRes.data.feedback || [], statsRes.data || {}));
      }
    } catch (error) {
      toast.error('Failed to load dashboard analytics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleExportCsv = async (reportType = 'detailed') => {
    try {
      setExportingCsv(true);
      const response = await exportAnalytics({
        format: 'csv',
        reportType,
        includeAdminNotes: isPrivilegedUser,
        days: parseDateRange(filters.dateRange),
        category: filters.category,
        platform: filters.platform
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `community-pulse-${reportType}-analytics-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${reportType === 'summary' ? 'Summary' : 'Detailed'} CSV export started`);
    } catch (error) {
      toast.error('Unable to export CSV right now');
      console.error(error);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportPdf = () => {
    if (!analytics) return;

    const reportWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=900');
    if (!reportWindow) {
      toast.error('Please allow pop-ups to export the PDF report');
      return;
    }

    const topRows = (analytics.topPerformingContent || [])
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.category || 'Other')}</td>
            <td>${escapeHtml(item.excerpt || item.content || '')}</td>
            <td>${item.upvoteCount || 0}</td>
            <td>${item.status || 'Pending'}</td>
          </tr>`
      )
      .join('');

    const trendRows = (analytics.trends || [])
      .slice(-10)
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.date || '')}</td>
            <td>${item.total || 0}</td>
            <td>${item.sentimentScore || 0}%</td>
          </tr>`
      )
      .join('');

    reportWindow.document.write(`
      <html>
        <head>
          <title>CommunityPulse Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1, h2 { margin-bottom: 8px; }
            .meta { color: #475569; margin-bottom: 24px; }
            .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
            .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
            .label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
            .value { font-size: 28px; font-weight: bold; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; vertical-align: top; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>CommunityPulse Analytics Report</h1>
          <div class="meta">Generated ${new Date().toLocaleString()} • Range: ${getLabelForDateRange(filters.dateRange)} • Category: ${escapeHtml(filters.category)} • Platform: ${escapeHtml(filters.platform)}</div>

          <div class="grid">
            <div class="card"><div class="label">Engagement</div><div class="value">${analytics.overview?.engagementRate || 0}</div></div>
            <div class="card"><div class="label">Reach</div><div class="value">${analytics.overview?.reach || 0}</div></div>
            <div class="card"><div class="label">Growth Rate</div><div class="value">${analytics.overview?.growthRate || 0}%</div></div>
            <div class="card"><div class="label">Total Feedback</div><div class="value">${analytics.overview?.totalFeedback || 0}</div></div>
          </div>

          <h2>Top-Performing Content</h2>
          <table>
            <thead>
              <tr><th>#</th><th>Category</th><th>Content</th><th>Upvotes</th><th>Status</th></tr>
            </thead>
            <tbody>${topRows || '<tr><td colspan="5">No data available.</td></tr>'}</tbody>
          </table>

          <h2>Recent Trend Snapshot</h2>
          <table>
            <thead>
              <tr><th>Period</th><th>Feedback Volume</th><th>Sentiment Score</th></tr>
            </thead>
            <tbody>${trendRows || '<tr><td colspan="3">No trend data available.</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  const sentimentData = analytics
    ? [
        { name: 'Positive', value: analytics.sentiment?.positive || 0 },
        { name: 'Neutral', value: analytics.sentiment?.neutral || 0 },
        { name: 'Negative', value: analytics.sentiment?.negative || 0 }
      ]
    : [];

  const trendData = useMemo(
    () =>
      (analytics?.trends || []).map((item) => ({
        label: formatTrendLabel(item.date, filters.interval),
        total: item.total || 0,
        sentimentScore: item.sentimentScore || 0,
        positive: item.positive || 0,
        negative: item.negative || 0
      })),
    [analytics?.trends, filters.interval]
  );

  const categoryData = analytics?.categories || [];
  const platformData = analytics?.demographics?.platform || [];
  const participationData = analytics?.demographics?.participation || [];
  const topContent = analytics?.topPerformingContent || analytics?.priorityIssues || [];
  const availableCategories = analytics?.filters?.categories || [];
  const availablePlatforms = analytics?.filters?.platforms || [];

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading advanced dashboard analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Advanced Dashboard Analytics</h1>
            <p className="text-slate-600">
              Turn your dashboard into an insights engine for engagement, reach, growth, and audience behavior.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf}>
              <Download className="w-4 h-4 mr-1" /> Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExportCsv('summary')} loading={exportingCsv}>
              <Download className="w-4 h-4 mr-1" /> Summary CSV
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleExportCsv('detailed')} loading={exportingCsv}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" /> Analytics Filters
              </h2>
              <p className="text-sm text-slate-500 mt-1">Slice the dashboard by date range, platform, and category.</p>
            </div>
            <Badge variant="primary">{isPrivilegedUser ? 'Admin analytics' : 'Your personal activity'}</Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <FilterSelect
              label="Date range"
              value={filters.dateRange}
              onChange={(value) => handleFilterChange('dateRange', value)}
              options={DATE_RANGE_OPTIONS}
            />
            <FilterSelect
              label="Platform"
              value={filters.platform}
              onChange={(value) => handleFilterChange('platform', value)}
              options={[{ value: 'all', label: 'All platforms' }, ...availablePlatforms.map((item) => ({ value: item, label: item }))]}
            />
            <FilterSelect
              label="Category"
              value={filters.category}
              onChange={(value) => handleFilterChange('category', value)}
              options={[{ value: 'all', label: 'All categories' }, ...availableCategories.map((item) => ({ value: item, label: item }))]}
            />
            <FilterSelect
              label="Trend view"
              value={filters.interval}
              onChange={(value) => handleFilterChange('interval', value)}
              options={INTERVAL_OPTIONS}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <KpiCard
            title="Engagement"
            value={formatMetric(analytics?.overview?.engagementRate)}
            suffix="avg upvotes"
            change={analytics?.overview?.growthRate || 0}
            icon={<TrendingUp className="w-6 h-6 text-indigo-600" />}
          />
          <KpiCard
            title="Reach"
            value={analytics?.overview?.reach || 0}
            suffix="feedback + upvotes"
            change={analytics?.overview?.responseRate || 0}
            icon={<Globe className="w-6 h-6 text-sky-600" />}
            changeLabel="response rate"
          />
          <KpiCard
            title="Growth Rate"
            value={`${analytics?.overview?.growthRate || 0}%`}
            suffix="vs previous period"
            change={analytics?.overview?.sentimentScore || 0}
            icon={<ArrowUpRight className="w-6 h-6 text-emerald-600" />}
            changeLabel="sentiment score"
          />
          <KpiCard
            title="Active Contributors"
            value={analytics?.overview?.activeContributors || analytics?.overview?.totalFeedback || 0}
            suffix="people engaged"
            change={analytics?.overview?.totalFeedback || 0}
            icon={<Users className="w-6 h-6 text-violet-600" />}
            changeLabel="total feedback"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-semibold text-slate-900">Time-series trends</h3>
                  <p className="text-sm text-slate-500">Track daily, weekly, or monthly volume alongside sentiment momentum.</p>
                </div>
                <Badge variant="primary">{getIntervalLabel(filters.interval)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                    <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="total" name="Feedback volume" stroke="#6366f1" strokeWidth={3} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="sentimentScore" name="Sentiment score" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Audience demographics</h3>
              <p className="text-sm text-slate-500">A quick view of where participation is coming from.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <MiniMetric
                label="Anonymous vs identified"
                items={participationData}
              />
              <MiniMetric
                label="Platform mix"
                items={platformData}
              />
              <MiniMetric
                label="Sentiment split"
                items={sentimentData}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Top-performing content</h3>
              <p className="text-sm text-slate-500">High-performing submissions by upvotes, sentiment, and follow-through.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {topContent.length === 0 ? (
                <EmptyState label="No top-performing content available for the selected filters." />
              ) : (
                topContent.map((item, index) => (
                  <div key={item._id || `${item.category}-${index}`} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <Badge variant="primary">#{index + 1} {item.category || 'Other'}</Badge>
                      <span className="text-xs text-slate-500">{formatDate(item.submittedAt)}</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-6">{item.excerpt || item.content}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <Badge variant="success">{item.upvoteCount || 0} upvotes</Badge>
                      <Badge variant="neutral">{item.status || 'Pending'}</Badge>
                      {item.platform ? <Badge variant="warning">{item.platform}</Badge> : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Category performance</h3>
              <p className="text-sm text-slate-500">Which themes are driving the most activity.</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 10, 10, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Audience mix</h3>
              <p className="text-sm text-slate-500">Visual breakdown of platform-based participation.</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={95} paddingAngle={3}>
                      {platformData.map((entry, index) => (
                        <Cell key={`platform-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Status and response insights</h3>
            <p className="text-sm text-slate-500">Use this to monitor progress and resolution velocity.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <InsightPill label="Pending" value={analytics?.status?.pending || 0} tone="warning" />
            <InsightPill label="In Progress" value={analytics?.status?.in_progress || 0} tone="primary" />
            <InsightPill label="Resolved" value={analytics?.status?.resolved || 0} tone="success" />
            <InsightPill label="Dismissed" value={analytics?.status?.dismissed || 0} tone="neutral" />
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Response rate:</span> {analytics?.overview?.responseRate || 0}%
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Total feedback:</span> {analytics?.overview?.totalFeedback || 0}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

const FilterSelect = ({ label, value, onChange, options }) => (
  <label className="block">
    <span className="text-sm font-medium text-slate-700 block mb-2">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const KpiCard = ({ title, value, suffix, change, icon, changeLabel = 'period change' }) => {
  const isPositive = Number(change) >= 0;

  return (
    <Card hover className="p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="p-3 bg-indigo-50 rounded-2xl">{icon}</div>
        <Badge variant={isPositive ? 'success' : 'danger'}>
          {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {change}{typeof change === 'number' || /^-?\d+(\.\d+)?$/.test(String(change)) ? '%' : ''}
        </Badge>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{title}</p>
      <p className="text-xs text-slate-400 mt-3">{suffix} • {changeLabel}</p>
    </Card>
  );
};

const MiniMetric = ({ label, items }) => (
  <div>
    <p className="text-sm font-medium text-slate-700 mb-3">{label}</p>
    <div className="space-y-3">
      {items?.length ? (
        items.map((item) => {
          const total = items.reduce((sum, current) => sum + (current.value || 0), 0) || 1;
          const width = Math.max(8, Math.round(((item.value || 0) / total) * 100));
          return (
            <div key={item.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">{item.name}</span>
                <span className="font-medium text-slate-900">{item.value || 0}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })
      ) : (
        <EmptyState label="No demographic data available." compact />
      )}
    </div>
  </div>
);

const InsightPill = ({ label, value, tone = 'primary' }) => {
  const toneClasses = {
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <div className={`rounded-2xl border px-4 py-5 ${toneClasses[tone] || toneClasses.primary}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
};

const EmptyState = ({ label, compact = false }) => (
  <div className={`text-center ${compact ? 'py-2' : 'py-8'} text-slate-500`}>
    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
    <p>{label}</p>
  </div>
);

const parseDateRange = (value) => {
  const parsed = parseInt(String(value).replace(/\D/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 30;
};

const formatMetric = (value) => {
  if (value === null || value === undefined) return 0;
  return Number.isInteger(value) ? value : Number(value).toFixed(1);
};

const formatTrendLabel = (value, interval) => {
  if (!value) return '';
  if (interval === 'month') return value;
  if (interval === 'week') return value.replace(/^\d{4}-/, '');
  return value.slice(5);
};

const getIntervalLabel = (value) => INTERVAL_OPTIONS.find((item) => item.value === value)?.label || 'Weekly';
const getLabelForDateRange = (value) => DATE_RANGE_OPTIONS.find((item) => item.value === value)?.label || 'Last 30 days';
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '');

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildMemberAnalytics = (feedbackItems, stats) => {
  const sentiment = { positive: 0, neutral: 0, negative: 0 };
  const status = { pending: 0, in_progress: 0, resolved: 0, dismissed: 0 };
  const categoryMap = new Map();
  const trendMap = new Map();

  feedbackItems.forEach((item) => {
    const sentimentLabel = item.sentiment?.label || 'NEUTRAL';

    if (sentimentLabel === 'POSITIVE') sentiment.positive += 1;
    else if (sentimentLabel === 'NEGATIVE') sentiment.negative += 1;
    else sentiment.neutral += 1;

    const statusKey = (item.status || 'Pending').toLowerCase().replace(/\s+/g, '_');
    status[statusKey] = (status[statusKey] || 0) + 1;

    const category = item.category || 'Other';
    categoryMap.set(category, {
      name: category,
      count: (categoryMap.get(category)?.count || 0) + 1,
      sentiment:
        (categoryMap.get(category)?.sentiment || 0) +
        (sentimentLabel === 'POSITIVE' ? 1 : sentimentLabel === 'NEGATIVE' ? -1 : 0)
    });

    const dateKey = new Date(item.submittedAt).toISOString().slice(0, 10);
    const currentTrend = trendMap.get(dateKey) || {
      date: dateKey,
      total: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      sentimentScore: 0
    };

    currentTrend.total += 1;
    if (sentimentLabel === 'POSITIVE') currentTrend.positive += 1;
    else if (sentimentLabel === 'NEGATIVE') currentTrend.negative += 1;
    else currentTrend.neutral += 1;
    currentTrend.sentimentScore =
      currentTrend.total > 0
        ? Math.round(((currentTrend.positive - currentTrend.negative) / currentTrend.total) * 100)
        : 0;

    trendMap.set(dateKey, currentTrend);
  });

  const totalFeedback = feedbackItems.length;
  const totalUpvotes = feedbackItems.reduce((sum, item) => sum + (item.upvoteCount || 0), 0);
  const growthRate = feedbackItems.length > 1 ? Math.round((totalUpvotes / feedbackItems.length) * 10) : 0;

  return {
    overview: {
      totalFeedback,
      sentimentScore: totalFeedback > 0 ? Math.round(((sentiment.positive - sentiment.negative) / totalFeedback) * 100) : 0,
      responseRate: totalFeedback > 0 ? Math.round((((status.resolved || 0) + (status.in_progress || 0)) / totalFeedback) * 100) : 0,
      engagementRate: totalFeedback > 0 ? Number((totalUpvotes / totalFeedback).toFixed(1)) : 0,
      reach: totalFeedback + totalUpvotes,
      growthRate,
      activeContributors: totalFeedback,
      communityTotalFeedback: stats.total || 0
    },
    sentiment,
    categories: Array.from(categoryMap.values()).map((item) => ({
      name: item.name,
      count: item.count,
      sentiment: item.count ? item.sentiment / item.count : 0
    })),
    status,
    trends: Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    topPerformingContent: [...feedbackItems]
      .sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0))
      .slice(0, 6)
      .map((item) => ({
        ...item,
        excerpt: item.content?.length > 120 ? `${item.content.slice(0, 119)}…` : item.content,
        platform: item.metadata?.platform || 'Web'
      })),
    demographics: {
      platform: [{ name: 'Web', value: feedbackItems.length }],
      participation: [{ name: 'Your submissions', value: feedbackItems.length }]
    },
    filters: {
      categories: Array.from(categoryMap.keys()),
      platforms: ['Web']
    }
  };
};

export default Dashboard;
