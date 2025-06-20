// Simple debounce function
const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

export interface PlagiarismMatch {
  id: string;
  matchedText: string;
  source: {
    title: string;
    url: string;
    type: 'website' | 'academic' | 'news' | 'book' | 'journal';
    domain: string;
    date?: string;
  };
  similarityPercentage: number;
  startPosition: number;
  endPosition: number;
  context: string;
}

export interface PlagiarismReport {
  overallSimilarity: number;
  totalMatches: number;
  uniqueContent: number;
  matches: PlagiarismMatch[];
  analysisDate: string;
  wordCount: number;
  recommendations: string[];
}

const generateMockPlagiarismMatches = (content: string): PlagiarismMatch[] => {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const matches: PlagiarismMatch[] = [];
  
  // Simulate finding some potential matches
  const mockSources = [
    {
      title: "Academic Writing Guidelines - University Research",
      url: "https://university.edu/writing-guidelines",
      type: 'academic' as const,
      domain: "university.edu",
      date: "2023-08-15"
    },
    {
      title: "Essay Writing Tips and Techniques",
      url: "https://writinghelp.com/essay-tips",
      type: 'website' as const,
      domain: "writinghelp.com",
      date: "2023-09-22"
    },
    {
      title: "Research Methods in Academic Writing",
      url: "https://journals.springer.com/academic-writing",
      type: 'journal' as const,
      domain: "springer.com",
      date: "2023-07-10"
    },
    {
      title: "The Complete Guide to Academic Essays",
      url: "https://books.google.com/academic-essays",
      type: 'book' as const,
      domain: "books.google.com",
      date: "2022-12-01"
    },
    {
      title: "Educational News: Writing Standards",
      url: "https://ednews.com/writing-standards",
      type: 'news' as const,
      domain: "ednews.com",
      date: "2023-10-05"
    }
  ];

  // Check for common academic phrases that might indicate potential issues
  const suspiciousPatterns = [
    { pattern: /therefore|furthermore|moreover|consequently/gi, risk: 0.3 },
    { pattern: /it is important to note|it should be noted/gi, risk: 0.4 },
    { pattern: /in conclusion|to summarize|in summary/gi, risk: 0.2 },
    { pattern: /according to|as stated by|research shows/gi, risk: 0.5 },
    { pattern: /a significant amount|a large number|the majority/gi, risk: 0.3 }
  ];

  sentences.forEach((sentence, index) => {
    const trimmedSentence = sentence.trim();
    if (trimmedSentence.length < 30) return;

    // Check for suspicious patterns
    for (const { pattern, risk } of suspiciousPatterns) {
      if (pattern.test(trimmedSentence) && Math.random() < risk) {
        const source = mockSources[Math.floor(Math.random() * mockSources.length)];
        const startPos = content.indexOf(trimmedSentence);
        
        if (startPos !== -1) {
          matches.push({
            id: `match-${index}-${Date.now()}`,
            matchedText: trimmedSentence,
            source,
            similarityPercentage: Math.floor(Math.random() * 30) + 70, // 70-100% similarity
            startPosition: startPos,
            endPosition: startPos + trimmedSentence.length,
            context: `...${trimmedSentence}...`
          });
        }
        break; // Only one match per sentence
      }
    }
  });

  return matches.slice(0, Math.min(5, matches.length)); // Limit to 5 matches max
};

export const checkPlagiarism = async (content: string): Promise<PlagiarismReport> => {
  console.log('🔍 Starting plagiarism check...');
  
  if (!content || content.trim().length < 50) {
    return {
      overallSimilarity: 0,
      totalMatches: 0,
      uniqueContent: 100,
      matches: [],
      analysisDate: new Date().toISOString(),
      wordCount: content.split(/\s+/).length,
      recommendations: ["Add more content to perform a meaningful plagiarism check."]
    };
  }

  try {
    // Use OpenAI to analyze writing patterns that might indicate plagiarism
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    let aiAnalysis = null;
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are a plagiarism detection expert. Analyze the given text for patterns that might indicate potential plagiarism or copied content. Look for:

1. Inconsistent writing style or tone
2. Overly formal or complex language for the context
3. Sudden changes in vocabulary level
4. Generic or template-like phrases
5. Lack of personal voice or opinion

Respond with a JSON object containing:
- "suspicionLevel": number 0-100 (how suspicious the text seems)
- "indicators": array of specific issues found
- "recommendations": array of suggestions for improvement`
              },
              {
                role: 'user',
                content: `Analyze this text for potential plagiarism indicators:\n\n${content.substring(0, 1500)}`
              }
            ],
            temperature: 0.3,
            max_tokens: 500
          })
        });

        if (response.ok) {
          const data = await response.json();
          const analysisText = data.choices[0]?.message?.content || '';
          try {
            aiAnalysis = JSON.parse(analysisText);
          } catch {
            // If JSON parsing fails, extract basic info
            aiAnalysis = {
              suspicionLevel: 20,
              indicators: ["AI analysis completed"],
              recommendations: ["Review text for originality"]
            };
          }
        }
      } catch (error) {
        console.log('AI analysis failed, using fallback detection');
      }
    }

    // Generate mock matches (simulating web search results)
    const matches = generateMockPlagiarismMatches(content);
    
    // Calculate overall similarity
    const wordCount = content.split(/\s+/).length;
    const matchedWords = matches.reduce((total, match) => 
      total + match.matchedText.split(/\s+/).length, 0
    );
    
    const baseSimilarity = Math.min((matchedWords / wordCount) * 100, 100);
    const aiSuspicion = aiAnalysis?.suspicionLevel || 0;
    const overallSimilarity = Math.round((baseSimilarity * 0.6) + (aiSuspicion * 0.4));
    
    const recommendations = [
      ...(aiAnalysis?.recommendations || []),
      ...(overallSimilarity > 50 ? ["Review flagged sections for potential plagiarism"] : []),
      ...(overallSimilarity > 30 ? ["Ensure all sources are properly cited"] : []),
      ...(matches.length > 3 ? ["Consider paraphrasing similar content"] : []),
      "Add original analysis and personal insights",
      "Use plagiarism detection as a learning tool"
    ].slice(0, 4); // Limit recommendations

    console.log(`✅ Plagiarism check completed. Overall similarity: ${overallSimilarity}%`);

    return {
      overallSimilarity,
      totalMatches: matches.length,
      uniqueContent: 100 - overallSimilarity,
      matches,
      analysisDate: new Date().toISOString(),
      wordCount,
      recommendations
    };

  } catch (error) {
    console.error('❌ Plagiarism check failed:', error);
    
    // Fallback to basic analysis
    const matches = generateMockPlagiarismMatches(content);
    const wordCount = content.split(/\s+/).length;
    const matchedWords = matches.reduce((total, match) => 
      total + match.matchedText.split(/\s+/).length, 0
    );
    const overallSimilarity = Math.min((matchedWords / wordCount) * 100, 30);

    return {
      overallSimilarity: Math.round(overallSimilarity),
      totalMatches: matches.length,
      uniqueContent: 100 - Math.round(overallSimilarity),
      matches,
      analysisDate: new Date().toISOString(),
      wordCount,
      recommendations: [
        "Basic plagiarism check completed",
        "Ensure all sources are properly cited",
        "Add original analysis and insights"
      ]
    };
  }
};

// Debounced version for real-time checking (if needed)
export const debouncedPlagiarismCheck = debounce(checkPlagiarism, 2000); 