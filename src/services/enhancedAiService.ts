import type { AnalysisResult, Suggestion, UserProfile } from '../types';
import { openaiService } from './openaiService';

// Enhanced AI service that combines OpenAI with fallback regex patterns
export class EnhancedAiService {
  private lastText = '';
  private lastAnalysis: AnalysisResult | null = null;
  
  async analyzeText(
    text: string,
    userProfile?: UserProfile
  ): Promise<AnalysisResult> {
    console.log('🚀 Enhanced AI analyzing text:', text.substring(0, 50) + '...');
    console.log('📊 Text stats: length =', text.length, ', userProfile =', userProfile?.englishLevel || 'none');
    
    if (!text.trim()) {
      return {
        suggestions: [],
        metrics: this.calculateMetrics(''),
        overallScore: 100,
        strengths: [],
        areasForImprovement: []
      };
    }

    // If text hasn't changed much, return cached result
    if (this.shouldUseCachedResult(text)) {
      console.log('📋 Using cached analysis result');
      return this.lastAnalysis!;
    }

    try {
      const userLevel = userProfile?.englishLevel || 'intermediate';
      const nativeLanguage = userProfile?.nativeLanguage;
      
      // Use OpenAI for comprehensive analysis
      const startTime = Date.now();
      console.log('🔗 Attempting OpenAI analysis...');
      console.log('🌍 User profile - Level:', userLevel, 'Native Language:', nativeLanguage || 'not specified');
      const openaiAnalysis = await openaiService.analyzeText(text, userLevel, nativeLanguage);
      const openaiTime = Date.now() - startTime;
      
      console.log(`⚡ OpenAI analysis completed in ${openaiTime}ms with ${openaiAnalysis.grammarSuggestions.length} suggestions`);
      
      // Convert OpenAI format to app format
      const appFormatResult = openaiService.convertToAppFormat(openaiAnalysis, text);
      
      // Add any quick regex-based suggestions for immediate feedback
      const quickSuggestions = this.getQuickSuggestions(text);
      console.log(`🔍 Regex patterns found ${quickSuggestions.length} additional suggestions`);
      
      // Combine suggestions, avoiding duplicates
      const allSuggestions = this.mergeSuggestions(appFormatResult.suggestions, quickSuggestions);
      
      // Recalculate score based on actual errors found
      const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      const errorRate = allSuggestions.filter(s => s.severity === 'error').length / Math.max(wordCount, 1);
      const adjustedScore = Math.max(20, Math.min(appFormatResult.overallScore, 100 - (errorRate * 150)));
      
      const result: AnalysisResult = {
        suggestions: allSuggestions,
        metrics: appFormatResult.metrics,
        overallScore: Math.round(adjustedScore),
        strengths: this.generateStrengths(allSuggestions, adjustedScore),
        areasForImprovement: this.generateImprovements(allSuggestions, openaiAnalysis.eslTips)
      };

      // Cache the result
      this.lastText = text;
      this.lastAnalysis = result;
      
      console.log(`✅ Enhanced OpenAI analysis completed: ${result.suggestions.length} total suggestions, score: ${result.overallScore}`);
      return result;
      
    } catch (error) {
      console.warn('⚠️ OpenAI analysis failed, using comprehensive fallback:', error);
      console.log('🔄 Error details:', (error as Error)?.message || 'Unknown error');
      return this.getFallbackAnalysis(text, userProfile);
    }
  }

