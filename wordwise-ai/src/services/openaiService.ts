import OpenAI from 'openai';
import { translationService } from './translationService';

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
    
    console.log('🔧 OpenAI Service initializing...');
    console.log('🔑 API Key found:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NO KEY');
    
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
      });
      this.isInitialized = true;
      console.log('✅ OpenAI Service initialized successfully');
    } else {
      console.warn('❌ OpenAI API key not found. Using mock responses.');
      console.log('🔍 Expected env var: VITE_OPENAI_API_KEY');
    }
  }

  // Cache for fast lookups
  private cache = new Map<string, { analysis: WritingAnalysis; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async analyzeText(text: string, userLevel: string = 'intermediate', nativeLanguage?: string): Promise<WritingAnalysis> {
    if (!text.trim()) {
      return {
        grammarSuggestions: [],
        overallScore: 100,
        wordCount: 0,
        readabilityScore: 100,
        eslTips: []
      };
    }

    console.log('🔍 OpenAI analyzing text:', text.substring(0, 50) + '...');
    console.log('🌍 User native language:', nativeLanguage || 'not specified');
    console.log('📊 Service status:', {
      isInitialized: this.isInitialized,
      hasOpenAI: !!this.openai,
      textLength: text.length,
      userLevel
    });

    // Check cache first for performance - include native language in cache key
    const cacheKey = `${text.slice(0, 100)}-${userLevel}-${nativeLanguage || 'en'}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('📋 Using cached OpenAI result');
      return cached.analysis;
    }

    // If OpenAI is not initialized, return mock data
    if (!this.isInitialized || !this.openai) {
      console.log('🔄 OpenAI not available, using mock analysis');
      console.log('❌ Reason:', !this.isInitialized ? 'Not initialized' : 'No OpenAI instance');
      return this.getMockAnalysis(text, nativeLanguage);
    }

    try {
      const prompt = this.createOptimizedPrompt(text, userLevel, nativeLanguage);
      
      console.log('🚀 Sending request to OpenAI GPT-4o...');
      console.log('📝 Prompt length:', prompt.length);
      
      const startTime = Date.now();
      const response = await Promise.race([
        this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: this.createSystemPrompt(nativeLanguage)
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.05,
          max_tokens: 3000,
          stream: false
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI timeout')), 45000)
        )
      ]) as any;

      const duration = Date.now() - startTime;
      console.log(`⚡ OpenAI API call completed in ${duration}ms`);
      console.log('📦 OpenAI Response:', {
        model: response.model,
        usage: response.usage,
        contentLength: response.choices[0].message.content?.length || 0
      });

      const analysis = this.parseOpenAIResponse(response.choices[0].message.content || '', text);
      
      // Cache the result
      this.cache.set(cacheKey, { analysis, timestamp: Date.now() });
      
      console.log('✅ OpenAI analysis complete:', analysis.grammarSuggestions.length, 'suggestions');
      console.log('🎯 Found errors:', analysis.grammarSuggestions.map(s => `"${s.originalText}" → "${s.suggestion}"`));
      return analysis;
    } catch (error) {
      console.error('❌ OpenAI API Error:', error);
      console.error('🔍 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split('\n')[0] : 'No stack trace'
      });
      
      // If it's a timeout error, try with a simpler, faster prompt
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('⏰ OpenAI timed out, using enhanced fallback analysis...');
        try {
          return await this.getFastAnalysis(text, userLevel, nativeLanguage);
        } catch (fallbackError) {
          console.error('❌ Fast analysis also failed:', fallbackError);
        }
      }
      
      // Final fallback to mock data if everything fails
      console.log('🔄 Using mock analysis as final fallback');
      return this.getMockAnalysis(text, nativeLanguage);
    }
  }

  private createSystemPrompt(nativeLanguage?: string): string {
    const basePrompt = `You are a HYPER-AGGRESSIVE spell checker and grammar expert. Your job is to find EVERY SINGLE ERROR in the text - no matter how small. You have zero tolerance for mistakes.

🔍 ULTRA-COMPREHENSIVE ANALYSIS PROTOCOL:

STAGE 1 - EXHAUSTIVE SPELLING CHECK:
Examine EVERY SINGLE WORD for any spelling mistake:
• Check each word against standard English dictionary
• Flag ANY non-standard spelling, including slang, texting shortcuts, phonetic errors
• Catch missing letters, extra letters, wrong letters, transposed letters
• Find homophone errors (their/there/they're, to/two/too, your/you're)
• Identify compound word errors (alot→a lot, incase→in case, everytime→every time)
• Detect capitalization errors
• Find apostrophe mistakes (cant→can't, wont→won't, its/it's)
• Catch plural/singular errors (-s endings)
• BE EXTREMELY THOROUGH - if a word looks even slightly wrong, flag it

STAGE 2 - RUTHLESS GRAMMAR ANALYSIS:
Check EVERY aspect of grammar with zero tolerance:
• Subject-verb agreement (every verb must match its subject)
• Verb tense consistency (past/present/future alignment)
• Irregular verb forms (any -ed endings that should be different)
• Articles (a/an/the usage)
• Preposition errors (in/on/at, to/for/with)
• Pronoun agreement and reference
• Sentence fragments and run-on sentences
• Dangling modifiers
• Parallel structure violations
• Double negatives
• Wrong word forms (adjective vs adverb)

STAGE 3 - PUNCTUATION & CAPITALIZATION PRECISION:
Find EVERY punctuation and capitalization error:
• Missing commas, periods, apostrophes
• Incorrect comma usage
• Missing quotation marks
• CRITICAL: Wrong capitalization after periods - every NEW SENTENCE must start with a capital letter
• Only capitalize the FIRST LETTER of the FIRST WORD after periods (.), exclamation marks (!), and question marks (?)
• Do NOT flag letters within words (like "i" in "playing") - only flag sentence-starting words
• Semicolon and colon errors

CRITICAL INSTRUCTIONS:
• BE AGGRESSIVE - err on the side of flagging too many errors rather than too few
• If you're unsure about a word, check it anyway
• Don't skip common words - they can be misspelled too
• Every non-standard spelling should be flagged
• Every grammar rule violation should be caught
• Trust your language model knowledge - if something seems wrong, it probably is
• The goal is 100% accuracy - catch EVERYTHING
• NEVER create multiple suggestions for the same word or text position
• Each word should only appear ONCE in your suggestions list

ZERO TOLERANCE POLICY:
• No error is too small to flag
• No mistake should be ignored
• Be thorough to the point of being nitpicky
• Better to over-correct than under-correct
• Students want ALL their mistakes found, not just some
• NO DUPLICATE SUGGESTIONS - each error should be flagged exactly once

🎯 ANALYSIS MINDSET:
You are like a strict English teacher who catches every single mistake. Be thorough, be aggressive, be comprehensive. The student wants you to find EVERYTHING wrong with their writing.`;
    
    if (nativeLanguage && nativeLanguage.toLowerCase() !== 'english') {
      return `${basePrompt} 

🌍 BILINGUAL INSTRUCTION: The student's native language is ${nativeLanguage}. You MUST provide ALL explanations in BOTH English and ${nativeLanguage}. This is critical for ESL learning.

BILINGUAL FORMAT REQUIRED:
- "message": "English explanation | ${nativeLanguage} explanation"

Examples for different languages:
📚 Spanish: "Spelling error - 'bech' should be 'beach' | Error de ortografía - 'bech' debe ser 'beach'"
📚 Chinese: "Wrong verb tense - 'goed' should be 'went' | 错误的动词时态 - 'goed' 应该是 'went'"
📚 French: "Grammar error - 'We was' should be 'We were' | Erreur de grammaire - 'We was' devrait être 'We were'"
📚 Vocabulary: "Use more academic vocabulary - 'very good' could be 'excellent' | Usa vocabulario más académico - 'very good' podría ser 'excellent'"

EVERY suggestion must include both languages.`;
    }
    
    return basePrompt;
  }

  private createOptimizedPrompt(text: string, userLevel: string, nativeLanguage?: string): string {
    const bilingualInstruction = nativeLanguage && nativeLanguage.toLowerCase() !== 'english' 
      ? `\n\n🌍 CRITICAL BILINGUAL REQUIREMENT: The student's native language is ${nativeLanguage}. For EVERY SINGLE suggestion, you MUST provide the "message" field with explanations in BOTH English AND ${nativeLanguage}, separated by " | ". This is mandatory for ESL learning.

📝 BILINGUAL MESSAGE FORMAT (REQUIRED):
"Spelling error - 'bech' should be 'beach' | Error de ortografía - 'bech' debe ser 'beach'" (Spanish example)
"Wrong verb tense - 'goed' should be 'went' | 错误的动词时态 - 'goed' 应该是 'went'" (Chinese example)
"Grammar error - 'We was' should be 'We were' | Erreur de grammaire - 'We was' devrait être 'We were'" (French example)
"Vocabulary enhancement - 'very good' could be 'excellent' | Mejora de vocabulario - 'very good' podría ser 'excellent'" (Spanish example)

NO EXCEPTIONS: Every message must include both languages.`
      : '';

    return `FIND ALL ERRORS! Check every word for spelling, grammar, and punctuation mistakes. Be thorough and aggressive.

TEXT: "${text}"

INSTRUCTIONS:
1. Check EVERY word for spelling errors
2. Check ALL grammar (verb tenses, subject-verb agreement, articles)  
3. Check ALL punctuation (apostrophes, commas, periods)
4. Flag ANY mistake, no matter how small
5. Be aggressive - if it looks wrong, flag it

Return JSON format:
{
  "grammarSuggestions": [
    {
      "type": "spelling|grammar|punctuation",
      "severity": "error",
      "message": "Brief error explanation${bilingualInstruction ? ' in BOTH English and ' + nativeLanguage : ''}",
      "suggestion": "correct version",
      "originalText": "incorrect text",
      "startIndex": 0,
      "endIndex": 5
    }
  ],
  "overallScore": 75,
  "readabilityScore": 80,
  "eslTips": ["tip 1", "tip 2"]
}${bilingualInstruction}

Analyze the text above and find EVERY error. Check each word individually.`;
  }

  private parseOpenAIResponse(response: string, originalText: string): WritingAnalysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        console.log('📋 Parsed OpenAI response:', parsed.grammarSuggestions?.length || 0, 'suggestions');
        
        // Validate and fix positions for each suggestion
        const fixedSuggestions = (parsed.grammarSuggestions || []).map((suggestion: any) => {
          const originalWord = suggestion.originalText;
          if (!originalWord) {
            console.warn('⚠️ Suggestion missing originalText:', suggestion);
            return null;
          }
          
          // Find the correct position of this word in the text
          const searchText = originalText.toLowerCase();
          const searchWord = originalWord.toLowerCase();
          let startIndex = searchText.indexOf(searchWord);
          
          // If not found, try case-sensitive search
          if (startIndex === -1) {
            startIndex = originalText.indexOf(originalWord);
          }
          
          // If still not found, try regex search for partial matches
          if (startIndex === -1) {
            const regex = new RegExp(searchWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            const match = originalText.match(regex);
            if (match && match.index !== undefined) {
              startIndex = match.index;
            }
          }
          
          if (startIndex === -1) {
            console.warn('⚠️ Could not find position for:', originalWord);
            return null;
          }
          
          const endIndex = startIndex + originalWord.length;
          
          // Verify the text matches
          const actualText = originalText.substring(startIndex, endIndex);
          if (actualText.toLowerCase() !== originalWord.toLowerCase()) {
            console.warn('⚠️ Position mismatch for:', originalWord, 'found:', actualText);
            // Try to find a better match nearby
            for (let offset = -5; offset <= 5; offset++) {
              const testStart = startIndex + offset;
              const testEnd = testStart + originalWord.length;
              if (testStart >= 0 && testEnd <= originalText.length) {
                const testText = originalText.substring(testStart, testEnd);
                if (testText.toLowerCase() === originalWord.toLowerCase()) {
                  console.log('✅ Found better position with offset:', offset);
                  return {
                    ...suggestion,
                    startIndex: testStart,
                    endIndex: testEnd
                  };
                }
              }
            }
            return null;
          }
          
          return {
            ...suggestion,
            startIndex: Math.max(0, startIndex),
            endIndex: Math.min(originalText.length, endIndex)
          };
        }).filter(Boolean); // Remove null entries
        
        // Deduplicate suggestions - remove overlapping or duplicate suggestions
        const deduplicatedSuggestions = this.deduplicateSuggestions(fixedSuggestions);
        
        console.log('✅ Fixed positions for', fixedSuggestions.length, 'suggestions');
        console.log('🔄 After deduplication:', deduplicatedSuggestions.length, 'suggestions');
        
        return {
          grammarSuggestions: deduplicatedSuggestions,
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

  private deduplicateSuggestions(suggestions: any[]): any[] {
    const deduplicated: any[] = [];
    const seen = new Set<string>();
    
    // Sort suggestions by position to process them in order
    const sortedSuggestions = [...suggestions].sort((a, b) => a.startIndex - b.startIndex);
    
    for (const suggestion of sortedSuggestions) {
      // Create a unique key for this suggestion based on position and content
      const key = `${suggestion.startIndex}-${suggestion.endIndex}-${suggestion.originalText}`;
      
      if (!seen.has(key)) {
        // Check if this suggestion overlaps with any existing suggestion
        const hasOverlap = deduplicated.some(existing => 
          this.positionsOverlap(
            { start: suggestion.startIndex, end: suggestion.endIndex },
            { start: existing.startIndex, end: existing.endIndex }
          )
        );
        
        if (!hasOverlap) {
          deduplicated.push(suggestion);
          seen.add(key);
        } else {
          console.log('🔄 Removing overlapping suggestion:', suggestion.originalText);
        }
      } else {
        console.log('🔄 Removing duplicate suggestion:', suggestion.originalText);
      }
    }
    
    return deduplicated;
  }

  private positionsOverlap(pos1: { start: number; end: number }, pos2: { start: number; end: number }): boolean {
    return pos1.start < pos2.end && pos2.start < pos1.end;
  }

  private getMockAnalysis(text: string, nativeLanguage?: string): WritingAnalysis {
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const suggestions: GrammarSuggestion[] = [];

    console.log('🔄 Using mock analysis for text:', text.substring(0, 100) + '...');

    // Helper function to create bilingual messages using translation service
    const createBilingualMessage = (englishMsg: string, customTranslation?: string): string => {
      if (customTranslation) {
        // Use custom translation if provided (for backwards compatibility)
        return `${englishMsg} | ${customTranslation}`;
      }
      // Use translation service for automatic translation
      return translationService.createBilingualMessage(englishMsg, nativeLanguage);
    };

    // Common spelling patterns for testing
    const spellingPatterns = [
      { pattern: /\byesturday\b/gi, correction: 'yesterday', message: 'Spelling error' },
      { pattern: /\bbecuase\b/gi, correction: 'because', message: 'Spelling error' },
      { pattern: /\bgrosherys\b/gi, correction: 'groceries', message: 'Spelling error' },
      { pattern: /\bjuce\b/gi, correction: 'juice', message: 'Spelling error' },
      { pattern: /\binsted\b/gi, correction: 'instead', message: 'Spelling error' },
      { pattern: /\bcarring\b/gi, correction: 'carrying', message: 'Spelling error' },
      { pattern: /\binsited\b/gi, correction: 'insisted', message: 'Spelling error' },
      { pattern: /\bexperiance\b/gi, correction: 'experience', message: 'Spelling error' },
      { pattern: /\balot\b/gi, correction: 'a lot', message: 'Spelling error - two separate words' },
    ];

    // Grammar patterns for testing
    const grammarPatterns = [
      { pattern: /\bwasnt\b/gi, correction: "wasn't", message: 'Missing apostrophe' },
      { pattern: /\bgotted\b/gi, correction: 'got', message: 'Incorrect verb form' },
      { pattern: /\baskeded\b/gi, correction: 'asked', message: 'Incorrect verb form' },
      { pattern: /\bcamed\b/gi, correction: 'came', message: 'Incorrect past tense' },
      { pattern: /\bweted\b/gi, correction: 'wet', message: 'Incorrect verb form' },
      { pattern: /\bshe were\b/gi, correction: 'she was', message: 'Subject-verb agreement error' },
    ];

    // Capitalization patterns - first letter after sentence endings must be capitalized (only word boundaries)
    const capitalizationPatterns = [
      { 
        pattern: /([.!?]\s+)\b([a-z])/g, 
        correction: (match: string, punctuation: string, letter: string) => punctuation + letter.toUpperCase(),
        message: 'First letter after period must be capitalized'
      },
      // Start of text should be capitalized (only word boundaries)
      { 
        pattern: /^(\s*)\b([a-z])/,
        correction: (match: string, spaces: string, letter: string) => spaces + letter.toUpperCase(),
        message: 'First letter of text must be capitalized'
      }
    ];

    // Word choice patterns
    const wordChoicePatterns = [
      { pattern: /\bto by\b/gi, correction: 'to buy', message: 'Wrong word - should be "buy"' },
    ];

    // Apply regular patterns
    [...spellingPatterns, ...grammarPatterns, ...wordChoicePatterns].forEach(({pattern, correction, message}) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        suggestions.push({
          type: message.includes('verb') || message.includes('agreement') ? 'grammar' : 'spelling',
          severity: 'error',
          message: createBilingualMessage(message),
          suggestion: correction,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          originalText: match[0]
        });
      }
    });

    // Apply capitalization patterns (these have function corrections)
    capitalizationPatterns.forEach(({pattern, correction, message}) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let correctedText: string;
        if (typeof correction === 'function') {
          correctedText = correction(match[0], match[1] || '', match[2] || '');
        } else {
          correctedText = correction;
        }
        
        suggestions.push({
          type: 'grammar',
          severity: 'error',
          message: createBilingualMessage(message),
          suggestion: correctedText,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          originalText: match[0]
        });
      }
    });

    console.log('🔄 Mock analysis found', suggestions.length, 'errors:', suggestions.map(s => s.originalText));

    // Deduplicate mock suggestions as well
    const deduplicatedSuggestions = this.deduplicateSuggestions(suggestions.map(s => ({
      ...s,
      startIndex: s.startIndex,
      endIndex: s.endIndex
    })));
    
    console.log('🔄 After mock deduplication:', deduplicatedSuggestions.length, 'suggestions');

    if (text.includes('there is many') || text.includes('there are much')) {
      const index = text.indexOf('there is many') !== -1 ? text.indexOf('there is many') : text.indexOf('there are much');
      
      deduplicatedSuggestions.push({
        type: 'grammar',
        severity: 'error',
        message: createBilingualMessage('Subject-verb agreement error'),
        suggestion: text.includes('there is many') ? 'there are many' : 'there is much',
        startIndex: index,
        endIndex: index + (text.includes('there is many') ? 13 : 14),
        originalText: text.includes('there is many') ? 'there is many' : 'there are much'
      });
    }

    // Add vocabulary suggestions for simple words with bilingual explanations
    const vocabularyPatterns = [
      { 
        pattern: /\bvery good\b/gi, 
        suggestion: 'excellent', 
        message: 'Consider using more precise academic vocabulary'
      },
      { 
        pattern: /\bvery bad\b/gi, 
        suggestion: 'poor', 
        message: 'Consider using more formal academic language'
      },
      { 
        pattern: /\ba lot of\b/gi, 
        suggestion: 'numerous', 
        message: 'Consider using more formal quantifiers'
      }
    ];

    vocabularyPatterns.forEach(vocab => {
      let match;
      while ((match = vocab.pattern.exec(text)) !== null) {
        deduplicatedSuggestions.push({
          type: 'vocabulary',
          severity: 'suggestion',
          message: createBilingualMessage(vocab.message),
          suggestion: vocab.suggestion,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          originalText: match[0]
        });
      }
    });

    // Final deduplication pass including the additional suggestions
    const finalSuggestions = this.deduplicateSuggestions(deduplicatedSuggestions);

    // Create bilingual ESL tips using translation service
    const eslTips = [
      createBilingualMessage('Remember to use articles (a, an, the) before nouns'),
      createBilingualMessage('Check subject-verb agreement in your sentences'),
      createBilingualMessage('Use transition words to connect your ideas'),
      createBilingualMessage('Vary your sentence length for better flow')
    ];

    return {
      grammarSuggestions: finalSuggestions,
      overallScore: Math.max(70, 100 - finalSuggestions.length * 5),
      wordCount,
      readabilityScore: wordCount > 50 ? 85 : 90,
      eslTips
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

  // Fast analysis with simpler prompt for timeout recovery
  private async getFastAnalysis(text: string, userLevel: string, nativeLanguage?: string): Promise<WritingAnalysis> {
    if (!this.isInitialized || !this.openai) {
      return this.getMockAnalysis(text, nativeLanguage);
    }

    try {
      console.log('🚄 Trying fast OpenAI analysis...');
      const response = await Promise.race([
        this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: `Find spelling and grammar errors in: "${text}". Return JSON: {"grammarSuggestions":[{"type":"spelling","severity":"error","message":"error description","suggestion":"correction","originalText":"wrong word","startIndex":0,"endIndex":5}],"overallScore":75,"readabilityScore":80,"eslTips":[]}`
            }
          ],
          temperature: 0.1,
          max_tokens: 1500,
          stream: false
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Fast analysis timeout')), 15000)
        )
      ]) as any;

      const analysis = this.parseOpenAIResponse(response.choices[0].message.content || '', text);
      console.log('✅ Fast analysis complete:', analysis.grammarSuggestions.length, 'suggestions');
      return analysis;
    } catch (error) {
      console.error('❌ Fast analysis failed:', error);
      throw error;
    }
  }

  // Debounced analysis for real-time checking
  private debounceTimer: NodeJS.Timeout | null = null;
  
  analyzeTextDebounced(text: string, userLevel: string, callback: (analysis: WritingAnalysis) => void, delay: number = 800, nativeLanguage?: string) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(async () => {
      const analysis = await this.analyzeText(text, userLevel, nativeLanguage);
      callback(analysis);
    }, delay);
  }
}

export const openaiService = new OpenAIService(); 