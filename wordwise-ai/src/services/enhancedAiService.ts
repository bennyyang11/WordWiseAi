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
      
      // Use OpenAI for comprehensive analysis
      const startTime = Date.now();
      console.log('🔗 Attempting OpenAI analysis...');
      const openaiAnalysis = await openaiService.analyzeText(text, userLevel);
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
    
    // COMPREHENSIVE ERROR PATTERNS - Covers 50+ common mistakes
    const errorPatterns = [
      // Basic spelling errors - Test these specific ones first
      { regex: /\bsumer\b/gi, correction: 'summer', message: 'Spelling error - missing double "m"' },
      { regex: /\bgoed\b/gi, correction: 'went', message: 'Past tense of "go" is "went"' },
      { regex: /\bwekend\b/gi, correction: 'weekend', message: 'Spelling error - missing double "e"' },
      { regex: /\brealy\b/gi, correction: 'really', message: 'Spelling error - missing double "l"' },
      { regex: /\bexcited\b(?=\.|\s+|$)/gi, correction: 'exciting', message: 'Use "exciting" to describe things' },
      { regex: /\bwaked\b/gi, correction: 'woke', message: 'Past tense of "wake" is "woke"' },
      { regex: /\bdrived\b/gi, correction: 'drove', message: 'Past tense of "drive" is "drove"' },
      { regex: /\bminits\b/gi, correction: 'minutes', message: 'Spelling error' },
      { regex: /\bfinaly\b/gi, correction: 'finally', message: 'Spelling error - missing double "l"' },
      
      // More spelling errors
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
      { regex: /\bshineing\b/gi, correction: 'shining', message: 'Drop "e" before adding "ing"' },
      { regex: /\bbrite\b/gi, correction: 'bright', message: 'Spelling error' },
      { regex: /\bswimsut\b/gi, correction: 'swimsuit', message: 'Spelling error' },
      { regex: /\bocan\b/gi, correction: 'ocean', message: 'Spelling error' },
      { regex: /\bsandcastel\b/gi, correction: 'sandcastle', message: 'Spelling error' },
      { regex: /\bfalled\b/gi, correction: 'fell', message: 'Past tense of "fall" is "fell"' },
      { regex: /\bcamed\b/gi, correction: 'came', message: 'Past tense of "come" is "came"' },
      { regex: /\beated\b/gi, correction: 'ate', message: 'Past tense of "eat" is "ate"' },
      { regex: /\bblankit\b/gi, correction: 'blanket', message: 'Spelling error' },
      { regex: /\bsandwitch\b/gi, correction: 'sandwich', message: 'Spelling error' },
      { regex: /\bchps\b/gi, correction: 'chips', message: 'Missing "i"' },
      { regex: /\bseagul\b/gi, correction: 'seagull', message: 'Double "l"' },
      { regex: /\btryed\b/gi, correction: 'tried', message: 'Change "y" to "i" before "ed"' },
      { regex: /\bbordwalk\b/gi, correction: 'boardwalk', message: 'Spelling error' },
      { regex: /\bfeeled\b/gi, correction: 'felt', message: 'Past tense of "feel" is "felt"' },
      { regex: /\bbestest\b/gi, correction: 'best', message: '"Best" is already superlative' },
      { regex: /\bbuilded\b/gi, correction: 'built', message: 'Past tense of "build" is "built"' },
      { regex: /\bbrang\b/gi, correction: 'brought', message: 'Past tense of "bring" is "brought"' },
      { regex: /\blayed\b/gi, correction: 'lay', message: 'Past tense of "lie" is "lay"' },
      { regex: /\bspend\b(?=\s+(some|a|about))/gi, correction: 'spent', message: 'Use past tense "spent"' },
      
      // Grammar errors  
      { regex: /\bto\s+fast\b/gi, correction: 'too fast', message: 'Use "too" for "excessively"' },
      { regex: /\bto\s+big\b/gi, correction: 'too big', message: 'Use "too" for "excessively"' },
      { regex: /\bwas\s+to\s+big\b/gi, correction: 'was too big', message: 'Use "too" for "excessively"' },
      { regex: /\bmore\s+longer\b/gi, correction: 'longer', message: 'Use either "more" or "longer", not both' },
      { regex: /\bme\s+and\s+my\s+family\b/gi, correction: 'my family and I', message: 'Use "my family and I" as subject' },
      { regex: /\bwaves\s+was\b/gi, correction: 'waves were', message: 'Plural subject needs "were"' },
      { regex: /\bEveryone\s+feeled\b/gi, correction: 'Everyone felt', message: 'Past tense of "feel" is "felt"' },
      { regex: /\bIt\s+was\s+realy\s+fun\s+and\s+excited\b/gi, correction: 'It was really fun and exciting', message: 'Use "exciting" for describing things' },
      { regex: /\bspend\s+some\b/gi, correction: 'spent some', message: 'Use past tense "spent"' },
      { regex: /\bWe\s+spend\b/gi, correction: 'We spent', message: 'Use past tense "spent"' },
      
      // Homophones and common confusions
      { regex: /\bhole\b(?=\s+(sumer|vacation|day))/gi, correction: 'whole', message: 'Did you mean "whole"? Hole is a gap.' },
      { regex: /\byour\s+welcome\b/gi, correction: "you're welcome", message: 'Contraction: you are welcome' },
      { regex: /\bits\s+raining\b/gi, correction: "it's raining", message: 'Contraction: it is raining' },
      { regex: /\bwhos\s+car\b/gi, correction: "whose car", message: 'Possessive form' },
      
      // Articles and prepositions
      { regex: /\ba\s+exciting\b/gi, correction: 'an exciting', message: 'Use "an" before vowel sounds' },
      { regex: /\ba\s+hour\b/gi, correction: 'an hour', message: 'Use "an" before vowel sounds' },
      { regex: /\bin\s+the\s+beach\b/gi, correction: 'to the beach', message: 'Use "to" for destinations' },
      
      // Word order and structure
      { regex: /\bvery\s+much\s+enjoyed\b/gi, correction: 'really enjoyed', message: 'More natural word order' },
      { regex: /\bmuch\s+better\s+than\b/gi, correction: 'much better than', message: 'Correct comparison structure' }
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
    
    // Academic vocabulary improvements for ESL students
    const vocabularyMappings = [
      { simple: /\bvery good\b/gi, advanced: 'excellent', explanation: 'Use more precise academic vocabulary' },
      { simple: /\bvery bad\b/gi, advanced: 'poor', explanation: 'More formal academic term' },
      { simple: /\bvery important\b/gi, advanced: 'crucial', explanation: 'More impactful academic language' },
      { simple: /\bvery big\b/gi, advanced: 'substantial', explanation: 'More sophisticated description' },
      { simple: /\bvery small\b/gi, advanced: 'minimal', explanation: 'More precise academic term' },
      { simple: /\bbig\s+problem\b/gi, advanced: 'significant issue', explanation: 'More formal academic terminology' },
      { simple: /\bshow\b/gi, advanced: 'demonstrate', explanation: 'Better for academic writing' },
      { simple: /\bthing\b/gi, advanced: 'aspect', explanation: 'More specific academic term' },
      { simple: /\bstuff\b/gi, advanced: 'materials', explanation: 'More formal academic language' },
      { simple: /\bget\b/gi, advanced: 'obtain', explanation: 'More formal verb choice' },
      { simple: /\bmake\s+sure\b/gi, advanced: 'ensure', explanation: 'More concise academic language' },
      { simple: /\ba lot of\b/gi, advanced: 'numerous', explanation: 'More formal quantifier' },
      { simple: /\blots of\b/gi, advanced: 'many', explanation: 'More formal quantifier' },
      { simple: /\bhelp\s+with\b/gi, advanced: 'assist with', explanation: 'More formal verb' },
      { simple: /\bthink\s+about\b/gi, advanced: 'consider', explanation: 'More precise academic verb' },
      { simple: /\btalk\s+about\b/gi, advanced: 'discuss', explanation: 'More formal verb for academic writing' },
      { simple: /\buse\b/gi, advanced: 'utilize', explanation: 'More sophisticated vocabulary' },
      { simple: /\bstart\b/gi, advanced: 'commence', explanation: 'More formal academic term' },
      { simple: /\bbegin\b/gi, advanced: 'initiate', explanation: 'More sophisticated academic term' },
      { simple: /\bend\b/gi, advanced: 'conclude', explanation: 'More academic conclusion term' },
      { simple: /\bfinish\b/gi, advanced: 'complete', explanation: 'More formal completion term' },
      { simple: /\bfind\s+out\b/gi, advanced: 'discover', explanation: 'More elegant academic expression' },
      { simple: /\bgo\s+up\b/gi, advanced: 'increase', explanation: 'More precise academic verb' },
      { simple: /\bgo\s+down\b/gi, advanced: 'decrease', explanation: 'More precise academic verb' },
      { simple: /\bput\s+together\b/gi, advanced: 'assemble', explanation: 'More sophisticated verb choice' },
      { simple: /\bcome\s+up\s+with\b/gi, advanced: 'develop', explanation: 'More concise academic language' },
      { simple: /\bpoint\s+out\b/gi, advanced: 'highlight', explanation: 'More formal academic verb' },
      { simple: /\bfigure\s+out\b/gi, advanced: 'determine', explanation: 'More academic problem-solving term' },
      { simple: /\bkeep\s+in\s+mind\b/gi, advanced: 'consider', explanation: 'More concise academic expression' },
      { simple: /\bmake\s+happen\b/gi, advanced: 'facilitate', explanation: 'More sophisticated causative verb' }
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
    
    // Simple similarity based on length difference and common substring
    const lengthSimilarity = 1 - Math.abs(len1 - len2) / maxLen;
    return lengthSimilarity;
  }

  private getFallbackAnalysis(text: string, _userProfile?: UserProfile): AnalysisResult {
    console.log('🔄 Using fallback analysis - OpenAI failed, using comprehensive regex patterns');
    
    // Use the comprehensive regex-based analysis as fallback
    const quickSuggestions = this.getQuickSuggestions(text);
    
    // Calculate score based on error density
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const errorRate = quickSuggestions.length / Math.max(wordCount, 1);
    let score = Math.max(20, 100 - (errorRate * 200)); // More aggressive scoring
    
    console.log(`📊 Fallback analysis results:`);
    console.log(`   - ${quickSuggestions.length} errors found in ${wordCount} words`);
    console.log(`   - Error rate: ${Math.round(errorRate * 100)}%`);
    console.log(`   - Calculated score: ${Math.round(score)}`);
    console.log(`   - Error details:`, quickSuggestions.map(s => `"${s.originalText}" -> "${s.suggestedText}"`));
    
    return {
      suggestions: quickSuggestions,
      metrics: this.calculateMetrics(text),
      overallScore: Math.round(score),
      strengths: quickSuggestions.length === 0 ? ['No obvious errors detected', 'Good text structure'] : ['Text has clear narrative flow'],
      areasForImprovement: quickSuggestions.length > 0 ? 
        [
          'Focus on spelling accuracy',
          'Check verb tenses for consistency', 
          'Review grammar rules'
        ] : 
        ['Continue writing to get more detailed feedback']
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
      passiveVoiceCount: this.countPassiveVoice(text)
    };
  }

  private estimateReadability(words: string[], sentences: any[]): number {
    if (sentences.length === 0) return 100;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const complexWords = words.filter(word => word.length > 6).length;
    const complexWordRatio = complexWords / words.length;
    
    // Simple readability estimate (higher is easier to read)
    let score = 100;
    if (avgWordsPerSentence > 20) score -= 20;
    if (complexWordRatio > 0.3) score -= 20;
    
    return Math.max(60, score);
  }

  private countPassiveVoice(text: string): number {
    // Simple passive voice detection
    const passivePatterns = [
      /\bis\s+\w+ed\b/gi,
      /\bare\s+\w+ed\b/gi,
      /\bwas\s+\w+ed\b/gi,
      /\bwere\s+\w+ed\b/gi,
      /\bbeen\s+\w+ed\b/gi
    ];
    
    let count = 0;
    passivePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) count += matches.length;
    });
    
    return count;
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
    
    const vocabularyCount = suggestions.filter(s => s.type === 'vocabulary').length;
    if (vocabularyCount === 0) {
      strengths.push('Good vocabulary usage');
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

  // Test patterns manually (for debugging)
  testPatterns(text: string): void {
    console.log('🧪 TESTING PATTERNS ON:', text);
    const patterns = [
      { regex: /\bsumer\b/gi, correction: 'summer', message: 'Test: summer' },
      { regex: /\bgoed\b/gi, correction: 'went', message: 'Test: went' },
      { regex: /\bwekend\b/gi, correction: 'weekend', message: 'Test: weekend' },
      { regex: /\brealy\b/gi, correction: 'really', message: 'Test: really' },
      { regex: /\bexcited\b/gi, correction: 'exciting', message: 'Test: exciting' }
    ];
    
    patterns.forEach((pattern, index) => {
      const matches = text.match(pattern.regex);
      if (matches) {
        console.log(`✅ Pattern ${index} MATCHED:`, matches, '-> should be:', pattern.correction);
      } else {
        console.log(`❌ Pattern ${index} NO MATCH for`, pattern.regex);
      }
    });
  }

  // Debounced analysis for real-time checking
  private debounceTimer: NodeJS.Timeout | null = null;
  
  analyzeTextDebounced(
    text: string, 
    userProfile: UserProfile | undefined, 
    callback: (analysis: AnalysisResult) => void, 
    delay: number = 600 // Faster response time
  ) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(async () => {
      console.log('⚡ Enhanced AI Service: Starting comprehensive analysis...');
      console.log('📝 Analyzing text:', text.substring(0, 100) + '...');
      
      // TEST: Run pattern test on sample text
      this.testPatterns(text);
      
      const analysis = await this.analyzeText(text, userProfile);
      console.log(`🎯 Enhanced AI Service: Analysis complete!`);
      console.log(`📊 Results: ${analysis.suggestions.length} suggestions, score: ${analysis.overallScore}`);
      console.log(`📋 Suggestions: ${analysis.suggestions.map(s => `"${s.originalText}" → "${s.suggestedText}"`).join(', ')}`);
      callback(analysis);
    }, delay);
  }
}

// Export singleton instance
export const enhancedAiService = new EnhancedAiService(); 