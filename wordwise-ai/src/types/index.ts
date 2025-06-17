export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  type: 'essay' | 'paragraph' | 'draft';
  wordCount: number;
}

export interface Suggestion {
  id: string;
  type: 'grammar' | 'spelling' | 'vocabulary' | 'style' | 'structure' | 'clarity';
  severity: 'error' | 'warning' | 'suggestion';
  originalText: string;
  suggestedText: string;
  explanation: string;
  position: {
    start: number;
    end: number;
  };
  confidence: number;
  rule?: string;
  examples?: string[];
}

export interface WritingMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readabilityScore: number;
  averageWordsPerSentence: number;
  complexWords: number;
  passiveVoiceCount: number;
}

export interface WritingGoals {
  type: 'academic' | 'creative' | 'business';
  targetWordCount?: number;
  targetAudience: 'professor' | 'peers' | 'general';
  formalityLevel: 'formal' | 'semiformal' | 'informal';
  essayType?: 'argumentative' | 'expository' | 'narrative' | 'descriptive';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  nativeLanguage: string;
  englishLevel: 'beginner' | 'intermediate' | 'advanced';
  writingGoals: WritingGoals;
  preferences: {
    showExplanations: boolean;
    highlightComplexWords: boolean;
    suggestSimplifications: boolean;
    realTimeAnalysis: boolean;
  };
}

export interface AnalysisResult {
  suggestions: Suggestion[];
  metrics: WritingMetrics;
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
} 