import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, Brain, BarChart3, Users, ArrowRight, CheckCircle,
  MessageSquare, Zap, Star, Sparkles, ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Shield className="w-8 h-8 text-indigo-600" />,
      title: "Anonymous & Secure",
      desc: "Members share honest feedback without fear. End-to-end encryption protects all data.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <Brain className="w-8 h-8 text-indigo-600" />,
      title: "AI-Powered Insights",
      desc: "Hugging Face NLP analyzes sentiment automatically, surfacing what matters most.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-indigo-600" />,
      title: "Real-Time Dashboards",
      desc: "Visualize community sentiment trends with interactive charts and priority alerts.",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: <Users className="w-8 h-8 text-indigo-600" />,
      title: "Collaborative Resolution",
      desc: "Track issues from submission to resolution with transparent workflows.",
      color: "from-orange-500 to-red-600"
    }
  ];

  const testimonials = [
    {
      quote: "CommunityPulse helped us identify a facilities issue before it became a crisis. The AI sentiment analysis was spot-on.",
      author: "Sarah Chen",
      role: "Student Council President",
      avatar: "👩‍🎓"
    },
    {
      quote: "Finally, a feedback tool that doesn't feel like a suggestion box black hole. Our team acts on data, not guesses.",
      author: "Marcus Johnson",
      role: "Church Administrator",
      avatar: "👨‍💼"
    },
    {
      quote: "The anonymous feedback feature increased participation by 300%. Members finally feel heard.",
      author: "Elena Rodriguez",
      role: "Nonprofit Director",
      avatar: "👩‍💼"
    }
  ];

  const stats = [
    { value: "98%", label: "Member Satisfaction", icon: <Star className="w-5 h-5 text-yellow-500" /> },
    { value: "3x", label: "Faster Issue Resolution", icon: <Zap className="w-5 h-5 text-indigo-500" /> },
    { value: "24/7", label: "Real-Time Monitoring", icon: <Brain className="w-5 h-5 text-purple-500" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">CommunityPulse</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-indigo-600 transition font-medium">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-indigo-600 transition font-medium">How It Works</a>
              <a href="#testimonials" className="text-slate-600 hover:text-indigo-600 transition font-medium">Testimonials</a>
              
              {isAuthenticated ? (
                <Button onClick={() => navigate('/dashboard')} variant="primary" size="sm">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button onClick={() => navigate('/login')} variant="ghost" size="sm">
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/register')} variant="primary" size="sm">
                    Get Started Free
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-200 to-orange-200 rounded-full blur-3xl opacity-30"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-indigo-50 rounded-full mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-indigo-700">AI-Powered Community Intelligence</span>
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight animate-slide-up">
            Hear Your Community.<br />
            <span className="text-gradient">Before Problems Escalate.</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            CommunityPulse gives leaders real-time insight into member sentiment through 
            anonymous feedback, AI analysis, and actionable dashboards.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button 
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              size="lg"
              className="shadow-xl hover:shadow-2xl"
            >
              Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg">
              Watch Demo (2 min)
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200">
                <div className="flex justify-center mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-3xl blur-2xl opacity-20"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-slate-800 px-4 py-3 flex items-center space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-slate-700 px-4 py-1 rounded-full text-xs text-slate-300">
                    app.communitypulse.app/dashboard
                  </div>
                </div>
              </div>
              {/* Preview Image */}
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50 p-8">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Total Feedback', value: '1,247', change: '+12%', color: 'text-green-600' },
                    { label: 'Sentiment Score', value: '+42', change: '+8%', color: 'text-green-600' },
                    { label: 'Pending Issues', value: '23', change: '-15%', color: 'text-green-600' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-sm text-slate-500 mb-1">{stat.label}</div>
                      <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                      <div className={`text-sm ${stat.color}`}>{stat.change} this week</div>
                    </div>
                  ))}
                </div>
                {/* Chart Placeholder */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-indigo-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Interactive Sentiment Chart</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Listen & Act
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Built for schools, churches, nonprofits, and small teams who value 
              transparent, data-driven community management.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 bg-slate-50 rounded-2xl hover:bg-white transition-all duration-300 border border-slate-100 hover:border-indigo-200 card-hover"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Simple Setup, Powerful Results
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                step: "1", 
                title: "Members Submit", 
                desc: "Anonymous, categorized feedback via mobile or desktop",
                icon: <MessageSquare className="w-8 h-8" />
              },
              { 
                step: "2", 
                title: "AI Analyzes", 
                desc: "Hugging Face NLP detects sentiment & extracts key themes",
                icon: <Brain className="w-8 h-8" />
              },
              { 
                step: "3", 
                title: "Leaders Act", 
                desc: "Real-time dashboards highlight priorities for intervention",
                icon: <BarChart3 className="w-8 h-8" />
              }
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                  {item.step}
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-indigo-200 to-transparent -translate-x-1/2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Loved by Community Leaders
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, index) => (
              <div key={index} className="p-8 bg-slate-50 rounded-2xl border border-slate-100 card-hover">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl mr-4">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{t.author}</p>
                    <p className="text-slate-500 text-sm">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Community?
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            Join hundreds of organizations using CommunityPulse to build 
            healthier, more responsive communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/register')}
              size="lg"
              className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl"
            >
              Start Your Free Trial
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white/10"
            >
              Schedule a Demo
            </Button>
          </div>
          <p className="mt-6 text-indigo-200 text-sm">
            ✓ No credit card required &nbsp;•&nbsp; ✓ Cancel anytime &nbsp;•&nbsp; ✓ 14-day full access
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">CommunityPulse</span>
            </div>
            <p className="text-sm">Empowering communities to listen, understand, and act—before small concerns become big problems.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Features</a></li>
              <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition">Security</a></li>
              <li><a href="#" className="hover:text-white transition">API Docs</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition">Community Guidelines</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">Status</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition">Data Processing</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 text-center text-sm">
          <p>© {new Date().getFullYear()} CommunityPulse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;