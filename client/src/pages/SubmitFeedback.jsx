import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { submitFeedback } from '../services/feedbackService';
import { getActiveCategories } from '../services/categoryService';
import toast from 'react-hot-toast';

const DEFAULT_CATEGORIES = [
  { name: 'Facilities', description: 'Buildings and physical spaces', icon: 'Home', color: 'blue' },
  { name: 'Leadership', description: 'Management and governance', icon: 'Users', color: 'indigo' },
  { name: 'Safety', description: 'Security and health concerns', icon: 'Shield', color: 'red' },
  { name: 'Events', description: 'Activities and programs', icon: 'Star', color: 'orange' },
  { name: 'Communication', description: 'News and announcements', icon: 'MessageSquare', color: 'green' },
  { name: 'Other', description: 'Other feedback', icon: 'Briefcase', color: 'slate' },
];

const SubmitFeedback = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    content: '',
    category: '',
    isAnonymous: true
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getActiveCategories();
        if (response?.data?.categories?.length > 0) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.warn('Failed to fetch categories, using defaults', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: newValue });
    
    if (name === 'content') {
      setCharCount(value.length);
    }
  };

  // ✅ FIXED handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📤 Submitting feedback:', formData);
    
    if (formData.content.length < 10) {
      toast.error('Feedback must be at least 10 characters');
      return;
    }
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    setLoading(true);
    
    try {
      const response = await submitFeedback(formData);
      
      if (!response.success) {
        const errorMsg = response.errors?.[0]?.message || response.message || 'Validation failed';
        toast.error(errorMsg);
        return;
      }
      
      setSubmitted(true);
      toast.success('Feedback submitted successfully! 🎉');
      
      setTimeout(() => {
        setFormData({ content: '', category: '', isAnonymous: true });
        setCharCount(0);
        setSubmitted(false);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Submit error:', error);
      const errorMsg = error.response?.data?.errors?.[0]?.message 
        || error.response?.data?.message 
        || 'Failed to submit feedback';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 animate-slide-up">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Thank You!</h2>
          <p className="text-slate-600 mb-6">
            Your feedback has been submitted anonymously. Our team will review it shortly.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => setSubmitted(false)} className="w-full">
              Submit Another
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Share Your Feedback</h1>
          <p className="text-slate-600">Your voice matters. Help us build a better community together.</p>
        </div>

        <Card className="animate-slide-up">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Feedback Details</h3>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Category <span className="text-red-500">*</span>
                </label>
                
                {categoriesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.name })}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          formData.category === cat.name
                            ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200'
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-2xl mb-2">
                          {cat.icon ? <span className="text-lg">{getIconEmoji(cat.icon)}</span> : '📝'}
                        </div>
                        <div className="font-medium text-slate-900">{cat.name}</div>
                        {cat.description && (
                          <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {cat.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedback Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-2">
                  Your Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={6}
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="What's on your mind? Be specific and constructive..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                  maxLength={2000}
                />
                <div className="flex justify-between mt-2 text-sm">
                  <span className={`transition-colors ${charCount < 10 ? 'text-red-500' : 'text-slate-500'}`}>
                    {charCount}/2000 characters
                  </span>
                  {charCount < 10 && (
                    <span className="text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Minimum 10 characters
                    </span>
                  )}
                </div>
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">Submit Anonymously</p>
                  <p className="text-sm text-slate-500">Your identity will not be shared with administrators</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAnonymous"
                    checked={formData.isAnonymous}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Tips */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <p className="text-sm text-indigo-800 flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Tip:</strong> Be specific about the issue and suggest possible solutions. 
                    This helps us take action faster!
                  </span>
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={loading}
                disabled={loading || formData.content.length < 10 || !formData.category || categoriesLoading}
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          All feedback is encrypted and stored securely. Anonymous submissions cannot be traced back to you.
        </p>
      </div>
    </div>
  );
};

// Helper: Map icon names to emojis
const getIconEmoji = (iconName) => {
  const iconMap = {
    'Home': '🏢', 'Users': '👥', 'Shield': '🛡️', 'Star': '🎉',
    'MessageSquare': '📢', 'Briefcase': '💬', 'Settings': '⚙️',
    'Heart': '❤️', 'Brain': '🧠', 'BarChart3': '📊',
    'AlertTriangle': '⚠️', 'CheckCircle': '✅',
  };
  return iconMap[iconName] || '📝';
};

export default SubmitFeedback;