'use client';

import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import HomePage from './components/HomePage';
import outputs from '@/amplify_outputs.json';

// Configure Amplify
Amplify.configure(outputs);

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <header className="bg-white dark:bg-gray-800 shadow-sm">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Stock AI Advisor
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome, {user?.signInDetails?.loginId || 'User'}
                </span>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </header>
          <HomePage user={user} />
        </div>
      )}
    </Authenticator>
  );
}
