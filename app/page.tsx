'use client';

import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import HomePageMinimal from './components/HomePageMinimal';
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
        <HomePageMinimal user={user || {}} signOut={signOut} />
      )}
    </Authenticator>
  );
}
