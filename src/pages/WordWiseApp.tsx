import React from 'react';
import Header from '../components/Header';
import TextEditor from '../components/TextEditor';
import { useWritingStore } from '../store/writingStore';

interface WordWiseAppProps {
  onLogout: () => void;
}

const WordWiseApp: React.FC<WordWiseAppProps> = ({ onLogout }) => {
  const { currentDocument } = useWritingStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onLogout={onLogout} />

      <div className="flex-1 flex flex-col">
        {/* Document Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-lg font-bold text-gray-900">
              {currentDocument?.title || 'Untitled Essay'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              AI-powered writing assistant for ESL students • Start typing to get real-time suggestions
            </p>
          </div>
        </div>

        {/* Full-Width Text Editor */}
        <div className="flex-1 bg-white">
          <div className="max-w-7xl mx-auto h-full">
            <TextEditor />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordWiseApp; 