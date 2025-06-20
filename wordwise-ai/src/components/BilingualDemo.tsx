import React, { useState } from 'react';
import { enhancedAiService } from '../services/enhancedAiService';
import type { UserProfile } from '../types';
import LanguageSelector, { POPULAR_LANGUAGES } from './LanguageSelector';

const BilingualDemo: React.FC = () => {
  const [text, setText] = useState('I alot of mistakes in my writing. I goed to the store yesterday and buyed some milk.');
  const [selectedLanguageCode, setSelectedLanguageCode] = useState('es'); // Default to Spanish
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const selectedLanguage = POPULAR_LANGUAGES.find(lang => lang.code === selectedLanguageCode);
  const nativeLanguageName = selectedLanguage?.name || 'English';

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    const mockProfile: UserProfile = {
      id: 'demo',
      name: 'Demo User',
      email: 'demo@example.com',
      nativeLanguage: nativeLanguageName,
      englishLevel: 'intermediate' as const,
      writingGoals: {
        type: 'academic',
        targetWordCount: 500,
        targetAudience: 'professor',
        formalityLevel: 'formal',
        essayType: 'argumentative',
      },
      preferences: {
        showExplanations: true,
        highlightComplexWords: true,
        suggestSimplifications: true,
        realTimeAnalysis: true,
      }
    };

    try {
      const result = await enhancedAiService.analyzeText(text, mockProfile);
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguageCode(languageCode);
    // Clear suggestions when language changes
    setSuggestions([]);
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">🌍 Multilingual Writing Assistant</h2>
        <p className="text-gray-600">
          Get writing suggestions in English + your native language for better learning
        </p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Input Section */}
        <div className="space-y-4 min-w-0 w-full max-w-full">
          <div className="bg-white p-4 rounded-lg shadow-sm border w-full max-w-full overflow-hidden">
            <LanguageSelector
              selectedLanguage={selectedLanguageCode}
              onLanguageChange={handleLanguageChange}
              showNativeNames={true}
              className="mb-6"
            />

            <label className="block text-sm font-medium mb-2">
              📝 Text to Analyze:
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-40 p-4 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Enter text with errors to see multilingual suggestions..."
            />

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  🚀 Analyze Text
                </span>
              )}
            </button>
          </div>

          {/* Sample Texts */}
          <div className="bg-gray-50 p-4 rounded-lg w-full max-w-full overflow-hidden">
            <h4 className="font-semibold mb-2">📚 Try These Sample Texts:</h4>
            <div className="space-y-2">
              <button
                onClick={() => setText('I have went to the store yesterday and buyed some foods. It was very good experience.')}
                className="text-left w-full p-2 text-sm bg-white border rounded hover:bg-blue-50 transition-colors break-words"
              >
                📝 Past tense errors
              </button>
              <button
                onClick={() => setText('My teacher give me alot of homeworks. I must to finish it before tomorrow.')}
                className="text-left w-full p-2 text-sm bg-white border rounded hover:bg-blue-50 transition-colors break-words"
              >
                📝 Grammar & spelling mix
              </button>
              <button
                onClick={() => setText('I am very exciting about my vacation. The weather is very good and very nice.')}
                className="text-left w-full p-2 text-sm bg-white border rounded hover:bg-blue-50 transition-colors break-words"
              >
                📝 Vocabulary improvements
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4 min-w-0 w-full max-w-full">
          <div className="bg-white p-4 rounded-lg shadow-sm border w-full max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <h3 className="text-xl font-semibold">
                📋 Suggestions
              </h3>
              {suggestions.length > 0 && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex-shrink-0">
                  {suggestions.length} found
                </span>
              )}
            </div>
            
            {suggestions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-lg mb-2">No suggestions yet</p>
                <p className="text-sm">
                  {text.trim() ? 'Click "Analyze Text" to get suggestions' : 'Enter some text first'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto w-full">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-lg p-3 hover:shadow-md transition-shadow w-full">
                    <div className="flex flex-col gap-2 mb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                        <span className="font-mono text-xs bg-red-100 text-red-800 px-2 py-1 rounded truncate max-w-full">
                          "{suggestion.originalText}"
                        </span>
                        <span className="text-gray-400 self-center flex-shrink-0">→</span>
                        <span className="font-mono text-xs bg-green-100 text-green-800 px-2 py-1 rounded truncate max-w-full">
                          "{suggestion.suggestedText}"
                        </span>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize self-start">
                        {suggestion.type}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-700 leading-relaxed break-words w-full">
                      <strong>Explanation:</strong> {suggestion.explanation}
                    </div>
                    
                    {suggestion.explanation.includes('|') && selectedLanguage && (
                      <div className="mt-3 flex items-start text-xs text-blue-600 bg-blue-50 p-2 rounded gap-2 w-full">
                        <span className="flex-shrink-0">{selectedLanguage.flag}</span>
                        <span className="break-words w-full">
                          Bilingual explanation in English + {selectedLanguage.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border w-full">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">✨</span>
              How Multilingual Suggestions Work
            </h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 flex-shrink-0">🌍</span>
                <span className="break-words">Choose your native language from 15+ popular options</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 flex-shrink-0">🤖</span>
                <span className="break-words">AI provides explanations in both English and your language</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 flex-shrink-0">📚</span>
                <span className="break-words">Learn grammar rules faster with bilingual explanations</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5 flex-shrink-0">🚀</span>
                <span className="break-words">Perfect for ESL students and language learners</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BilingualDemo; 