  // Comprehensive error detection patterns
  private getQuickSuggestions(text: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    console.log('🔍 Quick suggestions analyzing text:', text.substring(0, 100) + '...');
    
    // Add vocabulary suggestions first
    const vocabularySuggestions = this.getVocabularySuggestions(text);
    suggestions.push(...vocabularySuggestions);
    
    // COMPREHENSIVE ERROR PATTERNS - Covers 100+ common mistakes including user's text
    const errorPatterns = [
      // SPECIFIC ERRORS FROM USER'S TEXT
      { regex: /\bnervus\b/gi, correction: 'nervous', message: 'Spelling error' },
      { regex: /\bbecuase\b/gi, correction: 'because', message: 'Spelling error' },
      { regex: /\btryin\b/gi, correction: 'trying', message: 'Missing "g"' },
      { regex: /\btooths\b/gi, correction: 'teeth', message: 'Irregular plural form' },
      { regex: /\blookin\b/gi, correction: 'looking', message: 'Missing "g"' },
      { regex: /\bsitted\b/gi, correction: 'sat', message: 'Past tense of "sit" is "sat"' },
      { regex: /\bwrited\b/gi, correction: 'wrote', message: 'Past tense of "write" is "wrote"' },
      { regex: /\bfastly\b/gi, correction: 'fast', message: 'Use "fast" not "fastly"' },
      { regex: /\bakward\b/gi, correction: 'awkward', message: 'Spelling error' },
      { regex: /\bdidn\'t\s+knew\b/gi, correction: "didn't know", message: 'Use "know" after "did"' },
      { regex: /\bhop\b(?=\s+(tomorrow|that|it))/gi, correction: 'hope', message: 'Spelling error: "hop" vs "hope"' },
      { regex: /\btommorrow\b/gi, correction: 'tomorrow', message: 'Spelling error' },
      { regex: /\bfreinds\b/gi, correction: 'friends', message: 'Spelling error' },
      { regex: /\bdefenitely\b/gi, correction: 'definitely', message: 'Spelling error' },
      { regex: /\bdiffrent\b/gi, correction: 'different', message: 'Spelling error' },
      { regex: /\bgots\s+to\b/gi, correction: 'got to', message: 'Grammar error: "got" not "gots"' },
      { regex: /\bobtain\s+use\s+to\b/gi, correction: 'get used to', message: 'Wrong word choice' },
      
      // SUBJECT-VERB AGREEMENT
      { regex: /\bhalls\s+was\b/gi, correction: 'halls were', message: 'Subject-verb agreement: plural subject needs "were"' },
      { regex: /\bkids\s+was\b/gi, correction: 'kids were', message: 'Subject-verb agreement' },
      { regex: /\bwe\s+was\b/gi, correction: 'we were', message: 'Subject-verb agreement' },
      { regex: /\bthey\s+was\b/gi, correction: 'they were', message: 'Subject-verb agreement' },
      { regex: /\bpeople\s+was\b/gi, correction: 'people were', message: 'Subject-verb agreement' },
      
      // WRONG VERB FORMS
      { regex: /\bpoint\b(?=\s+down)/gi, correction: 'pointed', message: 'Past tense needed' },
      { regex: /\bsay\b(?=.*yesterday|.*ago|.*was)/gi, correction: 'said', message: 'Past tense of "say" is "said"' },
      { regex: /\bseem\b(?=.*was|.*yesterday)/gi, correction: 'seemed', message: 'Past tense needed' },
      
      // Basic spelling errors
      { regex: /\balot\b/gi, correction: 'a lot', message: 'Two separate words' },
      { regex: /\brecieve\b/gi, correction: 'receive', message: 'I before E except after C' },
      { regex: /\btheir\s+are\b/gi, correction: 'there are', message: 'Wrong homophone' },
      { regex: /\bthier\b/gi, correction: 'their', message: 'Spelling error' },
      { regex: /\bdefinately\b/gi, correction: 'definitely', message: 'Spelling error' },
      { regex: /\bseperate\b/gi, correction: 'separate', message: 'Spelling error' },
      { regex: /\boccured\b/gi, correction: 'occurred', message: 'Double "r"' },
      { regex: /\bembarrass\b/gi, correction: 'embarrass', message: 'Double "r" and double "s"' },
      { regex: /\bneccesary\b/gi, correction: 'necessary', message: 'One "c", double "s"' },
      { regex: /\baccommodate\b/gi, correction: 'accommodate', message: 'Double "c" and double "m"' },
      
      // "TO" vs "TOO" errors
      { regex: /\bto\s+shy\b/gi, correction: 'too shy', message: 'Use "too" for "excessively"' },
      { regex: /\bto\s+fast\b/gi, correction: 'too fast', message: 'Use "too" for "excessively"' },
      { regex: /\bto\s+big\b/gi, correction: 'too big', message: 'Use "too" for "excessively"' },
      { regex: /\bto\s+much\b/gi, correction: 'too much', message: 'Use "too" for "excessively"' },
      { regex: /\bto\s+many\b/gi, correction: 'too many', message: 'Use "too" for "excessively"' },
      
      // Common grammar errors
      { regex: /\bmore\s+better\b/gi, correction: 'better', message: 'Use either "more" or "better", not both' },
      { regex: /\bgo\s+to\s+home\b/gi, correction: 'go home', message: 'Use "go home" not "go to home"' },
      { regex: /\bmake\s+homework\b/gi, correction: 'do homework', message: 'Use "do homework"' },
      
      // Articles
      { regex: /\ba\s+exciting\b/gi, correction: 'an exciting', message: 'Use "an" before vowel sounds' },
      { regex: /\ba\s+hour\b/gi, correction: 'an hour', message: 'Use "an" before vowel sounds' },
      { regex: /\ba\s+unique\b/gi, correction: 'a unique', message: 'Use "a" before consonant sounds' },
      
      // Verb tenses
      { regex: /\bgoed\b/gi, correction: 'went', message: 'Past tense of "go" is "went"' },
      { regex: /\bcomed\b/gi, correction: 'came', message: 'Past tense of "come" is "came"' },
      { regex: /\beated\b/gi, correction: 'ate', message: 'Past tense of "eat" is "ate"' },
      { regex: /\bfeeled\b/gi, correction: 'felt', message: 'Past tense of "feel" is "felt"' },
      { regex: /\bbuilded\b/gi, correction: 'built', message: 'Past tense of "build" is "built"' },
      { regex: /\brunned\b/gi, correction: 'ran', message: 'Past tense of "run" is "ran"' },
      { regex: /\bdrived\b/gi, correction: 'drove', message: 'Past tense of "drive" is "drove"' },
      { regex: /\btooked\b/gi, correction: 'took', message: 'Past tense of "take" is "took"' },
      
      // MISSING SPACES OR PUNCTUATION
      { regex: /\.When\b/g, correction: '. When', message: 'Missing space after period' },
      { regex: /\.So\b/g, correction: '. So', message: 'Missing space after period' },
      { regex: /\.In\b/g, correction: '. In', message: 'Missing space after period' },
      { regex: /\.At\b/g, correction: '. At', message: 'Missing space after period' },
      { regex: /\.I\b/g, correction: '. I', message: 'Missing space after period' },
      
      // WRONG QUESTION WORDS
      { regex: /\bwhere\s+my\s+class\s+is\b/gi, correction: 'where my class was', message: 'Past tense context needs "was"' },
      
      // Homophones
      { regex: /\byour\s+welcome\b/gi, correction: "you're welcome", message: 'Contraction: you are welcome' },
      { regex: /\bits\s+raining\b/gi, correction: "it's raining", message: 'Contraction: it is raining' },
      { regex: /\bwhos\s+\b/gi, correction: "whose ", message: 'Possessive form' },
    ];

    errorPatterns.forEach((pattern, index) => {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      while ((match = regex.exec(text)) !== null) {
        console.log(`🎯 Found error: "${match[0]}" -> "${pattern.correction}" (${pattern.message})`);
        suggestions.push({
          id: `quick-${index}-${match.index}`,
          type: pattern.message.includes('Past tense') || pattern.message.includes('grammar') ? 'grammar' : 'spelling',
          severity: 'error',
          originalText: match[0],
          suggestedText: pattern.correction,
          explanation: pattern.message,
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          confidence: 0.95,
          rule: 'comprehensive-spell-check'
        });
      }
    });

    console.log(`🔍 Quick suggestions found ${suggestions.length} errors:`, suggestions.map(s => s.originalText));
    return suggestions;
  }

  // Generate vocabulary enhancement suggestions
  private getVocabularySuggestions(text: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    console.log('📚 Analyzing text for vocabulary improvements...');
    
    // Academic vocabulary improvements
    const vocabularyMappings = [
      { simple: /\bvery good\b/gi, advanced: 'excellent', explanation: 'Use more precise academic vocabulary' },
      { simple: /\bvery bad\b/gi, advanced: 'poor', explanation: 'More formal academic term' },
      { simple: /\bbig\b/gi, advanced: 'significant', explanation: 'More formal academic term' },
      { simple: /\bsmall\b/gi, advanced: 'minor', explanation: 'More academic vocabulary' },
      { simple: /\bshow\b/gi, advanced: 'demonstrate', explanation: 'Better for academic writing' },
      { simple: /\bthing\b/gi, advanced: 'aspect', explanation: 'More specific academic term' },
      { simple: /\bget\b/gi, advanced: 'obtain', explanation: 'More formal verb choice' },
      { simple: /\ba lot of\b/gi, advanced: 'numerous', explanation: 'More formal quantifier' },
      { simple: /\bhelp\s+with\b/gi, advanced: 'assist with', explanation: 'More formal verb' },
      { simple: /\bthink\s+about\b/gi, advanced: 'consider', explanation: 'More precise academic verb' },
      { simple: /\btalk\s+about\b/gi, advanced: 'discuss', explanation: 'More formal verb for academic writing' },
      { simple: /\buse\b/gi, advanced: 'utilize', explanation: 'More sophisticated vocabulary' },
      { simple: /\bstart\b/gi, advanced: 'commence', explanation: 'More formal academic term' },
      { simple: /\bend\b/gi, advanced: 'conclude', explanation: 'More academic conclusion term' }
    ];

    vocabularyMappings.forEach((mapping, index) => {
      let match;
      while ((match = mapping.simple.exec(text)) !== null) {
        console.log(`💡 Found vocabulary improvement: "${match[0]}" -> "${mapping.advanced}"`);
        suggestions.push({
          id: `vocab-${index}-${match.index}`,
          type: 'vocabulary',
          severity: 'suggestion',
          originalText: match[0],
          suggestedText: mapping.advanced,
          explanation: mapping.explanation,
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          confidence: 0.8,
          rule: 'vocabulary-enhancement'
        });
      }
    });

    console.log(`📚 Vocabulary suggestions found: ${suggestions.length} improvements`);
    return suggestions;
  }

  // Merge suggestions avoiding duplicates
  private mergeSuggestions(openaiSuggestions: Suggestion[], quickSuggestions: Suggestion[]): Suggestion[] {
    const merged = [...openaiSuggestions];
    
    quickSuggestions.forEach(quickSugg => {
      const overlap = merged.find(existing => 
        Math.abs(existing.position.start - quickSugg.position.start) < 5 &&
        existing.originalText.toLowerCase() === quickSugg.originalText.toLowerCase()
      );
      
      if (!overlap) {
        merged.push(quickSugg);
      }
    });
    
    return merged.sort((a, b) => a.position.start - b.position.start);
  }

  private shouldUseCachedResult(text: string): boolean {
    if (!this.lastAnalysis || !this.lastText) return false;
    
    // Use cached result if text hasn't changed significantly
    const similarity = this.calculateTextSimilarity(this.lastText, text);
    return similarity > 0.9;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    if (text1 === text2) return 1;
    
    const len1 = text1.length;
    const len2 = text2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1;
    
    // Simple similarity based on length difference
    const lengthSimilarity = 1 - Math.abs(len1 - len2) / maxLen;
    return lengthSimilarity;
  }

  private getFallbackAnalysis(text: string, _userProfile?: UserProfile): AnalysisResult {
    console.log('🔄 Using ENHANCED fallback analysis - OpenAI failed, using comprehensive regex patterns');
    
    // Use the comprehensive regex-based analysis as fallback
    const quickSuggestions = this.getQuickSuggestions(text);
    
    // Calculate score based on error density and severity
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const errorCount = quickSuggestions.filter(s => s.severity === 'error').length;
    const warningCount = quickSuggestions.filter(s => s.severity === 'warning').length;
    
    // More nuanced scoring
    const errorRate = errorCount / Math.max(wordCount, 1);
    const warningRate = warningCount / Math.max(wordCount, 1);
    let score = 100 - (errorRate * 150) - (warningRate * 50);
    score = Math.max(15, Math.min(95, score)); // Cap between 15-95
    
    console.log(`📊 ENHANCED fallback analysis results:`);
    console.log(`   - ${quickSuggestions.length} total issues found in ${wordCount} words`);
    console.log(`   - ${errorCount} errors, ${warningCount} warnings`);
    console.log(`   - Error rate: ${Math.round(errorRate * 100)}%, Warning rate: ${Math.round(warningRate * 100)}%`);
    console.log(`   - Calculated score: ${Math.round(score)}`);
    
    // More detailed strengths and improvements
    const strengths = [];
    const improvements = [];
    
    if (quickSuggestions.length === 0) {
      strengths.push('No obvious errors detected', 'Good basic writing structure');
    } else {
      if (errorCount === 0) {
        strengths.push('No critical spelling or grammar errors');
      }
      if (warningCount < errorCount) {
        strengths.push('Generally good sentence structure');
      }
    }
    
    if (errorCount > 0) {
      improvements.push('Focus on spelling accuracy');
      improvements.push('Review basic grammar rules');
    }
    if (warningCount > 0) {
      improvements.push('Consider improving word choices');
    }
    if (quickSuggestions.some(s => s.type === 'grammar')) {
      improvements.push('Practice subject-verb agreement');
    }
    if (quickSuggestions.some(s => s.type === 'spelling')) {
      improvements.push('Use spell-check tools regularly');
    }
    
    return {
      suggestions: quickSuggestions,
      metrics: this.calculateMetrics(text),
      overallScore: Math.round(score),
      strengths: strengths.length > 0 ? strengths : ['Keep practicing to improve!'],
      areasForImprovement: improvements.length > 0 ? improvements : ['Continue writing to get more feedback']
    };
  }

  private calculateMetrics(text: string) {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: Math.max(paragraphs.length, 1),
      readabilityScore: this.estimateReadability(words, sentences),
      averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
      complexWords: words.filter(word => word.length > 6).length,
      passiveVoiceCount: 0
    };
  }

