import React, { useState, useCallback } from 'react';
import { useWritingStore } from '../store/writingStore';
import { enhancedAiService } from '../services/enhancedAiService';
import SuggestionsPanel from './SuggestionsPanel';

const TextEditor: React.FC = () => {
  const { 
    suggestions, 
    isAnalyzing,
    setSuggestions, 
    setIsAnalyzing,
    userProfile
  } = useWritingStore();
  
  // Simple local state - exactly like SimpleTextTest
  const [text, setText] = useState('Start writing your essay here. WordWise AI will help you improve your grammar, vocabulary, and writing style as you type.');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Simple text change handler - exactly like SimpleTextTest
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  // Manual analysis function (only triggered by button click)
  const performAnalysis = useCallback(async () => {
    if (text.trim().length < 5) {
      setSuggestions([]);
      return;
    }

    console.log('🚀 Starting analysis for:', text.substring(0, 50) + '...');
    setIsAnalyzing(true);
    
    try {
      const result = await enhancedAiService.analyzeText(text, userProfile);
      console.log('✅ Analysis complete:', result.suggestions.length, 'suggestions');
      setSuggestions(result.suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [text, userProfile, setSuggestions, setIsAnalyzing]);

  // Simple word and character counts
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="h-full flex">
      {/* Main Text Editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-800">My Essay</h2>
            <div className="text-sm text-gray-500">
              {wordCount} words • {charCount} characters
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Analysis Button */}
            <button
              onClick={performAnalysis}
              disabled={isAnalyzing || text.trim().length === 0}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isAnalyzing
                  ? 'bg-orange-100 text-orange-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isAnalyzing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                '🔍 Analyze Text'
              )}
            </button>

            {/* Suggestions Toggle */}
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                showSuggestions
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showSuggestions ? '👁️ Hide Suggestions' : '👁️ Show Suggestions'}
              {suggestions.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 px-2 py-1 text-xs rounded-full">
                  {suggestions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Text Area - EXACTLY like SimpleTextTest */}
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Start writing your essay here. WordWise AI will help you improve your grammar, vocabulary, and writing style as you type."
            className="w-full h-full p-6 border-0 resize-none focus:outline-none"
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
              fontFamily: 'Georgia, serif',
            }}
            autoFocus
          />

          {/* Loading Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-700 font-medium">Analyzing your writing...</p>
                <p className="text-sm text-gray-500 mt-1">Finding grammar, vocabulary, and style improvements</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>📝 Words: {wordCount}</span>
              <span>🔤 Characters: {charCount}</span>
              {suggestions.length > 0 && (
                <span className="text-red-600">⚠️ {suggestions.length} issue{suggestions.length === 1 ? '' : 's'} found</span>
              )}
              {isAnalyzing && (
                <span className="text-blue-600 flex items-center">
                  <div className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                  Analyzing...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions Panel */}
      {showSuggestions && (
        <div className="w-80 border-l border-gray-200 bg-white">
          <SuggestionsPanel />
        </div>
      )}
    </div>
  );
};

export default TextEditor; 