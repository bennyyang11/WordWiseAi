import type { AnalysisResult, Suggestion, UserProfile } from '../types';

// Mock AI service - will be replaced with real OpenAI integration
export async function analyzeText(
  text: string,
  userProfile?: UserProfile
): Promise<AnalysisResult> {
  console.log('🔍 Analyzing text:', text.substring(0, 100) + '...');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const suggestions: Suggestion[] = [];
  
  // Mock grammar suggestions
  const grammarIssues = findGrammarIssues(text);
  console.log('📝 Grammar issues found:', grammarIssues.length);
  suggestions.push(...grammarIssues);
  
  // Mock vocabulary suggestions
  if (userProfile) {
    const vocabularyIssues = findVocabularyIssues(text, userProfile);
    console.log('📚 Vocabulary issues found:', vocabularyIssues.length);
    suggestions.push(...vocabularyIssues);
    
    // Mock style suggestions
    const styleIssues = findStyleIssues(text, userProfile);
    console.log('✨ Style issues found:', styleIssues.length);
    suggestions.push(...styleIssues);
  }

  // Add some general suggestions for demo purposes
  if (text.length > 50) {
    // Find the first word to demonstrate suggestions
    const firstWordMatch = text.match(/\b\w+\b/);
    if (firstWordMatch && firstWordMatch.index !== undefined) {
      suggestions.push({
        id: `demo-${suggestions.length}`,
        type: 'vocabulary',
        severity: 'suggestion',
        originalText: firstWordMatch[0],
        suggestedText: firstWordMatch[0] + ' (enhanced)',
        explanation: 'Consider using more sophisticated vocabulary',
        position: {
          start: firstWordMatch.index,
          end: firstWordMatch.index + firstWordMatch[0].length
        },
        confidence: 0.5
      });
    }
  }

  console.log('✅ Total suggestions generated:', suggestions.length);
  
  return {
    suggestions,
    metrics: calculateMetrics(text),
    overallScore: 85,
    strengths: ['Good paragraph structure', 'Clear thesis statement'],
    areasForImprovement: ['Use more varied vocabulary', 'Check subject-verb agreement']
  };
}

function findGrammarIssues(text: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Common ESL grammar patterns - More comprehensive
  const patterns = [
    {
      regex: /\b(a|an)\s+(unique|universal|university|European|honest|hour)\b/gi,
      type: 'grammar' as const,
      message: 'Use "a" before consonant sounds, "an" before vowel sounds',
      replacement: (match: string) => {
        if (match.toLowerCase().includes('an unique') || match.toLowerCase().includes('an university') || match.toLowerCase().includes('an European')) {
          return match.replace(/an\s+/gi, 'a ');
        }
        if (match.toLowerCase().includes('a honest') || match.toLowerCase().includes('a hour')) {
          return match.replace(/a\s+/gi, 'an ');
        }
        return match;
      }
    },
    {
      regex: /\bmore\s+better\b/gi,
      type: 'grammar' as const,
      message: 'Use either "more" or "better", not both',
      replacement: () => 'better'
    },
    {
      regex: /\b(go|went|come|came)\s+(to\s+)?home\b/gi,
      type: 'grammar' as const,
      message: 'Use "go home" not "go to home"',
      replacement: (match: string) => match.replace(/\s+to\s+home/gi, ' home')
    },
    {
      regex: /\bmake\s+(homework|research|mistake)\b/gi,
      type: 'grammar' as const,
      message: 'Use "do homework/research" or "make a mistake"',
      replacement: (match: string) => {
        if (match.toLowerCase().includes('homework') || match.toLowerCase().includes('research')) {
          return match.replace(/make/gi, 'do');
        }
        return match.replace(/make\s+mistake/gi, 'make a mistake');
      }
    },
    {
      regex: /\b(peoples|informations|knowledges|advices)\b/gi,
      type: 'grammar' as const,
      message: 'These are uncountable nouns - use singular form',
      replacement: (match: string) => match.replace(/s$/i, '')
    },
    // Capitalization after periods - only match first letter of words
    {
      regex: /([.!?]\s+)\b([a-z])/g,
      type: 'grammar' as const,
      message: 'First letter after period must be capitalized',
      replacement: (match: string) => {
        const parts = match.match(/([.!?]\s+)\b([a-z])/);
        if (parts) {
          return parts[1] + parts[2].toUpperCase();
        }
        return match;
      }
    },
    // Capitalization at start of text - only match first letter of words
    {
      regex: /^(\s*)\b([a-z])/,
      type: 'grammar' as const,
      message: 'First letter of text must be capitalized',
      replacement: (match: string) => {
        const parts = match.match(/^(\s*)\b([a-z])/);
        if (parts) {
          return (parts[1] || '') + parts[2].toUpperCase();
        }
        return match;
      }
    }
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      suggestions.push({
        id: `grammar-${suggestions.length}`,
        type: pattern.type,
        severity: 'error',
        originalText: match[0],
        suggestedText: pattern.replacement(match[0]),
        explanation: pattern.message,
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        confidence: 0.9,
        rule: 'grammar-check'
      });
    }
  });

  return suggestions;
}

