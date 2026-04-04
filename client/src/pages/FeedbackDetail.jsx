import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
  Tag,
  ThumbsUp
} from 'lucide-react';
import { getFeedbackById, updateFeedback } from '../services/feedbackService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FeedbackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await getFeedbackById(id);
        setFeedback(response.data.feedback);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load feedback details.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [id]);

  const handleStatusChange = async (nextStatus) => {
    setStatusLoading(true);
    try {
      const response = await updateFeedback(id, { status: nextStatus });
      setFeedback(response.data.feedback);
      toast.success(`Status updated to ${nextStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to update feedback status.');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Feedback unavailable</h1>
          <p className="text-slate-600 mb-6">{error || 'This feedback item could not be found.'}</p>
          <Link
            to="/feedback"
            className="inline-flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition"
          >
            Back to feedback
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <StatusBadge status={feedback.status} />
            <MetaBadge icon={<Tag className="w-4 h-4" />} label={feedback.category || 'Other'} />
            <MetaBadge icon={<ThumbsUp className="w-4 h-4" />} label={`${feedback.upvoteCount || 0} upvotes`} />
            <MetaBadge icon={<Clock className="w-4 h-4" />} label={new Date(feedback.submittedAt).toLocaleString()} />
          </div>

          <div className="flex items-start gap-3 mb-6">
            <MessageSquare className="w-5 h-5 text-indigo-600 mt-1" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-3">Feedback details</h1>
              <p className="text-slate-700 leading-8 whitespace-pre-wrap">{feedback.content}</p>
            </div>
          </div>

          {feedback.keywords?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {feedback.keywords.map((keyword) => (
                  <span key={keyword} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {feedback.adminNotes?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Admin notes</h2>
              <div className="space-y-3">
                {feedback.adminNotes.map((note, index) => (
                  <div key={`${note.timestamp}-${index}`} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-slate-700">{note.note}</p>
                    <p className="text-xs text-slate-500 mt-2">{new Date(note.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(user?.role === 'admin' || user?.role === 'moderator') && (
            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick actions</h2>
              <div className="flex flex-wrap gap-3">
                {['Pending', 'In Progress', 'Resolved', 'Dismissed'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={statusLoading || feedback.status === status}
                    onClick={() => handleStatusChange(status)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    {statusLoading && feedback.status !== status ? 'Updating...' : status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetaBadge = ({ icon, label }) => (
  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm">
    {icon}
    {label}
  </span>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: 'bg-amber-100 text-amber-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    Resolved: 'bg-green-100 text-green-800',
    Dismissed: 'bg-slate-200 text-slate-700'
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${styles[status] || styles.Pending}`}>
      <CheckCircle className="w-4 h-4" />
      {status || 'Pending'}
    </span>
  );
};

export default FeedbackDetail;
