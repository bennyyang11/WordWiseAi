import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useWritingStore } from '../store/writingStore';
import { analyzeText } from '../services/aiService';
import { debounce } from '../utils/debounce';
import SampleEssayLoader from './SampleEssayLoader';
import SuggestionsPanel from './SuggestionsPanel';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { CursorRules } from '@mrzacsmith/cursor-rules';

const TextEditor: React.FC = () => {
  const { 
    currentDocument, 
    suggestions, 
    isAnalyzing,
    updateDocumentContent, 
    setSuggestions, 
    setIsAnalyzing,
    setSelectedSuggestion,
    userProfile,
    setCurrentDocument
  } = useWritingStore();
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cursorRulesRef = useRef<CursorRules | null>(null);

  // Initialize cursor rules
  useEffect(() => {
    if (textAreaRef.current) {
      cursorRulesRef.current = new CursorRules(textAreaRef.current, {
        preventBackspaceOnEmpty: true,
        preventDeleteOnEmpty: true,
        preventArrowKeysOnEmpty: true,
        preventHomeEndKeysOnEmpty: true,
      });

      return () => {
        cursorRulesRef.current?.destroy();
      };
    }
  }, []);

  // Initialize default document when user is authenticated but has no document
  useEffect(() => {
    if (userProfile && !currentDocument) {
      const defaultDocument = {
        id: '1',
        title: 'My First Essay',
        content: 'Start writing your essay here. WordWise AI will help you improve your grammar, vocabulary, and writing style as you type.',
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'essay' as const,
        wordCount: 0,
      };
      setCurrentDocument(defaultDocument);
    }
  }, [userProfile, currentDocument, setCurrentDocument]);

  // Manual analysis function for immediate execution
  const performAnalysis = useCallback(async (text: string) => {
    if (text.trim().length > 10) {
      console.log('Starting analysis for:', text.substring(0, 50) + '...');
      setIsAnalyzing(true);
      try {
        const result = await analyzeText(text, userProfile);
        console.log('Analysis result:', result);
        setSuggestions(result.suggestions);
      } catch (error) {
        console.error('Analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [userProfile, setSuggestions, setIsAnalyzing]);

  // Debounced analysis function
  const debouncedAnalyze = useCallback(
    debounce(async (text: string) => {
      if (userProfile?.preferences.realTimeAnalysis) {
        await performAnalysis(text);
      }
    }, 1000),
    [performAnalysis, userProfile]
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    updateDocumentContent(newContent);
    debouncedAnalyze(newContent);
  };

  // Handle cursor movement
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (cursorRulesRef.current) {
      console.log('Cursor Rules - Key pressed:', e.key);
      console.log('Text area empty:', !textAreaRef.current?.value);
      cursorRulesRef.current.handleKeyDown(e);
    }
  };

  const renderTextWithHighlights = () => {
    if (!currentDocument) return '';
    
    const content = currentDocument.content;
    let result = [];
    let lastIndex = 0;

    // Sort suggestions by position
    const sortedSuggestions = [...suggestions].sort((a, b) => a.position.start - b.position.start);

    sortedSuggestions.forEach((suggestion, index) => {
      // Add text before the suggestion
      if (suggestion.position.start > lastIndex) {
        result.push(content.substring(lastIndex, suggestion.position.start));
      }

      // Add highlighted suggestion
      const suggestionText = content.substring(suggestion.position.start, suggestion.position.end);
      const className = getSuggestionClassName(suggestion.type);
      
      result.push(
        <span
          key={`suggestion-${index}`}
          className={className}
          onClick={() => setSelectedSuggestion(suggestion)}
          title={suggestion.explanation}
        >
          {suggestionText}
        </span>
      );

      lastIndex = suggestion.position.end;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      result.push(content.substring(lastIndex));
    }

    return result;
  };

  const getSuggestionClassName = (type: string) => {
    switch (type) {
      case 'grammar':
        return 'suggestion-error';
      case 'vocabulary':
        return 'suggestion-vocabulary';
      case 'style':
        return 'suggestion-style';
      case 'clarity':
        return 'suggestion-highlight';
      default:
        return 'suggestion-highlight';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Writing Stats Bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-1">
        <div className="grid grid-cols-3 gap-2 max-w-md text-sm">
          {/* Word Count Section */}
          <div className="bg-blue-50 px-2 py-1 rounded text-center">
            <div className="text-blue-600 font-medium text-xs">Words</div>
            <div className="text-sm font-bold text-blue-800">{currentDocument?.wordCount || 0}</div>
          </div>
          
          {/* Reading Time Section */}
          <div className="bg-green-50 px-2 py-1 rounded text-center">
            <div className="text-green-600 font-medium text-xs">Read Time</div>
            <div className="text-sm font-bold text-green-800">
              {Math.ceil((currentDocument?.wordCount || 0) / 250)} min
            </div>
          </div>
          
          {/* Analysis Status Section */}
          <div className="bg-gray-100 px-2 py-1 rounded text-center">
            <div className="text-gray-600 font-medium text-xs">Status</div>
            {isAnalyzing ? (
              <div className="flex items-center justify-center space-x-1">
                <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-primary-600"></div>
                <span className="text-xs text-primary-600">Analyzing</span>
              </div>
            ) : (
              <div className="text-xs font-bold text-gray-800">Ready</div>
            )}
          </div>
        </div>
      </div>

      {/* Document Container */}
      <div className="flex-1 bg-white overflow-hidden" style={{ minHeight: '400px' }}>
        <div className="h-full bg-white shadow-sm">
          <div className="relative h-full" style={{ minHeight: '400px' }}>
            {/* Highlighted Text Overlay */}
            <div 
              className="absolute inset-0 px-8 py-0 pointer-events-none whitespace-pre-wrap break-words text-transparent overflow-y-auto"
              style={{ 
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '18px',
                lineHeight: '1.8',
                zIndex: 1,
                minHeight: '500px',
              }}
            >
              {renderTextWithHighlights()}
            </div>

            {/* Actual Textarea */}
            <textarea
              ref={textAreaRef}
              value={currentDocument?.content || ''}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Start writing your essay here. WordWise AI will help you improve your grammar, vocabulary, and writing style as you type."
              className="w-full h-full px-8 py-0 border-0 resize-none focus:outline-none bg-transparent overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              style={{ 
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '18px',
                lineHeight: '1.8',
                zIndex: 2,
                minHeight: '500px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-1">
        <div className="grid grid-cols-3 gap-2 items-center">
          {/* Progress Section */}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Target: {userProfile?.writingGoals.targetWordCount || 500} words</span>
            <span>•</span>
            <span>
              {Math.round(((currentDocument?.wordCount || 0) / (userProfile?.writingGoals.targetWordCount || 500)) * 100)}% complete
            </span>
          </div>
          
          {/* Suggestions Section */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                suggestions.length === 0 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200'
              }`}
            >
              <span>{suggestions.length === 0 ? 'Looking good!' : `${suggestions.length} suggestions`}</span>
              {showSuggestions ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronUpIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {/* Tools Section */}
          <div className="flex items-center justify-end space-x-1">
            <SampleEssayLoader />
            <button 
              onClick={() => performAnalysis(currentDocument?.content || '')}
              className="px-2 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
            </button>
          </div>
        </div>
      </div>

      {/* Toggleable Suggestions Panel */}
      {showSuggestions && (
        <div className="h-80 border-t border-gray-200 bg-white">
          <SuggestionsPanel />
        </div>
      )}
    </div>
  );
};

export default TextEditor; 