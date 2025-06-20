export interface ErrorPattern {
  category: string;
  subcategory: string;
  count: number;
  totalOpportunities: number;
  accuracy: number;
  examples: string[];
  recentErrors: Array<{
    text: string;
    correction: string;
    timestamp: Date;
  }>;
}

export interface ErrorHeatmapData {
  patterns: ErrorPattern[];
  overallAccuracy: number;
  totalErrors: number;
  mostProblematicArea: string;
  strongestArea: string;
  improvementTrend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

// Error categories for ESL learners
const ERROR_CATEGORIES = {
  ARTICLES: {
    name: 'Articles',
    subcategories: ['Missing Article', 'Wrong Article', 'Unnecessary Article'],
    color: '#ef4444',
    description: 'a, an, the usage'
  },
  VERB_TENSES: {
    name: 'Verb Tenses',
    subcategories: ['Past Tense', 'Present Tense', 'Future Tense', 'Perfect Tenses', 'Progressive Tenses'],
    color: '#f97316',
    description: 'Verb conjugation and tense consistency'
  },
  PREPOSITIONS: {
    name: 'Prepositions',
    subcategories: ['Time Prepositions', 'Place Prepositions', 'Direction Prepositions', 'Other Prepositions'],
    color: '#eab308',
    description: 'in, on, at, by, for, with, etc.'
  },
  SUBJECT_VERB_AGREEMENT: {
    name: 'Subject-Verb Agreement',
    subcategories: ['Singular/Plural Mismatch', 'Third Person Singular'],
    color: '#22c55e',
    description: 'Subject and verb number agreement'
  },
  PLURALS: {
    name: 'Plurals',
    subcategories: ['Regular Plurals', 'Irregular Plurals', 'Uncountable Nouns'],
    color: '#3b82f6',
    description: 'Singular and plural noun forms'
  },
  WORD_ORDER: {
    name: 'Word Order',
    subcategories: ['Adjective Order', 'Question Formation', 'Adverb Placement'],
    color: '#8b5cf6',
    description: 'Sentence structure and word arrangement'
  },
  PUNCTUATION: {
    name: 'Punctuation',
    subcategories: ['Commas', 'Periods', 'Question Marks', 'Apostrophes'],
    color: '#ec4899',
    description: 'Punctuation marks and their usage'
  },
  SPELLING: {
    name: 'Spelling',
    subcategories: ['Common Misspellings', 'Homophones', 'Double Letters'],
    color: '#06b6d4',
    description: 'Correct spelling of words'
  }
};

class ErrorPatternService {
  private patterns: Map<string, ErrorPattern> = new Map();
  private readonly STORAGE_KEY = 'wordwise_error_patterns';

  constructor() {
    this.loadPatternsFromStorage();
    this.initializeDefaultPatterns();
  }

