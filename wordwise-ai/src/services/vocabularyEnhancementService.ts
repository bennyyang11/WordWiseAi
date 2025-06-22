import OpenAI from 'openai';
import type { UserProfile } from '../types';

export interface VocabularySuggestion {
  id: string;
  type: 'vocabulary';
  severity: 'suggestion';
  message: string;
  originalText: string;
  suggestedText: string;
  explanation: string;
  position: { start: number; end: number };
  confidence: number;
  alternatives?: string[];
}

export interface VocabularyAnalysis {
  suggestions: VocabularySuggestion[];
  overallScore: number;
  enhancementOpportunities: number;
}

class VocabularyEnhancementService {
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
        dangerouslyAllowBrowser: true
      });
      this.isInitialized = true;
      console.log('✅ Vocabulary Enhancement Service initialized');
    } else {
      console.warn('❌ OpenAI API key not found for vocabulary enhancement');
    }
  }

  async analyzeVocabulary(text: string, userProfile: UserProfile): Promise<VocabularySuggestion[]> {
    if (!text.trim()) {
      return [];
    }

    console.log('📚 Starting vocabulary enhancement analysis...');
    console.log('🔧 OpenAI initialized:', this.isInitialized);
    console.log('🔑 Has OpenAI instance:', !!this.openai);

    if (!this.isInitialized || !this.openai) {
      console.warn('❌ OpenAI not available for vocabulary analysis - API key missing');
      return []; // Return empty instead of mock patterns
    }

    try {
      const prompt = this.createVocabularyPrompt(text, userProfile);
      
      console.log('🚀 Sending vocabulary analysis request to OpenAI...');
      console.log('📝 Prompt:', prompt.substring(0, 200) + '...');
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: this.createSystemPrompt(userProfile)
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      console.log('📦 OpenAI vocabulary response received');
      console.log('📄 Response content:', response.choices[0].message.content?.substring(0, 300) + '...');

      const analysis = this.parseVocabularyResponse(response.choices[0].message.content || '', text);
      console.log('✅ Vocabulary analysis complete:', analysis.length, 'suggestions');
      
      if (analysis.length > 0) {
        console.log('📚 Vocabulary suggestions found:', analysis.map(s => ({ 
          original: s.originalText, 
          suggested: s.suggestedText,
          message: s.message
        })));
      }
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Vocabulary enhancement failed:', error);
      console.error('🔍 Error details:', error instanceof Error ? error.message : String(error));
      return []; // Return empty instead of mock patterns when API fails
    }
  }

  private createSystemPrompt(userProfile: UserProfile): string {
    const basePrompt = `You are an expert vocabulary enhancement assistant. Your job is to analyze text and suggest vocabulary improvements for ${userProfile.englishLevel} level ESL students.

ANALYSIS GOALS:
- Find words that could be replaced with more appropriate vocabulary for the student's level
- Focus on common words that have better academic/professional alternatives
- Suggest improvements that sound natural in context
- Only suggest words that fit the student's current level

LEVEL GUIDELINES:
- Beginner: Replace very basic words with slightly more varied vocabulary
- Intermediate: Suggest more academic and professional vocabulary
- Advanced: Recommend sophisticated and nuanced word choices

CRITICAL: You must provide exact character positions (startIndex, endIndex) for each word in the original text.`;

    if (userProfile.nativeLanguage && userProfile.nativeLanguage.toLowerCase() !== 'english') {
      return `${basePrompt}

BILINGUAL REQUIREMENT: Provide ALL explanations in both English and ${userProfile.nativeLanguage}, separated by " | ".
Example: "Consider using more precise vocabulary | Considera usar vocabulario más preciso"`;
    }
    
    return basePrompt;
  }

  private createVocabularyPrompt(text: string, userProfile: UserProfile): string {
    const bilingualNote = userProfile.nativeLanguage && userProfile.nativeLanguage.toLowerCase() !== 'english' 
      ? `\n\nIMPORTANT: Provide message and explanation in BOTH English and ${userProfile.nativeLanguage}, separated by " | ".`
      : '';

    return `Analyze this text and find 3-7 vocabulary enhancement opportunities for a ${userProfile.englishLevel} level ESL student:

TEXT: "${text}"

Look for:
1. Simple words that could be more specific (good → excellent, big → significant)
2. Overused words (very + adjective → single stronger word)
3. Informal words that could be more academic (get → obtain, use → utilize)
4. Vague words that could be more precise (things → elements, stuff → materials)

For each suggestion, you MUST:
- Identify the exact word from the text that needs improvement
- Suggest a word appropriate for the student's level  
- Explain why the change improves the text

Return ONLY valid JSON in this exact format:
{
  "vocabularySuggestions": [
    {
      "originalText": "good",
      "suggestedText": "excellent", 
      "message": "Consider using more precise vocabulary",
      "explanation": "Excellent is more specific and impactful than 'good'",
      "confidence": 85,
      "alternatives": ["outstanding", "remarkable", "impressive"]
    }
  ]
}${bilingualNote}

IMPORTANT: Focus on identifying the exact words that appear in the text. Don't worry about character positions - just provide the exact word as it appears.`;
  }

  private parseVocabularyResponse(response: string, originalText: string): VocabularySuggestion[] {
    try {
      console.log('🔍 Parsing vocabulary response...');
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('❌ No JSON found in vocabulary response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const suggestions = parsed.vocabularySuggestions || [];
      
      console.log(`📋 Found ${suggestions.length} raw vocabulary suggestions`);

      const validSuggestions: VocabularySuggestion[] = [];

      suggestions.forEach((suggestion: any, index: number) => {
        const originalWord = suggestion.originalText;

        if (!originalWord || !suggestion.suggestedText) {
          console.warn('⚠️ Vocabulary suggestion missing required fields:', suggestion);
          return;
        }

        // Find the actual position of the word in the text (ignore AI's provided positions)
        const wordPosition = this.findWordPosition(originalWord, originalText);
        
        if (wordPosition === null) {
          console.warn('⚠️ Could not find vocabulary word in text:', {
            word: originalWord,
            textLength: originalText.length
          });
          return;
        }

        validSuggestions.push({
          id: `vocab-${index}-${Date.now()}`,
          type: 'vocabulary',
          severity: 'suggestion',
          message: suggestion.message || 'Consider vocabulary enhancement',
          originalText: originalWord,
          suggestedText: suggestion.suggestedText,
          explanation: suggestion.explanation || 'Better word choice',
          position: { start: wordPosition.start, end: wordPosition.end },
          confidence: Math.max(70, Math.min(100, suggestion.confidence || 80)),
          alternatives: Array.isArray(suggestion.alternatives) ? suggestion.alternatives : []
        });
      });

      console.log(`✅ Validated ${validSuggestions.length} vocabulary suggestions`);
      return validSuggestions;

    } catch (error) {
      console.error('❌ Error parsing vocabulary response:', error);
      console.error('📄 Raw response:', response.substring(0, 500) + '...');
      return [];
    }
  }

  private findWordPosition(word: string, text: string): { start: number; end: number } | null {
    // Try to find the word with exact case match first
    let index = text.indexOf(word);
    
    if (index !== -1) {
      return { start: index, end: index + word.length };
    }
    
    // Try case-insensitive search
    const lowerText = text.toLowerCase();
    const lowerWord = word.toLowerCase();
    index = lowerText.indexOf(lowerWord);
    
    if (index !== -1) {
      return { start: index, end: index + word.length };
    }
    
    // Try to find as a whole word (with word boundaries)
    const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const match = text.match(wordRegex);
    
    if (match && match.index !== undefined) {
      return { start: match.index, end: match.index + match[0].length };
    }
    
    // Try fuzzy matching - look for similar words
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const textWord = words[i].replace(/[^\w]/g, ''); // Remove punctuation
      if (textWord.toLowerCase() === word.toLowerCase()) {
        // Find this word's position in the original text
        const beforeWords = words.slice(0, i).join(' ');
        const startPos = beforeWords.length + (i > 0 ? 1 : 0); // Add space if not first word
        return { start: startPos, end: startPos + textWord.length };
      }
    }
    
    console.warn(`Could not find word "${word}" in text`);
    return null;
  }


}

export const vocabularyEnhancementService = new VocabularyEnhancementService(); 