function findVocabularyIssues(text: string, _userProfile: UserProfile): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Academic vocabulary improvements for ESL students - More comprehensive
  const vocabularyMappings = [
    { simple: /\bvery good\b/gi, advanced: 'excellent', explanation: 'Use more precise academic vocabulary' },
    { simple: /\bvery bad\b/gi, advanced: 'poor', explanation: 'More formal academic term' },
    { simple: /\bbig\b/gi, advanced: 'significant', explanation: 'More formal academic term' },
    { simple: /\bsmall\b/gi, advanced: 'minor', explanation: 'More academic vocabulary' },
    { simple: /\bshow\b/gi, advanced: 'demonstrate', explanation: 'Better for academic writing' },
    { simple: /\bthing\b/gi, advanced: 'aspect', explanation: 'More specific academic term' },
    { simple: /\bget\b/gi, advanced: 'obtain', explanation: 'More formal verb choice' },
    { simple: /\bmake\s+sure\b/gi, advanced: 'ensure', explanation: 'More concise academic language' },
    { simple: /\ba lot of\b/gi, advanced: 'numerous', explanation: 'More formal quantifier' },
    { simple: /\bhelp\s+with\b/gi, advanced: 'assist with', explanation: 'More formal verb' },
    { simple: /\bthink\s+about\b/gi, advanced: 'consider', explanation: 'More precise academic verb' },
    { simple: /\btalk\s+about\b/gi, advanced: 'discuss', explanation: 'More formal verb for academic writing' },
    { simple: /\buse\b/gi, advanced: 'utilize', explanation: 'More sophisticated vocabulary' },
    { simple: /\bstart\b/gi, advanced: 'commence', explanation: 'More formal academic term' },
    { simple: /\bend\b/gi, advanced: 'conclude', explanation: 'More academic conclusion term' }
  ];

  vocabularyMappings.forEach(mapping => {
    let match;
    while ((match = mapping.simple.exec(text)) !== null) {
      suggestions.push({
        id: `vocab-${suggestions.length}`,
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
        examples: [`"${match[0]}" → "${mapping.advanced}"`]
      });
    }
  });

  return suggestions;
}

function findStyleIssues(text: string, userProfile: UserProfile): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Style improvements for academic writing
  if (userProfile.writingGoals.formalityLevel === 'formal') {
    const informalPatterns = [
      { regex: /\bcan't\b/gi, formal: 'cannot', explanation: 'Use full forms in formal writing' },
      { regex: /\bdon't\b/gi, formal: 'do not', explanation: 'Use full forms in formal writing' },
      { regex: /\bwon't\b/gi, formal: 'will not', explanation: 'Use full forms in formal writing' },
      { regex: /\bisn't\b/gi, formal: 'is not', explanation: 'Use full forms in formal writing' },
      { regex: /\baren't\b/gi, formal: 'are not', explanation: 'Use full forms in formal writing' },
      { regex: /\bwasn't\b/gi, formal: 'was not', explanation: 'Use full forms in formal writing' },
      { regex: /\bweren't\b/gi, formal: 'were not', explanation: 'Use full forms in formal writing' },
      { regex: /\bit's\b/gi, formal: 'it is', explanation: 'Use full forms in formal writing' },
      { regex: /\bthat's\b/gi, formal: 'that is', explanation: 'Use full forms in formal writing' },
      { regex: /\bwhat's\b/gi, formal: 'what is', explanation: 'Use full forms in formal writing' },
      { regex: /\bI'm\b/gi, formal: 'I am', explanation: 'Use full forms in formal writing' },
      { regex: /\byou're\b/gi, formal: 'you are', explanation: 'Use full forms in formal writing' },
      { regex: /\bwe're\b/gi, formal: 'we are', explanation: 'Use full forms in formal writing' },
      { regex: /\bthey're\b/gi, formal: 'they are', explanation: 'Use full forms in formal writing' }
    ];

    informalPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        suggestions.push({
          id: `style-${suggestions.length}`,
          type: 'style',
          severity: 'warning',
          originalText: match[0],
          suggestedText: pattern.formal,
          explanation: pattern.explanation,
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          confidence: 0.7
        });
      }
    });
  }

  // General clarity suggestions
  const clarityPatterns = [
    { regex: /\bIn my opinion,?\s*/gi, better: '', explanation: 'Remove redundant phrase - your opinion is implied' },
    { regex: /\bI think that\s*/gi, better: 'I believe ', explanation: 'More confident academic language' },
    { regex: /\bkind of\b/gi, better: 'somewhat', explanation: 'More precise academic language' },
    { regex: /\bsort of\b/gi, better: 'somewhat', explanation: 'More precise academic language' }
  ];

  clarityPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      suggestions.push({
        id: `clarity-${suggestions.length}`,
        type: 'clarity',
        severity: 'suggestion',
        originalText: match[0],
        suggestedText: pattern.better,
        explanation: pattern.explanation,
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        confidence: 0.6
      });
    }
  });

  return suggestions;
}

function calculateMetrics(text: string) {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    readabilityScore: 75, // Mock score
    averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
    complexWords: words.filter(word => word.length > 6).length,
    passiveVoiceCount: 0 // Mock count
  };
}