  private loadPatternsFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.patterns = new Map(data.map((p: ErrorPattern) => [p.category + '_' + p.subcategory, p]));
      }
    } catch (error) {
      console.warn('Failed to load error patterns from storage:', error);
    }
  }

  private savePatternsToStorage() {
    try {
      const data = Array.from(this.patterns.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save error patterns to storage:', error);
    }
  }

  private initializeDefaultPatterns() {
    Object.entries(ERROR_CATEGORIES).forEach(([key, category]) => {
      category.subcategories.forEach(subcategory => {
        const patternKey = `${category.name}_${subcategory}`;
        if (!this.patterns.has(patternKey)) {
          this.patterns.set(patternKey, {
            category: category.name,
            subcategory,
            count: 0,
            totalOpportunities: 0,
            accuracy: 100,
            examples: [],
            recentErrors: []
          });
        }
      });
    });
  }

  // Analyze suggestions to extract error patterns
  analyzeErrorPatterns(suggestions: any[]): void {
    suggestions.forEach(suggestion => {
      const category = this.categorizeError(suggestion);
      if (category) {
        this.recordError(category.main, category.sub, suggestion);
      }
    });
    this.savePatternsToStorage();
  }

  private categorizeError(suggestion: any): { main: string; sub: string } | null {
    const originalText = suggestion.originalText?.toLowerCase() || '';
    const suggestedText = suggestion.suggestedText?.toLowerCase() || '';
    const explanation = suggestion.explanation?.toLowerCase() || '';
    const type = suggestion.type?.toLowerCase() || '';

    // Article errors
    if (this.isArticleError(originalText, suggestedText, explanation)) {
      if (!originalText.match(/\b(a|an|the)\b/) && suggestedText.match(/\b(a|an|the)\b/)) {
        return { main: 'Articles', sub: 'Missing Article' };
      } else if (originalText.match(/\b(a|an|the)\b/) && !suggestedText.match(/\b(a|an|the)\b/)) {
        return { main: 'Articles', sub: 'Unnecessary Article' };
      } else {
        return { main: 'Articles', sub: 'Wrong Article' };
      }
    }

    // Verb tense errors
    if (this.isVerbTenseError(explanation, type)) {
      if (explanation.includes('past')) return { main: 'Verb Tenses', sub: 'Past Tense' };
      if (explanation.includes('present')) return { main: 'Verb Tenses', sub: 'Present Tense' };
      if (explanation.includes('future')) return { main: 'Verb Tenses', sub: 'Future Tense' };
      if (explanation.includes('perfect')) return { main: 'Verb Tenses', sub: 'Perfect Tenses' };
      if (explanation.includes('progressive') || explanation.includes('continuous')) return { main: 'Verb Tenses', sub: 'Progressive Tenses' };
      return { main: 'Verb Tenses', sub: 'Past Tense' }; // Default
    }

    // Preposition errors
    if (this.isPrepositionError(originalText, suggestedText, explanation)) {
      const timePreps = ['at', 'on', 'in', 'during', 'for', 'since'];
      const placePreps = ['at', 'on', 'in', 'under', 'over', 'beside'];
      
      if (timePreps.some(prep => originalText.includes(prep) || suggestedText.includes(prep))) {
        return { main: 'Prepositions', sub: 'Time Prepositions' };
      } else if (placePreps.some(prep => originalText.includes(prep) || suggestedText.includes(prep))) {
        return { main: 'Prepositions', sub: 'Place Prepositions' };
      } else {
        return { main: 'Prepositions', sub: 'Other Prepositions' };
      }
    }

    // Subject-verb agreement
    if (this.isSubjectVerbAgreementError(explanation)) {
      return { main: 'Subject-Verb Agreement', sub: 'Singular/Plural Mismatch' };
    }

    // Plural errors
    if (this.isPluralError(originalText, suggestedText, explanation)) {
      if (explanation.includes('irregular')) return { main: 'Plurals', sub: 'Irregular Plurals' };
      if (explanation.includes('uncountable')) return { main: 'Plurals', sub: 'Uncountable Nouns' };
      return { main: 'Plurals', sub: 'Regular Plurals' };
    }

    // Spelling errors
    if (type === 'spelling') {
      return { main: 'Spelling', sub: 'Common Misspellings' };
    }

    // Punctuation errors
    if (this.isPunctuationError(originalText, suggestedText)) {
      if (originalText.includes(',') || suggestedText.includes(',')) return { main: 'Punctuation', sub: 'Commas' };
      if (originalText.includes('?') || suggestedText.includes('?')) return { main: 'Punctuation', sub: 'Question Marks' };
      if (originalText.includes("'") || suggestedText.includes("'")) return { main: 'Punctuation', sub: 'Apostrophes' };
      return { main: 'Punctuation', sub: 'Periods' };
    }

    // Word order errors
    if (explanation.includes('order') || explanation.includes('structure')) {
      return { main: 'Word Order', sub: 'Question Formation' };
    }

    return null;
  }

  private isArticleError(original: string, suggested: string, explanation: string): boolean {
    const articleRegex = /\b(a|an|the)\b/;
    return explanation.includes('article') || 
           (articleRegex.test(original) !== articleRegex.test(suggested));
  }

  private isVerbTenseError(explanation: string, type: string): boolean {
    return type === 'grammar' && (
      explanation.includes('tense') || 
      explanation.includes('verb') ||
      explanation.includes('past') ||
      explanation.includes('present') ||
      explanation.includes('future')
    );
  }

  private isPrepositionError(original: string, suggested: string, explanation: string): boolean {
    const prepositions = ['in', 'on', 'at', 'by', 'for', 'with', 'to', 'from', 'of', 'about', 'under', 'over'];
    return explanation.includes('preposition') ||
           prepositions.some(prep => original.includes(prep) || suggested.includes(prep));
  }

  private isSubjectVerbAgreementError(explanation: string): boolean {
    return explanation.includes('agreement') || 
           explanation.includes('subject') && explanation.includes('verb');
  }

  private isPluralError(original: string, suggested: string, explanation: string): boolean {
    return explanation.includes('plural') || 
           explanation.includes('singular') ||
           (original.endsWith('s') !== suggested.endsWith('s'));
  }

  private isPunctuationError(original: string, suggested: string): boolean {
    const punctuation = /[.,;:!?'"()]/;
    return punctuation.test(original) || punctuation.test(suggested);
  }

  private recordError(category: string, subcategory: string, suggestion: any): void {
    const key = `${category}_${subcategory}`;
    const pattern = this.patterns.get(key);
    
    if (pattern) {
      pattern.count++;
      pattern.totalOpportunities++;
      pattern.accuracy = Math.max(0, 100 - (pattern.count / pattern.totalOpportunities) * 100);
      
      // Add example if not already present
      if (!pattern.examples.includes(suggestion.originalText) && pattern.examples.length < 5) {
        pattern.examples.push(suggestion.originalText);
      }
      
      // Add recent error
      pattern.recentErrors.unshift({
        text: suggestion.originalText,
        correction: suggestion.suggestedText,
        timestamp: new Date()
      });
      
      // Keep only last 10 recent errors
      pattern.recentErrors = pattern.recentErrors.slice(0, 10);
    }
  }

  // Record successful usage (when no errors found in a category)
  recordSuccessfulUsage(text: string): void {
    // Simple heuristic to identify opportunities
    const words = text.toLowerCase().split(/\s+/);
    
    // Count article opportunities
    const articleOpportunities = words.filter(word => 
      /^[aeiou]/.test(word) || // Words starting with vowels (potential 'an')
      ['university', 'hour', 'honest'].some(w => word.startsWith(w)) // Special cases
    ).length;
    
    this.recordOpportunity('Articles', 'Missing Article', articleOpportunities);
    
    // Count verb opportunities (simple heuristic)
    const verbCount = words.filter(word => 
      word.endsWith('ed') || word.endsWith('ing') || 
      ['is', 'are', 'was', 'were', 'have', 'has', 'had'].includes(word)
    ).length;
    
    this.recordOpportunity('Verb Tenses', 'Past Tense', verbCount);
    
    this.savePatternsToStorage();
  }

  private recordOpportunity(category: string, subcategory: string, count: number): void {
    const key = `${category}_${subcategory}`;
    const pattern = this.patterns.get(key);
    
    if (pattern) {
      pattern.totalOpportunities += count;
      pattern.accuracy = Math.max(0, 100 - (pattern.count / pattern.totalOpportunities) * 100);
    }
  }

  getErrorHeatmapData(): ErrorHeatmapData {
    const patterns = Array.from(this.patterns.values());
    const totalErrors = patterns.reduce((sum, p) => sum + p.count, 0);
    const totalOpportunities = patterns.reduce((sum, p) => sum + p.totalOpportunities, 0);
    const overallAccuracy = totalOpportunities > 0 ? 
      ((totalOpportunities - totalErrors) / totalOpportunities) * 100 : 100;

    // Find most problematic and strongest areas
    const sortedByAccuracy = patterns
      .filter(p => p.totalOpportunities > 0)
      .sort((a, b) => a.accuracy - b.accuracy);
    
    const mostProblematic = sortedByAccuracy[0]?.category || 'None';
    const strongest = sortedByAccuracy[sortedByAccuracy.length - 1]?.category || 'None';

    return {
      patterns: patterns.filter(p => p.totalOpportunities > 0), // Only show categories with data
      overallAccuracy: Math.round(overallAccuracy),
      totalErrors,
      mostProblematicArea: mostProblematic,
      strongestArea: strongest,
      improvementTrend: 'stable', // Could be calculated based on historical data
      lastUpdated: new Date()
    };
  }

  getErrorCategoryInfo() {
    return ERROR_CATEGORIES;
  }

  clearErrorPatterns(): void {
    this.patterns.clear();
    this.initializeDefaultPatterns();
    this.savePatternsToStorage();
  }

  exportErrorData(): string {
    return JSON.stringify(Array.from(this.patterns.values()), null, 2);
  }
}

export const errorPatternService = new ErrorPatternService(); 