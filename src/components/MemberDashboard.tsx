import { useState } from 'react';
import FeedbackForm from './FeedbackForm';
import FeedbackList from './FeedbackList';
import { MessageSquare, List } from 'lucide-react';

export default function MemberDashboard() {
  const [activeTab, setActiveTab] = useState<'submit' | 'view'>('submit');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFeedbackSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('view');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'submit'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Submit Feedback
          </button>

          <button
            onClick={() => setActiveTab('view')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'view'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <List className="w-5 h-5" />
            View Feedback
          </button>
        </div>
      </div>

      {activeTab === 'submit' ? (
        <FeedbackForm onSuccess={handleFeedbackSuccess} />
      ) : (
        <FeedbackList key={refreshKey} />
      )}
    </div>
  );
}
