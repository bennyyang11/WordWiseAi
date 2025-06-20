import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from '../pages/AuthPage';
import WordWiseApp from '../pages/WordWiseApp';

const MainApp: React.FC = () => {
  const { currentUser, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading WordWise AI...</p>
        </div>
      </div>
    );
  }

  return currentUser ? <WordWiseApp onLogout={logout} /> : <AuthPage />;
};

export default MainApp; 