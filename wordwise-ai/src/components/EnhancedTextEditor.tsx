import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useWritingStore } from '../store/writingStore';
import { enhancedAiService } from '../services/enhancedAiService';
import LanguageSelector, { POPULAR_LANGUAGES } from './LanguageSelector';
import type { UserProfile } from '../types';
import { Check, X } from 'lucide-react';

const EnhancedTextEditor: React.FC = () => {
  const { 
    currentDocument, 
    suggestions, 
    isAnalyzing,
    updateDocumentContent, 
    setSuggestions, 
    setIsAnalyzing,
    setSelectedSuggestion,
    userProfile,
    setCurrentDocument,
    setUserProfile
  } = useWritingStore();
  
  const textAreaRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [selectedLanguageData, setSelectedLanguageData] = useState(POPULAR_LANGUAGES.find(lang => lang.code === 'es'));
  
  // Tooltip state for suggestion bubbles
  const [activeSuggestion, setActiveSuggestion] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{x: number, y: number, isBelow: boolean} | null>(null);

  // Simple debounce function
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Initialize language from user profile
  useEffect(() => {
    if (userProfile?.nativeLanguage) {
      const language = POPULAR_LANGUAGES.find(lang => 
        lang.name.toLowerCase() === userProfile.nativeLanguage.toLowerCase()
      );
      if (language) {
        setSelectedLanguage(language.code);
        setSelectedLanguageData(language);
      }
    }
  }, [userProfile]);

  // Initialize default document when user is authenticated but has no document  
  useEffect(() => {
    if (userProfile && !currentDocument) {
      const defaultDocument = {
        id: '1',
        title: 'My Writing Practice',
        content: 'Start writing here. Choose your preferred language for suggestions above, and WordWise AI will provide bilingual feedback to help you learn!',
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'essay' as const,
        wordCount: 0,
      };
      setCurrentDocument(defaultDocument);
    }
  }, [userProfile, currentDocument, setCurrentDocument]);

  // Handle language change
  const handleLanguageChange = (langCode: string) => {
    const newLang = POPULAR_LANGUAGES.find(lang => lang.code === langCode);
    if (newLang) {
      setSelectedLanguage(langCode);
      setSelectedLanguageData(newLang);
      
      // Update user profile with new native language
      if (userProfile) {
        const updatedProfile = {
          ...userProfile,
          nativeLanguage: newLang.name
        };
        
        // Trigger re-analysis with new language if there's content
        if (currentDocument?.content && currentDocument.content.trim().length > 10) {
          performAnalysis(currentDocument.content, updatedProfile);
        }
      }
    }
  };

  // Manual analysis function with language support
  const performAnalysis = useCallback(async (text: string, profile?: UserProfile) => {
    if (text.trim().length > 10) {
      console.log('🚀 Starting multilingual analysis for:', text.substring(0, 50) + '...');
      console.log('🌍 Using language:', selectedLanguage);
      
      setIsAnalyzing(true);
      try {
        const analysisProfile = profile || userProfile || undefined;
        const result = await enhancedAiService.analyzeText(text, analysisProfile);
        console.log('✅ Multilingual analysis result:', result);
        setSuggestions(result.suggestions);
      } catch (error) {
        console.error('❌ Analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [userProfile, selectedLanguage, setSuggestions, setIsAnalyzing]);

  // Real-time debounced analysis
  const debouncedAnalyze = useCallback(
    (text: string) => {
      if (userProfile?.preferences.realTimeAnalysis && text.trim().length > 5) {
        console.log('🔍 Starting real-time multilingual analysis...');
        enhancedAiService.analyzeTextDebounced(text, userProfile, (result) => {
          console.log('⚡ Real-time analysis complete:', result.suggestions.length, 'suggestions');
          setSuggestions(result.suggestions);
          setIsAnalyzing(false);
        }, 800);
        setIsAnalyzing(true);
      }
    },
    [userProfile, setSuggestions, setIsAnalyzing]
  );

  // Debounced text change handler  
  const debouncedTextChange = useCallback(
    debounce((text: string) => {
      updateDocumentContent(text);
    }, 300),
    [updateDocumentContent, debounce]
  );

  // Handle contentEditable changes
  const handleContentEditableChange = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const newContent = target.textContent || '';
    
    // Clear any existing suggestions and tooltips when typing
    if (activeSuggestion) {
      setActiveSuggestion(null);
      setTooltipPosition(null);
    }
    
    // Update content and trigger analysis
    debouncedTextChange(newContent);
    
    // Trigger re-analysis after text change
    if (newContent.trim().length > 10) {
      setTimeout(() => {
        performAnalysis(newContent);
      }, 500);
    }
  }, [activeSuggestion, debouncedTextChange]);

  const handleTextChange = handleContentEditableChange;

  // Handle clicking on textarea to close any open tooltips
  const handleTextAreaClick = () => {
    if (activeSuggestion) {
      setActiveSuggestion(null);
      setTooltipPosition(null);
    }
  };

  // Handle clicking on highlighted suggestions
  const handleSuggestionClick = useCallback((suggestion: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Get the position of the clicked element for tooltip positioning
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const tooltipWidth = 300;
    const margin = 10;
    let x = rect.left + rect.width / 2;
    let y = rect.top - margin;
    let isBelow = false;
    
    // Adjust X position if tooltip would go off screen
    if (x - tooltipWidth / 2 < margin) {
      x = tooltipWidth / 2 + margin;
    } else if (x + tooltipWidth / 2 > window.innerWidth - margin) {
      x = window.innerWidth - tooltipWidth / 2 - margin;
    }
    
    // Adjust Y position if tooltip would go above viewport
    if (y < margin) {
      y = rect.bottom + margin;
      isBelow = true;
    }
    
    setTooltipPosition({ x, y, isBelow });
    setActiveSuggestion(suggestion);
  }, []);

  // Accept a suggestion
  const acceptSuggestion = useCallback((suggestion: any) => {
    if (!currentDocument) return;
    
    const content = currentDocument.content;
    const newContent = content.substring(0, suggestion.position.start) + 
                      suggestion.suggestedText + 
                      content.substring(suggestion.position.end);
    
    updateDocumentContent(newContent);
    
    // Remove the accepted suggestion
    setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
    
    // Close tooltip
    setActiveSuggestion(null);
    setTooltipPosition(null);
  }, [currentDocument, suggestions, updateDocumentContent, setSuggestions]);

  // Dismiss a suggestion
  const dismissSuggestion = useCallback((suggestion: any) => {
    setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
    setActiveSuggestion(null);
    setTooltipPosition(null);
  }, [suggestions, setSuggestions]);

  // Accept all suggestions
  const acceptAllSuggestions = useCallback(() => {
    if (!currentDocument || suggestions.length === 0) return;
    
    let content = currentDocument.content;
    
    // Sort suggestions by position (reverse order to apply from end to start)
    const sortedSuggestions = [...suggestions].sort((a, b) => b.position.start - a.position.start);
    
    sortedSuggestions.forEach(suggestion => {
      content = content.substring(0, suggestion.position.start) + 
                suggestion.suggestedText + 
                content.substring(suggestion.position.end);
    });
    
    updateDocumentContent(content);
    setSuggestions([]);
    setActiveSuggestion(null);
    setTooltipPosition(null);
  }, [currentDocument, suggestions, updateDocumentContent, setSuggestions]);

  // Render text with highlights 
  const renderTextWithHighlights = () => {
    if (!currentDocument) return null;
    
    const content = currentDocument.content;
    
    // If no suggestions, return plain text
    if (suggestions.length === 0) {
      return content || '';
    }
    
    let result = [];
    let lastIndex = 0;

    // Sort suggestions by position and filter out invalid ones  
    const validSuggestions = suggestions.filter(suggestion => {
      // Validate positions are within text bounds
      if (suggestion.position.start < 0 || suggestion.position.end > content.length) {
        console.warn('⚠️ Invalid suggestion position:', suggestion);
        return false;
      }
      // Validate the text still matches
      const textAtPosition = content.substring(suggestion.position.start, suggestion.position.end);
      if (textAtPosition !== suggestion.originalText) {
        console.warn('⚠️ Suggestion text mismatch:', {
          expected: suggestion.originalText,
          actual: textAtPosition,
          position: suggestion.position
        });
        return false;
      }
      return true;
    });

    const sortedSuggestions = [...validSuggestions].sort((a, b) => a.position.start - b.position.start);
    
    console.log('🎨 Rendering highlights for', sortedSuggestions.length, 'valid suggestions');
    
    // Clean up invalid suggestions from the store if any were filtered out
    if (validSuggestions.length !== suggestions.length) {
      console.log('🧹 Cleaning up', suggestions.length - validSuggestions.length, 'invalid suggestions');
      setSuggestions(validSuggestions);
    }

    sortedSuggestions.forEach((suggestion, index) => {
      // Add normal text before the error word
      if (suggestion.position.start > lastIndex) {
        result.push(
          <span key={`before-${index}`}>
            {content.substring(lastIndex, suggestion.position.start)}
          </span>
        );
      }

      // COLOR-CODED HIGHLIGHT: Different colors for different suggestion types
      const errorWord = content.substring(suggestion.position.start, suggestion.position.end);
      const isActive = activeSuggestion?.id === suggestion.id;
      
      // Get the appropriate color class based on suggestion type
      const getHighlightClass = (type: string, isActive: boolean) => {
        const baseClass = 'clean-error-highlight cursor-pointer transition-all';
        const activeClass = isActive ? 'active-highlight' : '';
        
        let colorClass = '';
        switch (type) {
          case 'grammar':
          case 'spelling':
            colorClass = 'error-highlight-red';
            break;
          case 'vocabulary':
            colorClass = 'error-highlight-blue';
            break;
          case 'style':
            colorClass = 'error-highlight-purple';
            break;
          case 'clarity':
            colorClass = 'error-highlight-green';
            break;
          default:
            colorClass = 'error-highlight-yellow';
            break;
        }
        
        return `${baseClass} ${colorClass} ${activeClass}`;
      };
      
      result.push(
        <span
          key={`highlight-${suggestion.id}`}
          data-suggestion="true"
          className={getHighlightClass(suggestion.type, isActive)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Clicked suggestion:', suggestion.originalText, 'type:', suggestion.type);
            handleSuggestionClick(suggestion, e);
          }}
          title={`${suggestion.type}: ${suggestion.explanation} (Click for suggestion)`}
        >
          {errorWord}
        </span>
      );

      lastIndex = suggestion.position.end;
    });

    // Add remaining normal text
    if (lastIndex < content.length) {
      result.push(
        <span key="after-all">
          {content.substring(lastIndex)}
        </span>
      );
    }

    return result;
  };

  // Suggestion Tooltip Component
  const SuggestionTooltip = () => {
    if (!activeSuggestion || !tooltipPosition) return null;

    // Calculate arrow position - where the tooltip should point to
    const tooltipLeft = tooltipPosition.x - 150;
    const clickedWordCenter = tooltipPosition.x;
    const arrowOffset = Math.max(20, Math.min(280, clickedWordCenter - tooltipLeft)); // Keep arrow within tooltip bounds

    return (
      <div
        className="suggestion-tooltip fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
        style={{
          left: tooltipLeft,
          top: tooltipPosition.y,
          maxWidth: '300px',
          minWidth: '250px'
        }}
      >
        {/* Error type and message */}
        <div className="mb-2">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              activeSuggestion.type === 'grammar' || activeSuggestion.type === 'spelling' 
                ? 'bg-red-100 text-red-800' 
                : activeSuggestion.type === 'vocabulary'
                ? 'bg-blue-100 text-blue-800'
                : activeSuggestion.type === 'style'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {activeSuggestion.type.charAt(0).toUpperCase() + activeSuggestion.type.slice(1)}
            </span>
            <span className={`px-2 py-1 text-xs rounded ${
              activeSuggestion.severity === 'error' 
                ? 'bg-red-50 text-red-600' 
                : activeSuggestion.severity === 'warning'
                ? 'bg-yellow-50 text-yellow-600'
                : 'bg-blue-50 text-blue-600'
            }`}>
              {activeSuggestion.severity}
            </span>
          </div>
          <p className="text-sm text-gray-700">{activeSuggestion.explanation}</p>
        </div>

        {/* Original vs Suggested */}
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Change:</div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm line-through">
              {activeSuggestion.originalText}
            </span>
            <span className="text-gray-400">→</span>
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm font-medium">
              {activeSuggestion.suggestedText}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => acceptSuggestion(activeSuggestion)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            <Check className="h-3 w-3" />
            <span>Accept</span>
          </button>
          <button
            onClick={() => dismissSuggestion(activeSuggestion)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
          >
            <X className="h-3 w-3" />
            <span>Dismiss</span>
          </button>
        </div>

        {/* Dynamic tooltip arrow */}
        <div 
          className={`absolute w-0 h-0 border-l-4 border-r-4 border-transparent ${
            tooltipPosition.isBelow 
              ? 'bottom-full border-b-4 border-b-white' // Arrow pointing up when tooltip is below
              : 'top-full border-t-4 border-t-white'    // Arrow pointing down when tooltip is above
          }`}
          style={{
            left: `${arrowOffset}px`,
            transform: 'translateX(-50%)'
          }}
        />
      </div>
    );
  };

  // Close tooltip and dropdowns when clicking outside
  const handleDocumentClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.suggestion-tooltip') && !target.closest('[data-suggestion]')) {
      setActiveSuggestion(null);
      setTooltipPosition(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [handleDocumentClick]);

  // Handle escape key to close tooltips
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeSuggestion) {
        setActiveSuggestion(null);
        setTooltipPosition(null);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [activeSuggestion]);

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Writing Stats & Language Selector Bar */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Writing Stats */}
          <div className="flex items-center space-x-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-white px-3 py-2 rounded-md shadow-sm text-center">
                <div className="text-blue-600 font-medium text-xs">Words</div>
                <div className="text-lg font-bold text-blue-800">{currentDocument?.wordCount || 0}</div>
              </div>
              
              <div className="bg-white px-3 py-2 rounded-md shadow-sm text-center">
                <div className="text-green-600 font-medium text-xs">Read Time</div>
                <div className="text-lg font-bold text-green-800">
                  {Math.ceil((currentDocument?.wordCount || 0) / 250)} min
                </div>
              </div>
              
              <div className="bg-white px-3 py-2 rounded-md shadow-sm text-center">
                <div className="text-gray-600 font-medium text-xs">Status</div>
                {isAnalyzing ? (
                  <div className="flex items-center justify-center space-x-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span className="text-xs text-blue-600 font-semibold">Analyzing</span>
                  </div>
                ) : (
                  <div className="text-sm font-bold text-gray-800">Ready</div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Language Selector */}
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-md shadow-sm p-2">
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
                compact={true}
                showNativeNames={false}
                className="min-w-[140px]"
              />
            </div>
            
            {/* Language Status Indicator */}
            {selectedLanguageData && (
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md shadow-sm">
                <span className="text-lg">{selectedLanguageData.flag}</span>
                <div className="text-xs">
                  <div className="font-semibold text-gray-800">
                    {selectedLanguage === 'en' ? 'English Only' : 'Bilingual Mode'}
                  </div>
                  <div className="text-gray-500">
                    {selectedLanguage === 'en' ? 'Monolingual' : `EN + ${selectedLanguageData.name}`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Container */}
      <div className="flex-1 bg-white overflow-hidden" style={{ minHeight: '400px' }}>
        <div className="h-full bg-white shadow-sm">
          <div className="relative h-full" style={{ minHeight: '400px' }}>
            {/* Clean highlighting overlay - perfectly aligned with textarea */}
            {suggestions.length > 0 && (
              <div 
                className="absolute top-0 left-0 right-0 bottom-0 whitespace-pre-wrap break-words overflow-y-auto pointer-events-none"
                style={{ 
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '18px',
                  lineHeight: '1.8',
                  padding: '16px 32px', // Match textarea padding exactly (py-4 = 16px, px-8 = 32px)
                  margin: '0',
                  border: '0',
                  outline: 'none',
                  resize: 'none',
                  minHeight: '500px',
                  zIndex: 2,
                  color: 'transparent', // Make text completely invisible
                  background: 'transparent',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  boxSizing: 'border-box'
                }}
              >
                <div className="pointer-events-auto">
                  {renderTextWithHighlights()}
                </div>
              </div>
            )}

            {/* Main textarea - always visible */}
            <div
              ref={textAreaRef}
              contentEditable="true"
              onInput={handleContentEditableChange}
              data-placeholder={`Start writing here. WordWise AI will provide ${selectedLanguage === 'en' ? 'English' : 'bilingual'} suggestions to help you improve your writing.`}
              className="absolute top-0 left-0 right-0 bottom-0 border-0 resize-none focus:outline-none bg-transparent overflow-y-auto"
              style={{ 
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '18px',
                lineHeight: '1.8',
                padding: '16px 32px', // Match overlay padding exactly
                margin: '0',
                border: '0',
                outline: 'none',
                minHeight: '500px',
                color: 'black', // Always keep text visible
                zIndex: 1,
                background: 'transparent',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                boxSizing: 'border-box',
                whiteSpace: 'pre-wrap'
              }}
              onClick={handleTextAreaClick}
              suppressContentEditableWarning={true}
            >
              {renderTextWithHighlights()}
            </div>
            
            {/* Show error indicator when there are suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute top-2 right-2 bg-white border border-gray-200 rounded-lg shadow-sm p-2 z-10">
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>{suggestions.length} error{suggestions.length === 1 ? '' : 's'} found</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Click highlighted text for suggestions
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Bottom Action Bar */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Progress */}
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span>Target: {userProfile?.writingGoals.targetWordCount || 500} words</span>
            <span className="text-gray-400">•</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round(((currentDocument?.wordCount || 0) / (userProfile?.writingGoals.targetWordCount || 500)) * 100))}%`
                  }}
                ></div>
              </div>
              <span className="font-semibold">
                {Math.round(((currentDocument?.wordCount || 0) / (userProfile?.writingGoals.targetWordCount || 500)) * 100)}%
              </span>
            </div>
          </div>
          
          {/* Center: Suggestions */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                suggestions.length === 0 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200'
              }`}
            >
              <span>
                {suggestions.length === 0 ? '✅ Looking good!' : `📝 ${suggestions.length} suggestions`}
              </span>
              {suggestions.length > 0 && selectedLanguage !== 'en' && (
                <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                  {selectedLanguageData?.flag} Bilingual
                </span>
              )}
              <span className="text-xs">
                {showSuggestions ? '▼' : '▲'}
              </span>
            </button>
          </div>
          
          {/* Right: Tools */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => performAnalysis(currentDocument?.content || '')}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </span>
              ) : (
                '🔍 Analyze Now'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toggleable Suggestions Panel */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 max-h-60 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Suggestions 
              {selectedLanguage !== 'en' && selectedLanguageData && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center">
                  {selectedLanguageData.flag} Bilingual Mode
                </span>
              )}
            </h3>
            <div className="space-y-3">
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <div key={index} className="bg-white p-3 rounded-md border hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                        "{suggestion.originalText}"
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-mono text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        "{suggestion.suggestedText}"
                      </span>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">
                      {suggestion.type}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700 mb-2">
                    <strong>Explanation:</strong> {suggestion.explanation}
                  </div>
                  
                  {suggestion.explanation.includes('|') && selectedLanguageData && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded flex items-center">
                      <span className="mr-2">{selectedLanguageData.flag}</span>
                      Explanation provided in English + {selectedLanguageData.name}
                    </div>
                  )}
                </div>
              ))}
              
              {suggestions.length > 5 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  ... and {suggestions.length - 5} more suggestions
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suggestion Tooltip */}
      {activeSuggestion && (
        <SuggestionTooltip />
      )}
    </div>
  );
};

export default EnhancedTextEditor; 