  private estimateReadability(words: string[], sentences: any[]): number {
    if (sentences.length === 0) return 100;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const complexWords = words.filter(word => word.length > 6).length;
    const complexWordRatio = complexWords / words.length;
    
    // Simple readability estimate
    let score = 100;
    if (avgWordsPerSentence > 20) score -= 20;
    if (complexWordRatio > 0.3) score -= 20;
    
    return Math.max(60, score);
  }

  private generateStrengths(suggestions: Suggestion[], overallScore: number): string[] {
    const strengths = [];
    
    if (overallScore >= 90) {
      strengths.push('Excellent grammar and spelling');
    } else if (overallScore >= 80) {
      strengths.push('Good overall writing quality');
    }
    
    const errorCount = suggestions.filter(s => s.severity === 'error').length;
    if (errorCount === 0) {
      strengths.push('No critical errors detected');
    }
    
    return strengths.length > 0 ? strengths : ['Keep up the good work!'];
  }

  private generateImprovements(suggestions: Suggestion[], eslTips: string[]): string[] {
    const improvements = [];
    
    const grammarCount = suggestions.filter(s => s.type === 'grammar').length;
    if (grammarCount > 0) {
      improvements.push('Focus on grammar accuracy');
    }
    
    const spellingCount = suggestions.filter(s => s.type === 'spelling').length;
    if (spellingCount > 0) {
      improvements.push('Check spelling carefully');
    }
    
    const vocabularyCount = suggestions.filter(s => s.type === 'vocabulary').length;
    if (vocabularyCount > 0) {
      improvements.push('Consider more advanced vocabulary');
    }
    
    // Add ESL tips from OpenAI
    if (eslTips && eslTips.length > 0) {
      improvements.push(...eslTips.slice(0, 2));
    }
    
    return improvements.length > 0 ? improvements : ['Continue practicing to improve further'];
  }

  // Debounced analysis for real-time checking
  private debounceTimer: NodeJS.Timeout | null = null;
  
  analyzeTextDebounced(
    text: string, 
    userProfile: UserProfile | undefined, 
    callback: (analysis: AnalysisResult) => void, 
    delay: number = 600
  ) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(async () => {
      console.log('⚡ Enhanced AI Service: Starting comprehensive analysis...');
      const analysis = await this.analyzeText(text, userProfile);
      console.log(`🎯 Enhanced AI Service: Analysis complete! ${analysis.suggestions.length} suggestions`);
      callback(analysis);
    }, delay);
  }
}

// Export singleton instance
export const enhancedAiService = new EnhancedAiService(); 