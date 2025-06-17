export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  type: 'essay' | 'note' | 'letter';
  wordCount: number;
}

export interface Suggestion {
  id: string;
  type: 'grammar' | 'vocabulary' | 'style' | 'clarity';
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

export interface AnalysisResult {
  overallScore: number;
  suggestions: Suggestion[];
  metrics: {
    readabilityScore: number;
    grammarScore: number;
    vocabularyScore: number;
    styleScore: number;
  };
  strengths: string[];
  areasForImprovement: string[];
} 