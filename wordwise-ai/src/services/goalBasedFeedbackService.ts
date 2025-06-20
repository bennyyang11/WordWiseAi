import OpenAI from 'openai';

export interface WritingGoal {
  type: 'essay' | 'email' | 'letter' | 'report' | 'creative' | 'conversation';
  description: string;
  keyFocusAreas: string[];
  targetAudience: string;
  formalityLevel: 'formal' | 'semi-formal' | 'informal';
  expectedLength: string;
}

export interface GoalBasedFeedback {
  writingType: string;
  overallAssessment: string;
  specificGoals: {
    goal: string;
    assessment: string;
    suggestions: string[];
    score: number;
  }[];
  nextSteps: string[];
  strengthsIdentified: string[];
}

export interface AIWritingSuggestions {
  generalTips: string[];
  writingTypeSpecific: string[];
  commonMistakes: string[];
  improvementAreas: string[];
}

class GoalBasedFeedbackService {
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
    } else {
      console.warn('OpenAI API key not found for goal-based feedback. Using mock responses.');
    }
  }

  private getWritingGoals(writingType: string): WritingGoal {
    const goals: Record<string, WritingGoal> = {
      essay: {
        type: 'essay',
        description: 'Academic essay writing with clear thesis, supporting arguments, and formal structure',
        keyFocusAreas: ['thesis clarity', 'argument structure', 'evidence support', 'formal language', 'academic vocabulary', 'paragraph unity', 'transitions'],
        targetAudience: 'academic readers, professors, peers',
        formalityLevel: 'formal',
        expectedLength: '300-1500 words'
      },
      email: {
        type: 'email',
        description: 'Professional email communication with clear purpose and appropriate tone',
        keyFocusAreas: ['subject line clarity', 'professional greeting', 'clear purpose', 'concise language', 'polite tone', 'appropriate closing', 'call to action'],
        targetAudience: 'colleagues, clients, supervisors',
        formalityLevel: 'semi-formal',
        expectedLength: '50-300 words'
      },
      letter: {
        type: 'letter',
        description: 'Formal letter writing with proper structure and conventions',
        keyFocusAreas: ['proper format', 'formal salutation', 'clear purpose', 'respectful tone', 'proper closing', 'contact information', 'date and address'],
        targetAudience: 'institutions, employers, officials',
        formalityLevel: 'formal',
        expectedLength: '200-500 words'
      },
      report: {
        type: 'report',
        description: 'Business or academic report with objective analysis and clear findings',
        keyFocusAreas: ['executive summary', 'clear headings', 'objective tone', 'data presentation', 'logical flow', 'evidence-based conclusions', 'recommendations'],
        targetAudience: 'management, stakeholders, academic reviewers',
        formalityLevel: 'formal',
        expectedLength: '500-2000 words'
      },
      creative: {
        type: 'creative',
        description: 'Creative writing with engaging narrative, character development, and literary techniques',
        keyFocusAreas: ['narrative voice', 'character development', 'plot structure', 'descriptive language', 'dialogue', 'literary devices', 'emotional impact'],
        targetAudience: 'readers, creative writing community',
        formalityLevel: 'informal',
        expectedLength: '300-1000 words'
      },
      conversation: {
        type: 'conversation',
        description: 'Casual text communication with natural tone and clear expression',
        keyFocusAreas: ['clarity', 'natural tone', 'appropriate informality', 'emoji usage', 'message length', 'context awareness', 'response timing'],
        targetAudience: 'friends, family, casual contacts',
        formalityLevel: 'informal',
        expectedLength: '10-200 words'
      }
    };

    return goals[writingType] || goals.essay;
  }

  async generateGoalBasedFeedback(
    text: string, 
    writingType: string, 
    userLevel: string = 'intermediate',
    nativeLanguage?: string
  ): Promise<GoalBasedFeedback> {
    if (!text.trim()) {
      return this.getEmptyFeedback(writingType);
    }

    console.log(`🎯 Generating goal-based feedback for ${writingType} writing...`);

    const writingGoal = this.getWritingGoals(writingType);
    
    if (!this.isInitialized || !this.openai) {
      console.log('🔄 OpenAI not available, using mock goal-based feedback');
      return this.getMockGoalBasedFeedback(text, writingGoal, nativeLanguage);
    }

    try {
      const prompt = this.createGoalBasedPrompt(text, writingGoal, userLevel, nativeLanguage);
      
      console.log('🚀 Sending goal-based feedback request to OpenAI...');
      const response = await Promise.race([
        this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: this.createGoalBasedSystemPrompt(nativeLanguage)
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
          stream: false
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI timeout')), 30000)
        )
      ]) as any;

      const feedback = this.parseGoalBasedResponse(response.choices[0].message.content || '', writingGoal);
      
      console.log('✅ Goal-based feedback generated successfully');
      return feedback;
    } catch (error) {
      console.error('❌ Goal-based feedback API Error:', error);
      return this.getMockGoalBasedFeedback(text, writingGoal, nativeLanguage);
    }
  }

  private createGoalBasedSystemPrompt(nativeLanguage?: string): string {
    const basePrompt = `You are an expert writing coach specializing in goal-based feedback for different writing types. You provide specific, actionable feedback that helps writers achieve their writing goals.

Your feedback should be:
- Specific to the writing type and its goals
- Actionable and practical
- Encouraging but honest
- Focused on improvement areas
- Structured and organized

You analyze writing based on the specific goals and conventions of each writing type (essays, emails, letters, reports, creative writing, casual text).`;

    if (nativeLanguage && nativeLanguage.toLowerCase() !== 'english') {
      return `${basePrompt}

🌍 BILINGUAL INSTRUCTION: The student's native language is ${nativeLanguage}. You MUST provide ALL feedback in BOTH English and ${nativeLanguage}. Use the format: "English feedback | ${nativeLanguage} feedback" for all text fields.`;
    }

    return basePrompt;
  }

  private createGoalBasedPrompt(
    text: string, 
    writingGoal: WritingGoal, 
    userLevel: string,
    nativeLanguage?: string
  ): string {
    const bilingualInstruction = nativeLanguage && nativeLanguage.toLowerCase() !== 'english' 
      ? `\n\n🌍 CRITICAL BILINGUAL REQUIREMENT: The student's native language is ${nativeLanguage}. For EVERY field in the JSON response, you MUST provide content in BOTH English AND ${nativeLanguage}, separated by " | ". This is mandatory for ESL learning.`
      : '';

    return `🎯 GOAL-BASED WRITING FEEDBACK ANALYSIS

📝 WRITING TYPE: ${writingGoal.type.toUpperCase()}
📋 WRITING GOALS: ${writingGoal.description}
🎯 KEY FOCUS AREAS: ${writingGoal.keyFocusAreas.join(', ')}
👥 TARGET AUDIENCE: ${writingGoal.targetAudience}
📏 FORMALITY LEVEL: ${writingGoal.formalityLevel}
📊 EXPECTED LENGTH: ${writingGoal.expectedLength}
🎓 STUDENT LEVEL: ${userLevel}${bilingualInstruction}

🎯 ANALYSIS MISSION: 
Evaluate this ${writingGoal.type} against its specific goals and provide targeted feedback that helps the student achieve excellence in this writing type.

📊 RETURN FORMAT: JSON ONLY, NO EXPLANATIONS OUTSIDE JSON:

{
  "writingType": "${writingGoal.type}",
  "overallAssessment": "Brief overall assessment of how well the writing meets its goals${bilingualInstruction ? ' (bilingual)' : ''}",
  "specificGoals": [
    {
      "goal": "Specific goal from the focus areas${bilingualInstruction ? ' (bilingual)' : ''}",
      "assessment": "How well this goal is met${bilingualInstruction ? ' (bilingual)' : ''}",
      "suggestions": ["Specific suggestion 1${bilingualInstruction ? ' (bilingual)' : ''}", "Specific suggestion 2${bilingualInstruction ? ' (bilingual)' : ''}"],
      "score": 75
    }
  ],
  "nextSteps": ["Actionable next step 1${bilingualInstruction ? ' (bilingual)' : ''}", "Actionable next step 2${bilingualInstruction ? ' (bilingual)' : ''}"],
  "strengthsIdentified": ["Strength 1${bilingualInstruction ? ' (bilingual)' : ''}", "Strength 2${bilingualInstruction ? ' (bilingual)' : ''}"]
}

🔍 SPECIFIC EVALUATION CRITERIA FOR ${writingGoal.type.toUpperCase()}:

${this.getSpecificCriteria(writingGoal)}

📝 TEXT TO ANALYZE:
"${text}"

Provide comprehensive goal-based feedback that helps the student excel in ${writingGoal.type} writing specifically.`;
  }

  private getSpecificCriteria(writingGoal: WritingGoal): string {
    const criteriaMap: Record<string, string> = {
      essay: `• Thesis Statement: Clear, arguable, and well-positioned
• Argument Structure: Logical flow of ideas with supporting evidence
• Academic Language: Formal vocabulary and sentence structures
• Paragraph Unity: Each paragraph supports the main argument
• Transitions: Smooth connections between ideas
• Conclusion: Effective summary and broader implications`,

      email: `• Subject Line: Clear and informative
• Professional Greeting: Appropriate salutation
• Clear Purpose: Main message communicated early
• Concise Language: Efficient use of words
• Professional Tone: Respectful and appropriate
• Call to Action: Clear next steps if needed
• Proper Closing: Professional sign-off`,

      letter: `• Proper Format: Correct letter structure and layout
• Formal Salutation: Appropriate greeting for recipient
• Clear Purpose: Reason for writing stated clearly
• Respectful Tone: Formal and courteous language
• Supporting Details: Relevant information provided
• Proper Closing: Appropriate formal ending
• Contact Information: Complete sender details`,

      report: `• Executive Summary: Key findings summarized
• Clear Structure: Logical organization with headings
• Objective Tone: Neutral and professional language
• Data Integration: Evidence and statistics effectively used
• Analysis: Insights and interpretations provided
• Recommendations: Actionable next steps suggested
• Professional Format: Consistent formatting throughout`,

      creative: `• Narrative Voice: Engaging and consistent perspective
• Character Development: Well-developed personalities
• Plot Structure: Compelling story progression
• Descriptive Language: Vivid and immersive details
• Dialogue: Natural and character-appropriate
• Literary Techniques: Effective use of literary devices
• Emotional Impact: Engaging and memorable content`,

      conversation: `• Clarity: Message is easy to understand
• Natural Tone: Conversational and friendly
• Appropriate Informality: Suitable level of casualness
• Context Awareness: Relevant to the conversation
• Message Length: Appropriate for the medium
• Response Timing: Timely and relevant replies
• Emoji/Informal Elements: Used appropriately`
    };

    return criteriaMap[writingGoal.type] || criteriaMap.essay;
  }

  private parseGoalBasedResponse(response: string, writingGoal: WritingGoal): GoalBasedFeedback {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          writingType: writingGoal.type,
          overallAssessment: parsed.overallAssessment || 'Feedback analysis in progress...',
          specificGoals: parsed.specificGoals || [],
          nextSteps: parsed.nextSteps || [],
          strengthsIdentified: parsed.strengthsIdentified || []
        };
      }
    } catch (error) {
      console.error('Error parsing goal-based response:', error);
    }
    
    return this.getMockGoalBasedFeedback('', writingGoal);
  }

  private getMockGoalBasedFeedback(text: string, writingGoal: WritingGoal, nativeLanguage?: string): GoalBasedFeedback {
    const createBilingualText = (english: string, nativeTranslation?: string): string => {
      if (nativeLanguage && nativeLanguage.toLowerCase() !== 'english' && nativeTranslation) {
        return `${english} | ${nativeTranslation}`;
      }
      return english;
    };

    const mockFeedback: Record<string, any> = {
      essay: {
        overallAssessment: createBilingualText(
          "Your essay shows good potential with clear ideas, but needs stronger academic structure and formal language",
          nativeLanguage?.toLowerCase() === 'spanish' ? 'Tu ensayo muestra buen potencial con ideas claras, pero necesita una estructura académica más fuerte y lenguaje formal' :
          nativeLanguage?.toLowerCase() === 'chinese' ? '你的论文显示出良好的潜力和清晰的思想，但需要更强的学术结构和正式语言' :
          nativeLanguage?.toLowerCase() === 'french' ? 'Votre essai montre un bon potentiel avec des idées claires, mais a besoin d\'une structure académique plus forte et d\'un langage formel' : undefined
        ),
        specificGoals: [
          {
            goal: createBilingualText("Thesis clarity", nativeLanguage?.toLowerCase() === 'spanish' ? 'Claridad de tesis' : nativeLanguage?.toLowerCase() === 'chinese' ? '论文清晰度' : undefined),
            assessment: createBilingualText("Your main argument needs to be stated more clearly in the introduction", nativeLanguage?.toLowerCase() === 'spanish' ? 'Tu argumento principal necesita ser expresado más claramente en la introducción' : undefined),
            suggestions: [
              createBilingualText("Start with a clear thesis statement that presents your main argument", nativeLanguage?.toLowerCase() === 'spanish' ? 'Comienza con una declaración de tesis clara que presente tu argumento principal' : undefined),
              createBilingualText("Make sure your thesis is specific and arguable", nativeLanguage?.toLowerCase() === 'spanish' ? 'Asegúrate de que tu tesis sea específica y debatible' : undefined)
            ],
            score: 65
          },
          {
            goal: createBilingualText("Academic vocabulary", nativeLanguage?.toLowerCase() === 'spanish' ? 'Vocabulario académico' : undefined),
            assessment: createBilingualText("Use more formal, academic language throughout your essay", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa un lenguaje más formal y académico en todo tu ensayo' : undefined),
            suggestions: [
              createBilingualText("Replace informal expressions with academic alternatives", nativeLanguage?.toLowerCase() === 'spanish' ? 'Reemplaza expresiones informales con alternativas académicas' : undefined),
              createBilingualText("Use transition words like 'furthermore', 'however', 'consequently'", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa palabras de transición como furthermore, however, consequently' : undefined)
            ],
            score: 70
          }
        ],
        nextSteps: [
          createBilingualText("Revise your introduction to include a clear thesis statement", nativeLanguage?.toLowerCase() === 'spanish' ? 'Revisa tu introducción para incluir una declaración de tesis clara' : undefined),
          createBilingualText("Practice using formal academic vocabulary in your writing", nativeLanguage?.toLowerCase() === 'spanish' ? 'Practica usando vocabulario académico formal en tu escritura' : undefined)
        ],
        strengthsIdentified: [
          createBilingualText("Good use of examples to support your points", nativeLanguage?.toLowerCase() === 'spanish' ? 'Buen uso de ejemplos para apoyar tus puntos' : undefined),
          createBilingualText("Clear paragraph structure with topic sentences", nativeLanguage?.toLowerCase() === 'spanish' ? 'Estructura de párrafo clara con oraciones temáticas' : undefined)
        ]
      },
      email: {
        overallAssessment: createBilingualText(
          "Your email communicates the main message clearly but could be more professional in tone and structure",
          nativeLanguage?.toLowerCase() === 'spanish' ? 'Tu correo comunica el mensaje principal claramente pero podría ser más profesional en tono y estructura' : undefined
        ),
        specificGoals: [
          {
            goal: createBilingualText("Professional tone", nativeLanguage?.toLowerCase() === 'spanish' ? 'Tono profesional' : undefined),
            assessment: createBilingualText("Your email tone is friendly but needs to be more formal for business communication", nativeLanguage?.toLowerCase() === 'spanish' ? 'El tono de tu correo es amigable pero necesita ser más formal para comunicación de negocios' : undefined),
            suggestions: [
              createBilingualText("Use formal greetings like 'Dear Mr./Ms. [Name]' instead of casual ones", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa saludos formales como Dear Mr./Ms. [Name] en lugar de informales' : undefined),
              createBilingualText("Avoid contractions (use 'I would' instead of 'I'd')", nativeLanguage?.toLowerCase() === 'spanish' ? 'Evita contracciones (usa I would en lugar de I\'d)' : undefined)
            ],
            score: 75
          }
        ],
        nextSteps: [
          createBilingualText("Review professional email templates for your industry", nativeLanguage?.toLowerCase() === 'spanish' ? 'Revisa plantillas de correos profesionales para tu industria' : undefined)
        ],
        strengthsIdentified: [
          createBilingualText("Clear subject line that explains the purpose", nativeLanguage?.toLowerCase() === 'spanish' ? 'Línea de asunto clara que explica el propósito' : undefined)
        ]
      },
      letter: {
        overallAssessment: createBilingualText(
          "Your letter follows basic structure but needs more formal language and proper conventions",
          nativeLanguage?.toLowerCase() === 'spanish' ? 'Tu carta sigue la estructura básica pero necesita un lenguaje más formal y convenciones apropiadas' : undefined
        ),
        specificGoals: [
          {
            goal: createBilingualText("Formal structure", nativeLanguage?.toLowerCase() === 'spanish' ? 'Estructura formal' : undefined),
            assessment: createBilingualText("Include all formal letter elements: date, recipient address, proper salutation, and closing", nativeLanguage?.toLowerCase() === 'spanish' ? 'Incluye todos los elementos de carta formal: fecha, dirección del destinatario, saludo apropiado y cierre' : undefined),
            suggestions: [
              createBilingualText("Add the date at the top of your letter", nativeLanguage?.toLowerCase() === 'spanish' ? 'Añade la fecha en la parte superior de tu carta' : undefined),
              createBilingualText("Use 'Sincerely' or 'Yours faithfully' for formal closing", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa Sincerely o Yours faithfully para el cierre formal' : undefined)
            ],
            score: 68
          }
        ],
        nextSteps: [
          createBilingualText("Study formal letter formats and practice with templates", nativeLanguage?.toLowerCase() === 'spanish' ? 'Estudia formatos de cartas formales y practica con plantillas' : undefined)
        ],
        strengthsIdentified: [
          createBilingualText("Clear statement of purpose in the opening paragraph", nativeLanguage?.toLowerCase() === 'spanish' ? 'Declaración clara del propósito en el párrafo de apertura' : undefined)
        ]
      },
      report: {
        overallAssessment: createBilingualText(
          "Your report presents information clearly but needs better organization and more objective language",
          nativeLanguage?.toLowerCase() === 'spanish' ? 'Tu informe presenta información claramente pero necesita mejor organización y lenguaje más objetivo' : undefined
        ),
        specificGoals: [
          {
            goal: createBilingualText("Objective tone", nativeLanguage?.toLowerCase() === 'spanish' ? 'Tono objetivo' : undefined),
            assessment: createBilingualText("Use more neutral, fact-based language throughout your report", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa un lenguaje más neutral y basado en hechos en todo tu informe' : undefined),
            suggestions: [
              createBilingualText("Replace opinion words with objective analysis", nativeLanguage?.toLowerCase() === 'spanish' ? 'Reemplaza palabras de opinión con análisis objetivo' : undefined),
              createBilingualText("Use data and evidence to support your findings", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa datos y evidencia para apoyar tus hallazgos' : undefined)
            ],
            score: 72
          }
        ],
        nextSteps: [
          createBilingualText("Add clear headings and subheadings to organize your content", nativeLanguage?.toLowerCase() === 'spanish' ? 'Añade encabezados y subtítulos claros para organizar tu contenido' : undefined)
        ],
        strengthsIdentified: [
          createBilingualText("Good use of specific examples and case studies", nativeLanguage?.toLowerCase() === 'spanish' ? 'Buen uso de ejemplos específicos y estudios de caso' : undefined)
        ]
      },
      creative: {
        overallAssessment: createBilingualText(
          "Your creative writing shows imagination and good storytelling instincts",
          nativeLanguage?.toLowerCase() === 'spanish' ? 'Tu escritura creativa muestra imaginación y buenos instintos narrativos' : undefined
        ),
        specificGoals: [
          {
            goal: createBilingualText("Descriptive language", nativeLanguage?.toLowerCase() === 'spanish' ? 'Lenguaje descriptivo' : undefined),
            assessment: createBilingualText("Add more sensory details to help readers visualize your story", nativeLanguage?.toLowerCase() === 'spanish' ? 'Añade más detalles sensoriales para ayudar a los lectores a visualizar tu historia' : undefined),
            suggestions: [
              createBilingualText("Include details about what characters see, hear, smell, and feel", nativeLanguage?.toLowerCase() === 'spanish' ? 'Incluye detalles sobre lo que los personajes ven, oyen, huelen y sienten' : undefined),
              createBilingualText("Use metaphors and similes to create vivid imagery", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa metáforas y símiles para crear imágenes vívidas' : undefined)
            ],
            score: 78
          }
        ],
        nextSteps: [
          createBilingualText("Practice writing detailed character descriptions", nativeLanguage?.toLowerCase() === 'spanish' ? 'Practica escribir descripciones detalladas de personajes' : undefined)
        ],
        strengthsIdentified: [
          createBilingualText("Engaging dialogue that sounds natural", nativeLanguage?.toLowerCase() === 'spanish' ? 'Diálogo atractivo que suena natural' : undefined)
        ]
      },
      conversation: {
        overallAssessment: createBilingualText(
          "Your casual writing is clear and friendly, perfect for informal communication",
          nativeLanguage?.toLowerCase() === 'spanish' ? 'Tu escritura casual es clara y amigable, perfecta para comunicación informal' : undefined
        ),
        specificGoals: [
          {
            goal: createBilingualText("Natural tone", nativeLanguage?.toLowerCase() === 'spanish' ? 'Tono natural' : undefined),
            assessment: createBilingualText("Your conversational style is authentic and engaging", nativeLanguage?.toLowerCase() === 'spanish' ? 'Tu estilo conversacional es auténtico y atractivo' : undefined),
            suggestions: [
              createBilingualText("Continue using this natural, friendly tone", nativeLanguage?.toLowerCase() === 'spanish' ? 'Continúa usando este tono natural y amigable' : undefined)
            ],
            score: 85
          }
        ],
        nextSteps: [
          createBilingualText("Keep practicing casual writing to maintain this natural flow", nativeLanguage?.toLowerCase() === 'spanish' ? 'Sigue practicando escritura casual para mantener este flujo natural' : undefined)
        ],
        strengthsIdentified: [
          createBilingualText("Excellent use of informal language appropriate for the context", nativeLanguage?.toLowerCase() === 'spanish' ? 'Excelente uso del lenguaje informal apropiado para el contexto' : undefined)
        ]
      }
    };

    return {
      writingType: writingGoal.type,
      ...mockFeedback[writingGoal.type]
    };
  }

  private getEmptyFeedback(writingType: string): GoalBasedFeedback {
    return {
      writingType,
      overallAssessment: 'Start writing to receive goal-based feedback...',
      specificGoals: [],
      nextSteps: [],
      strengthsIdentified: []
    };
  }

  generateFeedbackDebounced(
    text: string, 
    writingType: string, 
    userLevel: string, 
    callback: (feedback: GoalBasedFeedback) => void, 
    delay: number = 2000,
    nativeLanguage?: string
  ) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(async () => {
      const feedback = await this.generateGoalBasedFeedback(text, writingType, userLevel, nativeLanguage);
      callback(feedback);
    }, delay);
  }

  private debounceTimer: NodeJS.Timeout | null = null;

  // Generate general AI writing suggestions that are always available
  async generateAIWritingSuggestions(
    writingType: string,
    userLevel: string = 'intermediate',
    nativeLanguage?: string
  ): Promise<AIWritingSuggestions> {
    console.log(`💡 Generating AI writing suggestions for ${writingType}...`);

    if (!this.isInitialized || !this.openai) {
      console.log('🔄 OpenAI not available, using mock writing suggestions');
      return this.getMockWritingSuggestions(writingType, nativeLanguage);
    }

    try {
      const prompt = this.createWritingSuggestionsPrompt(writingType, userLevel, nativeLanguage);
      
      console.log('🚀 Sending writing suggestions request to OpenAI...');
      const response = await Promise.race([
        this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: this.createWritingSuggestionsSystemPrompt(nativeLanguage)
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 1500,
          stream: false
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI timeout')), 30000)
        )
      ]) as any;

      const suggestions = this.parseWritingSuggestionsResponse(response.choices[0].message.content || '', writingType);
      
      console.log('✅ AI writing suggestions generated successfully');
      return suggestions;
    } catch (error) {
      console.error('❌ AI writing suggestions API Error:', error);
      return this.getMockWritingSuggestions(writingType, nativeLanguage);
    }
  }

  private createWritingSuggestionsSystemPrompt(nativeLanguage?: string): string {
    const basePrompt = `You are an expert writing coach who provides helpful, actionable writing suggestions. You specialize in giving practical advice that writers can immediately apply to improve their writing skills.

Your suggestions should be:
- Practical and actionable
- Easy to understand and implement
- Relevant to the writing type
- Encouraging and constructive
- Specific rather than generic`;

    if (nativeLanguage && nativeLanguage.toLowerCase() !== 'english') {
      return `${basePrompt}

🌍 BILINGUAL INSTRUCTION: The student's native language is ${nativeLanguage}. You MUST provide ALL suggestions in BOTH English and ${nativeLanguage}. Use the format: "English suggestion | ${nativeLanguage} suggestion" for all suggestion text.`;
    }

    return basePrompt;
  }

  private createWritingSuggestionsPrompt(
    writingType: string,
    userLevel: string,
    nativeLanguage?: string
  ): string {
    const bilingualInstruction = nativeLanguage && nativeLanguage.toLowerCase() !== 'english' 
      ? `\n\n🌍 CRITICAL BILINGUAL REQUIREMENT: The student's native language is ${nativeLanguage}. For EVERY suggestion in the JSON response, you MUST provide content in BOTH English AND ${nativeLanguage}, separated by " | ". This is mandatory for ESL learning.`
      : '';

    return `🎯 AI WRITING SUGGESTIONS REQUEST

📝 WRITING TYPE: ${writingType.toUpperCase()}
🎓 STUDENT LEVEL: ${userLevel}${bilingualInstruction}

🎯 MISSION: 
Generate helpful writing suggestions that are always useful for ${writingType} writing, regardless of what the user has written so far. These should be practical tips they can apply immediately.

📊 RETURN FORMAT: JSON ONLY, NO EXPLANATIONS OUTSIDE JSON:

{
  "generalTips": [
    "Universal writing tip that applies to all good writing${bilingualInstruction ? ' (bilingual)' : ''}",
    "Another general tip for better writing${bilingualInstruction ? ' (bilingual)' : ''}"
  ],
  "writingTypeSpecific": [
    "Specific tip for ${writingType} writing${bilingualInstruction ? ' (bilingual)' : ''}",
    "Another ${writingType}-specific suggestion${bilingualInstruction ? ' (bilingual)' : ''}"
  ],
  "commonMistakes": [
    "Common mistake to avoid in ${writingType} writing${bilingualInstruction ? ' (bilingual)' : ''}",
    "Another common pitfall to watch out for${bilingualInstruction ? ' (bilingual)' : ''}"
  ],
  "improvementAreas": [
    "Area to focus on for ${writingType} improvement${bilingualInstruction ? ' (bilingual)' : ''}",
    "Another improvement focus area${bilingualInstruction ? ' (bilingual)' : ''}"
  ]
}

🔍 FOCUS AREAS FOR ${writingType.toUpperCase()}:
${this.getWritingSuggestionsFocus(writingType)}

Generate 3-4 suggestions for each category that are immediately actionable and specifically helpful for ${writingType} writing.`;
  }

  private getWritingSuggestionsFocus(writingType: string): string {
    const focusMap: Record<string, string> = {
      essay: `• Academic tone and formal language
• Thesis development and argument structure
• Evidence integration and citation
• Paragraph unity and transitions
• Critical analysis and evaluation`,

      email: `• Professional tone and courtesy
• Clear subject lines and purpose
• Concise and direct communication
• Appropriate formality level
• Call-to-action clarity`,

      letter: `• Formal structure and conventions
• Appropriate salutations and closings
• Respectful and courteous tone
• Clear purpose and intent
• Professional presentation`,

      report: `• Objective and analytical tone
• Clear organization and headings
• Data presentation and analysis
• Evidence-based conclusions
• Executive summary effectiveness`,

      creative: `• Narrative voice and perspective
• Character development and dialogue
• Descriptive language and imagery
• Plot structure and pacing
• Emotional engagement`,

      conversation: `• Natural and authentic tone
• Clarity and understanding
• Appropriate informality
• Context awareness
• Effective communication`
    };

    return focusMap[writingType] || focusMap.essay;
  }

  private parseWritingSuggestionsResponse(response: string, writingType: string): AIWritingSuggestions {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          generalTips: parsed.generalTips || [],
          writingTypeSpecific: parsed.writingTypeSpecific || [],
          commonMistakes: parsed.commonMistakes || [],
          improvementAreas: parsed.improvementAreas || []
        };
      }
    } catch (error) {
      console.error('Error parsing AI writing suggestions response:', error);
    }
    
    return this.getMockWritingSuggestions(writingType);
  }

  private getMockWritingSuggestions(writingType: string, nativeLanguage?: string): AIWritingSuggestions {
    const createBilingualText = (english: string, nativeTranslation?: string): string => {
      if (nativeLanguage && nativeLanguage.toLowerCase() !== 'english' && nativeTranslation) {
        return `${english} | ${nativeTranslation}`;
      }
      return english;
    };

    const mockSuggestions: Record<string, AIWritingSuggestions> = {
      essay: {
        generalTips: [
          createBilingualText("Start each paragraph with a clear topic sentence", nativeLanguage?.toLowerCase() === 'spanish' ? 'Comienza cada párrafo con una oración temática clara' : undefined),
          createBilingualText("Use transitions to connect your ideas smoothly", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa transiciones para conectar tus ideas suavemente' : undefined),
          createBilingualText("Support your arguments with specific examples", nativeLanguage?.toLowerCase() === 'spanish' ? 'Apoya tus argumentos con ejemplos específicos' : undefined)
        ],
        writingTypeSpecific: [
          createBilingualText("Develop a clear thesis statement in your introduction", nativeLanguage?.toLowerCase() === 'spanish' ? 'Desarrolla una declaración de tesis clara en tu introducción' : undefined),
          createBilingualText("Use academic vocabulary and formal language", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa vocabulario académico y lenguaje formal' : undefined),
          createBilingualText("End with a strong conclusion that reinforces your main argument", nativeLanguage?.toLowerCase() === 'spanish' ? 'Termina con una conclusión fuerte que refuerce tu argumento principal' : undefined)
        ],
        commonMistakes: [
          createBilingualText("Avoid using 'I think' or 'I believe' in academic writing", nativeLanguage?.toLowerCase() === 'spanish' ? 'Evita usar I think o I believe en escritura académica' : undefined),
          createBilingualText("Don't forget to cite your sources properly", nativeLanguage?.toLowerCase() === 'spanish' ? 'No olvides citar tus fuentes apropiadamente' : undefined)
        ],
        improvementAreas: [
          createBilingualText("Practice writing stronger thesis statements", nativeLanguage?.toLowerCase() === 'spanish' ? 'Practica escribir declaraciones de tesis más fuertes' : undefined),
          createBilingualText("Work on paragraph unity and coherence", nativeLanguage?.toLowerCase() === 'spanish' ? 'Trabaja en la unidad y coherencia de párrafos' : undefined)
        ]
      },
      email: {
        generalTips: [
          createBilingualText("Keep your message clear and concise", nativeLanguage?.toLowerCase() === 'spanish' ? 'Mantén tu mensaje claro y conciso' : undefined),
          createBilingualText("Use a professional but friendly tone", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa un tono profesional pero amigable' : undefined),
          createBilingualText("Proofread before sending", nativeLanguage?.toLowerCase() === 'spanish' ? 'Revisa antes de enviar' : undefined)
        ],
        writingTypeSpecific: [
          createBilingualText("Write a clear, specific subject line", nativeLanguage?.toLowerCase() === 'spanish' ? 'Escribe una línea de asunto clara y específica' : undefined),
          createBilingualText("Start with appropriate greeting (Dear, Hello)", nativeLanguage?.toLowerCase() === 'spanish' ? 'Comienza con un saludo apropiado (Dear, Hello)' : undefined),
          createBilingualText("End with a professional closing (Best regards, Sincerely)", nativeLanguage?.toLowerCase() === 'spanish' ? 'Termina con un cierre profesional (Best regards, Sincerely)' : undefined)
        ],
        commonMistakes: [
          createBilingualText("Avoid using informal language in professional emails", nativeLanguage?.toLowerCase() === 'spanish' ? 'Evita usar lenguaje informal en correos profesionales' : undefined),
          createBilingualText("Don't forget to include a clear call to action", nativeLanguage?.toLowerCase() === 'spanish' ? 'No olvides incluir una llamada a la acción clara' : undefined)
        ],
        improvementAreas: [
          createBilingualText("Practice writing more effective subject lines", nativeLanguage?.toLowerCase() === 'spanish' ? 'Practica escribir líneas de asunto más efectivas' : undefined),
          createBilingualText("Focus on being more concise while staying polite", nativeLanguage?.toLowerCase() === 'spanish' ? 'Enfócate en ser más conciso mientras te mantienes cortés' : undefined)
        ]
      },
      letter: {
        generalTips: [
          createBilingualText("Use formal language throughout", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa lenguaje formal en todo momento' : undefined),
          createBilingualText("Be clear about your purpose from the beginning", nativeLanguage?.toLowerCase() === 'spanish' ? 'Sé claro sobre tu propósito desde el principio' : undefined),
          createBilingualText("Maintain a respectful and courteous tone", nativeLanguage?.toLowerCase() === 'spanish' ? 'Mantén un tono respetuoso y cortés' : undefined)
        ],
        writingTypeSpecific: [
          createBilingualText("Include the date and recipient's address", nativeLanguage?.toLowerCase() === 'spanish' ? 'Incluye la fecha y dirección del destinatario' : undefined),
          createBilingualText("Use 'Dear Sir/Madam' or specific name if known", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa Dear Sir/Madam o nombre específico si lo conoces' : undefined),
          createBilingualText("Close with 'Yours sincerely' or 'Yours faithfully'", nativeLanguage?.toLowerCase() === 'spanish' ? 'Cierra con Yours sincerely o Yours faithfully' : undefined)
        ],
        commonMistakes: [
          createBilingualText("Don't use contractions (write 'cannot' not 'can't')", nativeLanguage?.toLowerCase() === 'spanish' ? 'No uses contracciones (escribe cannot no can\'t)' : undefined),
          createBilingualText("Avoid being too casual or familiar", nativeLanguage?.toLowerCase() === 'spanish' ? 'Evita ser demasiado casual o familiar' : undefined)
        ],
        improvementAreas: [
          createBilingualText("Practice formal letter structure and format", nativeLanguage?.toLowerCase() === 'spanish' ? 'Practica la estructura y formato de cartas formales' : undefined),
          createBilingualText("Work on expressing requests politely but clearly", nativeLanguage?.toLowerCase() === 'spanish' ? 'Trabaja en expresar solicitudes cortés pero claramente' : undefined)
        ]
      },
      report: {
        generalTips: [
          createBilingualText("Use clear headings to organize your content", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa encabezados claros para organizar tu contenido' : undefined),
          createBilingualText("Present information objectively", nativeLanguage?.toLowerCase() === 'spanish' ? 'Presenta información objetivamente' : undefined),
          createBilingualText("Support statements with data and evidence", nativeLanguage?.toLowerCase() === 'spanish' ? 'Apoya declaraciones with datos y evidencia' : undefined)
        ],
        writingTypeSpecific: [
          createBilingualText("Start with an executive summary", nativeLanguage?.toLowerCase() === 'spanish' ? 'Comienza con un resumen ejecutivo' : undefined),
          createBilingualText("Use tables and charts to present data clearly", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa tablas y gráficos para presentar datos claramente' : undefined),
          createBilingualText("End with clear recommendations", nativeLanguage?.toLowerCase() === 'spanish' ? 'Termina con recomendaciones claras' : undefined)
        ],
        commonMistakes: [
          createBilingualText("Avoid personal opinions without supporting evidence", nativeLanguage?.toLowerCase() === 'spanish' ? 'Evita opiniones personales sin evidencia de apoyo' : undefined),
          createBilingualText("Don't bury important findings in dense paragraphs", nativeLanguage?.toLowerCase() === 'spanish' ? 'No entierres hallazgos importantes en párrafos densos' : undefined)
        ],
        improvementAreas: [
          createBilingualText("Practice writing clear, actionable recommendations", nativeLanguage?.toLowerCase() === 'spanish' ? 'Practica escribir recomendaciones claras y accionables' : undefined),
          createBilingualText("Focus on logical flow and structure", nativeLanguage?.toLowerCase() === 'spanish' ? 'Enfócate en flujo lógico y estructura' : undefined)
        ]
      },
      creative: {
        generalTips: [
          createBilingualText("Show, don't tell - use vivid descriptions", nativeLanguage?.toLowerCase() === 'spanish' ? 'Muestra, no digas - usa descripciones vívidas' : undefined),
          createBilingualText("Vary your sentence length for better rhythm", nativeLanguage?.toLowerCase() === 'spanish' ? 'Varía la longitud de tus oraciones para mejor ritmo' : undefined),
          createBilingualText("Read your work aloud to catch awkward phrasing", nativeLanguage?.toLowerCase() === 'spanish' ? 'Lee tu trabajo en voz alta para captar frases incómodas' : undefined)
        ],
        writingTypeSpecific: [
          createBilingualText("Develop characters with distinct voices", nativeLanguage?.toLowerCase() === 'spanish' ? 'Desarrolla personajes con voces distintas' : undefined),
          createBilingualText("Use sensory details to immerse readers", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa detalles sensoriales para sumergir a los lectores' : undefined),
          createBilingualText("Create conflict and tension to drive the story", nativeLanguage?.toLowerCase() === 'spanish' ? 'Crea conflicto y tensión para impulsar la historia' : undefined)
        ],
        commonMistakes: [
          createBilingualText("Avoid overusing adverbs and adjectives", nativeLanguage?.toLowerCase() === 'spanish' ? 'Evita usar demasiados adverbios y adjetivos' : undefined),
          createBilingualText("Don't info-dump - reveal information gradually", nativeLanguage?.toLowerCase() === 'spanish' ? 'No hagas info-dump - revela información gradualmente' : undefined)
        ],
        improvementAreas: [
          createBilingualText("Practice writing dialogue that sounds natural", nativeLanguage?.toLowerCase() === 'spanish' ? 'Practica escribir diálogo que suene natural' : undefined),
          createBilingualText("Work on creating compelling opening scenes", nativeLanguage?.toLowerCase() === 'spanish' ? 'Trabaja en crear escenas de apertura convincentes' : undefined)
        ]
      },
      conversation: {
        generalTips: [
          createBilingualText("Keep your message clear and easy to understand", nativeLanguage?.toLowerCase() === 'spanish' ? 'Mantén tu mensaje claro y fácil de entender' : undefined),
          createBilingualText("Match the tone to your audience", nativeLanguage?.toLowerCase() === 'spanish' ? 'Ajusta el tono a tu audiencia' : undefined),
          createBilingualText("Use simple, direct language", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa lenguaje simple y directo' : undefined)
        ],
        writingTypeSpecific: [
          createBilingualText("It's okay to use contractions and informal language", nativeLanguage?.toLowerCase() === 'spanish' ? 'Está bien usar contracciones y lenguaje informal' : undefined),
          createBilingualText("Use emojis sparingly and appropriately", nativeLanguage?.toLowerCase() === 'spanish' ? 'Usa emojis con moderación y apropiadamente' : undefined),
          createBilingualText("Keep messages brief and to the point", nativeLanguage?.toLowerCase() === 'spanish' ? 'Mantén mensajes breves y al punto' : undefined)
        ],
        commonMistakes: [
          createBilingualText("Don't assume your tone is clear - be explicit", nativeLanguage?.toLowerCase() === 'spanish' ? 'No asumas que tu tono es claro - sé explícito' : undefined),
          createBilingualText("Avoid typing in all caps (it seems like shouting)", nativeLanguage?.toLowerCase() === 'spanish' ? 'Evita escribir todo en mayúsculas (parece gritar)' : undefined)
        ],
        improvementAreas: [
          createBilingualText("Practice being more conversational and natural", nativeLanguage?.toLowerCase() === 'spanish' ? 'Practica ser más conversacional y natural' : undefined),
          createBilingualText("Work on expressing emotions clearly in text", nativeLanguage?.toLowerCase() === 'spanish' ? 'Trabaja en expresar emociones claramente en texto' : undefined)
        ]
      }
    };

    return mockSuggestions[writingType] || mockSuggestions.essay;
  }
}

export const goalBasedFeedbackService = new GoalBasedFeedbackService(); 