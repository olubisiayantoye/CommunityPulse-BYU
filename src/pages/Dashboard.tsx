import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from '../components/AdminDashboard';
import MemberDashboard from '../components/MemberDashboard';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { profile, signOut, isAdmin } = useAuth();
  const [darkMode, setDarkMode] = useState(profile?.dark_mode ?? false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);

    if (profile) {
      await supabase
        .from('profiles')
        .update({ dark_mode: newMode })
        .eq('id', profile.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                CommunityPulse
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isAdmin ? 'Admin Dashboard' : 'Member Dashboard'} • {profile?.email}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAdmin ? <AdminDashboard /> : <MemberDashboard />}
      </main>
    </div>
  );
}
