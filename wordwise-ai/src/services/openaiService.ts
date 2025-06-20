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
      return this.getMockAnalysis(text, nativeLanguage);
    }

    try {
      const prompt = this.createOptimizedPrompt(text, userLevel, nativeLanguage);
      
      console.log('🚀 Sending request to OpenAI...');
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
          setTimeout(() => reject(new Error('OpenAI timeout')), 20000)
        )
      ]) as any;

      const analysis = this.parseOpenAIResponse(response.choices[0].message.content || '', text);
      
      // Cache the result
      this.cache.set(cacheKey, { analysis, timestamp: Date.now() });
      
      console.log('✅ OpenAI analysis complete:', analysis.grammarSuggestions.length, 'suggestions');
      return analysis;
    } catch (error) {
      console.error('❌ OpenAI API Error:', error);
      // Fallback to mock data if API fails
      return this.getMockAnalysis(text, nativeLanguage);
    }
  }

  private createSystemPrompt(nativeLanguage?: string): string {
    const basePrompt = `You are an expert English teacher with perfect spelling, grammar, and vocabulary enhancement skills. You use a three-stage analysis approach:

🔍 STAGE 1 - WORD-BY-WORD SPELLING ANALYSIS:
Check every single word individually for spelling errors. Look for:
• Misspelled words: vacashun→vacation, bech→beach, famly→family, thingz→things
• Wrong word forms: hourz→hours, snackz→snacks, musick→music
• Phonetic errors: their→there, wether→weather, suny→sunny
• Missing letters: finaly→finally, listend→listened, delishus→delicious
• Common mistakes: alot→a lot, recieve→receive, seperate→separate

📝 STAGE 2 - SENTENCE-BY-SENTENCE GRAMMAR ANALYSIS:
Analyze from period to period (complete sentences) for grammar in context:
• Verb tense consistency: "Yesterday I go" → "Yesterday I went"
• Irregular past tense: "drived"→"drove", "tooked"→"took", "runned"→"ran", "builed"→"built"
• Subject-verb agreement: "We was"→"We were", "he don't"→"he doesn't"
• Past tense context: Look at sentence timeline to determine correct tense

📚 STAGE 3 - INTELLIGENT VOCABULARY ENHANCEMENT:
Analyze vocabulary sophistication and suggest improvements based on context:
• Simple → Academic: "very good"→"excellent", "a lot of"→"numerous", "big"→"significant"
• Repetitive words: Suggest synonyms for overused terms
• Context-appropriate upgrades: Formal language for essays, professional tone for emails
• ESL-friendly suggestions: Not overly complex, but more sophisticated than current level
• Word choice precision: "thing"→"aspect", "stuff"→"materials", "get"→"obtain"

🎯 CONTEXT-AWARE VOCABULARY RULES:
• ESSAYS: Academic vocabulary, sophisticated transitions, formal language
• EMAILS: Professional terminology, courteous phrases, business-appropriate language  
• GENERAL: Clear, precise word choices that enhance meaning without being pretentious

🎯 ANALYSIS PROTOCOL:
1. Split text into individual words - check each for spelling
2. Split text into sentences (period to period) - analyze grammar in context
3. Analyze vocabulary sophistication - suggest context-appropriate improvements
4. For each sentence, determine the intended timeframe (past/present/future)
5. Check if all verbs in that sentence match the timeframe
6. Look for irregular verb patterns that students commonly get wrong
7. Identify vocabulary upgrade opportunities without overwhelming the student

🚨 CRITICAL: Be thorough but precise. Don't create false positives. Vocabulary suggestions should be helpful, not excessive.`;
    
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

    return `🎯 MISSION: Analyze this ${userLevel} ESL student text using our three-stage approach. Be precise and thorough.

📊 RETURN FORMAT: JSON ONLY, NO EXPLANATIONS OUTSIDE JSON:

{
  "grammarSuggestions": [
    {
      "type": "spelling|grammar|punctuation|vocabulary",
      "severity": "error|warning|suggestion", 
      "message": "Specific error description${bilingualInstruction ? ' in BOTH English and ' + nativeLanguage : ''}",
      "suggestion": "Exact correct word/phrase",
      "originalText": "Wrong text from document",
      "startIndex": 0,
      "endIndex": 5
    }
  ],
  "overallScore": 25,
  "readabilityScore": 40,
  "eslTips": ["Specific ESL tip${bilingualInstruction ? ' in both languages' : ''}"]
}${bilingualInstruction}

🔍 THREE-STAGE ANALYSIS PROTOCOL:

📝 STAGE 1 - WORD-BY-WORD SPELLING CHECK:
Go through every single word individually. Common ESL spelling errors to catch:
• Phonetic misspellings: bech→beach, wether→weather, nite→night
• Letter substitutions: thingz→things, hourz→hours, snackz→snacks
• Missing letters: famly→family, finaly→finally, brothar→brother
• Wrong endings: vacashun→vacation, restrant→restaurant, delishus→delicious
• Doubled letters: toook→took, hott→hot, suny→sunny

⚖️ STAGE 2 - SENTENCE-BY-SENTENCE GRAMMAR:
Analyze each sentence (period to period) for context:
• Determine sentence timeframe: past/present/future
• Check verb tense consistency within each sentence
• Common ESL grammar errors:
  - Irregular past tense: drived→drove, tooked→took, runned→ran, builed→built, felled→fell
  - Subject-verb agreement: "We was"→"We were" 
  - Wrong comparative forms: "funner"→"more fun"
  - Tense mixing: "Yesterday I go"→"Yesterday I went"

📚 STAGE 3 - GPT-4O VOCABULARY ENHANCEMENT:
Analyze vocabulary sophistication and suggest context-appropriate improvements:
• Academic upgrades for essays: "very good"→"excellent", "a lot of"→"numerous", "big problem"→"significant issue"
• Professional language for emails: "get"→"obtain", "help with"→"assist with", "talk about"→"discuss"
• Precision improvements: "thing"→"aspect", "stuff"→"materials", "make sure"→"ensure"
• Transition enhancements: "also"→"furthermore", "but"→"however", "so"→"therefore"
• Synonym suggestions for repetitive words
• Context-appropriate formality level

🎯 VOCABULARY GUIDELINES BY WRITING TYPE:
• ESSAYS: Academic vocabulary, sophisticated transitions, formal register
• EMAILS: Professional terminology, courteous language, business-appropriate tone
• LETTERS: Formal expressions, respectful language, proper conventions
• REPORTS: Technical precision, objective language, clear terminology

🎯 EXAMPLE ANALYSIS for "This summer I drived to the bech with my famly. It was very good.":
SPELLING: "drived"(grammar-drove), "bech"(spelling-beach), "famly"(spelling-family) 
GRAMMAR: Past tense context - "This summer" indicates past, so "drived" should be "drove"
VOCABULARY: "very good"(vocabulary-excellent) - suggest more sophisticated descriptor

📝 TEXT TO ANALYZE:
"${text}"

Apply all three stages systematically. Find every spelling error word-by-word, then analyze grammar sentence-by-sentence, then enhance vocabulary with context-appropriate suggestions.`;
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

  private getMockAnalysis(text: string, nativeLanguage?: string): WritingAnalysis {
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const suggestions: GrammarSuggestion[] = [];

    // Helper function to create bilingual messages
    const createBilingualMessage = (englishMsg: string, nativeMsg?: string): string => {
      if (nativeLanguage && nativeLanguage.toLowerCase() !== 'english' && nativeMsg) {
        return `${englishMsg} | ${nativeMsg}`;
      }
      return englishMsg;
    };

    // Simple mock suggestions based on common patterns with bilingual support
    if (text.toLowerCase().includes('alot')) {
      const nativeMsg = nativeLanguage?.toLowerCase() === 'spanish' ? 'Ortografía incorrecta - son dos palabras separadas' :
                       nativeLanguage?.toLowerCase() === 'chinese' ? '拼写错误 - 应该是两个单独的词' :
                       nativeLanguage?.toLowerCase() === 'french' ? 'Orthographe incorrecte - ce sont deux mots séparés' : undefined;
      
      suggestions.push({
        type: 'spelling',
        severity: 'error',
        message: createBilingualMessage('Incorrect spelling - should be two separate words', nativeMsg),
        suggestion: 'a lot',
        startIndex: text.toLowerCase().indexOf('alot'),
        endIndex: text.toLowerCase().indexOf('alot') + 4,
        originalText: 'alot'
      });
    }

    if (text.includes('there is many') || text.includes('there are much')) {
      const index = text.indexOf('there is many') !== -1 ? text.indexOf('there is many') : text.indexOf('there are much');
      const nativeMsg = nativeLanguage?.toLowerCase() === 'spanish' ? 'Error de concordancia sujeto-verbo' :
                       nativeLanguage?.toLowerCase() === 'chinese' ? '主谓一致错误' :
                       nativeLanguage?.toLowerCase() === 'french' ? 'Erreur d\'accord sujet-verbe' : undefined;
      
      suggestions.push({
        type: 'grammar',
        severity: 'error',
        message: createBilingualMessage('Subject-verb agreement error', nativeMsg),
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
        englishMsg: 'Consider using more precise academic vocabulary',
        nativeMessages: {
          spanish: 'Considera usar vocabulario académico más preciso',
          chinese: '考虑使用更精确的学术词汇',
          french: 'Considérez utiliser un vocabulaire académique plus précis'
        }
      },
      { 
        pattern: /\bvery bad\b/gi, 
        suggestion: 'poor', 
        englishMsg: 'Consider using more formal academic language',
        nativeMessages: {
          spanish: 'Considera usar un lenguaje académico más formal',
          chinese: '考虑使用更正式的学术语言',
          french: 'Considérez utiliser un langage académique plus formel'
        }
      },
      { 
        pattern: /\ba lot of\b/gi, 
        suggestion: 'numerous', 
        englishMsg: 'Consider using more formal quantifiers',
        nativeMessages: {
          spanish: 'Considera usar cuantificadores más formales',
          chinese: '考虑使用更正式的量词',
          french: 'Considérez utiliser des quantificateurs plus formels'
        }
      }
    ];

    vocabularyPatterns.forEach(vocab => {
      let match;
      while ((match = vocab.pattern.exec(text)) !== null) {
        const nativeMsg = nativeLanguage ? vocab.nativeMessages[nativeLanguage.toLowerCase() as keyof typeof vocab.nativeMessages] : undefined;
        
        suggestions.push({
          type: 'vocabulary',
          severity: 'suggestion',
          message: createBilingualMessage(vocab.englishMsg, nativeMsg),
          suggestion: vocab.suggestion,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          originalText: match[0]
        });
      }
    });

    // Create bilingual ESL tips
    const eslTips = [
      createBilingualMessage(
        'Remember to use articles (a, an, the) before nouns',
        nativeLanguage?.toLowerCase() === 'spanish' ? 'Recuerda usar artículos (a, an, the) antes de los sustantivos' :
        nativeLanguage?.toLowerCase() === 'chinese' ? '记住在名词前使用冠词 (a, an, the)' :
        nativeLanguage?.toLowerCase() === 'french' ? 'N\'oubliez pas d\'utiliser les articles (a, an, the) avant les noms' : undefined
      ),
      createBilingualMessage(
        'Check subject-verb agreement in your sentences',
        nativeLanguage?.toLowerCase() === 'spanish' ? 'Verifica la concordancia sujeto-verbo en tus oraciones' :
        nativeLanguage?.toLowerCase() === 'chinese' ? '检查句子中的主谓一致' :
        nativeLanguage?.toLowerCase() === 'french' ? 'Vérifiez l\'accord sujet-verbe dans vos phrases' : undefined
      ),
      createBilingualMessage(
        'Use transition words to connect your ideas',
        nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa palabras de transición para conectar tus ideas' :
        nativeLanguage?.toLowerCase() === 'chinese' ? '使用过渡词来连接你的想法' :
        nativeLanguage?.toLowerCase() === 'french' ? 'Utilisez des mots de transition pour connecter vos idées' : undefined
      ),
      createBilingualMessage(
        'Vary your sentence length for better flow',
        nativeLanguage?.toLowerCase() === 'spanish' ? 'Varía la longitud de tus oraciones para mejor fluidez' :
        nativeLanguage?.toLowerCase() === 'chinese' ? '改变句子长度以获得更好的流畅度' :
        nativeLanguage?.toLowerCase() === 'french' ? 'Variez la longueur de vos phrases pour un meilleur flux' : undefined
      )
    ];

    return {
      grammarSuggestions: suggestions,
      overallScore: Math.max(70, 100 - suggestions.length * 5),
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