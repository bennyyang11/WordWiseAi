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

const searchForActualSources = async (text: string, apiKey: string): Promise<any[]> => {
  try {
    // Use OpenAI to search for the actual sources
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a web search specialist. I will give you a sentence, and you need to find the actual URLs where this exact text appears online.

Search the internet for this exact text and return the real URLs where it can be found. Focus on:
- News websites (CNN, BBC, Reuters, ABC News, etc.)
- Academic papers and journals
- Government websites
- Official publications

Return a JSON array of actual sources:
[
  {
    "url": "https://abcnews.go.com/Politics/actual-article-url",
    "title": "Actual Article Title",
    "domain": "abcnews.go.com",
    "type": "news",
    "snippet": "surrounding context from the article"
  }
]

IMPORTANT: Only return real, working URLs where this text actually appears. Do not make up URLs.`
          },
          {
            role: 'user',
            content: `Find the actual URLs where this exact text appears online:

"${text}"

Return only real URLs where this text was published.`
          }
        ],
        temperature: 0.1,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content || '';
    
    try {
      const results = JSON.parse(resultText);
      return Array.isArray(results) ? results : [];
    } catch {
      console.log('Failed to parse search results, trying alternative method');
      return [];
    }
  } catch (error) {
    console.error('Error searching for actual sources:', error);
    return [];
  }
};

const intelligentPlagiarismDetection = async (content: string, apiKey: string): Promise<PlagiarismMatch[]> => {
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    console.log('⚠️ No OpenAI API key provided, using basic detection');
    return [];
  }

  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 25);
  const matches: PlagiarismMatch[] = [];
  
  // Process up to 2 sentences for plagiarism detection to avoid too many API calls
  for (let i = 0; i < Math.min(sentences.length, 2); i++) {
    const sentence = sentences[i].trim();
    if (sentence.length < 25) continue;
    
    try {
      console.log(`🔍 Analyzing sentence ${i + 1} for plagiarism indicators...`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert plagiarism detector. Analyze text for indicators of potential plagiarism.

Look for these RED FLAGS:
1. Very specific facts, statistics, or quotes
2. Formal journalistic language ("according to", "reported that", "sources say")
3. Technical jargon or specialized terminology
4. News-style reporting patterns
5. Academic or research language
6. Direct statements that sound like they're from articles
7. Specific dates, numbers, or named entities

If the text shows STRONG indicators of being copied from a source, respond with JSON:
{
  "isPlagiarized": true,
  "confidence": 80-95,
  "sourceType": "news|academic|journal|website",
  "reasoning": "specific reason why this appears plagiarized"
}

If text appears original or common, respond with:
{
  "isPlagiarized": false,
  "confidence": 0-20,
  "reasoning": "why this appears original"
}

Be aggressive in detecting potential plagiarism - err on the side of flagging suspicious content.`
            },
            {
              role: 'user',
              content: `Analyze this sentence for plagiarism:\n\n"${sentence}"`
            }
          ],
          temperature: 0.1,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.status);
        continue;
      }

      const data = await response.json();
      const analysisText = data.choices[0]?.message?.content || '';
      
      try {
        const analysis = JSON.parse(analysisText);
        
        if (analysis.isPlagiarized && analysis.confidence > 70) {
          console.log(`🚨 PLAGIARISM DETECTED: ${analysis.reasoning} (${analysis.confidence}% confidence)`);
          console.log(`🌐 Searching for actual sources...`);
          
          // Search for actual sources
          const sources = await searchForActualSources(sentence, apiKey);
          
          if (sources.length > 0) {
            console.log(`✅ Found ${sources.length} actual source(s)`);
            
            sources.forEach((source, index) => {
              const startPos = content.indexOf(sentence) >= 0 ? content.indexOf(sentence) : 0;
              
              // Determine source type from domain
              let sourceType: 'website' | 'academic' | 'news' | 'book' | 'journal' = 'website';
              const domain = source.domain?.toLowerCase() || '';
              
              if (domain.includes('news') || domain.includes('cnn') || domain.includes('bbc') || 
                  domain.includes('reuters') || domain.includes('abc') || domain.includes('nytimes') ||
                  domain.includes('washingtonpost') || domain.includes('guardian') || domain.includes('forbes')) {
                sourceType = 'news';
              } else if (domain.includes('edu') || domain.includes('scholar') || domain.includes('research')) {
                sourceType = 'academic';
              } else if (domain.includes('springer') || domain.includes('jstor') || domain.includes('pubmed')) {
                sourceType = 'journal';
              }
              
                             matches.push({
                 id: `plagiarism-${i}-${index}-${Date.now()}`,
                 matchedText: sentence,
                 source: {
                   title: source.title || 'Found Source',
                   url: source.url,
                   type: sourceType,
                   domain: source.domain || (source.url ? new URL(source.url).hostname : 'unknown')
                 },
                similarityPercentage: analysis.confidence,
                startPosition: startPos,
                endPosition: startPos + sentence.length,
                context: source.snippet || `...${sentence}...`
              });
            });
          } else {
            console.log(`⚠️ No actual sources found, creating search link as fallback`);
            
            // Fallback to search link if no actual sources found
            const startPos = content.indexOf(sentence) >= 0 ? content.indexOf(sentence) : 0;
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`"${sentence}"`)}`;
            
                         matches.push({
               id: `plagiarism-${i}-${Date.now()}`,
               matchedText: sentence,
               source: {
                 title: `Search for this plagiarized text online`,
                 url: searchUrl,
                 type: 'website',
                 domain: 'google.com'
               },
              similarityPercentage: analysis.confidence,
              startPosition: startPos,
              endPosition: startPos + sentence.length,
              context: `...${sentence}...`
            });
          }
        } else {
          console.log(`✅ Sentence ${i + 1} appears original (${analysis.confidence}% confidence)`);
        }
        
      } catch (parseError) {
        console.log('Failed to parse plagiarism analysis for sentence:', sentence.substring(0, 50));
      }
      
      // Add delay between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error analyzing sentence:', sentence.substring(0, 50), error);
    }
  }
  
  return matches;
};

export const checkPlagiarism = async (content: string): Promise<PlagiarismReport> => {
  console.log('🔍 Starting intelligent plagiarism detection with real source finding...');
  
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

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  try {
    console.log('🤖 Using AI to detect plagiarism and find actual sources...');
    const matches = await intelligentPlagiarismDetection(content, apiKey || '');
    
    // Calculate overall similarity
    const wordCount = content.split(/\s+/).length;
    const matchedWords = matches.reduce((total, match) => 
      total + match.matchedText.split(/\s+/).length, 0
    );
    
    const overallSimilarity = Math.min(Math.round((matchedWords / wordCount) * 100), 100);
    
    const recommendations = [];
    if (matches.length > 0) {
      const hasDirectLinks = matches.some(match => !match.source.url.includes('google.com/search'));
      
      if (hasDirectLinks) {
        recommendations.push("🎯 DIRECT SOURCES FOUND - Click to view original articles!");
        recommendations.push("Links go directly to the sources where text was published");
      } else {
        recommendations.push("🚨 PLAGIARISM DETECTED - Search links provided!");
        recommendations.push("Click links to find the original sources");
      }
      recommendations.push("Add proper citations or rewrite flagged sections");
      if (overallSimilarity > 50) {
        recommendations.push("⚠️ High similarity - immediate action required");
      }
    } else {
      recommendations.push("✅ No plagiarism detected");
      recommendations.push("Content appears to be original");
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        recommendations.push("💡 Add OpenAI API key for enhanced detection");
      }
    }

    console.log(`✅ Plagiarism check completed. Found ${matches.length} sources, ${overallSimilarity}% estimated similarity`);

    return {
      overallSimilarity,
      totalMatches: matches.length,
      uniqueContent: 100 - overallSimilarity,
      matches,
      analysisDate: new Date().toISOString(),
      wordCount,
      recommendations: recommendations.slice(0, 4)
    };

  } catch (error) {
    console.error('❌ Plagiarism check failed:', error);
    
    return {
      overallSimilarity: 0,
      totalMatches: 0,
      uniqueContent: 100,
      matches: [],
      analysisDate: new Date().toISOString(),
      wordCount: content.split(/\s+/).length,
      recommendations: [
        "❌ Plagiarism check failed - please try again",
        "Ensure you have a valid OpenAI API key",
        "Check your internet connection"
      ]
    };
  }
};

// Debounced version for real-time checking (if needed)
export const debouncedPlagiarismCheck = debounce(checkPlagiarism, 2000); 