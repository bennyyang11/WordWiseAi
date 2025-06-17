import { create } from 'zustand';
import type { Document, Suggestion, AnalysisResult } from '../types';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  nativeLanguage: string;
  englishLevel: string;
  writingGoals: {
    type: string;
    targetWordCount: number;
    targetAudience: string;
    formalityLevel: string;
    essayType: string;
  };
  preferences: {
    showExplanations: boolean;
    highlightComplexWords: boolean;
    suggestSimplifications: boolean;
    realTimeAnalysis: boolean;
  };
  currentDocument?: Document;
}

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
  setUserProfile: (profile: UserProfile | null) => void;
}

export const useWritingStore = create<WritingState>((set, get) => ({
  currentDocument: null,
  suggestions: [],
  analysisResult: null,
  isAnalyzing: false,
  selectedSuggestion: null,
  userProfile: null,

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
      const newContent = content.substring(0, suggestion.position.start) +
                        suggestion.suggestedText +
                        content.substring(suggestion.position.end);
      
      // Update document content
      state.updateDocumentContent(newContent);
      
      // Remove applied suggestion
      const remainingSuggestions = state.suggestions.filter(s => s.id !== suggestionId);
      set({ suggestions: remainingSuggestions, selectedSuggestion: null });
    }
  },
  
  dismissSuggestion: (suggestionId) => {
    const state = get();
    const remainingSuggestions = state.suggestions.filter(s => s.id !== suggestionId);
    set({ suggestions: remainingSuggestions, selectedSuggestion: null });
  },
  
  setUserProfile: (profile) => set({ userProfile: profile }),
})); 