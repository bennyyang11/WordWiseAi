import { create } from 'zustand';
import type { Document, Suggestion, AnalysisResult, UserProfile } from '../types';

interface WritingState {
  currentDocument: Document | null;
  suggestions: Suggestion[];
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  selectedSuggestion: Suggestion | null;
  userProfile: UserProfile | null;
  
  // Actions
  setCurrentDocument: (document: Document) => void;
  updateDocumentContent: (content: string) => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setSelectedSuggestion: (suggestion: Suggestion | null) => void;
  applySuggestion: (suggestionId: string) => void;
  dismissSuggestion: (suggestionId: string) => void;
  setUserProfile: (profile: UserProfile) => void;
}

export const useWritingStore = create<WritingState>((set, get) => ({
  currentDocument: {
    id: '1',
    title: 'My First Essay',
    content: 'Start writing your essay here. WordWise AI will help you improve your grammar, vocabulary, and writing style as you type.',
    createdAt: new Date(),
    updatedAt: new Date(),
    type: 'essay',
    wordCount: 0,
  },
  suggestions: [],
  analysisResult: null,
  isAnalyzing: false,
  selectedSuggestion: null,
  userProfile: {
    id: '1',
    name: 'Student',
    email: 'student@example.com',
    nativeLanguage: 'Spanish',
    englishLevel: 'intermediate',
    writingGoals: {
      type: 'academic',
      targetWordCount: 500,
      targetAudience: 'professor',
      formalityLevel: 'formal',
      essayType: 'argumentative',
    },
    preferences: {
      showExplanations: true,
      highlightComplexWords: true,
      suggestSimplifications: true,
      realTimeAnalysis: true,
    },
  },

  setCurrentDocument: (document) => set({ currentDocument: document }),
  
  updateDocumentContent: (content) => {
    const state = get();
    if (state.currentDocument) {
      const updatedDocument = {
        ...state.currentDocument,
        content,
        updatedAt: new Date(),
        wordCount: content.trim().split(/\s+/).filter(word => word.length > 0).length,
      };
      set({ currentDocument: updatedDocument });
    }
  },
  
  setSuggestions: (suggestions) => set({ suggestions }),
  
  setAnalysisResult: (result) => set({ analysisResult: result }),
  
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  
  setSelectedSuggestion: (suggestion) => set({ selectedSuggestion: suggestion }),
  
  applySuggestion: (suggestionId) => {
    const state = get();
    const suggestion = state.suggestions.find(s => s.id === suggestionId);
    if (suggestion && state.currentDocument) {
      const content = state.currentDocument.content;
      
      // Double-check that the suggestion still matches the current text
      const currentTextAtPosition = content.substring(suggestion.position.start, suggestion.position.end);
      if (currentTextAtPosition !== suggestion.originalText) {
        console.warn('⚠️ Suggestion no longer matches current text. Clearing invalid suggestions...');
        set({ suggestions: [], selectedSuggestion: null });
        return;
      }
      
      const newContent = content.substring(0, suggestion.position.start) +
                        suggestion.suggestedText +
                        content.substring(suggestion.position.end);
      
      // Update document content
      state.updateDocumentContent(newContent);
      
      // Calculate the position change for adjusting other suggestions
      const lengthDifference = suggestion.suggestedText.length - suggestion.originalText.length;
      
      // Remove applied suggestion and adjust positions of remaining suggestions
      const updatedSuggestions = state.suggestions
        .filter(s => s.id !== suggestionId) // Remove the applied suggestion
        .map(s => {
          // Adjust positions of suggestions that come after the applied one
          if (s.position.start > suggestion.position.end) {
            return {
              ...s,
              position: {
                start: s.position.start + lengthDifference,
                end: s.position.end + lengthDifference
              }
            };
          }
          return s;
        })
        .filter(s => {
          // Validate that suggestions still match the updated text
          const newTextAtPosition = newContent.substring(s.position.start, s.position.end);
          return newTextAtPosition === s.originalText;
        });
      
      console.log('✅ Applied suggestion:', suggestion.originalText, '→', suggestion.suggestedText);
      console.log('📝 Keeping', updatedSuggestions.length, 'remaining suggestions, removed', state.suggestions.length - updatedSuggestions.length);
      
      set({ suggestions: updatedSuggestions, selectedSuggestion: null });
    }
  },
  
  dismissSuggestion: (suggestionId) => {
    const state = get();
    const remainingSuggestions = state.suggestions.filter(s => s.id !== suggestionId);
    set({ suggestions: remainingSuggestions, selectedSuggestion: null });
  },
  
  setUserProfile: (profile) => set({ userProfile: profile }),
})); 