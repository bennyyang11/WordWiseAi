import React, { useState } from 'react';
import Header from '../components/Header';
import TextEditor from '../components/TextEditor';
import SimpleTextTest from '../components/SimpleTextTest';
import { useWritingStore } from '../store/writingStore';

interface WordWiseAppProps {
  onLogout: () => void;
}

const WordWiseApp: React.FC<WordWiseAppProps> = ({ onLogout }) => {
  const { currentDocument } = useWritingStore();
  const [showTestMode, setShowTestMode] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onLogout={onLogout} />

      <div className="flex-1 flex flex-col">
        {/* Document Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {showTestMode ? '🧪 Text Input Test Mode' : (currentDocument?.title || 'Untitled Essay')}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {showTestMode 
                    ? 'Testing for backwards typing issue with isolated component' 
                    : 'AI-powered writing assistant for ESL students • Start typing to get real-time suggestions'
                  }
                </p>
              </div>
              <button
                onClick={() => setShowTestMode(!showTestMode)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showTestMode 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {showTestMode ? '🔙 Back to Editor' : '🧪 Test Mode'}
              </button>
            </div>
          </div>
        </div>

        {/* Full-Width Text Editor or Test Component */}
        <div className="flex-1 bg-white">
          <div className="max-w-7xl mx-auto h-full">
            {showTestMode ? <SimpleTextTest /> : <TextEditor />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordWiseApp; 