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
      console.log('✅ OpenAI service initialized successfully');
    } else {
      console.warn('⚠️ OpenAI API key not found. Using mock responses.');
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
          model: "gpt-4",
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
          temperature: 0.1,
          max_tokens: 2000,
          stream: false
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI timeout')), 15000)
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
    const basePrompt = `You are an extremely meticulous English teacher and grammar expert specializing in comprehensive error detection. Your primary goal is to find EVERY SINGLE ERROR in student writing, no matter how small. You must be thorough and catch ALL mistakes.

CRITICAL: You must find and report EVERY error including:
- Every misspelled word (even simple ones like "bech" → "beach")
- Every incorrect verb form (like "goed" → "went", "drived" → "drove") 
- Every grammar mistake (subject-verb agreement, tense errors, etc.)
- Every punctuation error
- Every capitalization error
- Every word usage error

Be exhaustive in your analysis. Do not skip any errors, even obvious ones.`;
    
    if (nativeLanguage && nativeLanguage.toLowerCase() !== 'english') {
      return `${basePrompt} 

IMPORTANT: The student's native language is ${nativeLanguage}. For each suggestion, provide explanations in BOTH English and ${nativeLanguage}. This will help the student understand better since they are still learning English.

Format your bilingual explanations like this:
- "message": "English explanation | ${nativeLanguage} explanation"

For example:
- "Spelling error - 'bech' should be 'beach' | Error de ortografía - 'bech' debe ser 'beach'" (if Spanish)
- "Wrong verb tense - 'goed' should be 'went' | 错误的动词时态 - 'goed' 应该是 'went'" (if Chinese)

Always provide both languages to help the ESL student learn more effectively.`;
    }
    
    return basePrompt;
  }

  private createOptimizedPrompt(text: string, userLevel: string, nativeLanguage?: string): string {
    const bilingualInstruction = nativeLanguage && nativeLanguage.toLowerCase() !== 'english' 
      ? `\n\nCRITICAL: The student's native language is ${nativeLanguage}. For EVERY suggestion, provide the "message" field with explanations in BOTH English and ${nativeLanguage}, separated by " | ". This helps ESL students understand better.

Example message format: "Spelling error - missing double 'm' | Error de ortografía - falta doble 'm'" (if Spanish)`
      : '';

    return `You are an extremely thorough English teacher using GPT-4. Your job is to find EVERY SINGLE ERROR in this ${userLevel} ESL text. Miss absolutely nothing! Return JSON only:

{
  "grammarSuggestions": [
    {
      "type": "grammar|spelling|vocabulary|style",
      "severity": "error|warning|suggestion", 
      "message": "Clear explanation${bilingualInstruction ? ' in both English and ' + nativeLanguage : ''}",
      "suggestion": "Exact correction",
      "originalText": "Wrong text",
      "startIndex": 0,
      "endIndex": 5
    }
  ],
  "overallScore": 85,
  "readabilityScore": 80,
  "eslTips": ["Helpful ESL tip${bilingualInstruction ? ' in both languages' : ''}"]
}${bilingualInstruction}

CRITICAL INSTRUCTIONS - FIND ALL OF THESE ERRORS:

SPELLING ERRORS (Find every single one):
- Misspelled words: bech→beach, famly→family, alott→a lot, thingz→things
- Wrong verb forms: goed→went, drived→drove, tooked→took, builed→built
- Phonetic mistakes: wether→weather, their→there, nite→night
- Missing letters: finaly→finally, brothar→brother, restrant→restaurant
- Extra letters: musick→music, snackz→snacks, hourz→hours
- Wrong endings: eated→ate, drinked→drank, runned→ran, laught→laughed

GRAMMAR ERRORS (Catch all):
- Subject-verb agreement: "we was mad" → "we were mad"
- Wrong verb tenses: "we go" → "we went" (past context)
- Article errors: missing a/an/the
- Preposition errors: "in the watter" → "in the water"
- Word order mistakes
- Plural/singular errors

OTHER ERRORS:
- Punctuation mistakes
- Capitalization errors  
- Word choice errors: "funner" → "more fun"
- Run-on sentences

ANALYZE THIS TEXT WORD BY WORD. Check every single word for spelling. Check every verb for correct tense. Check every sentence for grammar. Be exhaustive!

Text: "${text}"

Remember: Your goal is to find 30-50+ errors if they exist. Be thorough and comprehensive!`;
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
      console.error('❌ Error parsing OpenAI response:', error);
    }
    
    // Fallback if parsing fails
    return this.getMockAnalysis(originalText);
  }

  private getMockAnalysis(text: string, nativeLanguage?: string): WritingAnalysis {
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const suggestions: GrammarSuggestion[] = [];

    console.log('🔄 Using mock OpenAI analysis');

    // Helper function to create bilingual messages
    const createBilingualMessage = (englishMsg: string, nativeMsg?: string): string => {
      if (nativeLanguage && nativeLanguage.toLowerCase() !== 'english' && nativeMsg) {
        return `${englishMsg} | ${nativeMsg}`;
      }
      return englishMsg;
    };

    // Simple mock suggestions based on common patterns with bilingual support
    if (text.toLowerCase().includes('alot')) {
      const index = text.toLowerCase().indexOf('alot');
      const nativeMsg = nativeLanguage?.toLowerCase() === 'spanish' ? 'Ortografía incorrecta - son dos palabras separadas' :
                       nativeLanguage?.toLowerCase() === 'chinese' ? '拼写错误 - 应该是两个单独的词' :
                       nativeLanguage?.toLowerCase() === 'french' ? 'Orthographe incorrecte - ce sont deux mots séparés' : undefined;
      
      suggestions.push({
        type: 'spelling',
        severity: 'error',
        message: createBilingualMessage('Incorrect spelling - should be two words', nativeMsg),
        suggestion: 'a lot',
        startIndex: index,
        endIndex: index + 4,
        originalText: 'alot'
      });
    }

    if (text.includes('recieve')) {
      const index = text.indexOf('recieve');
      const nativeMsg = nativeLanguage?.toLowerCase() === 'spanish' ? 'Error de ortografía - recuerda "i antes de e excepto después de c"' :
                       nativeLanguage?.toLowerCase() === 'chinese' ? '拼写错误 - 记住"i在e之前，除了在c之后"' :
                       nativeLanguage?.toLowerCase() === 'french' ? 'Erreur d\'orthographe - rappelez-vous "i avant e sauf après c"' : undefined;
      
      suggestions.push({
        type: 'spelling',
        severity: 'error',
        message: createBilingualMessage('Spelling error - remember "i before e except after c"', nativeMsg),
        suggestion: 'receive',
        startIndex: index,
        endIndex: index + 7,
        originalText: 'recieve'
      });
    }

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
}

export const openaiService = new OpenAIService(); 