import type { UserProfile } from '../types';

export interface VocabularyFeedback {
  overallScore: number; // 0-100 score for vocabulary appropriateness
  complexWords: VocabularyWord[];
  simpleWords: VocabularyWord[];
  recommendations: VocabularyRecommendation[];
  levelAppropriate: boolean;
  suggestedWords: VocabularySuggestion[];
}

export interface VocabularyWord {
  word: string;
  position: { start: number; end: number };
  complexity: 'too-simple' | 'appropriate' | 'too-complex';
  explanation: string;
  definition?: string;
}

export interface VocabularyRecommendation {
  type: 'simplify' | 'enhance' | 'learn' | 'context';
  message: string;
  examples?: string[];
}

export interface VocabularySuggestion {
  original: string;
  suggested: string[];
  reason: string;
  context: string;
}

class VocabularyFeedbackService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  async analyzeVocabulary(text: string, userProfile: UserProfile): Promise<VocabularyFeedback> {
    if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
      console.warn('OpenAI API key not configured, using mock vocabulary feedback');
      return this.getMockVocabularyFeedback(text, userProfile);
    }

    try {
      const prompt = this.createVocabularyPrompt(text, userProfile);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a vocabulary expert specializing in ESL (English as Second Language) education. You analyze text and provide vocabulary feedback tailored to the student's English proficiency level.

CRITICAL INSTRUCTIONS:
- Respond ONLY with valid JSON
- No additional text, explanations, or formatting
- Ensure all JSON properties are properly formatted
- Use double quotes for all strings
- Include proper position indices for words in the text`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Clean and extract JSON from the response
      console.log('📝 Raw vocabulary response:', content.substring(0, 200) + '...');
      
      // Remove markdown code blocks and backticks
      let cleanContent = content.trim();
      
      // Remove markdown code blocks
      cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // Remove backticks
      cleanContent = cleanContent.replace(/`/g, '"');
      
      // Extract JSON from the cleaned content
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      console.log('🧹 Cleaned JSON:', jsonMatch[0].substring(0, 200) + '...');
      
      // Parse the JSON response
      const feedback = JSON.parse(jsonMatch[0]);
      return this.validateAndFormatFeedback(feedback, text);

    } catch (error) {
      console.error('Vocabulary analysis failed:', error);
      return this.getMockVocabularyFeedback(text, userProfile);
    }
  }

  private createVocabularyPrompt(text: string, userProfile: UserProfile): string {
    const levelDescriptions = {
      beginner: 'basic everyday vocabulary (1000-2000 most common English words)',
      intermediate: 'expanded vocabulary including academic and professional terms (2000-5000 word range)',
      advanced: 'sophisticated vocabulary including complex academic, technical, and nuanced terms'
    };

    const nativeLanguageNote = userProfile.nativeLanguage !== 'English' 
      ? `The student's native language is ${userProfile.nativeLanguage}, so provide culturally relevant examples when possible.`
      : '';

    return `Analyze the vocabulary in this text for a ${userProfile.englishLevel}-level ESL student:

TEXT: "${text}"

STUDENT PROFILE:
- English Level: ${userProfile.englishLevel}
- Native Language: ${userProfile.nativeLanguage}
- Target vocabulary: ${levelDescriptions[userProfile.englishLevel as keyof typeof levelDescriptions]}

${nativeLanguageNote}

Provide vocabulary feedback in this exact JSON format:
{
  "overallScore": 85,
  "complexWords": [
    {
      "word": "sophisticated",
      "position": {"start": 45, "end": 58},
      "complexity": "too-complex",
      "explanation": "This word might be too advanced for intermediate level",
      "definition": "having great knowledge or experience"
    }
  ],
  "simpleWords": [
    {
      "word": "good",
      "position": {"start": 12, "end": 16},
      "complexity": "too-simple",
      "explanation": "Consider using more specific vocabulary",
      "definition": "having the required qualities; of a satisfactory standard"
    }
  ],
  "recommendations": [
    {
      "type": "enhance",
      "message": "Try using more varied adjectives instead of repeating 'good'",
      "examples": ["excellent", "remarkable", "impressive"]
    }
  ],
  "levelAppropriate": true,
  "suggestedWords": [
    {
      "original": "good",
      "suggested": ["excellent", "impressive", "notable"],
      "reason": "More specific and appropriate for your level",
      "context": "academic writing"
    }
  ]
}

IMPORTANT: 
- Find actual word positions in the provided text
- Score appropriateness 0-100 (higher = better match for level)
- Identify 3-5 words that are too simple/complex for the student's level
- Provide 2-3 actionable recommendations
- Suggest 2-3 alternative words with context`;
  }

  private validateAndFormatFeedback(feedback: any, _originalText: string): VocabularyFeedback {
    // Validate required properties and provide defaults
    return {
      overallScore: Math.max(0, Math.min(100, feedback.overallScore || 75)),
      complexWords: Array.isArray(feedback.complexWords) ? feedback.complexWords.slice(0, 5) : [],
      simpleWords: Array.isArray(feedback.simpleWords) ? feedback.simpleWords.slice(0, 5) : [],
      recommendations: Array.isArray(feedback.recommendations) ? feedback.recommendations.slice(0, 3) : [],
      levelAppropriate: Boolean(feedback.levelAppropriate),
      suggestedWords: Array.isArray(feedback.suggestedWords) ? feedback.suggestedWords.slice(0, 3) : []
    };
  }

  private getMockVocabularyFeedback(text: string, userProfile: UserProfile): VocabularyFeedback {
    const wordCount = text.split(/\s+/).length;
    const isAppropriate = wordCount > 10;

    // Create mock feedback based on user's level
    const mockFeedback: VocabularyFeedback = {
      overallScore: userProfile.englishLevel === 'beginner' ? 78 : 
                   userProfile.englishLevel === 'intermediate' ? 85 : 88,
      complexWords: this.getMockComplexWords(text, userProfile.englishLevel),
      simpleWords: this.getMockSimpleWords(text, userProfile.englishLevel),
      recommendations: this.getMockRecommendations(userProfile.englishLevel),
      levelAppropriate: isAppropriate,
      suggestedWords: this.getMockSuggestions(userProfile.englishLevel)
    };

    return mockFeedback;
  }

  private getMockComplexWords(_text: string, level: string): VocabularyWord[] {
    const complexWords: Record<string, VocabularyWord[]> = {
      beginner: [
        {
          word: 'sophisticated',
          position: { start: 0, end: 13 },
          complexity: 'too-complex',
          explanation: 'This word might be too advanced. Try "complex" or "advanced" instead.',
          definition: 'having great knowledge or experience'
        }
      ],
      intermediate: [
        {
          word: 'ubiquitous',
          position: { start: 0, end: 10 },
          complexity: 'too-complex',
          explanation: 'Consider using "common" or "widespread" for better clarity.',
          definition: 'present, appearing, or found everywhere'
        }
      ],
      advanced: []
    };

    return complexWords[level] || [];
  }

  private getMockSimpleWords(_text: string, level: string): VocabularyWord[] {
    const simpleWords: Record<string, VocabularyWord[]> = {
      beginner: [],
      intermediate: [
        {
          word: 'good',
          position: { start: 0, end: 4 },
          complexity: 'too-simple',
          explanation: 'Try using more specific words like "excellent" or "effective".',
          definition: 'having the required qualities'
        }
      ],
      advanced: [
        {
          word: 'nice',
          position: { start: 0, end: 4 },
          complexity: 'too-simple',
          explanation: 'Use more precise vocabulary like "impressive" or "remarkable".',
          definition: 'pleasant; agreeable; satisfactory'
        }
      ]
    };

    return simpleWords[level] || [];
  }

  private getMockRecommendations(level: string): VocabularyRecommendation[] {
    const recommendations: Record<string, VocabularyRecommendation[]> = {
      beginner: [
        {
          type: 'learn',
          message: 'Focus on learning common academic words like "analyze", "compare", "evaluate"',
          examples: ['analyze', 'compare', 'evaluate', 'describe']
        },
        {
          type: 'context',
          message: 'Practice using new words in different contexts to improve retention'
        }
      ],
      intermediate: [
        {
          type: 'enhance',
          message: 'Expand your vocabulary with more sophisticated adjectives and adverbs',
          examples: ['remarkable', 'substantial', 'considerable', 'significantly']
        },
        {
          type: 'context',
          message: 'Use transition words to connect ideas more effectively'
        }
      ],
      advanced: [
        {
          type: 'enhance',
          message: 'Incorporate more nuanced vocabulary to express subtle differences in meaning',
          examples: ['compelling', 'profound', 'comprehensive', 'intricate']
        },
        {
          type: 'context',
          message: 'Focus on domain-specific terminology for your field of study'
        }
      ]
    };

    return recommendations[level] || [];
  }

  private getMockSuggestions(level: string): VocabularySuggestion[] {
    const suggestions: Record<string, VocabularySuggestion[]> = {
      beginner: [
        {
          original: 'big',
          suggested: ['large', 'significant', 'important'],
          reason: 'More specific and academic',
          context: 'academic writing'
        }
      ],
      intermediate: [
        {
          original: 'good',
          suggested: ['excellent', 'effective', 'beneficial'],
          reason: 'More precise and professional',
          context: 'formal writing'
        }
      ],
      advanced: [
        {
          original: 'show',
          suggested: ['demonstrate', 'illustrate', 'exemplify'],
          reason: 'More sophisticated and academic',
          context: 'scholarly writing'
        }
      ]
    };

    return suggestions[level] || [];
  }
}

export const vocabularyFeedbackService = new VocabularyFeedbackService(); 