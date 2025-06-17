import React, { useCallback, useRef, useState } from 'react';
import { useWritingStore } from '../store/writingStore';
import { enhancedAiService } from '../services/enhancedAiService';
import { debounce } from '../utils/debounce';
import SampleEssayLoader from './SampleEssayLoader';
import SuggestionsPanel from './SuggestionsPanel';
import { ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import type { Suggestion } from '../types';

const TextEditor: React.FC = () => {
  const { 
    currentDocument, 
    suggestions, 
    isAnalyzing,
    updateDocumentContent, 
    setSuggestions, 
    setIsAnalyzing,
    setAnalysisResult,
    applySuggestion: storeApplySuggestion,
    dismissSuggestion: storeDismissSuggestion,
    userProfile 
  } = useWritingStore();
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number; isBelow?: boolean } | null>(null);

  // Debug: Log when suggestions change
  React.useEffect(() => {
    console.log('🔍 TextEditor: Received', suggestions.length, 'suggestions:', suggestions.map(s => s.originalText));
    console.log('📋 Store state - suggestions length:', suggestions.length);
    if (suggestions.length > 0) {
      console.log('📍 First suggestion details:', suggestions[0]);
    } else {
      console.log('📭 No suggestions in store');
    }
  }, [suggestions]);

  // TEST: Add a simple test suggestion manually for debugging
  React.useEffect(() => {
    if (currentDocument?.content && currentDocument.content.includes('test') && suggestions.length === 0) {
      console.log('🧪 Adding test suggestion for debugging');
      const testSuggestion = {
        id: 'test-suggestion-1',
        type: 'spelling' as const,
        severity: 'error' as const,
        originalText: 'test',
        suggestedText: 'TEST',
        explanation: 'This is a test suggestion to verify highlighting works',
        position: {
          start: currentDocument.content.indexOf('test'),
          end: currentDocument.content.indexOf('test') + 4
        },
        confidence: 1.0,
        rule: 'debug-test'
      };
      setSuggestions([testSuggestion]);
    }
  }, [currentDocument?.content, suggestions.length, setSuggestions]);

  // Manual analysis function for immediate execution
  const performAnalysis = useCallback(async (text: string) => {
    if (text.trim().length > 10) {
      console.log('🚀 Starting enhanced AI analysis for:', text.substring(0, 50) + '...');
      setIsAnalyzing(true);
      try {
        const result = await enhancedAiService.analyzeText(text, userProfile || undefined);
        console.log('✅ Enhanced analysis result:', result);
        console.log('📝 Setting', result.suggestions.length, 'suggestions and analysis result in store');
        setSuggestions(result.suggestions);
        setAnalysisResult(result);
        console.log('✅ Suggestions and analysis result set in store successfully');
      } catch (error) {
        console.error('❌ Enhanced analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [userProfile, setSuggestions, setAnalysisResult, setIsAnalyzing]);

  // Real-time analysis with enhanced AI service
  const debouncedAnalyze = useCallback(
    debounce(async (text: string) => {
      console.log('🔍 Checking analysis conditions:');
      console.log('  - Text length:', text.trim().length);
      console.log('  - User profile exists:', !!userProfile);
      console.log('  - Text preview:', text.substring(0, 100) + '...');
      
      if (text.trim().length > 3) { // Lower threshold for better responsiveness
        console.log('⚡ TextEditor: Starting real-time analysis for:', text.substring(0, 50) + '...');
        setIsAnalyzing(true);
        try {
          enhancedAiService.analyzeTextDebounced(
            text, 
            userProfile || undefined, 
            (result) => {
              console.log('✅ TextEditor: Analysis completed -', result.suggestions.length, 'suggestions found');
              console.log('🎯 Suggestions details:', result.suggestions.map(s => `${s.originalText} -> ${s.suggestedText}`));
              console.log('📝 Setting suggestions and analysis result from real-time analysis');
              setSuggestions(result.suggestions);
              setAnalysisResult(result);
              console.log('✅ Real-time suggestions and analysis result set in store');
              setIsAnalyzing(false);
            },
            400 // Even faster response
          );
        } catch (error) {
          console.error('❌ TextEditor: Analysis failed:', error);
          setIsAnalyzing(false);
        }
      } else {
        console.log('📝 Text too short for analysis, skipping...');
        setIsAnalyzing(false);
      }
    }, 600), // Faster debounce for quicker response
    [userProfile, setSuggestions, setIsAnalyzing]
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    updateDocumentContent(newContent);
    debouncedAnalyze(newContent); // Trigger analysis
    // Hide tooltip when typing
    setActiveSuggestion(null);
    setTooltipPosition(null);
  };

  // Dismiss a suggestion without applying it
  const dismissSuggestion = useCallback((suggestion: Suggestion) => {
    console.log('🗑️ Dismissing suggestion:', suggestion.originalText);
    
    // Hide tooltip
    setActiveSuggestion(null);
    setTooltipPosition(null);
    
    // Use store function to dismiss
    storeDismissSuggestion(suggestion.id);
    
    console.log('✅ Suggestion dismissed via store');
  }, [storeDismissSuggestion]);

  // Accept a suggestion and update the text
  const acceptSuggestion = useCallback((suggestion: Suggestion) => {
    console.log('✅ Accepting suggestion:', suggestion.originalText, '→', suggestion.suggestedText);
    
    // Hide tooltip immediately
    setActiveSuggestion(null);
    setTooltipPosition(null);
    
    // Use store function to apply suggestion
    storeApplySuggestion(suggestion.id);
    
    console.log('✅ Suggestion applied via store');
  }, [storeApplySuggestion]);

  // Handle clicking on a suggestion highlight
  const handleSuggestionClick = useCallback((suggestion: Suggestion, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Smart tooltip positioning to stay within viewport
    const tooltipWidth = 300; // Approximate tooltip width
    const tooltipHeight = 100; // Approximate tooltip height
    const margin = 10; // Margin from screen edge
    
    let x = rect.left + rect.width / 2; // Default: center on word
    let y = rect.top - tooltipHeight - margin; // Default: above word
    let isBelow = false; // Track if tooltip is positioned below word
    
    // Adjust X position if tooltip would go off-screen
    if (x - tooltipWidth / 2 < margin) {
      // Too far left - align tooltip left edge with margin
      x = tooltipWidth / 2 + margin;
    } else if (x + tooltipWidth / 2 > window.innerWidth - margin) {
      // Too far right - align tooltip right edge with margin
      x = window.innerWidth - tooltipWidth / 2 - margin;
    }
    
    // Adjust Y position if tooltip would go above viewport
    if (y < margin) {
      // Not enough space above - position below word instead
      y = rect.bottom + margin;
      isBelow = true;
    }
    
    setTooltipPosition({ x, y, isBelow });
    setActiveSuggestion(suggestion);
    
    console.log('🎯 Clicked suggestion:', suggestion.originalText, 'at position:', { x, y, isBelow });
  }, []);

  const renderTextWithHighlights = () => {
    if (!currentDocument || suggestions.length === 0) return null;
    
    const content = currentDocument.content;
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

  // Close tooltip when clicking outside
  const handleDocumentClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.suggestion-tooltip') && !target.closest('[data-suggestion]')) {
      setActiveSuggestion(null);
      setTooltipPosition(null);
    }
  }, []);

  React.useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [handleDocumentClick]);

  return (
    <div className="h-full flex flex-col relative">
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

      {/* Document Container - Full Width Like a Real Document */}
      <div className="flex-1 bg-white overflow-hidden" style={{ minHeight: '400px' }}>
        {/* Document Paper Effect */}
        <div className="h-full bg-white shadow-sm">
          {/* TEST AI Button - Floating in document */}
          <div className="absolute top-4 right-4 z-30">
            <button 
              onClick={() => {
                console.log('🧪 Test AI button clicked');
                updateDocumentContent(`Last sumer, me and my family goed to the beach for a wekend trip. It was realy fun and excited. We waked up early and drived for about two hours. When we arrived, we spend some minits looking for a good spot. Finaly, we found a place near the ocan where we could build sandcastel.

The sun was shineing very brite, so we put on sunscreen. My sister brang her new swimsut and jumped into the water. She tryed to swim but the waves was to big. We builded a huge sandcastel with towers and walls. Some seagul camed and eated our sandwitch, but we didn't mind.

Later, we layed on our blankit and eated chips while watching other people. The bordwalk was full of families having fun. Everyone feeled happy and relaxed. It was the bestest day of the hole sumer vacation.`);
                console.log('🧪 Added test text with 25+ errors');
              }}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg font-medium"
            >
              🧪 Test AI
            </button>
          </div>
          
          {/* Document Content Area - Much Larger */}
          <div className="relative h-full" style={{ minHeight: '400px' }}>
            {/* Show highlighted text overlay when there are suggestions */}
            {suggestions.length > 0 && (
              <div 
                className="absolute inset-0 px-8 py-0 whitespace-pre-wrap break-words overflow-y-auto pointer-events-none"
                style={{ 
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '18px',
                  lineHeight: '1.8',
                  minHeight: '500px',
                  zIndex: 2
                }}
              >
                <div className="pointer-events-auto">
                  {renderTextWithHighlights()}
                </div>
              </div>
            )}

            {/* Always show textarea for editing */}
            <textarea
              ref={textAreaRef}
              value={currentDocument?.content || ''}
              onChange={handleTextChange}
              placeholder="Start writing your essay here. WordWise AI will help you improve your grammar, vocabulary, and writing style as you type."
              className={`w-full h-full px-8 py-0 border-0 resize-none focus:outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${
                suggestions.length > 0 ? 'text-transparent bg-transparent' : 'bg-transparent'
              }`}
              style={{ 
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '18px',
                lineHeight: '1.8',
                zIndex: 1,
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
                  : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'
              }`}
            >
              <span>
                {suggestions.length === 0 
                  ? 'No errors found!' 
                  : `${suggestions.length} error${suggestions.length === 1 ? '' : 's'} found`
                }
              </span>
              {showSuggestions ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {/* Tools Section */}
          <div className="flex items-center justify-end space-x-1">
            <SampleEssayLoader />
            
            {/* FORCE ANALYSIS: Always triggers comprehensive analysis */}
            <button 
              onClick={async () => {
                console.log('🧪 Force Analysis button clicked');
                const currentText = currentDocument?.content || '';
                console.log('📝 Current text length:', currentText.length);
                console.log('📝 Current text preview:', currentText.substring(0, 200));
                
                if (currentText.trim().length > 0) {
                  console.log('🚀 Force triggering analysis...');
                  setIsAnalyzing(true);
                  
                  try {
                    // Clear existing suggestions first
                    setSuggestions([]);
                    console.log('🧹 Cleared existing suggestions');
                    
                    // Force analysis
                    const result = await enhancedAiService.analyzeText(currentText, userProfile || undefined);
                    console.log('🎯 Force analysis completed!');
                    console.log('📊 Results:', result.suggestions.length, 'suggestions found');
                    console.log('📋 Suggestion details:', result.suggestions.map(s => `"${s.originalText}" → "${s.suggestedText}"`));
                    
                    setSuggestions(result.suggestions);
                    setAnalysisResult(result);
                    console.log('✅ Suggestions and analysis result set in store');
                    
                    setIsAnalyzing(false);
                  } catch (error) {
                    console.error('❌ Force analysis failed:', error);
                    setIsAnalyzing(false);
                  }
                } else {
                  console.log('🧪 No text to analyze - text is empty');
                  alert('Please enter some text first, then click Force Analysis');
                }
              }}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Force Analysis'}
            </button>
            
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

      {/* Interactive Suggestion Tooltip */}
      <SuggestionTooltip />
    </div>
  );
};

export default TextEditor;
