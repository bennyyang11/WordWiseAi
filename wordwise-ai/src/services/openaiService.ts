import OpenAI from 'openai';

// Types for our grammar checking responses
export interface GrammarSuggestion {
  type: 'grammar' | 'spelling' | 'vocabulary' | 'style' | 'esl';
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  suggestion?: string;
  startIndex: number;
  endIndex: number;
  originalText: string;
}

export interface WritingAnalysis {
  grammarSuggestions: GrammarSuggestion[];
  overallScore: number;
  wordCount: number;
  readabilityScore: number;
  eslTips: string[];
}

class OpenAIService {
  private openai: OpenAI | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
      });
      this.isInitialized = true;
    } else {
      console.warn('OpenAI API key not found. Using mock responses.');
    }
  }

  // Cache for fast lookups
  private cache = new Map<string, { analysis: WritingAnalysis; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async analyzeText(text: string, userLevel: string = 'intermediate'): Promise<WritingAnalysis> {
    if (!text.trim()) {
      return {
        grammarSuggestions: [],
        overallScore: 100,
        wordCount: 0,
        readabilityScore: 100,
        eslTips: []
      };
    }

    // Check cache first for performance
    const cacheKey = `${text.slice(0, 100)}-${userLevel}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.analysis;
    }

    // If OpenAI is not initialized, return mock data
    if (!this.isInitialized || !this.openai) {
      return this.getMockAnalysis(text);
    }

    try {
      const prompt = this.createOptimizedPrompt(text, userLevel);
      
      const response = await Promise.race([
        this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a meticulous English teacher and grammar expert. Your job is to find EVERY SINGLE ERROR in student text. Be extremely thorough and comprehensive. Do not miss any mistakes, no matter how small."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.2, // Slightly higher for more comprehensive analysis
          max_tokens: 1500, // More tokens for comprehensive error detection
          stream: false
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI timeout')), 4000) // 4 second timeout for thorough analysis
        )
      ]) as any;

      const analysis = this.parseOpenAIResponse(response.choices[0].message.content || '', text);
      
      // Cache the result
      this.cache.set(cacheKey, { analysis, timestamp: Date.now() });
      
      return analysis;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      // Fallback to mock data if API fails
      return this.getMockAnalysis(text);
    }
  }

  private createOptimizedPrompt(text: string, userLevel: string): string {
    return `You are a meticulous English teacher. Find EVERY SINGLE ERROR in this ${userLevel} ESL text. Miss nothing! Return JSON only:

{
  "grammarSuggestions": [
    {
      "type": "grammar|spelling|vocabulary|style",
      "severity": "error|warning|suggestion", 
      "message": "Specific error description",
      "suggestion": "Exact correction",
      "originalText": "Wrong text",
      "startIndex": 0,
      "endIndex": 5
    }
  ],
  "overallScore": 20,
  "readabilityScore": 40,
  "eslTips": ["Specific ESL tip"]
}

FIND ALL OF THESE ERRORS:
- Spelling mistakes (every misspelled word)
- Wrong verb tenses (past/present/future)
- Subject-verb disagreement
- Wrong articles (a/an/the)
- Wrong prepositions
- Word order mistakes
- Punctuation errors
- Wrong word forms
- Missing words
- Extra words
- Homophones (their/there/they're)
- Capitalization errors

Text: "${text}"

Be thorough! Find 15-30+ errors if they exist. Check every word and grammatical structure!`;
  }



  private parseOpenAIResponse(response: string, originalText: string): WritingAnalysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and clean the response
        return {
          grammarSuggestions: (parsed.grammarSuggestions || []).map((suggestion: any) => ({
            ...suggestion,
            startIndex: Math.max(0, suggestion.startIndex || 0),
            endIndex: Math.min(originalText.length, suggestion.endIndex || 0)
          })),
          overallScore: Math.max(0, Math.min(100, parsed.overallScore || 85)),
          wordCount: originalText.trim().split(/\s+/).filter(word => word.length > 0).length,
          readabilityScore: Math.max(0, Math.min(100, parsed.readabilityScore || 80)),
          eslTips: parsed.eslTips || []
        };
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
    }
    
    // Fallback if parsing fails
    return this.getMockAnalysis(originalText);
  }

  private getMockAnalysis(text: string): WritingAnalysis {
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const suggestions: GrammarSuggestion[] = [];

    // Simple mock suggestions based on common patterns
    if (text.toLowerCase().includes('alot')) {
      suggestions.push({
        type: 'spelling',
        severity: 'error',
        message: 'Incorrect spelling',
        suggestion: 'a lot',
        startIndex: text.toLowerCase().indexOf('alot'),
        endIndex: text.toLowerCase().indexOf('alot') + 4,
        originalText: 'alot'
      });
    }

    if (text.includes('there is many') || text.includes('there are much')) {
      const index = text.indexOf('there is many') !== -1 ? text.indexOf('there is many') : text.indexOf('there are much');
      suggestions.push({
        type: 'grammar',
        severity: 'error',
        message: 'Subject-verb agreement error',
        suggestion: text.includes('there is many') ? 'there are many' : 'there is much',
        startIndex: index,
        endIndex: index + (text.includes('there is many') ? 13 : 14),
        originalText: text.includes('there is many') ? 'there is many' : 'there are much'
      });
    }

    // Add vocabulary suggestions for simple words - more comprehensive
    const vocabularyPatterns = [
      { pattern: /\bvery good\b/gi, suggestion: 'excellent', message: 'Consider using more precise academic vocabulary' },
      { pattern: /\bvery bad\b/gi, suggestion: 'poor', message: 'Consider using more formal academic language' },
      { pattern: /\ba lot of\b/gi, suggestion: 'numerous', message: 'Consider using more formal quantifiers' },
      { pattern: /\bbig\b/gi, suggestion: 'significant', message: 'Consider using more academic terminology' },
      { pattern: /\bget\b/gi, suggestion: 'obtain', message: 'Consider using more formal vocabulary' },
      { pattern: /\bshow\b/gi, suggestion: 'demonstrate', message: 'Consider using more academic verbs' },
      { pattern: /\buse\b/gi, suggestion: 'utilize', message: 'Consider using more sophisticated vocabulary' }
    ];

    vocabularyPatterns.forEach(vocab => {
      let match;
      while ((match = vocab.pattern.exec(text)) !== null) {
        suggestions.push({
          type: 'vocabulary',
          severity: 'suggestion',
          message: vocab.message,
          suggestion: vocab.suggestion,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          originalText: match[0]
        });
      }
    });

    return {
      grammarSuggestions: suggestions,
      overallScore: Math.max(70, 100 - suggestions.length * 5),
      wordCount,
      readabilityScore: wordCount > 50 ? 85 : 90,
      eslTips: [
        'Remember to use articles (a, an, the) before nouns',
        'Check subject-verb agreement in your sentences',
        'Use transition words to connect your ideas',
        'Vary your sentence length for better flow'
      ]
    };
  }

  // Convert OpenAI analysis to app format
  convertToAppFormat(analysis: WritingAnalysis, text: string): { suggestions: any[], metrics: any, overallScore: number } {
    const suggestions = analysis.grammarSuggestions.map((suggestion, index) => ({
      id: `openai-${index}`,
      type: suggestion.type,
      severity: suggestion.severity,
      originalText: suggestion.originalText,
      suggestedText: suggestion.suggestion || '',
      explanation: suggestion.message,
      position: {
        start: suggestion.startIndex,
        end: suggestion.endIndex
      },
      confidence: 0.9,
      rule: 'openai-analysis'
    }));

    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    return {
      suggestions,
      metrics: {
        wordCount: analysis.wordCount,
        sentenceCount: sentences.length,
        paragraphCount: paragraphs.length,
        readabilityScore: analysis.readabilityScore,
        averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
        complexWords: words.filter(word => word.length > 6).length,
        passiveVoiceCount: 0
      },
      overallScore: analysis.overallScore
    };
  }

  // Debounced analysis for real-time checking
  private debounceTimer: NodeJS.Timeout | null = null;
  
  analyzeTextDebounced(text: string, userLevel: string, callback: (analysis: WritingAnalysis) => void, delay: number = 800) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(async () => {
      const analysis = await this.analyzeText(text, userLevel);
      callback(analysis);
    }, delay);
  }
}

export const openaiService = new OpenAIService(); 