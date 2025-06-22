import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useWritingStore } from '../store/writingStore';
import { enhancedAiService } from '../services/enhancedAiService';
import { openaiService } from '../services/openaiService';
import { vocabularyFeedbackService } from '../services/vocabularyFeedbackService';
import { checkPlagiarism } from '../services/plagiarismService';
import { errorPatternService } from '../services/errorPatternService';
import { debounce } from '../utils/debounce';
// import SuggestionsPanel from './SuggestionsPanel';
import ErrorHeatmap from './ErrorHeatmap';
import { Check, X, BookOpen, Users, Lightbulb, BookOpenText } from 'lucide-react';
import type { Suggestion } from '../types';
import { translationService, SUPPORTED_LANGUAGES } from '../services/translationService';
import { vocabularyEnhancementService, type VocabularySuggestion } from '../services/vocabularyEnhancementService';
import toast from 'react-hot-toast';

// Deduplication function to handle suggestions from multiple services targeting the same word
const deduplicateTextEditorSuggestions = (suggestions: any[]): any[] => {
  const deduplicated: any[] = [];
  const seen = new Set<string>();
  
  // Sort suggestions by priority: spelling/grammar first, then vocabulary
  const prioritizedSuggestions = [...suggestions].sort((a, b) => {
    // Prioritize spelling/grammar over vocabulary
    if ((a.type === 'spelling' || a.type === 'grammar') && a.type !== b.type) return -1;
    if ((b.type === 'spelling' || b.type === 'grammar') && a.type !== b.type) return 1;
    // Then sort by position
    return a.position.start - b.position.start;
  });
  
  for (const suggestion of prioritizedSuggestions) {
    // Create a key based on text position to identify overlapping suggestions
    const positionKey = `${suggestion.position.start}-${suggestion.position.end}`;
    
    if (!seen.has(positionKey)) {
      // Check if this suggestion overlaps with any existing suggestion
      const hasOverlap = deduplicated.some(existing => 
        positionsOverlap(
          { start: suggestion.position.start, end: suggestion.position.end },
          { start: existing.position.start, end: existing.position.end }
        )
      );
      
      if (!hasOverlap) {
        deduplicated.push(suggestion);
        seen.add(positionKey);
        console.log('✅ Keeping suggestion:', suggestion.type, suggestion.originalText);
      } else {
        console.log('🔄 Removing overlapping suggestion:', suggestion.type, suggestion.originalText);
      }
    } else {
      console.log('🔄 Removing duplicate suggestion:', suggestion.type, suggestion.originalText);
    }
  }
  
  return deduplicated;
};

const positionsOverlap = (pos1: { start: number; end: number }, pos2: { start: number; end: number }): boolean => {
  return pos1.start < pos2.end && pos2.start < pos1.end;
};

