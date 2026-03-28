import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Filter, ArrowUpDown, MessageSquare, 
  ThumbsUp, Clock, CheckCircle, AlertCircle, X
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { getFeedback, upvoteFeedback, removeUpvote } from '../services/feedbackService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FeedbackBrowser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    sentiment: '',
    status: '',
    search: ''
  });
  const [sort, setSort] = useState('submittedAt');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    fetchFeedback();
  }, [filters, sort, pagination.page]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        sort,
        page: pagination.page,
        limit: pagination.limit
      };
      // Remove empty filters
      Object.keys(params).forEach(key => !params[key] && delete params[key]);
      
      const response = await getFeedback(params);
      setFeedback(response.data.feedback);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load feedback');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (id, currentUpvotes, hasUpvoted) => {
    try {
      if (hasUpvoted) {
        await removeUpvote(id);
        setFeedback(feedback.map(fb => 
          fb._id === id ? { ...fb, upvoteCount: fb.upvoteCount - 1 } : fb
        ));
      } else {
        await upvoteFeedback(id);
        setFeedback(feedback.map(fb => 
          fb._id === id ? { ...fb, upvoteCount: fb.upvoteCount + 1 } : fb
        ));
      }
    } catch (error) {
      toast.error('Failed to update vote');
    }
  };

  const getSentimentBadge = (sentiment) => {
    const map = {
      POSITIVE: { variant: 'success', label: 'Positive' },
      NEUTRAL: { variant: 'neutral', label: 'Neutral' },
      NEGATIVE: { variant: 'danger', label: 'Negative' }
    };
    return map[sentiment] || map.NEUTRAL;
  };

  const getStatusIcon = (status) => {
    const map = {
      'Pending': <Clock className="w-4 h-4 text-orange-500" />,
      'In Progress': <AlertCircle className="w-4 h-4 text-blue-500" />,
      'Resolved': <CheckCircle className="w-4 h-4 text-green-500" />,
      'Dismissed': <X className="w-4 h-4 text-slate-400" />
    };
    return map[status] || null;
  };

  if (loading && feedback.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Community Feedback</h1>
            <p className="text-slate-600">{pagination.totalItems} submissions</p>
          </div>
          {user?.role !== 'member' && (
            <Button onClick={() => navigate('/feedback/submit')}>
              + New Feedback
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search feedback..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                <option value="Facilities">Facilities</option>
                <option value="Leadership">Leadership</option>
                <option value="Safety">Safety</option>
                <option value="Events">Events</option>
                <option value="Communication">Communication</option>
                <option value="Other">Other</option>
              </select>

              {/* Sentiment Filter */}
              <select
                value={filters.sentiment}
                onChange={(e) => setFilters({ ...filters, sentiment: e.target.value, page: 1 })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Sentiments</option>
                <option value="POSITIVE">Positive</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="NEGATIVE">Negative</option>
              </select>

              {/* Status Filter (Admin only) */}
              {user?.role !== 'member' && (
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
              )}

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="submittedAt">Newest</option>
                <option value="upvoteCount">Most Upvoted</option>
                <option value="sentiment.score">Sentiment</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        <div className="space-y-4">
          {feedback.map((item) => {
            const sentimentBadge = getSentimentBadge(item.sentiment?.label);
            const hasUpvoted = item.upvotes?.includes(user?._id);
            
            return (
              <Card key={item._id} hover className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant={sentimentBadge.variant}>{sentimentBadge.label}</Badge>
                      <Badge variant="primary">{item.category}</Badge>
                      {getStatusIcon(item.status)}
                      <span className="text-sm text-slate-500">
                        {new Date(item.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <p className="text-slate-700 mb-4 leading-relaxed">{item.content}</p>
                    
                    {/* Keywords */}
                    {item.keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Admin Notes (Admin only) */}
                    {user?.role !== 'member' && item.adminNotes?.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-700 mb-1">Admin Notes:</p>
                        {item.adminNotes.slice(-1).map((note, i) => (
                          <p key={i} className="text-sm text-slate-600">{note.note}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col items-end gap-3">
                    {/* Upvote Button */}
                    <button
                      onClick={() => handleUpvote(item._id, item.upvoteCount, hasUpvoted)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                        hasUpvoted 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">{item.upvoteCount}</span>
                    </button>
                    
                    {/* Status Badge */}
                    <Badge variant={
                      item.status === 'Resolved' ? 'success' :
                      item.status === 'In Progress' ? 'warning' :
                      item.status === 'Dismissed' ? 'neutral' : 'danger'
                    }>
                      {item.status}
                    </Badge>
                    
                    {/* View Details (Admin) */}
                    {user?.role !== 'member' && (
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/feedback/${item._id}`)}>
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Empty State */}
        {feedback.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No feedback found</h3>
            <p className="text-slate-600 mb-6">Try adjusting your filters or submit new feedback.</p>
            <Button onClick={() => navigate('/feedback/submit')}>
              Submit Feedback
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FeedbackBrowser;