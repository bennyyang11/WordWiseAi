import React from 'react';
import { useWritingStore } from '../store/writingStore';

const Header: React.FC = () => {
  const { userProfile } = useWritingStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-12">
        {/* Compact Branding */}
        <div>
          <h1 className="text-lg font-bold text-gray-900">WordWise AI</h1>
        </div>

        {/* Compact User Info */}
        <div className="flex items-center space-x-3">
          {/* Writing Goals */}
          <div className="hidden sm:flex items-center bg-gray-50 px-2 py-1 rounded text-xs">
            <span className="text-gray-600">
              {userProfile?.writingGoals.essayType || 'Essay'} ({userProfile?.writingGoals.targetWordCount || 500}w)
            </span>
          </div>

          {/* ESL Level */}
          <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
            {userProfile?.englishLevel || 'Intermediate'} ESL
          </div>

          {/* User Name */}
          <span className="hidden sm:block text-xs font-medium text-gray-700">
            {userProfile?.name || 'Student'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
