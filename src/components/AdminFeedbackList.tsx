import { useState, useEffect } from 'react';
import { supabase, Feedback, Category } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Tag, ThumbsUp, AlertCircle, CheckCircle, TrendingUp, Flag } from 'lucide-react';

interface FeedbackWithCategory extends Feedback {
  categories: Category | null;
}

interface AdminFeedbackListProps {
  onUpdate?: () => void;
}

export default function AdminFeedbackList({ onUpdate }: AdminFeedbackListProps) {
  const { profile } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    sentiment: 'all',
    status: 'all',
    priority: 'all',
  });

  useEffect(() => {
    fetchFeedback();
  }, [filter]);

  const fetchFeedback = async () => {
    try {
      let query = supabase
        .from('feedback')
        .select(`
          *,
          categories (*)
        `)
        .order('created_at', { ascending: false });

      if (filter.sentiment !== 'all') {
        query = query.eq('sentiment', filter.sentiment);
      }

      if (filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }

      if (filter.priority !== 'all') {
        query = query.eq('priority', filter.priority);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedback(data || []);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status: newStatus })
        .eq('id', feedbackId);

      if (error) throw error;

      await supabase
        .from('audit_logs')
        .insert({
          admin_id: profile?.id,
          action: 'status_update',
          feedback_id: feedbackId,
          details: { new_status: newStatus },
        });

      fetchFeedback();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const updatePriority = async (feedbackId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ priority: newPriority })
        .eq('id', feedbackId);

      if (error) throw error;

      await supabase
        .from('audit_logs')
        .insert({
          admin_id: profile?.id,
          action: 'priority_change',
          feedback_id: feedbackId,
          details: { new_priority: newPriority },
        });

      fetchFeedback();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating priority:', err);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'negative':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Feedback Moderation</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sentiment
            </label>
            <select
              value={filter.sentiment}
              onChange={(e) => setFilter({ ...filter, sentiment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {feedback.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              No feedback found
            </div>
          ) : (
            feedback.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <ThumbsUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.votes_count}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSentimentColor(item.sentiment)}`}>
                        {item.sentiment}
                      </span>

                      {item.categories && (
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                          style={{ backgroundColor: `${item.categories.color}20`, color: item.categories.color }}
                        >
                          <Tag className="w-3 h-3" />
                          {item.categories.name}
                        </span>
                      )}

                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getPriorityColor(item.priority)}`}>
                        <Flag className="w-3 h-3" />
                        {item.priority}
                      </span>

                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-gray-900 dark:text-gray-100 leading-relaxed mb-3">
                      {item.content}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateStatus(item.id, 'pending')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            item.status === 'pending'
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Pending
                        </button>
                        <button
                          onClick={() => updateStatus(item.id, 'in_progress')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            item.status === 'in_progress'
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3 inline mr-1" />
                          In Progress
                        </button>
                        <button
                          onClick={() => updateStatus(item.id, 'resolved')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            item.status === 'resolved'
                              ? 'bg-green-600 text-white'
                              : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40'
                          }`}
                        >
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Resolved
                        </button>
                      </div>

                      <div className="flex gap-1">
                        <select
                          value={item.priority}
                          onChange={(e) => updatePriority(item.id, e.target.value)}
                          className="px-3 py-1 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
