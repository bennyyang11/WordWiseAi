export interface ErrorPattern {
  category: string;
  subcategory: string;
  count: number;
  fixedCount: number; // New: track how many errors were fixed
  totalOpportunities: number;
  accuracy: number;
  examples: string[];
  recentErrors: Array<{
    text: string;
    correction: string;
    timestamp: Date;
  }>;
  recentFixes: Array<{
    text: string;
    correction: string;
    timestamp: Date;
  }>; // New: track recent fixes
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
        this.patterns = new Map(data.map((p: ErrorPattern) => {
          // Ensure all required properties exist for backward compatibility
          const pattern: ErrorPattern = {
            category: p.category,
            subcategory: p.subcategory,
            count: p.count || 0,
            fixedCount: p.fixedCount || 0,
            totalOpportunities: p.totalOpportunities || 0,
            accuracy: p.accuracy || 75,
            examples: p.examples || [],
            recentErrors: p.recentErrors || [],
            recentFixes: p.recentFixes || [] // Ensure this exists
          };
          return [pattern.category + '_' + pattern.subcategory, pattern];
        }));
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
    Object.entries(ERROR_CATEGORIES).forEach(([_key, category]) => {
      category.subcategories.forEach(subcategory => {
        const patternKey = `${category.name}_${subcategory}`;
        if (!this.patterns.has(patternKey)) {
          this.patterns.set(patternKey, {
            category: category.name,
            subcategory,
            count: 0,
            fixedCount: 0,
            totalOpportunities: 0,
            accuracy: 75, // Start with more realistic baseline - room for improvement
            examples: [],
            recentErrors: [],
            recentFixes: []
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

  // Record when an error is fixed (when user applies a suggestion)
  recordErrorFixed(category: string, subcategory: string, originalText: string, correction: string): void {
    const key = `${category}_${subcategory}`;
    const pattern = this.patterns.get(key);
    
    if (pattern) {
      pattern.fixedCount++;
      
      // Ensure recentFixes array exists (for backward compatibility)
      if (!pattern.recentFixes) {
        pattern.recentFixes = [];
      }
      
      // Add to recent fixes
      pattern.recentFixes.unshift({
        text: originalText,
        correction: correction,
        timestamp: new Date()
      });
      
      // Keep only last 10 recent fixes
      pattern.recentFixes = pattern.recentFixes.slice(0, 10);
      
      // Recalculate accuracy - fixes help improve your score
      this.updateAccuracy(pattern);
    }
    
    this.savePatternsToStorage();
  }

  private updateAccuracy(pattern: ErrorPattern): void {
    if (pattern.totalOpportunities > 0) {
      // Calculate base accuracy
      const errorRate = pattern.count / pattern.totalOpportunities;
      let accuracy = Math.round(Math.max(0, (1 - errorRate) * 100));
      
      // Bonus for fixing errors (improvement motivation)
      if (pattern.fixedCount > 0 && pattern.count > 0) {
        const fixRate = pattern.fixedCount / pattern.count;
        const fixBonus = Math.round(fixRate * 5); // Up to 5% bonus for fixing all errors
        accuracy = Math.min(100, accuracy + fixBonus);
      }
      
      // Bonus for consistent correct usage
      if (pattern.totalOpportunities > 20 && errorRate < 0.1) {
        accuracy = Math.min(100, accuracy + 5);
      }
      
      pattern.accuracy = accuracy;
    }
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
      
      // Update accuracy using the centralized method
      this.updateAccuracy(pattern);
    }
  }

  // Record successful usage (when no errors found in a category)
  recordSuccessfulUsage(text: string): void {
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
    
    // Much better opportunity detection for all categories
    
    // Article opportunities: count nouns that could need articles
    const nounPatterns = /\b(house|car|book|person|place|thing|time|way|man|woman|child|student|teacher|school|work|life|hand|eye|world|country|state|city|business|night|day|week|month|year|home|room|office|street|road|money|job|problem|question|answer|idea|story|fact|example|case|part|point|number|group|area|system|program|service|family|company|government|community|society)\b/g;
    const nouns = (text.match(nounPatterns) || []).length;
    this.recordOpportunity('Articles', 'Missing Article', Math.max(1, Math.floor(nouns * 0.7))); // Most nouns need articles
    this.recordOpportunity('Articles', 'Wrong Article', Math.max(1, Math.floor(nouns * 0.3)));
    
    // Verb tense opportunities: count all verbs and verb forms
    const verbPatterns = /\b(am|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|can|could|should|must|might|may|go|goes|went|gone|going|make|makes|made|making|take|takes|took|taken|taking|get|gets|got|gotten|getting|come|comes|came|coming|see|sees|saw|seen|seeing|know|knows|knew|known|knowing|think|thinks|thought|thinking|say|says|said|saying|tell|tells|told|telling|give|gives|gave|given|giving|find|finds|found|finding|work|works|worked|working|play|plays|played|playing|want|wants|wanted|wanting|need|needs|needed|needing|like|likes|liked|liking|help|helps|helped|helping|look|looks|looked|looking|feel|feels|felt|feeling|try|tries|tried|trying|call|calls|called|calling|ask|asks|asked|asking|talk|talks|talked|talking|turn|turns|turned|turning|move|moves|moved|moving|live|lives|lived|living|believe|believes|believed|believing|become|becomes|became|becoming|seem|seems|seemed|seeming|leave|leaves|left|leaving|put|puts|putting|mean|means|meant|meaning|keep|keeps|kept|keeping|let|lets|letting|begin|begins|began|beginning|happen|happens|happened|happening|write|writes|wrote|written|writing|bring|brings|brought|bringing|sit|sits|sat|sitting|stand|stands|stood|standing|lose|loses|lost|losing|pay|pays|paid|paying|meet|meets|met|meeting|include|includes|included|including|continue|continues|continued|continuing|set|sets|setting|learn|learns|learned|learning|change|changes|changed|changing|lead|leads|led|leading|understand|understands|understood|understanding|watch|watches|watched|watching|follow|follows|followed|following|stop|stops|stopped|stopping|create|creates|created|creating|speak|speaks|spoke|spoken|speaking|read|reads|reading|allow|allows|allowed|allowing|add|adds|added|adding|spend|spends|spent|spending|grow|grows|grew|grown|growing|open|opens|opened|opening|walk|walks|walked|walking|win|wins|won|winning|offer|offers|offered|offering|remember|remembers|remembered|remembering|love|loves|loved|loving|consider|considers|considered|considering|appear|appears|appeared|appearing|buy|buys|bought|buying|wait|waits|waited|waiting|serve|serves|served|serving|die|dies|died|dying|send|sends|sent|sending|expect|expects|expected|expecting|build|builds|built|building|stay|stays|stayed|staying|fall|falls|fell|fallen|falling|cut|cuts|cutting|reach|reaches|reached|reaching|kill|kills|killed|killing|remain|remains|remained|remaining)\b/g;
    const verbs = (text.match(verbPatterns) || []).length;
    this.recordOpportunity('Verb Tenses', 'Past Tense', Math.max(1, Math.floor(verbs * 0.3)));
    this.recordOpportunity('Verb Tenses', 'Present Tense', Math.max(1, Math.floor(verbs * 0.4)));
    this.recordOpportunity('Verb Tenses', 'Future Tense', Math.max(1, Math.floor(verbs * 0.2)));
    
    // Preposition opportunities: count contexts where prepositions are needed
    const timeWords = /\b(morning|afternoon|evening|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|today|tomorrow|yesterday|week|month|year|time|hour|minute|second|\d+)\b/g;
    const placeWords = /\b(home|school|work|office|house|room|kitchen|bathroom|bedroom|living|street|road|city|country|state|park|store|shop|restaurant|hospital|library|church|station|airport|hotel|beach|mountain|forest|garden|table|chair|desk|bed|floor|ceiling|wall|door|window|car|bus|train|plane)\b/g;
    const timeContexts = (text.match(timeWords) || []).length;
    const placeContexts = (text.match(placeWords) || []).length;
    this.recordOpportunity('Prepositions', 'Time Prepositions', Math.max(1, timeContexts));
    this.recordOpportunity('Prepositions', 'Place Prepositions', Math.max(1, placeContexts));
    this.recordOpportunity('Prepositions', 'Other Prepositions', Math.max(1, Math.floor(words.length / 15))); // Rough estimate
    
    // Subject-verb agreement: count subject-verb pairs
    const subjectVerbPairs = sentences.length * 2; // Estimate 2 subject-verb pairs per sentence
    this.recordOpportunity('Subject-Verb Agreement', 'Singular/Plural Mismatch', Math.max(1, subjectVerbPairs));
    
    // Plurals: count potential plural contexts
    const pluralWords = /\b(two|three|four|five|six|seven|eight|nine|ten|many|several|few|some|all|most|both|these|those|multiple|various|different|several)\b/g;
    const pluralContexts = (text.match(pluralWords) || []).length;
    this.recordOpportunity('Plurals', 'Regular Plurals', Math.max(1, pluralContexts));
    this.recordOpportunity('Plurals', 'Irregular Plurals', Math.max(1, Math.floor(pluralContexts * 0.3)));
    
    // Punctuation: count sentences and clauses
    this.recordOpportunity('Punctuation', 'Periods', Math.max(1, sentences.length));
    this.recordOpportunity('Punctuation', 'Commas', Math.max(1, Math.floor(words.length / 10))); // Rough estimate
    const questions = (text.match(/\?/g) || []).length;
    if (questions > 0) this.recordOpportunity('Punctuation', 'Question Marks', questions);
    
    // Capitalization: count sentences (each sentence start needs capitalization)
    this.recordOpportunity('Punctuation', 'Capitalization', Math.max(1, sentences.length));
    
    // Spelling: every word is a spelling opportunity
    this.recordOpportunity('Spelling', 'Common Misspellings', Math.max(1, words.length));
    
    // Word order: count complex sentences
    const complexSentences = sentences.filter(s => s.includes(',') || s.includes('and') || s.includes('but') || s.includes('because')).length;
    this.recordOpportunity('Word Order', 'Question Formation', Math.max(1, complexSentences));
    
    this.savePatternsToStorage();
  }

  private recordOpportunity(category: string, subcategory: string, count: number): void {
    const key = `${category}_${subcategory}`;
    const pattern = this.patterns.get(key);
    
    if (pattern && count > 0) {
      pattern.totalOpportunities += count;
      
      // Update accuracy using the centralized method
      this.updateAccuracy(pattern);
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

  // Add some demo data to show how the heatmap works
  addDemoData(): void {
    // Add some realistic demo patterns so users can see the heatmap in action
    this.recordOpportunity('Articles', 'Missing Article', 15);
    this.recordError('Articles', 'Missing Article', { originalText: 'I went to store', suggestedText: 'I went to the store', explanation: 'Missing article' });
    this.recordError('Articles', 'Missing Article', { originalText: 'She is student', suggestedText: 'She is a student', explanation: 'Missing article' });
    // Show that user fixed one of the article errors
    this.recordErrorFixed('Articles', 'Missing Article', 'I went to store', 'I went to the store');
    
    this.recordOpportunity('Verb Tenses', 'Past Tense', 12);
    this.recordError('Verb Tenses', 'Past Tense', { originalText: 'I go yesterday', suggestedText: 'I went yesterday', explanation: 'Wrong past tense' });
    // Show user fixed this error too
    this.recordErrorFixed('Verb Tenses', 'Past Tense', 'I go yesterday', 'I went yesterday');
    
    this.recordOpportunity('Prepositions', 'Time Prepositions', 8);
    this.recordError('Prepositions', 'Time Prepositions', { originalText: 'at morning', suggestedText: 'in the morning', explanation: 'Wrong preposition' });
    
    this.recordOpportunity('Subject-Verb Agreement', 'Singular/Plural Mismatch', 10);
    this.recordError('Subject-Verb Agreement', 'Singular/Plural Mismatch', { originalText: 'The students is', suggestedText: 'The students are', explanation: 'Subject-verb disagreement' });
    
    this.recordOpportunity('Spelling', 'Common Misspellings', 25);
    this.recordError('Spelling', 'Common Misspellings', { originalText: 'recieve', suggestedText: 'receive', explanation: 'Spelling error' });
    this.recordError('Spelling', 'Common Misspellings', { originalText: 'definately', suggestedText: 'definitely', explanation: 'Spelling error' });
    // Show user fixed one spelling error
    this.recordErrorFixed('Spelling', 'Common Misspellings', 'recieve', 'receive');
    
    this.savePatternsToStorage();
  }

  exportErrorData(): string {
    return JSON.stringify(Array.from(this.patterns.values()), null, 2);
  }
}

export const errorPatternService = new ErrorPatternService(); 