const TextEditor: React.FC = () => {
  const { 
    currentDocument, 
    suggestions, 
    isAnalyzing,
    updateDocumentContent, 
    setSuggestions, 
    setIsAnalyzing,
    // setAnalysisResult,
    applySuggestion: storeApplySuggestion,
    applyAllSuggestions,
    dismissSuggestion: _storeDismissSuggestion,
    userProfile,
    setCurrentDocument,
    // setSelectedSuggestion,
    goalBasedFeedback,
    isGeneratingGoalFeedback,
    setGoalBasedFeedback,
    setIsGeneratingGoalFeedback,
    aiWritingSuggestions,
    isGeneratingAISuggestions,
    setAIWritingSuggestions,
    setIsGeneratingAISuggestions,
    vocabularyFeedback,
    isGeneratingVocabularyFeedback,
    setVocabularyFeedback,
    setIsGeneratingVocabularyFeedback,
    plagiarismReport,
    isCheckingPlagiarism,
    setPlagiarismReport,
    setIsCheckingPlagiarism,
    errorHeatmapData,
    showErrorHeatmap,
    setErrorHeatmapData,
    setShowErrorHeatmap,
    setUserProfile
  } = useWritingStore();
  
  const textAreaRef = useRef<HTMLDivElement>(null);
  const [showSampleModal, setShowSampleModal] = useState(false);
  // const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [isErrorIndicatorDismissed, setIsErrorIndicatorDismissed] = useState(false);
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
  const [isProgrammaticUpdate, setIsProgrammaticUpdate] = useState(false);
  
  // Tooltip state for suggestion bubbles
  const [activeSuggestion, setActiveSuggestion] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{x: number, y: number, isBelow: boolean} | null>(null);

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
      // Set programmatic flag after document is set
      setTimeout(() => setIsProgrammaticUpdate(true), 0);
    }
  }, [userProfile, currentDocument, setCurrentDocument]);

  // Initialize temporary user profile for testing AI analysis if none exists
  useEffect(() => {
    if (!userProfile) {
      console.log('🔧 No user profile found, creating temporary profile for AI analysis testing...');
      const tempProfile = {
        id: 'temp-user',
        name: 'Test User',
        email: 'test@example.com',
        nativeLanguage: 'English',
        englishLevel: 'intermediate' as const,
        writingGoals: {
          type: 'academic' as const,
          targetWordCount: 500,
          targetAudience: 'professor' as const,
          formalityLevel: 'formal' as const,
          essayType: 'argumentative' as const,
        },
        preferences: {
          showExplanations: true,
          highlightComplexWords: true,
          suggestSimplifications: true,
          realTimeAnalysis: true, // This is crucial for AI analysis to work
        }
      };
      setUserProfile(tempProfile);
      console.log('✅ Temporary user profile created with realTimeAnalysis enabled');
    }
  }, [userProfile, setUserProfile]);

  // Set initial content of contentEditable when component mounts
  useEffect(() => {
    if (textAreaRef.current && currentDocument?.content !== undefined) {
      const currentDOMContent = textAreaRef.current.textContent || '';
      if (currentDOMContent === '' && currentDocument.content !== '') {
        // Set initial content only if DOM is empty
        textAreaRef.current.textContent = currentDocument.content;
      }
    }
  }, [currentDocument?.id]); // Only run when document changes

  // Set content of contentEditable for programmatic updates (like loading samples)
  useEffect(() => {
    if (textAreaRef.current && currentDocument?.content !== undefined && isProgrammaticUpdate) {
      // Only set content when it's a programmatic update (not user typing)
      textAreaRef.current.textContent = currentDocument.content;
      setIsProgrammaticUpdate(false);
    }
  }, [currentDocument?.content, isProgrammaticUpdate]);



  // Debug: Log when suggestions change (only in development)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && suggestions.length > 0) {
      console.log('🔍 TextEditor: Received', suggestions.length, 'suggestions:', suggestions.map(s => s.originalText));
    }
  }, [suggestions]);

  // Reset error indicator dismiss state when suggestions change
  React.useEffect(() => {
    setIsErrorIndicatorDismissed(false);
  }, [suggestions.length]);



  // Manual analysis function for immediate execution with AI-powered spell/grammar + vocabulary checking
  const performAnalysis = useCallback(async (text: string) => {
    if (text.trim().length > 10) {
      console.log('🚀 Starting comprehensive AI analysis (grammar + vocabulary) for:', text.substring(0, 50) + '...');
      setIsAnalyzing(true);
      try {
        if (!userProfile) {
          console.warn('⚠️ No user profile available for analysis');
          setIsAnalyzing(false);
          return;
        }

        // Run both grammar/spelling AND vocabulary analysis in parallel for faster results
        console.log('🌍 Using language for analysis:', userProfile?.nativeLanguage || 'English (default)');
        
        const [grammarResult, vocabularyResult] = await Promise.all([
          // Grammar and spelling analysis
          openaiService.analyzeText(
            text, 
            userProfile?.englishLevel || 'intermediate',
            userProfile?.nativeLanguage
          ),
          // Vocabulary enhancement analysis
          vocabularyEnhancementService.analyzeVocabulary(text, userProfile)
        ]);
        
        console.log('✅ Grammar analysis result:', grammarResult.grammarSuggestions.length, 'suggestions');
        console.log('✅ Vocabulary analysis result:', vocabularyResult.length, 'suggestions');
        
        // Convert grammar suggestions to our app format
        const convertedGrammarResult = openaiService.convertToAppFormat(grammarResult, text);
        
        // Convert vocabulary suggestions to our app format
        const vocabularySuggestions = vocabularyResult.map(vocabSugg => ({
          id: vocabSugg.id,
          type: vocabSugg.type,
          severity: vocabSugg.severity,
          originalText: vocabSugg.originalText,
          suggestedText: vocabSugg.suggestedText,
          explanation: vocabSugg.explanation,
          position: vocabSugg.position,
          confidence: vocabSugg.confidence
        }));
        
        // Combine grammar and vocabulary suggestions
        const allSuggestions = [
          ...convertedGrammarResult.suggestions,
          ...vocabularySuggestions
        ];
        
        // Deduplicate suggestions - prioritize spelling/grammar over vocabulary for same word
        const deduplicatedSuggestions = deduplicateTextEditorSuggestions(allSuggestions);
        
        // Sort by position in text for proper highlighting  
        deduplicatedSuggestions.sort((a: any, b: any) => a.position.start - b.position.start);
        
        setSuggestions(deduplicatedSuggestions);
        
        console.log('🎯 Final suggestions after deduplication:', deduplicatedSuggestions.length,
          `(from ${allSuggestions.length} original: ${convertedGrammarResult.suggestions.length} grammar/spelling, ${vocabularySuggestions.length} vocabulary)`);
        
        // Analyze error patterns from grammar suggestions only (for heatmap)
        if (convertedGrammarResult.suggestions.length > 0) {
          setTimeout(() => errorPatternService.analyzeErrorPatterns(convertedGrammarResult.suggestions), 0);
        }
      } catch (error) {
        console.error('❌ Comprehensive AI analysis failed:', error);
        // Fallback to enhanced service if OpenAI fails
        try {
          const fallbackResult = await enhancedAiService.analyzeText(text, userProfile || undefined);
          console.log('✅ Fallback analysis result:', fallbackResult);
          setSuggestions(fallbackResult.suggestions);
          if (fallbackResult.suggestions.length > 0) {
            setTimeout(() => errorPatternService.analyzeErrorPatterns(fallbackResult.suggestions), 0);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback analysis also failed:', fallbackError);
        }
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [userProfile, setSuggestions, setIsAnalyzing]);

  // Accept all suggestions at once (should ONLY be called by the Accept All button)
  const acceptAllSuggestions = useCallback(() => {
    const suggestionCount = suggestions.length;
    console.log('📝 ACCEPT ALL LOCAL FUNCTION - Accepting all', suggestionCount, 'suggestions');
    console.log('🔍 Store applyAllSuggestions function:', typeof applyAllSuggestions);
    
    if (suggestionCount === 0) {
      console.log('❌ No suggestions to apply');
      alert('No suggestions to apply!');
      return;
    }
    
    try {
      console.log('🚀 Calling store applyAllSuggestions...');
      
      // Use the store's optimized method for applying all suggestions
      applyAllSuggestions();
      
      console.log('✅ Store applyAllSuggestions called successfully');
      
      // Hide tooltip
      setActiveSuggestion(null);
      setTooltipPosition(null);
      
      // Show success message
      alert(`✅ Applied ${suggestionCount} suggestion${suggestionCount > 1 ? 's' : ''}!`);
      
      console.log('✅ All suggestions accepted');
    } catch (error) {
      console.error('❌ Error in acceptAllSuggestions:', error);
      alert(`❌ Error applying suggestions: ${error}`);
    }
  }, [applyAllSuggestions, suggestions.length]);

  // Generate vocabulary feedback
  const generateVocabularyFeedback = useCallback(async (text: string) => {
    if (!userProfile || text.trim().length < 20) {
      console.log('🔤 Vocabulary analysis skipped:', !userProfile ? 'no user profile' : `text too short (${text.trim().length} words)`);
      return;
    }
    
    console.log('🔤 Starting vocabulary analysis for', text.trim().length, 'characters...');
    setIsGeneratingVocabularyFeedback(true);
    try {
      const feedback = await vocabularyFeedbackService.analyzeVocabulary(text, userProfile);
      console.log('✅ Vocabulary feedback generated:', feedback);
      setVocabularyFeedback(feedback);
    } catch (error) {
      console.error('❌ Vocabulary feedback generation failed:', error);
    } finally {
      setIsGeneratingVocabularyFeedback(false);
    }
  }, [userProfile, setVocabularyFeedback, setIsGeneratingVocabularyFeedback]);

  // Plagiarism check function
  const handlePlagiarismCheck = useCallback(async () => {
    if (!currentDocument?.content || currentDocument.content.trim().length < 50) {
      toast.error('Please write at least 50 characters to perform a plagiarism check.');
      return;
    }

    console.log('🔍 Starting plagiarism check...');
    console.log('📝 Content length:', currentDocument.content.length);
    console.log('🔧 API Key available:', !!import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here');
    
    setIsCheckingPlagiarism(true);
    try {
      const report = await checkPlagiarism(currentDocument.content);
      console.log('✅ Plagiarism check completed:', report);
      setPlagiarismReport(report);
      setShowPlagiarismModal(true);
      
      if (report.totalMatches === 0) {
        toast.success('✅ No plagiarism detected!');
      } else {
        toast('⚠️ ' + `${report.totalMatches} potential match${report.totalMatches === 1 ? '' : 'es'} found`, {
          icon: '⚠️',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('❌ Plagiarism check failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('🔍 Error details:', errorMessage);
      
      // Better error messaging
      if (errorMessage.includes('API key')) {
        toast.error('❌ OpenAI API key is missing or invalid. Please check your environment variables.');
      } else if (errorMessage.includes('network')) {
        toast.error('❌ Network error. Please check your internet connection.');
      } else {
        toast.error('❌ Plagiarism check failed. Please try again or check the console for details.');
      }
    } finally {
      setIsCheckingPlagiarism(false);
    }
  }, [currentDocument, setIsCheckingPlagiarism, setPlagiarismReport]);

  // Generate error heatmap
  const handleErrorHeatmap = useCallback(() => {
    console.log('📊 Generating error heatmap...');
    const heatmapData = errorPatternService.getErrorHeatmapData();
    console.log('✅ Error heatmap generated:', heatmapData);
    setErrorHeatmapData(heatmapData);
    setShowErrorHeatmap(true);
  }, [setErrorHeatmapData, setShowErrorHeatmap]);

  // Analyze suggestions for error patterns
  const analyzeErrorPatterns = useCallback((suggestions: Suggestion[]) => {
    if (suggestions.length > 0) {
      console.log('📊 Analyzing error patterns from', suggestions.length, 'suggestions...');
      errorPatternService.analyzeErrorPatterns(suggestions);
    }
    
    // Also record successful usage for content without errors
    if (suggestions.length === 0 && currentDocument?.content) {
      errorPatternService.recordSuccessfulUsage(currentDocument.content);
    }
  }, [currentDocument]);

  // Debounced vocabulary analysis
  const debouncedVocabularyAnalysis = useCallback(
    debounce((text: string) => {
      generateVocabularyFeedback(text);
    }, 1500),
    [generateVocabularyFeedback]
  );

  // Trigger vocabulary analysis for existing content when user profile is available
  useEffect(() => {
    if (userProfile && currentDocument?.content && currentDocument.content.trim().length > 20) {
      console.log('🔤 Triggering vocabulary analysis for existing content...');
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        generateVocabularyFeedback(currentDocument.content);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userProfile, currentDocument?.content, generateVocabularyFeedback]);

  // Real-time debounced analysis using AI-powered spell/grammar checking
  const debouncedAnalyze = useCallback(
    (text: string) => {
      console.log('🔍 debouncedAnalyze called with:', {
        textLength: text.trim().length,
        hasUserProfile: !!userProfile,
        realTimeAnalysis: userProfile?.preferences.realTimeAnalysis,
        englishLevel: userProfile?.englishLevel,
        nativeLanguage: userProfile?.nativeLanguage
      });
      
      if (userProfile?.preferences.realTimeAnalysis && text.trim().length > 5) {
        console.log('🚀 Starting real-time AI-powered spell/grammar analysis...');
        console.log('🌍 Real-time analysis using language:', userProfile?.nativeLanguage || 'English (default)');
        setIsAnalyzing(true);
        
        // Use OpenAI service for real-time analysis with shorter debouncing (grammar + vocabulary)
        openaiService.analyzeTextDebounced(
          text, 
          userProfile?.englishLevel || 'intermediate',
          async (analysisResult) => {
            console.log('⚡ Real-time grammar analysis complete:', analysisResult.grammarSuggestions.length, 'suggestions');
            
            // Also run vocabulary analysis for real-time feedback
            try {
              const vocabularyResult = await vocabularyEnhancementService.analyzeVocabulary(text, userProfile);
              console.log('⚡ Real-time vocabulary analysis complete:', vocabularyResult.length, 'suggestions');
              
              // Convert grammar suggestions to our app format
              const convertedGrammarResult = openaiService.convertToAppFormat(analysisResult, text);
              
              // Convert vocabulary suggestions to our app format
              const vocabularySuggestions = vocabularyResult.map(vocabSugg => ({
                id: vocabSugg.id,
                type: vocabSugg.type,
                severity: vocabSugg.severity,
                originalText: vocabSugg.originalText,
                suggestedText: vocabSugg.suggestedText,
                explanation: vocabSugg.explanation,
                position: vocabSugg.position,
                confidence: vocabSugg.confidence
              }));
              
              // Combine grammar and vocabulary suggestions
              const allSuggestions = [
                ...convertedGrammarResult.suggestions,
                ...vocabularySuggestions
              ];
              
              // Deduplicate suggestions - prioritize spelling/grammar over vocabulary for same word
              const deduplicatedSuggestions = deduplicateTextEditorSuggestions(allSuggestions);
              
              // Sort by position in text
              deduplicatedSuggestions.sort((a: any, b: any) => a.position.start - b.position.start);
              
              setSuggestions(deduplicatedSuggestions);
              
              console.log('⚡ Real-time suggestions after deduplication:', deduplicatedSuggestions.length,
                `(from ${allSuggestions.length} original: ${convertedGrammarResult.suggestions.length} grammar, ${vocabularySuggestions.length} vocabulary)`);
              
              // Analyze error patterns from grammar suggestions only (for heatmap)
              if (convertedGrammarResult.suggestions.length > 0) {
                setTimeout(() => errorPatternService.analyzeErrorPatterns(convertedGrammarResult.suggestions), 0);
              }
            } catch (vocabError) {
              console.warn('⚠️ Real-time vocabulary analysis failed, using grammar only:', vocabError);
              // Fallback to grammar-only suggestions
              const convertedResult = openaiService.convertToAppFormat(analysisResult, text);
              setSuggestions(convertedResult.suggestions);
              
              if (convertedResult.suggestions.length > 0) {
                setTimeout(() => errorPatternService.analyzeErrorPatterns(convertedResult.suggestions), 0);
              }
            }
            
            setIsAnalyzing(false);
          }, 
          1200, // Increased debounce to give user more time to finish typing
          userProfile?.nativeLanguage
        );
      } else {
        console.log('❌ Analysis skipped - Requirements not met:', {
          realTimeAnalysis: userProfile?.preferences.realTimeAnalysis,
          textLength: text.trim().length,
          hasUserProfile: !!userProfile
        });
      }
    },
    [userProfile, setSuggestions, setIsAnalyzing]
  );

  // Save and restore cursor position
  const saveCursorPosition = useCallback(() => {
    if (!textAreaRef.current) return 0;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(textAreaRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return preCaretRange.toString().length;
  }, []);

  const restoreCursorPosition = useCallback((position: number) => {
    if (!textAreaRef.current) return;
    
    try {
      const selection = window.getSelection();
      if (!selection) return;

      const createRange = (node: Node, position: number) => {
        const range = document.createRange();
        let charIndex = 0;
        let walker = document.createTreeWalker(
          node,
          NodeFilter.SHOW_TEXT,
          null
        );

        let textNode;
        while (textNode = walker.nextNode()) {
          const nextCharIndex = charIndex + (textNode.textContent?.length || 0);
          if (position >= charIndex && position <= nextCharIndex) {
            range.setStart(textNode, position - charIndex);
            range.collapse(true);
            return range;
          }
          charIndex = nextCharIndex;
        }

        // If position is beyond text, place at end
        range.selectNodeContents(node);
        range.collapse(false);
        return range;
      };

      const range = createRange(textAreaRef.current, position);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (error) {
      console.warn('Failed to restore cursor position:', error);
    }
  }, []);

  // Handle contentEditable changes
  const handleContentEditableChange = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const newContent = target.textContent || '';
    
    // Only update our state, don't trigger re-render of the contentEditable
    updateDocumentContent(newContent);
    
    // Clear any existing suggestions and tooltips when typing
    if (activeSuggestion) {
      setActiveSuggestion(null);
      setTooltipPosition(null);
    }
    
    // Debounced analysis for grammar/spelling
    debouncedAnalyze(newContent);
    
    // Always trigger vocabulary analysis (independent of real-time grammar analysis)
    if (newContent.trim().length > 20) {
      debouncedVocabularyAnalysis(newContent);
    }
  }, [updateDocumentContent, activeSuggestion, debouncedAnalyze, debouncedVocabularyAnalysis]);

  // Handle key events for better cursor management
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      
      // Use Selection API directly for more reliable tab insertion
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const tabSpaces = '    '; // 4 spaces for tab
      
      // Delete any selected text first
      range.deleteContents();
      
      // Create a text node with tab spaces
      const textNode = document.createTextNode(tabSpaces);
      range.insertNode(textNode);
      
      // Move cursor to after the inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Update our document state
      const target = e.target as HTMLDivElement;
      updateDocumentContent(target.textContent || '');
      
      return;
    }
    
    // Handle Enter key to ensure proper line breaks
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Use Selection API directly for more reliable enter insertion
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      
      // Delete any selected text first
      range.deleteContents();
      
      // Create a <br> element for proper line break in HTML
      const brElement = document.createElement('br');
      range.insertNode(brElement);
      
      // Move cursor to after the line break
      range.setStartAfter(brElement);
      range.setEndAfter(brElement);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Update our document state (convert HTML to plain text with \n)
      const target = e.target as HTMLDivElement;
      // Convert <br> tags to \n for our text content
      const textContent = target.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
      updateDocumentContent(textContent);
      
      return;
    }
  }, [updateDocumentContent, saveCursorPosition, restoreCursorPosition]);

  // const handleTextChange = handleContentEditableChange;

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

  // Handle clicking on textarea to close any open tooltips or handle suggestion clicks
  const handleTextAreaClick = useCallback((_e: React.MouseEvent) => {
    // Close existing tooltips when clicking on the text area
    if (activeSuggestion) {
      setActiveSuggestion(null);
      setTooltipPosition(null);
    }
  }, [activeSuggestion]);

  // Accept a single suggestion (ensure it only accepts ONE)
  const acceptSuggestion = useCallback((suggestion: any) => {
    console.log('🎯 ACCEPTING INDIVIDUAL SUGGESTION ONLY:', {
      id: suggestion.id,
      original: suggestion.originalText,
      suggested: suggestion.suggestedText,
      totalSuggestions: suggestions.length
    });
    
    // Make sure we're only applying ONE suggestion by ID
    if (suggestion?.id) {
      storeApplySuggestion(suggestion.id);
      console.log('✅ Applied suggestion with ID:', suggestion.id);
    } else {
      console.error('❌ No suggestion ID found!', suggestion);
    }
    
    // Close tooltip
    setActiveSuggestion(null);
    setTooltipPosition(null);
  }, [storeApplySuggestion, suggestions.length]);

  // Dismiss a suggestion
  const dismissSuggestion = useCallback((suggestion: any) => {
    setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
    setActiveSuggestion(null);
    setTooltipPosition(null);
  }, [suggestions, setSuggestions]);

  // Clean up invalid suggestions function
  const cleanupInvalidSuggestions = useCallback(() => {
    if (!currentDocument || suggestions.length === 0) return;
    
    const content = currentDocument.content;
    const validSuggestions = suggestions.filter(suggestion => {
      if (suggestion.position.start < 0 || suggestion.position.end > content.length) {
        console.warn('⚠️ Invalid suggestion position:', suggestion);
        return false;
      }
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
    
    if (validSuggestions.length !== suggestions.length) {
      console.log('🧹 Cleaning up', suggestions.length - validSuggestions.length, 'invalid suggestions');
      setSuggestions(validSuggestions);
    }
  }, [currentDocument, suggestions, setSuggestions]);

  // Clean up invalid suggestions when content changes
  useEffect(() => {
    cleanupInvalidSuggestions();
  }, [cleanupInvalidSuggestions]);

  // Generate highlighted content with error underlines
  const generateHighlightedContent = useCallback(() => {
    if (!currentDocument || suggestions.length === 0) {
      return currentDocument?.content || '';
    }
    
    const content = currentDocument.content;
    let result = '';
    let lastIndex = 0;

    // Sort suggestions by position and filter out invalid ones  
    const validSuggestions = suggestions.filter(suggestion => {
      // Validate positions are within text bounds
      if (suggestion.position.start < 0 || suggestion.position.end > content.length) {
        return false;
      }
      // Validate the text still matches
      const textAtPosition = content.substring(suggestion.position.start, suggestion.position.end);
      return textAtPosition === suggestion.originalText;
    }).sort((a, b) => a.position.start - b.position.start);

    validSuggestions.forEach((suggestion, _index) => {
      // Add text before this suggestion
      result += content.substring(lastIndex, suggestion.position.start);
      
      // Add the highlighted suggestion with a data attribute for click handling
      // Make sure spelling and grammar errors get red highlighting
      let errorClass;
      if (suggestion.type === 'grammar' || suggestion.type === 'spelling') {
        errorClass = 'error-spelling'; // Use error-spelling class for both spelling and grammar to ensure red color
      } else if (suggestion.type === 'vocabulary') {
        errorClass = 'error-vocabulary';
      } else if (suggestion.type === 'style') {
        errorClass = 'error-style';
      } else {
        errorClass = 'error-spelling'; // Default to red for any other error types
      }
      
      result += `<mark class="${errorClass}" data-suggestion-id="${suggestion.id}" style="cursor: pointer;">${suggestion.originalText}</mark>`;
      
      lastIndex = suggestion.position.end;
    });
    
    // Add remaining text
    result += content.substring(lastIndex);
    
    return result;
  }, [currentDocument, suggestions]);

  // Update contentEditable when suggestions change to show/hide highlighting
  useEffect(() => {
    if (textAreaRef.current) {
      const newHTML = generateHighlightedContent();
      if (textAreaRef.current.innerHTML !== newHTML) {
        const cursorPosition = saveCursorPosition();
        textAreaRef.current.innerHTML = newHTML;
        
        // Add click handlers to highlighted suggestions
        const marks = textAreaRef.current.querySelectorAll('mark[data-suggestion-id]');
        console.log('👆 Adding click handlers to', marks.length, 'highlighted suggestions');
        marks.forEach((mark) => {
          const suggestionId = mark.getAttribute('data-suggestion-id');
          const suggestion = suggestions.find(s => s.id === suggestionId);
          if (suggestion) {
            // Remove any existing click handlers first
            mark.replaceWith(mark.cloneNode(true));
            const newMark = textAreaRef.current!.querySelector(`mark[data-suggestion-id="${suggestionId}"]`);
            if (newMark) {
              newMark.addEventListener('click', (e) => {
                console.log('🎯 CLICKED ON INDIVIDUAL SUGGESTION:', {
                  id: suggestion.id,
                  original: suggestion.originalText,
                  suggested: suggestion.suggestedText
                });
                e.preventDefault();
                e.stopPropagation();
                handleSuggestionClick(suggestion, e as any);
              });
            }
          }
        });
        
        // Restore cursor position after updating content
        requestAnimationFrame(() => {
          restoreCursorPosition(cursorPosition);
        });
      }
    }
  }, [suggestions, generateHighlightedContent, saveCursorPosition, restoreCursorPosition, handleSuggestionClick]);

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
          <div className="text-sm text-gray-700">
            {activeSuggestion.explanation.includes('|') && userProfile?.nativeLanguage && userProfile.nativeLanguage !== 'English' ? (
              <div className="space-y-2">
                {/* English explanation */}
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs font-medium text-gray-600 mb-1">🇺🇸 English:</div>
                  <div className="text-sm">{activeSuggestion.explanation.split('|')[0].trim()}</div>
                </div>
                {/* Native language explanation */}
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xs font-medium text-blue-600 mb-1">
                    {SUPPORTED_LANGUAGES.find(lang => lang.name === userProfile.nativeLanguage)?.flag || '🌍'} {userProfile.nativeLanguage}:
                  </div>
                  <div className="text-sm">{activeSuggestion.explanation.split('|')[1]?.trim()}</div>
                </div>
              </div>
            ) : (
              <p>{activeSuggestion.explanation}</p>
            )}
          </div>
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
            onClick={() => {
              console.log('🎯 TOOLTIP ACCEPT BUTTON CLICKED for suggestion:', activeSuggestion?.id);
              acceptSuggestion(activeSuggestion);
            }}
            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            <Check className="h-3 w-3" />
            <span>Accept</span>
          </button>
          <button
            onClick={() => {
              console.log('🗑️ TOOLTIP DISMISS BUTTON CLICKED for suggestion:', activeSuggestion?.id);
              dismissSuggestion(activeSuggestion);
            }}
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

  // SuggestionsPanel component with Goal-Based Feedback
  const SuggestionsPanel = () => (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Writing Suggestions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <span className="mr-2">💡</span>
            Writing Suggestions ({suggestions.length})
          </h3>
        </div>
        
        {suggestions.length === 0 ? (
          <p className="text-gray-500 text-sm">No errors found. Your writing looks great!</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {/* Accept All Button - Show for 1+ suggestions for easier testing */}
            {suggestions.length > 0 && (
              <div className="mb-3 pb-3 border-b border-gray-200">
                <button
                  onClick={() => {
                    console.log('🚀 ACCEPT ALL BUTTON CLICKED!');
                    console.log('📊 Current suggestions:', suggestions.length);
                    console.log('📝 Suggestions data:', suggestions.map(s => ({ id: s.id, original: s.originalText, suggested: s.suggestedText })));
                    
                    try {
                      acceptAllSuggestions();
                      console.log('✅ acceptAllSuggestions function called successfully');
                    } catch (error) {
                      console.error('❌ Error calling acceptAllSuggestions:', error);
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700 w-full justify-center"
                >
                  <Check className="h-4 w-4" />
                  <span>Accept All {suggestions.length} Suggestion{suggestions.length > 1 ? 's' : ''}</span>
                </button>
              </div>
            )}
            
            {suggestions.map((suggestion, index) => (
              <div key={suggestion.id || index} className="border rounded-lg p-2 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">
                      "{suggestion.originalText}"
                    </span>
                    <span className="text-gray-400 text-xs">→</span>
                    <span className="font-mono text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                      "{suggestion.suggestedText}"
                    </span>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded capitalize">
                    {suggestion.type}
                  </span>
                </div>
                
                <div className="text-xs text-gray-700 mb-2">
                  <strong>Explanation:</strong>
                  {suggestion.explanation.includes('|') && userProfile?.nativeLanguage && userProfile.nativeLanguage !== 'English' ? (
                    <div className="mt-1 space-y-2">
                      {/* English explanation */}
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs font-medium text-gray-600 mb-1">🇺🇸 English:</div>
                        <div>{suggestion.explanation.split('|')[0].trim()}</div>
                      </div>
                      {/* Native language explanation */}
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs font-medium text-blue-600 mb-1">
                          {SUPPORTED_LANGUAGES.find(lang => lang.name === userProfile.nativeLanguage)?.flag || '🌍'} {userProfile.nativeLanguage}:
                        </div>
                        <div>{suggestion.explanation.split('|')[1]?.trim()}</div>
                      </div>
                    </div>
                  ) : (
                    <span> {suggestion.explanation}</span>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => acceptSuggestion(suggestion)}
                    className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                  >
                    <Check className="h-2 w-2" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => dismissSuggestion(suggestion)}
                    className="flex items-center space-x-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                  >
                    <X className="h-2 w-2" />
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goal-Based Feedback Section */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <Users className="h-4 w-4 mr-2 text-orange-500" />
            Writing Goals
            {isGeneratingGoalFeedback && (
              <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500"></div>
            )}
            {/* Current language indicator */}
            {userProfile?.nativeLanguage && userProfile.nativeLanguage !== 'English' && (
              <div className="ml-auto flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                <span className="mr-1">
                  🇺🇸 + {SUPPORTED_LANGUAGES.find(lang => lang.name === userProfile.nativeLanguage)?.flag || '🌍'}
                </span>
                <span>Bilingual Mode</span>
              </div>
            )}
          </h3>
          
          {/* Language Selector for Bilingual Suggestions */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-gray-700" title="Choose the second language for bilingual suggestions">
              <span className="mr-1">🌍</span>
              Suggestions Language:
            </label>
            <select
              value={userProfile?.nativeLanguage || 'English'}
              onChange={(e) => {
                const newLanguage = e.target.value;
                if (userProfile) {
                  const updatedProfile = {
                    ...userProfile,
                    nativeLanguage: newLanguage
                  };
                  setUserProfile(updatedProfile);
                  
                  // Clear existing feedback to show regeneration with new language
                  setGoalBasedFeedback(null);
                  setAIWritingSuggestions(null);
                  setVocabularyFeedback(null);
                  setIsGeneratingGoalFeedback(true);
                  setIsGeneratingAISuggestions(true);
                  setIsGeneratingVocabularyFeedback(true);
                  
                  // Clear current suggestions so they regenerate with new language
                  setSuggestions([]);
                  
                  // Regenerate suggestions with new language
                  if (currentDocument?.content && currentDocument.content.trim().length > 10) {
                    console.log('🔄 Regenerating suggestions with new language:', newLanguage);
                    setTimeout(() => {
                      performAnalysis(currentDocument.content);
                    }, 200);
                  }
                  
                  // Regenerate vocabulary feedback if there's enough text
                  if (currentDocument?.content && currentDocument.content.trim().length > 20) {
                    setTimeout(() => generateVocabularyFeedback(currentDocument.content), 300);
                  }
                  
                  // Show a success message
                  console.log('🌍 Language changed to:', newLanguage === 'English' ? 'English Only' : `English + ${newLanguage}`);
                }
              }}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[180px]"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              <option value="English">🇺🇸 English Only</option>
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.name}>
                  🇺🇸 + {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {isGeneratingGoalFeedback ? (
          <div className="text-xs text-orange-600 p-2 bg-orange-50 rounded flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500 mr-2"></div>
            Generating goal-based feedback...
          </div>
        ) : goalBasedFeedback ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {/* Overall Assessment */}
            <div className="text-xs text-orange-800 p-2 bg-orange-50 rounded border-l-2 border-orange-200">
              <strong>📝 Overall:</strong> {goalBasedFeedback.overallAssessment}
            </div>

            {/* Specific Goals */}
            {goalBasedFeedback.specificGoals.map((goal, index) => (
              <div key={index} className="text-xs p-2 bg-orange-50 rounded border-l-2 border-orange-200">
                <div className="font-medium text-orange-800 mb-1">
                  🎯 {goal.goal} 
                  <span className="ml-1 bg-orange-200 text-orange-800 text-xs px-1 py-0.5 rounded">
                    {goal.score}/100
                  </span>
                </div>
                <div className="text-orange-700 mb-1 text-xs">{goal.assessment}</div>
                {goal.suggestions.map((suggestion, sugIndex) => (
                  <div key={sugIndex} className="text-orange-600 text-xs ml-2 mb-1">
                    • {suggestion}
                  </div>
                ))}
              </div>
            ))}

            {/* Strengths */}
            {goalBasedFeedback.strengthsIdentified.length > 0 && (
              <div className="text-xs p-2 bg-green-50 rounded border-l-2 border-green-200">
                <div className="font-medium text-green-800 mb-1">✅ Strengths:</div>
                {goalBasedFeedback.strengthsIdentified.map((strength, index) => (
                  <div key={index} className="text-green-700 text-xs mb-1">• {strength}</div>
                ))}
              </div>
            )}

            {/* Next Steps */}
            {goalBasedFeedback.nextSteps.length > 0 && (
              <div className="text-xs p-2 bg-blue-50 rounded border-l-2 border-blue-200">
                <div className="font-medium text-blue-800 mb-1">🚀 Next Steps:</div>
                {goalBasedFeedback.nextSteps.map((step, index) => (
                  <div key={index} className="text-blue-700 text-xs mb-1">• {step}</div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-orange-600 p-2 bg-orange-50 rounded">
            💡 Goal-based feedback will appear as you write more content...
          </div>
        )}
      </div>

      {/* AI Writing Suggestions Section */}
      <div className="border-t pt-4 space-y-3">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
          AI Writing Tips
          {isGeneratingAISuggestions && (
            <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-500"></div>
          )}
        </h3>
        
        {isGeneratingAISuggestions ? (
          <div className="text-xs text-yellow-600 p-2 bg-yellow-50 rounded flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-500 mr-2"></div>
            Generating AI suggestions...
          </div>
        ) : aiWritingSuggestions ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {/* General Tips */}
            {aiWritingSuggestions.generalTips.length > 0 && (
              <div>
                <div className="text-xs font-medium text-yellow-800 mb-1">💡 General Tips:</div>
                {aiWritingSuggestions.generalTips.slice(0, 2).map((tip, index) => (
                  <div key={index} className="text-xs text-yellow-700 p-1 bg-yellow-50 rounded mb-1">
                    • {tip}
                  </div>
                ))}
              </div>
            )}

            {/* Writing Type Specific */}
            {aiWritingSuggestions.writingTypeSpecific.length > 0 && (
              <div>
                <div className="text-xs font-medium text-blue-800 mb-1">🎯 Specific Tips:</div>
                {aiWritingSuggestions.writingTypeSpecific.slice(0, 2).map((tip, index) => (
                  <div key={index} className="text-xs text-blue-700 p-1 bg-blue-50 rounded mb-1">
                    • {tip}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-yellow-600 p-2 bg-yellow-50 rounded">
            💡 AI writing suggestions will appear when you select a writing type...
          </div>
        )}
      </div>

      {/* Vocabulary Feedback Section */}
      <div className="border-t pt-4 space-y-3">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <BookOpenText className="h-4 w-4 mr-2 text-purple-500" />
          Vocabulary Analysis
          {isGeneratingVocabularyFeedback && (
            <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-purple-500"></div>
          )}
        </h3>
        
        {isGeneratingVocabularyFeedback ? (
          <div className="text-xs text-purple-600 p-2 bg-purple-50 rounded flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-500 mr-2"></div>
            Analyzing vocabulary level...
          </div>
        ) : vocabularyFeedback ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {/* Overall Score */}
            <div className="text-xs text-purple-800 p-2 bg-purple-50 rounded border-l-2 border-purple-200">
              <strong>📊 Level Match:</strong> {vocabularyFeedback.overallScore}/100 
              <span className="ml-1 text-purple-600">
                ({vocabularyFeedback.levelAppropriate ? 'Good fit' : 'Needs adjustment'})
              </span>
            </div>

            {/* Complex Words */}
            {vocabularyFeedback.complexWords.length > 0 && (
              <div className="text-xs p-2 bg-red-50 rounded border-l-2 border-red-200">
                <div className="font-medium text-red-800 mb-1">🔴 Too Complex:</div>
                {vocabularyFeedback.complexWords.slice(0, 3).map((word, index) => (
                  <div key={index} className="text-red-700 mb-1">
                    <span className="font-mono bg-red-100 px-1 rounded">{word.word}</span>
                    <div className="text-xs ml-2">• {word.explanation}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Simple Words */}
            {vocabularyFeedback.simpleWords.length > 0 && (
              <div className="text-xs p-2 bg-yellow-50 rounded border-l-2 border-yellow-200">
                <div className="font-medium text-yellow-800 mb-1">🟡 Too Simple:</div>
                {vocabularyFeedback.simpleWords.slice(0, 3).map((word, index) => (
                  <div key={index} className="text-yellow-700 mb-1">
                    <span className="font-mono bg-yellow-100 px-1 rounded">{word.word}</span>
                    <div className="text-xs ml-2">• {word.explanation}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {vocabularyFeedback.recommendations.length > 0 && (
              <div className="text-xs p-2 bg-blue-50 rounded border-l-2 border-blue-200">
                <div className="font-medium text-blue-800 mb-1">💡 Recommendations:</div>
                {vocabularyFeedback.recommendations.slice(0, 2).map((rec, index) => (
                  <div key={index} className="text-blue-700 mb-1">
                    • {rec.message}
                    {rec.examples && rec.examples.length > 0 && (
                      <div className="text-xs ml-2 mt-1">
                        Examples: {rec.examples.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Suggested Words */}
            {vocabularyFeedback.suggestedWords.length > 0 && (
              <div className="text-xs p-2 bg-green-50 rounded border-l-2 border-green-200">
                <div className="font-medium text-green-800 mb-1">✨ Better Alternatives:</div>
                {vocabularyFeedback.suggestedWords.slice(0, 2).map((suggestion, index) => (
                  <div key={index} className="text-green-700 mb-1">
                    <span className="font-mono bg-green-100 px-1 rounded">{suggestion.original}</span>
                    <span className="mx-1">→</span>
                    <span className="font-mono bg-green-200 px-1 rounded">
                      {suggestion.suggested.slice(0, 2).join(', ')}
                    </span>
                    <div className="text-xs ml-2">• {suggestion.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-purple-600 p-2 bg-purple-50 rounded">
            📚 Vocabulary analysis will appear as you write more content (minimum 20 words)...
          </div>
        )}
      </div>
    </div>
  );

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

  // Handle escape key to close modal and tooltips
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSampleModal) {
          setShowSampleModal(false);
        } else if (activeSuggestion) {
          setActiveSuggestion(null);
          setTooltipPosition(null);
        }
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSampleModal, activeSuggestion]);

  // Static sample content for different document types and levels
  const sampleContent = {
    essay: {
      beginner: {
        title: "My Favorite Hobby",
        content: "My favorite hobby is reading books. I like to read different kinds of books like stories, science books, and books about history. Reading helps me learn new things and makes me happy.\n\nI usually read for one hour every day after school. I have a special place in my room where I sit and read. My favorite book is about a young girl who goes on adventures. She is brave and smart, and I want to be like her.\n\nReading is good for many reasons. It helps me learn new words and become better at writing. It also helps me understand different people and places around the world. When I read, I can imagine I am in the story.\n\nI think everyone should try reading more books. It is fun and you can learn many things. Books can take you to different worlds and help you dream big dreams."
      },
      intermediate: {
        title: "The Benefits of Learning a Second Language",
        content: "Learning a second language is one of the most valuable skills a person can develop in today's interconnected world. As globalization continues to bring people from different cultures together, the ability to communicate in multiple languages has become increasingly important for both personal and professional growth.\n\nFirst, learning a second language enhances cognitive abilities. Research has shown that bilingual individuals have better problem-solving skills, improved memory, and enhanced creativity. The mental exercise of switching between languages strengthens the brain and can even delay the onset of age-related cognitive decline.\n\nSecond, language learning opens up numerous career opportunities. In our global economy, employers highly value employees who can communicate with international clients and partners. Being bilingual can lead to higher salaries, promotions, and access to jobs in different countries.\n\nFinally, learning a new language allows us to connect with different cultures on a deeper level. It helps us understand different perspectives, traditions, and ways of thinking. This cultural awareness makes us more empathetic and well-rounded individuals.\n\nIn conclusion, the benefits of learning a second language extend far beyond simple communication. It improves our minds, enhances our careers, and enriches our understanding of the world around us."
      },
      advanced: {
        title: "The Digital Revolution's Impact on Modern Education",
        content: "The advent of digital technology has fundamentally transformed the landscape of education, creating unprecedented opportunities for learning while simultaneously presenting complex challenges that educators and policymakers must navigate. This digital revolution has not merely supplemented traditional teaching methods but has fundamentally altered the pedagogical paradigm, reshaping how knowledge is transmitted, acquired, and evaluated in contemporary educational settings.\n\nThe democratization of information through digital platforms has perhaps been the most profound change in educational accessibility. Students today can access vast repositories of knowledge, engage with expert instructors from around the globe, and participate in collaborative learning environments that transcend geographical boundaries. Massive Open Online Courses (MOOCs) have made high-quality education available to millions who previously lacked access to such resources, effectively dismantling traditional barriers of cost, location, and institutional affiliation.\n\nHowever, this digital transformation has also introduced significant challenges that threaten educational equity and effectiveness. The digital divide—the gap between those who have access to modern technology and those who do not—has become a critical factor in educational inequality. Students from economically disadvantaged backgrounds often lack the necessary devices, reliable internet connections, or technical support required to fully participate in digital learning environments.\n\nFurthermore, the abundance of information available online has necessitated a fundamental shift in educational priorities. Rather than focusing solely on content delivery, educators must now emphasize critical thinking skills, digital literacy, and the ability to evaluate the credibility and relevance of information sources. This evolution requires substantial investment in teacher training and curriculum development to ensure that educational institutions can effectively prepare students for an increasingly complex digital world.\n\nIn conclusion, while the digital revolution has undoubtedly enhanced the potential for innovative and accessible education, its successful implementation requires thoughtful consideration of equity issues, substantial infrastructure investment, and a commitment to developing both technological competency and critical thinking skills among students and educators alike."
      }
    },
    email: {
      beginner: {
        title: "Thank You Email",
        content: "Subject: Thank you for your help\n\nDear Ms. Johnson,\n\nI hope you are doing well. I want to thank you for helping me with my project last week. Your advice was very helpful and I learned a lot from you.\n\nBecause of your help, I was able to finish my project on time. My teacher was happy with my work and I got a good grade. I could not have done it without your support.\n\nThank you again for being so kind and helpful. I hope I can help you in the future too.\n\nBest regards,\nSarah"
      },
      intermediate: {
        title: "Job Application Email",
        content: "Subject: Application for Marketing Assistant Position\n\nDear Hiring Manager,\n\nI am writing to express my interest in the Marketing Assistant position advertised on your company website. With my recent degree in Business Administration and my passion for digital marketing, I believe I would be a valuable addition to your team.\n\nDuring my studies, I completed several marketing projects that involved social media campaigns, market research, and content creation. I also gained practical experience through a three-month internship at a local advertising agency, where I assisted with client presentations and campaign development.\n\nI am particularly excited about this opportunity because your company's innovative approach to sustainable marketing aligns with my personal values and career goals. I am eager to contribute my creativity, analytical skills, and fresh perspective to your marketing team.\n\nI have attached my resume and portfolio for your review. I would welcome the opportunity to discuss how my skills and enthusiasm can contribute to your organization's continued success.\n\nThank you for considering my application. I look forward to hearing from you soon.\n\nSincerely,\nMichael Chen"
      },
      advanced: {
        title: "Strategic Partnership Proposal",
        content: "Subject: Strategic Partnership Proposal - Expanding Market Reach Through Collaborative Innovation\n\nDear Mr. Rodriguez,\n\nI hope this message finds you well. Following our productive conversation at the International Business Summit last month, I am writing to formally propose a strategic partnership between our organizations that could yield significant mutual benefits while advancing our shared commitment to sustainable business practices.\n\nOur preliminary market analysis indicates substantial synergies between TechnoVate Solutions' cutting-edge artificial intelligence capabilities and your company's extensive distribution network across emerging markets. By combining our technological expertise with your established market presence, we could create a competitive advantage that would be difficult for either organization to achieve independently.\n\nThe proposed collaboration would involve three key components: joint product development initiatives focusing on AI-driven logistics optimization, shared investment in research and development activities targeting sustainable technology solutions, and coordinated market entry strategies for the Southeast Asian and Latin American regions. Our financial projections suggest that this partnership could generate a combined revenue increase of 35-40% within the first two years of implementation.\n\nTo ensure the success of this venture, we propose establishing a joint steering committee comprising senior executives from both organizations, implementing robust intellectual property protection agreements, and developing clear performance metrics and milestone assessments. We have prepared a comprehensive feasibility study and financial model that I would be delighted to share during a formal presentation to your executive team.\n\nI believe this partnership represents a unique opportunity to leverage our complementary strengths while positioning both organizations at the forefront of industry innovation. I would welcome the opportunity to discuss this proposal in greater detail at your earliest convenience.\n\nThank you for your time and consideration. I look forward to your response and the possibility of building a transformative business relationship.\n\nWarm regards,\nDr. Elena Vasquez\nChief Strategy Officer\nTechnoVate Solutions"
      }
    },
    letter: {
      beginner: {
        title: "Letter to a Friend",
        content: "Dear Maria,\n\nI hope you are happy and healthy. I miss you very much since you moved to another city. I want to tell you about my new school and my life here.\n\nMy new school is bigger than my old school. I have made some new friends, but they are not like you. We had so much fun together! I still remember when we played games in the playground and studied together for our tests.\n\nI am doing well in my classes. My favorite subject is still English, and my teacher says I am improving. I also joined the art club because I remember how much we enjoyed drawing together.\n\nPlease write to me soon and tell me about your new school and friends. I want to know if you are happy there. Maybe you can visit me during the summer holidays. My family would be happy to see you.\n\nI miss our friendship very much. Take care of yourself!\n\nYour friend,\nLisa"
      },
      intermediate: {
        title: "Complaint Letter to Store Manager",
        content: "Dear Store Manager,\n\nI am writing to express my dissatisfaction with a recent purchase I made at your store and to request a resolution to this matter.\n\nOn March 15th, I purchased a laptop computer from your electronics department for $850. The sales associate assured me that the device was brand new and came with a full manufacturer's warranty. However, when I brought the laptop home and attempted to set it up, I discovered several serious problems.\n\nFirst, the battery does not hold a charge for more than 30 minutes, which makes the laptop essentially unusable as a portable device. Second, the screen flickers constantly, making it difficult to read text or view images clearly. Finally, several keys on the keyboard are not responsive, particularly the space bar and enter key.\n\nI returned to your store the following day to request an exchange or refund, but the customer service representative told me that electronics could not be returned after 24 hours. This policy was not clearly explained to me at the time of purchase, and I believe it is unreasonable given the defective nature of the product.\n\nI am requesting either a full refund of $850 or an exchange for a properly functioning laptop of equivalent value. As a loyal customer who has shopped at your store for over five years, I hope you will resolve this matter promptly and fairly.\n\nI look forward to your response within one week. If this issue cannot be resolved satisfactorily, I will be forced to contact consumer protection services and consider taking my business elsewhere.\n\nSincerely,\nRobert Thompson"
      },
      advanced: {
        title: "Academic Recommendation Letter",
        content: "To Whom It May Concern,\n\nIt is with great pleasure and unwavering confidence that I recommend Alexandra Rodriguez for admission to your prestigious graduate program in Environmental Science. Having served as her thesis advisor and research mentor for the past two years at Stanford University, I have had the privilege of observing her exceptional academic prowess, innovative research capabilities, and steadfast commitment to environmental sustainability.\n\nAlexandra's intellectual curiosity and analytical acumen distinguish her as one of the most promising students I have encountered in my fifteen-year academic career. Her undergraduate thesis, \"Microplastic Contamination in Urban Watershed Systems: A Comprehensive Analysis of Mitigation Strategies,\" demonstrates not only her mastery of complex scientific methodologies but also her ability to synthesize interdisciplinary knowledge and propose practical solutions to pressing environmental challenges.\n\nWhat sets Alexandra apart from her peers is her remarkable ability to bridge theoretical knowledge with real-world applications. During her tenure as a research assistant in my laboratory, she spearheaded an innovative project examining the efficacy of bioengineered algae in removing heavy metals from contaminated water sources. Her meticulous experimental design, rigorous data analysis, and insightful interpretation of results culminated in a peer-reviewed publication in the Journal of Environmental Remediation—a rare achievement for an undergraduate student.\n\nBeyond her academic excellence, Alexandra demonstrates exceptional leadership qualities and collaborative skills. She has mentored numerous junior students, organized interdisciplinary research symposiums, and maintained productive partnerships with local environmental organizations. Her ability to communicate complex scientific concepts to diverse audiences, from elementary school children to municipal policymakers, reflects both her deep understanding of the subject matter and her commitment to public engagement.\n\nAlexandra's passion for environmental science extends far beyond the classroom and laboratory. She has volunteered extensively with habitat restoration projects, participated in climate change advocacy initiatives, and completed internships with both the Environmental Protection Agency and several non-profit organizations. This practical experience has enriched her academic perspective and reinforced her dedication to pursuing a career in environmental research and policy.\n\nI am confident that Alexandra will make significant contributions to your graduate program and to the broader field of environmental science. Her combination of intellectual rigor, research innovation, and social responsibility makes her an ideal candidate for advanced study. I recommend her without reservation and encourage you to give her application the strongest possible consideration.\n\nPlease feel free to contact me if you require any additional information regarding Alexandra's qualifications or character.\n\nSincerely,\n\nDr. Margaret Chen, Ph.D.\nProfessor of Environmental Science\nStanford University\nmchen@stanford.edu\n(650) 555-0123"
      }
    },
    report: {
      beginner: {
        title: "My School Day Report",
        content: "Report: My School Day\nDate: March 20, 2024\n\nIntroduction:\nThis report describes what happens during a typical day at my school. I will explain the different activities and classes that students do from morning to afternoon.\n\nMorning Activities:\nSchool starts at 8:00 AM. First, all students meet in the main hall for morning assembly. We sing the school song and listen to important announcements. After assembly, we go to our first class.\n\nClasses:\nWe have six classes each day. My favorite classes are English and Art. In English class, we read stories and learn new words. In Art class, we draw pictures and make crafts. Math class is difficult for me, but my teacher helps me understand the problems.\n\nLunch Time:\nAt 12:00 PM, we have lunch break for one hour. Students can eat in the cafeteria or bring lunch from home. I usually eat with my friends and we talk about our classes.\n\nAfternoon Activities:\nAfter lunch, we have three more classes. Sometimes we have physical education class where we play sports and exercise. This is very fun and helps us stay healthy.\n\nConclusion:\nMy school day is busy but enjoyable. I learn many new things and spend time with my friends. School helps me grow and prepare for my future."
      },
      intermediate: {
        title: "Community Survey Report",
        content: "Community Transportation Survey Report\nPrepared by: City Planning Committee\nDate: April 15, 2024\n\nExecutive Summary:\nThis report presents the findings of a comprehensive transportation survey conducted among 500 residents of Riverside Community. The survey aimed to identify current transportation patterns, challenges, and preferences to inform future infrastructure development decisions.\n\nMethodology:\nThe survey was conducted over a two-week period in March 2024 using both online questionnaires and face-to-face interviews. Participants were selected through random sampling to ensure demographic representation across age groups, income levels, and residential areas.\n\nKey Findings:\n\n1. Transportation Methods:\n   - 65% of residents primarily use personal vehicles\n   - 20% rely on public transportation\n   - 10% walk or bike regularly\n   - 5% use ride-sharing services\n\n2. Main Challenges:\n   - Traffic congestion during peak hours (78% of respondents)\n   - Limited parking availability downtown (56%)\n   - Insufficient public transit routes (43%)\n   - Poor road conditions (38%)\n\n3. Improvement Priorities:\n   - Better public transportation system (72%)\n   - More bike lanes and pedestrian paths (58%)\n   - Improved traffic signal timing (45%)\n   - Additional parking facilities (41%)\n\nRecommendations:\nBased on the survey results, we recommend the following actions:\n1. Expand public bus routes to underserved areas\n2. Implement a bike-sharing program\n3. Upgrade traffic management systems\n4. Develop park-and-ride facilities\n\nConclusion:\nThe survey reveals that while most residents currently depend on personal vehicles, there is strong community support for improved public transportation and alternative mobility options. Implementing these recommendations could significantly enhance the quality of life for Riverside Community residents while reducing environmental impact."
      },
      advanced: {
        title: "Quarterly Financial Performance Report",
        content: "QUARTERLY FINANCIAL PERFORMANCE REPORT\nQ1 2024 ANALYSIS AND STRATEGIC RECOMMENDATIONS\n\nGlobal Technologies Inc.\nPrepared by: Financial Analysis Division\nDate: April 30, 2024\n\nEXECUTIVE SUMMARY\n\nGlobal Technologies Inc. demonstrated robust financial performance during the first quarter of 2024, achieving record-breaking revenue growth of 23.7% year-over-year while maintaining strong profitability margins across all business segments. This exceptional performance was driven primarily by accelerated adoption of our cloud-based solutions, strategic market expansion in emerging economies, and successful implementation of operational efficiency initiatives.\n\nFINANCIAL PERFORMANCE OVERVIEW\n\nRevenue Analysis:\nTotal revenue for Q1 2024 reached $847.3 million, representing a 23.7% increase compared to Q1 2023 ($685.1 million). This growth was primarily attributed to:\n- Cloud Services Division: $423.8 million (50% of total revenue, +31% YoY)\n- Enterprise Software Solutions: $278.4 million (33% of total revenue, +18% YoY)\n- Hardware and Infrastructure: $145.1 million (17% of total revenue, +12% YoY)\n\nProfitability Metrics:\nGross profit margin improved to 68.2% (Q1 2023: 65.8%), reflecting enhanced operational efficiency and favorable product mix shifts toward higher-margin cloud services. Operating income increased by 28.4% to $203.6 million, while net income rose by 25.8% to $167.2 million, yielding an earnings per share of $2.34 (diluted).\n\nCash Flow and Liquidity:\nOperating cash flow reached $189.7 million, a 22.1% improvement over the previous year, demonstrating strong cash generation capabilities. The company maintains a robust balance sheet with $1.2 billion in cash and cash equivalents, providing substantial financial flexibility for strategic investments and market expansion initiatives.\n\nSEGMENT PERFORMANCE ANALYSIS\n\nCloud Services Division:\nThe cloud services segment continued to be the primary growth driver, benefiting from accelerated digital transformation trends across various industries. Subscription-based recurring revenue now accounts for 78% of total cloud services revenue, providing enhanced revenue predictability and customer retention. The division's annual recurring revenue (ARR) growth rate of 35% significantly outpaced industry averages.\n\nEnterprise Software Solutions:\nThis segment demonstrated steady growth, particularly in vertical-specific solutions for healthcare, financial services, and manufacturing sectors. The successful launch of our AI-enhanced analytics platform contributed to a 24% increase in average contract values, while customer acquisition costs decreased by 15% due to improved sales efficiency and enhanced partner channel programs.\n\nRISK FACTORS AND MITIGATION STRATEGIES\n\nMarket Risks:\nIncreasing competition from both established technology giants and emerging startups poses ongoing challenges to market share retention and pricing power. Additionally, potential economic downturn concerns may impact customer spending on technology investments.\n\nOperational Risks:\nRapid business growth has created scaling challenges in customer support operations and software development capacity. The company is addressing these concerns through strategic hiring initiatives and process automation investments.\n\nRegulatory Considerations:\nEvolving data privacy regulations across global markets require continued compliance investments and may impact product development timelines. The company has established a dedicated regulatory affairs team to proactively address these challenges.\n\nSTRATEGIC RECOMMENDATIONS\n\n1. Accelerate International Expansion:\nCapitalize on strong financial position to establish operations in high-growth markets, particularly in Southeast Asia and Latin America, where cloud adoption rates are rapidly increasing.\n\n2. Enhance Research and Development Investments:\nIncrease R&D spending by 25% to maintain technological leadership, particularly in artificial intelligence, machine learning, and cybersecurity capabilities.\n\n3. Strategic Acquisitions:\nPursue targeted acquisitions of complementary technology companies to expand product portfolio and accelerate market penetration in emerging segments.\n\n4. Sustainability Initiatives:\nImplement comprehensive environmental, social, and governance (ESG) programs to meet increasing stakeholder expectations and potential regulatory requirements.\n\nFORWARD-LOOKING GUIDANCE\n\nBased on current market conditions and business momentum, management projects Q2 2024 revenue in the range of $865-885 million, representing 18-21% year-over-year growth. Full-year 2024 revenue is expected to reach $3.5-3.6 billion, with operating margins improving to 25-26% as operational efficiency initiatives mature.\n\nCONCLUSION\n\nGlobal Technologies Inc. has delivered exceptional financial performance in Q1 2024, demonstrating the effectiveness of our strategic initiatives and the resilience of our business model. The company is well-positioned to capitalize on continued digital transformation trends while maintaining strong profitability and cash generation capabilities. Continued focus on innovation, operational excellence, and strategic market expansion will be critical to sustaining this momentum throughout 2024 and beyond."
      }
    },
    creative: {
      beginner: {
        title: "A Special Day",
        content: "Last Saturday was the most special day of my life. It was my little sister's birthday, and we had a wonderful celebration that I will never forget.\n\nI woke up early to help my mother prepare for the party. We decorated the house with colorful balloons and hung streamers from the ceiling. The dining room looked like a rainbow! I helped wrap the presents and set up the table with a beautiful pink tablecloth.\n\nWhen my sister woke up, she was so surprised and happy. Her eyes became big and round when she saw all the decorations. She jumped up and down and hugged everyone. This made me feel very happy too.\n\nMany of our friends and family came to the party. We played games like musical chairs and hide and seek. Everyone was laughing and having fun. My sister looked like a princess in her new dress.\n\nThe best part was when we brought out the birthday cake. It was a big chocolate cake with eight candles on top. We all sang \"Happy Birthday\" and my sister made a wish before blowing out the candles. I hope her wish comes true.\n\nThat night, when everyone went home, my sister thanked me for helping with her party. She said it was the best birthday ever. I felt proud and happy that I could make her special day so wonderful."
      },
      intermediate: {
        title: "The Mysterious Library",
        content: "Elena had always been curious about the old library at the end of Maple Street. The brick building stood there for decades, its windows covered with dust and ivy crawling up its walls. Most people in town avoided it, claiming it was abandoned, but Elena noticed something peculiar: every evening at exactly 7:30, a warm light would flicker in the third-floor window.\n\nOne rainy Thursday afternoon, Elena's curiosity finally overcame her caution. She approached the heavy wooden door and was surprised to find it unlocked. The door creaked as it opened, revealing a dimly lit hallway lined with towering bookshelves that seemed to stretch endlessly upward.\n\nAs she stepped inside, the musty scent of old books filled her nostrils, but there was something else—the faint aroma of fresh coffee and vanilla cookies. She followed the scent deeper into the library, her footsteps echoing softly on the polished wooden floor.\n\nSuddenly, she heard voices coming from somewhere above. Elena climbed the narrow spiral staircase, her hand trailing along the worn banister. On the third floor, she discovered something extraordinary: a cozy reading room filled with comfortable armchairs, soft lamplight, and a small group of elderly people engaged in animated discussion about the books they were reading.\n\nAn kind-looking woman with silver hair noticed Elena and smiled warmly. \"Welcome, dear,\" she said. \"We've been expecting you. I'm Margaret, the librarian. Would you like some tea and a good book recommendation?\"\n\nElena learned that the library had never been abandoned—it had simply become a secret sanctuary for book lovers who preferred quiet reading to the hustle and bustle of the modern world. From that day forward, Elena became a regular visitor, discovering not only wonderful books but also a community of friends who shared her love of literature and storytelling."
      },
      advanced: {
        title: "The Weight of Silence",
        content: "The courtroom fell silent as Judge Harrison adjusted her reading glasses, the weight of three decades on the bench evident in the deliberate care with which she handled the documents before her. In that moment of suspended time, the lives of everyone present—the defendant, the victim's family, the attorneys, and the packed gallery—hung in the balance, awaiting words that would either restore faith in justice or confirm their deepest fears about its fragility.\n\nSarah Chen, the prosecutor, felt her pulse quicken as she watched the judge's impassive face. This case had consumed her for eighteen months, transforming her from an idealistic public servant into someone who understood the complex intersection of law, morality, and human fallibility. The evidence was circumstantial but compelling; the defendant's alibi, while plausible, contained inconsistencies that raised troubling questions.\n\nAcross the aisle, defense attorney Michael Rodriguez wrestled with his own conflicted conscience. His client, a soft-spoken teacher named David Martinez, had maintained his innocence throughout the proceedings with a quiet dignity that was either genuine or masterfully performed. Rodriguez had seen both types of clients, and after twenty years of practice, he prided himself on his ability to distinguish between them. With David, however, that certainty eluded him.\n\nIn the gallery, Maria Santos clutched her sister's hand, both women united in their grief for Maria's teenage son, whose life had been cut short in what appeared to be a random act of violence. For Maria, the trial represented more than the pursuit of justice—it was her last hope of finding meaning in a loss that had fundamentally altered her understanding of how the world operated. She had spent countless sleepless nights wondering whether convicting the wrong person would dishonor her son's memory more than allowing the real perpetrator to go free.\n\nJudge Harrison cleared her throat, and the room's collective breathing seemed to pause. She had presided over thousands of cases, from petty theft to capital murder, but this one had challenged her judicial philosophy in unexpected ways. The law provided clear guidelines for evaluating evidence and determining guilt, yet the human cost of being wrong—in either direction—weighed heavily on her conscience.\n\n\"In a case built largely on circumstantial evidence,\" she began, her voice carrying the measured authority of decades spent weighing the scales of justice, \"the burden of proof remains unchanged. The prosecution must establish guilt beyond a reasonable doubt, not beyond all doubt, but beyond the kind of doubt that would cause a reasonable person to hesitate before making an important decision.\"\n\nAs she continued, Judge Harrison reflected on the broader implications of this moment. In an era of decreasing public trust in institutions, each judicial decision carried consequences that extended far beyond the immediate parties involved. The courtroom had become a microcosm of society's struggle to balance the presumption of innocence with the demand for accountability, the desire for closure with the requirement for certainty.\n\nThe judge's final words would soon break the silence, but the questions raised by this case—about justice, truth, and the limitations of human judgment—would linger long after the courtroom emptied and the participants returned to their forever-changed lives."
      }
    }
  };



  // Load static sample content or generate AI content
  const loadSampleContent = async (level: 'beginner' | 'intermediate' | 'advanced' | 'ai-generated') => {
    setShowSampleModal(false);
    // setIsLoadingSample(true); // Prevent auto-analysis during loading
    
    if (level === 'ai-generated') {
      // Generate new AI content using OpenAI
      setIsAnalyzing(true);
      
      try {
        const documentType = currentDocument?.type || 'essay';
        const randomLevel = ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)] as 'beginner' | 'intermediate' | 'advanced';
        
        console.log('🤖 Generating AI content:', documentType, randomLevel);
        
                 // Create the same enhanced prompt system from SampleContentGenerator
         const randomTopics = {
           essay: [
             'The Impact of Social Media on Modern Communication',
             'Climate Change and Individual Responsibility', 
             'The Benefits and Drawbacks of Remote Work',
             'The Role of Technology in Education',
             'Cultural Diversity in the Workplace',
             'The Importance of Mental Health Awareness',
             'Sustainable Living in Urban Areas',
             'The Future of Artificial Intelligence',
             'The Value of Learning a Second Language',
             'Work-Life Balance in the Digital Age',
             'The Influence of Music on Human Emotions',
             'Urban Gardening and Community Building',
             'The Rise of Online Learning Platforms',
             'Digital Privacy in the Modern World',
             'The Art of Effective Communication',
             'Healthy Living in a Fast-Paced Society',
             'The Impact of Travel on Personal Growth',
             'Renewable Energy and Environmental Protection',
             'The Psychology of Color in Daily Life',
             'Building Resilience Through Challenges'
           ],
           email: [
             'A professional follow-up email after a job interview',
             'Requesting flexible work arrangements from your boss',
             'Apologizing for a missed deadline to a client',
             'Introducing yourself to new team members',
             'Asking for feedback on a completed project',
             'Scheduling a meeting with colleagues',
             'Thanking someone for their help and support',
             'Confirming details for an upcoming event',
             'Requesting a recommendation letter',
             'Declining an invitation politely'
           ],
           letter: [
             'A formal complaint to a company about poor service',
             'A letter of recommendation for a colleague',
             'Requesting information about a university program',
             'Writing to a local government about community issues',
             'A thank you letter to a mentor or teacher',
             'Applying for a scholarship or grant',
             'Expressing interest in a volunteer position',
             'Requesting a refund for a defective product',
             'Writing to a newspaper editor about local news',
             'A formal invitation to a special event'
           ],
           report: [
             'A quarterly sales performance analysis',
             'An environmental impact assessment',
             'A customer satisfaction survey summary',
             'A market research findings report',
             'An employee training program evaluation',
             'A budget allocation proposal',
             'A technology implementation review',
             'A community health and safety audit',
             'A project completion status update',
             'A competitive analysis of industry trends'
           ],
           creative: [
             'A mysterious discovery in an old bookstore',
             'The last person on Earth receives a phone call',
             'A world where colors have been banned',
             'A time traveler gets stuck in the wrong era',
             'The story told from a pet\'s perspective',
             'A magical library that only appears at midnight',
             'A character who can hear other people\'s thoughts',
             'The day gravity stopped working',
             'A friendship between two very different people',
             'A small town with an unusual secret'
           ],
           conversation: [
             'Discussing weekend plans with friends',
             'Asking for directions in a new city',
             'Ordering food at a restaurant',
             'Negotiating the price at a market',
             'Making small talk with a neighbor',
             'Complaining politely about a service problem',
             'Asking for advice about a personal decision',
             'Introducing yourself at a social gathering',
             'Discussing a movie you both watched',
             'Planning a group project with classmates'
           ]
         };

        const topics = randomTopics[documentType as keyof typeof randomTopics] || randomTopics.essay;
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        
        const writingStyles = ['descriptive and detailed', 'concise and direct', 'conversational and friendly', 'formal and professional'];
        const perspectives = ['first person experience', 'objective third person view', 'personal reflection style', 'advisory tone'];
        const contexts = ['modern workplace setting', 'academic environment', 'everyday life situation', 'professional development context'];
        
        const randomStyle = writingStyles[Math.floor(Math.random() * writingStyles.length)];
        const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
        const randomContext = contexts[Math.floor(Math.random() * contexts.length)];
        
        const timestamp = Date.now();
        const randomSeed = Math.floor(Math.random() * 10000);
        
        const wordCount = randomLevel === 'beginner' ? '150-250' : randomLevel === 'intermediate' ? '250-400' : '400-600';
        const complexity = randomLevel === 'beginner' ? 
          'Use simple sentences and basic vocabulary. Avoid complex grammar structures. Make it easy to read and understand.' : 
          randomLevel === 'intermediate' ? 
          'Use some complex sentences and academic vocabulary. Include varied sentence structures. Balance simple and sophisticated language.' : 
          'Use advanced vocabulary, complex sentence structures, and sophisticated arguments. Demonstrate mastery of English with nuanced expression.';

                 let prompt = '';
         if (documentType === 'essay') {
           prompt = `Create a unique ${wordCount} word academic essay for ${randomLevel}-level ESL students on: "${randomTopic}". 
           
           Style: Write in a ${randomStyle} manner with a ${randomPerspective}. 
           Context: Set this in a ${randomContext}.
           
           ${complexity} 
           
           Structure: Include an introduction with a clear thesis, 2-3 body paragraphs with supporting evidence, and a strong conclusion.
           
           Make this essay unique and different from typical examples. Seed: ${timestamp}${randomSeed}`;
         } else {
           prompt = `Create a unique sample ${documentType} for ${randomLevel}-level ESL students on ${randomTopic}. 
           
           Style: ${randomStyle} with ${randomPerspective}
           Context: ${randomContext}
           
           ${complexity} 
           
           Make this completely unique and engaging. Seed: ${timestamp}${randomSeed}`;
         }

        // Use OpenAI API to generate content
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        
        if (!apiKey || apiKey === 'your_openai_api_key_here') {
          throw new Error('OpenAI API key not configured');
        }

        const randomInstructions = [
          'Create something completely fresh and unique.',
          'Generate entirely new content, avoid common topics.',
          'Make this totally different from typical examples.',
          'Create an original and creative piece.',
          'Generate something unexpected and engaging.',
          'Avoid overused topics, be innovative.'
        ];
        const randomInstruction = randomInstructions[Math.floor(Math.random() * randomInstructions.length)];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are a creative writing instructor who specializes in generating diverse, unique sample content for ESL students. 

CRITICAL REQUIREMENTS:
- Create completely different content each time
- NEVER repeat topics like "my favorite hobby", "my family", "my school" 
- Avoid cliché or overused subjects
- Generate fresh, engaging, and varied content
- Each piece should be unique and memorable
- Focus on originality and creativity

Your goal is to provide students with diverse, high-quality examples.`
              },
              {
                role: 'user',
                content: `${prompt}\n\nAdditional instruction: ${randomInstruction}`
              }
            ],
            temperature: 0.9,
            max_tokens: 700,
            top_p: 0.95,
            frequency_penalty: 0.3,
            presence_penalty: 0.4
          })
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        
        if (content) {
          console.log('✅ AI content generated successfully');
          // Clear any existing suggestions first to prevent overlap
          setSuggestions([]);
          setActiveSuggestion(null);
          setTooltipPosition(null);
          setIsProgrammaticUpdate(true);
          updateDocumentContent(content);
        } else {
          throw new Error('No content generated');
        }
        
      } catch (error) {
        console.error('❌ AI generation failed:', error);
        // Fallback to a varied static sample
        const documentType = currentDocument?.type || 'essay';
        const fallbackSamples = {
          essay: [
            "The Amazing World of Street Art\n\nStreet art has become one of the most exciting forms of creative expression in modern cities. From colorful murals on building walls to intricate designs in subway tunnels, this art form transforms ordinary urban spaces into outdoor galleries that everyone can enjoy.\n\nMany people think street art is just vandalism, but this is not always true. Professional street artists often work with permission from building owners and city governments. These artists use their skills to beautify neighborhoods, tell important stories, and bring communities together through shared cultural experiences.\n\nStreet art also provides opportunities for young people to express themselves creatively. Instead of feeling frustrated or bored, they can channel their energy into creating something beautiful and meaningful. Many famous artists today started by painting murals in their local neighborhoods.\n\nIn conclusion, street art represents a valuable form of artistic expression that enriches our cities and communities. When done respectfully and legally, it can transform ugly spaces into inspiring works of art that make everyone's daily life a little more colorful and interesting.",
            "Learning to Play a Musical Instrument\n\nLearning to play a musical instrument is one of the most rewarding experiences a person can have. Whether you choose the guitar, piano, violin, or drums, making music can bring joy to your life and help you express emotions in a completely new way.\n\nWhen I first started learning the piano, it seemed very difficult. My fingers felt clumsy on the keys, and I couldn't read music very well. However, my teacher was patient and encouraging. She taught me simple songs that I already knew, which made practicing more enjoyable and less frustrating.\n\nAfter several months of regular practice, I began to notice real improvement. Not only could I play more complex pieces, but I also felt more confident and relaxed. Playing music became a way to forget about stress from school and work. When I play my favorite songs, I feel peaceful and happy.\n\nI believe everyone should try learning a musical instrument. It doesn't matter if you're young or old, or if you think you're not talented. With patience, practice, and a good teacher, anyone can learn to make beautiful music and discover a new source of happiness in their life."
          ]
        };
        
        const randomSample = fallbackSamples[documentType as keyof typeof fallbackSamples]?.[0] || fallbackSamples.essay[Math.floor(Math.random() * fallbackSamples.essay.length)];
        // Clear any existing suggestions first to prevent overlap
        setSuggestions([]);
        setActiveSuggestion(null);
        setTooltipPosition(null);
        setIsProgrammaticUpdate(true);
        updateDocumentContent(randomSample);
        console.log('🔄 Used fallback AI sample');
      } finally {
        setIsAnalyzing(false);
        // Re-enable auto-analysis after a short delay to let content settle
        // setTimeout(() => setIsLoadingSample(false), 500);
      }
    } else {
      // Load static sample content
      const documentType = currentDocument?.type || 'essay';
      const samples = sampleContent[documentType as keyof typeof sampleContent];
      
      if (samples && samples[level]) {
        const sample = samples[level];
        const content = sample.title ? `${sample.title}\n\n${sample.content}` : sample.content;
        // Clear any existing suggestions first to prevent overlap
        setSuggestions([]);
        setActiveSuggestion(null);
        setTooltipPosition(null);
        setIsProgrammaticUpdate(true);
        updateDocumentContent(content);
      }
      // Re-enable auto-analysis after a short delay to let content settle
      // setTimeout(() => setIsLoadingSample(false), 500);
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Writing Stats Bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-1">
        <div className="grid grid-cols-3 gap-2 max-w-md text-sm">
          {/* Word Count Section */}
          <div className="bg-gray-100 px-2 py-1 rounded text-center">
            <div className="text-gray-600 font-medium text-xs">Words</div>
            <div className="text-sm font-bold text-gray-800">{currentDocument?.wordCount || 0}</div>
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
      <div className="flex-1 bg-white" style={{ minHeight: '600px' }}>
        {/* Document Paper Effect */}
        <div className="min-h-full bg-white shadow-sm">
          {/* Document Content Area - Much Larger */}
          <div className="relative min-h-full" style={{ minHeight: '600px' }}>
            {/* Background layer for error highlighting */}
            <div
              className="absolute top-0 left-0 right-0 bottom-0 suggestion-highlights"
              style={{ 
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '18px',
                lineHeight: '1.8',
                padding: '32px 32px 200px 32px',
                margin: '0',
                minHeight: '600px',
                height: 'auto',
                color: 'transparent',
                zIndex: 1,
                background: 'transparent',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                boxSizing: 'border-box',
                whiteSpace: 'pre-wrap'
              }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                // Check if clicked on a highlighted suggestion
                if (target.tagName === 'MARK' && target.dataset.suggestionId) {
                  const suggestionId = target.dataset.suggestionId;
                  const suggestion = suggestions.find(s => s.id === suggestionId);
                  
                  if (suggestion) {
                    handleSuggestionClick(suggestion, e);
                  }
                }
              }}
              dangerouslySetInnerHTML={{ __html: generateHighlightedContent() }}
            />
            
            {/* ContentEditable div for text input */}
            <div
              ref={textAreaRef}
              contentEditable
              onInput={handleContentEditableChange}
              onClick={handleTextAreaClick}
              onKeyDown={handleKeyDown}
              suppressContentEditableWarning={true}
              className="absolute top-0 left-0 right-0 bottom-0 border-0 resize-none focus:outline-none bg-transparent text-editor-container"
              style={{ 
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '18px',
                lineHeight: '1.8',
                padding: '32px 32px 200px 32px',
                margin: '0',
                border: '0',
                outline: 'none',
                minHeight: '600px',
                height: 'auto',
                color: 'black',
                zIndex: 2,
                background: 'transparent',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                boxSizing: 'border-box',
                whiteSpace: 'pre-wrap'
              }}
              data-placeholder="Start writing your essay here. WordWise AI will help you improve your grammar, vocabulary, and writing style as you type."
            />
            
            {/* Show error indicator when there are suggestions and not dismissed */}
            {suggestions.length > 0 && !isErrorIndicatorDismissed && (
              <div className="absolute top-2 right-2 bg-white border border-gray-200 rounded-lg shadow-sm p-2 z-10 max-w-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>{suggestions.length} error{suggestions.length === 1 ? '' : 's'} found</span>
                  </div>
                  <button
                    onClick={() => setIsErrorIndicatorDismissed(true)}
                    className="ml-2 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
                    title="Close"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Click highlighted text for suggestions
                </div>
              </div>
            )}
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
            <div className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium ${
                suggestions.length === 0 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              <span>
                {suggestions.length === 0 
                  ? 'No errors!' 
                  : `${suggestions.length} error${suggestions.length === 1 ? '' : 's'}`
                }
              </span>
            </div>
          </div>
          
          {/* Tools Section */}
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => setShowSampleModal(true)}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm"
            >
              <BookOpen className="h-3 w-3" />
              <span>Samples</span>
            </button>
            
            <button 
              onClick={handlePlagiarismCheck}
              disabled={isCheckingPlagiarism || !currentDocument?.content || currentDocument.content.trim().length < 50}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-orange-600 text-white hover:bg-orange-700 border border-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingPlagiarism ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <span className="text-sm">🔍</span>
              )}
              <span>{isCheckingPlagiarism ? 'Checking...' : 'Plagiarism'}</span>
            </button>

            <button 
              onClick={handleErrorHeatmap}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700 border border-purple-600"
            >
              <span className="text-sm">📊</span>
              <span>Heatmap</span>
            </button>
            
            <button 
              onClick={() => performAnalysis(currentDocument?.content || '')}
              className="px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Text'}
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions Panel - Always Visible */}
      <div className="border-t border-gray-200 bg-white">
        <SuggestionsPanel />
      </div>

      {/* Interactive Suggestion Tooltip */}
      <SuggestionTooltip />

      {/* Sample Content Modal */}
      {showSampleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowSampleModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Sample {(currentDocument?.type || 'essay').charAt(0).toUpperCase() + (currentDocument?.type || 'essay').slice(1)}s
                </h2>
                <p className="text-sm text-gray-500">Choose a difficulty level to load sample content</p>
              </div>
              <button
                onClick={() => setShowSampleModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Beginner Sample */}
              <div className="border border-gray-200 rounded-lg p-3 hover:border-green-300 hover:bg-green-50/30 transition-colors cursor-pointer group h-24" onClick={() => loadSampleContent('beginner')}>
                <div className="flex items-start gap-3 h-full">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">Beginner Level</h3>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Basic
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Simple vocabulary and clear structure for ESL beginners</p>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-auto">
                      <span>Easy words</span>
                      <span className="mx-1">•</span>
                      <span>Simple sentences</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intermediate Sample */}
              <div className="border border-gray-200 rounded-lg p-3 hover:border-amber-300 hover:bg-amber-50/30 transition-colors cursor-pointer group h-24" onClick={() => loadSampleContent('intermediate')}>
                <div className="flex items-start gap-3 h-full">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                      <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">Intermediate Level</h3>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          Moderate
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Varied vocabulary with more complex sentence patterns</p>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-auto">
                      <span>Mixed vocabulary</span>
                      <span className="mx-1">•</span>
                      <span>Complex ideas</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Sample */}
              <div className="border border-gray-200 rounded-lg p-3 hover:border-red-300 hover:bg-red-50/30 transition-colors cursor-pointer group h-24" onClick={() => loadSampleContent('advanced')}>
                <div className="flex items-start gap-3 h-full">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">Advanced Level</h3>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Complex
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Academic vocabulary and advanced writing techniques</p>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-auto">
                      <span>Academic terms</span>
                      <span className="mx-1">•</span>
                      <span>Advanced structure</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Generated Sample */}
              <div className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:bg-purple-50/30 transition-colors cursor-pointer group h-24" onClick={() => loadSampleContent('ai-generated')}>
                <div className="flex items-start gap-3 h-full">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">AI Generated</h3>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">
                          🤖 New
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Fresh, unique content created by AI each time</p>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-auto">
                      <span>Always different</span>
                      <span className="mx-1">•</span>
                      <span>OpenAI powered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <p className="text-xs text-gray-500">Click any level to load content</p>
              <button
                onClick={() => setShowSampleModal(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plagiarism Report Modal */}
      {showPlagiarismModal && plagiarismReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowPlagiarismModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">🔍</span>
                  Plagiarism Report
                </h2>
                <p className="text-sm text-gray-500 mt-1">Analysis completed on {new Date(plagiarismReport.analysisDate).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setShowPlagiarismModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Overall Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{plagiarismReport.overallSimilarity}%</div>
                  <div className="text-sm text-red-800 font-medium">Similarity Found</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{plagiarismReport.uniqueContent}%</div>
                  <div className="text-sm text-green-800 font-medium">Unique Content</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{plagiarismReport.totalMatches}</div>
                  <div className="text-sm text-blue-800 font-medium">Sources Found</div>
                </div>
              </div>

              {/* Overall Assessment */}
              <div className={`p-4 rounded-lg border-l-4 ${
                plagiarismReport.overallSimilarity > 50 
                  ? 'bg-red-50 border-red-400 text-red-800'
                  : plagiarismReport.overallSimilarity > 25
                  ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                  : 'bg-green-50 border-green-400 text-green-800'
              }`}>
                <h3 className="font-semibold mb-2">
                  {plagiarismReport.overallSimilarity > 50 
                    ? '⚠️ High Similarity Detected'
                    : plagiarismReport.overallSimilarity > 25
                    ? '⚡ Moderate Similarity Found'
                    : '✅ Low Similarity - Good Originality'
                  }
                </h3>
                <p className="text-sm">
                  {plagiarismReport.overallSimilarity > 50 
                    ? 'Your text shows significant similarity to existing sources. Please review the flagged sections and ensure proper citation or rewrite in your own words.'
                    : plagiarismReport.overallSimilarity > 25
                    ? 'Some sections may need attention. Review flagged content and ensure you are properly citing sources or expressing ideas in your own words.'
                    : 'Your content appears to be mostly original. Any matches found are likely common phrases or properly cited material.'
                  }
                </p>
              </div>

              {/* Potential Matches */}
              {plagiarismReport.matches.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">📝</span>
                    Potential Matches ({plagiarismReport.matches.length})
                  </h3>
                  <div className="space-y-4">
                    {plagiarismReport.matches.map((match, _index) => (
                      <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                match.source.type === 'academic' ? 'bg-blue-100 text-blue-800' :
                                match.source.type === 'journal' ? 'bg-purple-100 text-purple-800' :
                                match.source.type === 'book' ? 'bg-green-100 text-green-800' :
                                match.source.type === 'news' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {match.source.type.charAt(0).toUpperCase() + match.source.type.slice(1)}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{match.similarityPercentage}% similar</span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{match.source.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{match.source.domain}</p>
                            {match.source.date && (
                              <p className="text-xs text-gray-500">Published: {new Date(match.source.date).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="text-xs text-gray-600 mb-1">Matched text:</div>
                          <div className="text-sm text-gray-800 font-mono bg-yellow-100 p-2 rounded border-l-4 border-yellow-400">
                            "{match.matchedText}"
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <a
                            href={match.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            View Source →
                          </a>
                          <span className="text-xs text-gray-500">
                            Position: {match.startPosition}-{match.endPosition}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">💡</span>
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {plagiarismReport.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Word Count Info */}
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>Analysis Details:</strong> {plagiarismReport.wordCount} words analyzed
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                * This is a demonstration of plagiarism detection. For production use, integrate with professional services like Turnitin or Copyscape.
              </p>
              <button
                onClick={() => setShowPlagiarismModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Heatmap Modal */}
      {showErrorHeatmap && errorHeatmapData && (
        <ErrorHeatmap 
          data={errorHeatmapData} 
          onClose={() => setShowErrorHeatmap(false)} 
        />
      )}
    </div>
  );
};

export default TextEditor;
