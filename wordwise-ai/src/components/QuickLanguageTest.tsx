import React, { useState } from 'react';
import LanguageSelector from './LanguageSelector';
import { openaiService } from '../services/openaiService';

const QuickLanguageTest: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testSentences = [
    'I goed to the store yesterday.',
    'My teacher give me alot of homework.',
    'I am very exciting about my vacation.',
    'The weather was very good and very nice.',
    'I have buyed some new clothes.'
  ];

  const quickTest = async (sentence: string) => {
    setIsLoading(true);
    try {
      const selectedLang = selectedLanguage === 'en' ? undefined : 
        selectedLanguage === 'es' ? 'Spanish' :
        selectedLanguage === 'zh' ? 'Chinese' :
        selectedLanguage === 'fr' ? 'French' : 'Spanish';

      const result = await openaiService.analyzeText(sentence, 'intermediate', selectedLang);
      setSuggestions(result.grammarSuggestions);
    } catch (error) {
      console.error('Test failed:', error);
      // Show mock result for demo
      setSuggestions([
        {
          originalText: 'goed',
          suggestion: 'went',
          message: selectedLanguage === 'en' ? 
            'Past tense of "go" is "went"' :
            selectedLanguage === 'es' ?
              'Past tense of "go" is "went" | El pasado de "go" es "went"' :
              selectedLanguage === 'zh' ?
                'Past tense of "go" is "went" | "go"的过去式是"went"' :
                'Past tense of "go" is "went" | Le passé de "go" est "went"',
          type: 'grammar',
          severity: 'error'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-center">
        🚀 Quick Language Selector Test
      </h2>

      <div className="mb-6">
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          showNativeNames={true}
          compact={false}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3">📝 Test Sentences:</h3>
          <div className="space-y-2">
            {testSentences.map((sentence, index) => (
              <button
                key={index}
                onClick={() => quickTest(sentence)}
                disabled={isLoading}
                className="w-full text-left p-3 border rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {sentence}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">
            💡 Results ({selectedLanguage === 'en' ? 'English Only' : 'Bilingual'}):
          </h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Analyzing...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-mono text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                      "{suggestion.originalText}"
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="font-mono text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                      "{suggestion.suggestion}"
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    <strong>Explanation:</strong> {suggestion.message}
                  </div>
                  
                  {suggestion.message?.includes('|') && (
                    <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      🌍 This explanation includes both English and your selected language!
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center p-8">
              Click a test sentence to see multilingual suggestions
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">🎯 Quick Test Instructions:</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Select a language from the dropdown above</li>
          <li>2. Click any test sentence on the left</li>
          <li>3. See how suggestions change based on your language choice</li>
          <li>4. Notice bilingual explanations when non-English is selected</li>
          <li>5. Try switching languages and testing the same sentence</li>
        </ol>
      </div>
    </div>
  );
};

export default QuickLanguageTest; 