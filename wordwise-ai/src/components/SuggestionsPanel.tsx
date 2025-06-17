import React from 'react';
import { useWritingStore } from '../store/writingStore';
import toast from 'react-hot-toast';

const SuggestionsPanel: React.FC = () => {
  const {
    suggestions,
    selectedSuggestion,
    applySuggestion,
    dismissSuggestion,
    setSelectedSuggestion,
    analysisResult,
    currentDocument
  } = useWritingStore();

  const handleApplySuggestion = (suggestionId: string) => {
    applySuggestion(suggestionId);
    toast.success('Suggestion applied!');
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    dismissSuggestion(suggestionId);
    toast.success('Suggestion dismissed');
  };

  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    const type = suggestion.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(suggestion);
    return groups;
  }, {} as Record<string, typeof suggestions>);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Writing Assistant</h2>
        <p className="text-sm text-gray-600">
          {suggestions.length} suggestions • Click to review
        </p>
      </div>

      {/* Writing Overview */}
      {analysisResult && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Score</span>
            <span className="text-lg font-bold text-primary-600">
              {analysisResult.overallScore}/100
            </span>
          </div>

          <div className="space-y-2">
            {analysisResult.strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-700 mb-1">Strengths:</p>
                <ul className="text-xs text-green-600 space-y-1">
                  {analysisResult.strengths.map((strength, index) => (
                    <li key={index}>• {strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.areasForImprovement.length > 0 && (
              <div>
                <p className="text-xs font-medium text-yellow-700 mb-1">Areas to improve:</p>
                <ul className="text-xs text-yellow-600 space-y-1">
                  {analysisResult.areasForImprovement.map((area, index) => (
                    <li key={index}>• {area}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto">
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Great work!
            </h3>
            <p className="text-sm text-gray-600">
              No suggestions at the moment. Keep writing and WordWise AI will help you improve.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => (
              <div key={type}>
                <div className="sticky top-0 bg-white px-4 py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {type} ({typeSuggestions.length})
                  </span>
                </div>

                {typeSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedSuggestion?.id === suggestion.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedSuggestion(suggestion)}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {suggestion.severity === 'error' ? 'Error' :
                         suggestion.severity === 'warning' ? 'Warning' : 'Suggestion'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="line-through text-red-500">
                          "{suggestion.originalText}"
                        </span>
                        <span className="mx-2">→</span>
                        <span className="text-green-600 font-medium">
                          "{suggestion.suggestedText}"
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">
                      {suggestion.explanation}
                    </p>

                    {suggestion.examples && suggestion.examples.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">Examples:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {suggestion.examples.map((example, index) => (
                            <li key={index}>• {example}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplySuggestion(suggestion.id);
                        }}
                        className="px-3 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                      >
                        Apply
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissSuggestion(suggestion.id);
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {currentDocument && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {currentDocument.wordCount}
              </div>
              <div className="text-xs text-gray-600">Words</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {analysisResult?.metrics.readabilityScore || 0}
              </div>
              <div className="text-xs text-gray-600">Readability</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionsPanel;
