import { useState, useEffect } from 'react';
import { supabase, Feedback, Category, Vote } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ThumbsUp, Calendar, Tag, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface FeedbackWithCategory extends Feedback {
  categories: Category | null;
  user_vote?: Vote | null;
}

interface FeedbackListProps {
  isAdmin?: boolean;
  onFeedbackUpdate?: () => void;
}

export default function FeedbackList({ isAdmin = false, onFeedbackUpdate }: FeedbackListProps) {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    sentiment: 'all',
    status: 'all',
    category: 'all',
  });

  useEffect(() => {
    fetchFeedback();

    const channel = supabase
      .channel('feedback-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        () => {
          fetchFeedback();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => {
          fetchFeedback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

      if (filter.category !== 'all') {
        query = query.eq('category_id', filter.category);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (user) {
        const feedbackIds = data?.map(f => f.id) || [];
        const { data: votes } = await supabase
          .from('votes')
          .select('*')
          .eq('user_id', user.id)
          .in('feedback_id', feedbackIds);

        const feedbackWithVotes = data?.map(item => ({
          ...item,
          user_vote: votes?.find(v => v.feedback_id === item.id) || null,
        }));

        setFeedback(feedbackWithVotes || []);
      } else {
        setFeedback(data || []);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (feedbackId: string, hasVoted: boolean) => {
    if (!user) return;

    try {
      if (hasVoted) {
        await supabase
          .from('votes')
          .delete()
          .eq('feedback_id', feedbackId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('votes')
          .insert({ feedback_id: feedbackId, user_id: user.id });
      }
    } catch (err) {
      console.error('Error voting:', err);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'in_progress':
        return <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              Category
            </label>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {feedback.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">No feedback found</p>
          </div>
        ) : (
          feedback.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => handleVote(item.id, !!item.user_vote)}
                  disabled={!user}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    item.user_vote
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <ThumbsUp className={`w-5 h-5 ${item.user_vote ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{item.votes_count}</span>
                </button>

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

                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      {getStatusIcon(item.status)}
                      {item.status.replace('_', ' ')}
                    </span>

                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                    {item.content}
                  </p>

                  {item.is_anonymous && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Anonymous submission
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
