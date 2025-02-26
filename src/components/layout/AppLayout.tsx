import React from 'react';
import Header from './Header';
import Footer from './Footer';
import LoadingOverlay from './LoadingOverlay';

interface AppLayoutProps {
  children: React.ReactNode;
  userEmail?: string | null;
  onSignOut?: () => void;
  loading?: boolean;
}

export default function AppLayout({ children, userEmail, onSignOut, loading = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-yellow-50 px-4 py-8 md:px-6 lg:px-8">
      {loading && <LoadingOverlay />}
      <div className="max-w-6xl mx-auto">
        <Header
          showSignOut={!!onSignOut}
          onSignOut={onSignOut}
          userEmail={userEmail}
        />
        {children}
        <Footer />
      </div>
    </div>
  );
}