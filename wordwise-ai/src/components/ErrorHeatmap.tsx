import React from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, BarChart3 } from 'lucide-react';
import type { ErrorHeatmapData } from '../services/errorPatternService';
import { errorPatternService } from '../services/errorPatternService';

interface ErrorHeatmapProps {
  data: ErrorHeatmapData;
  onClose: () => void;
}

const ErrorHeatmap: React.FC<ErrorHeatmapProps> = ({ data, onClose }) => {
  const categoryInfo = errorPatternService.getErrorCategoryInfo();

  // Group patterns by category
  const groupedPatterns = data.patterns.reduce((acc, pattern) => {
    if (!acc[pattern.category]) {
      acc[pattern.category] = [];
    }
    acc[pattern.category].push(pattern);
    return acc;
  }, {} as Record<string, typeof data.patterns>);

  // Calculate category averages
  const categoryStats = Object.entries(groupedPatterns).map(([category, patterns]) => {
    const totalErrors = patterns.reduce((sum, p) => sum + p.count, 0);
    const totalOpportunities = patterns.reduce((sum, p) => sum + p.totalOpportunities, 0);
    const avgAccuracy = patterns.reduce((sum, p) => sum + p.accuracy, 0) / patterns.length;
    
    const categoryColor = Object.values(categoryInfo).find(c => c.name === category)?.color || '#9ca3af';
    
    return {
      category,
      patterns,
      totalErrors,
      totalOpportunities,
      avgAccuracy: Math.round(avgAccuracy),
      color: categoryColor,
      description: Object.values(categoryInfo).find(c => c.name === category)?.description || ''
    };
  }).sort((a, b) => a.avgAccuracy - b.avgAccuracy); // Sort by accuracy (worst first)

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'bg-green-500';
    if (accuracy >= 80) return 'bg-yellow-500';
    if (accuracy >= 70) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getAccuracyTextColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-700';
    if (accuracy >= 80) return 'text-yellow-700';
    if (accuracy >= 70) return 'text-orange-700';
    return 'text-red-700';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
              Error Pattern Heatmap
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Visual analysis of your writing patterns and areas for improvement
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Overall Statistics */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{data.overallAccuracy}%</div>
              <div className="text-sm text-gray-600">Overall Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{data.totalErrors}</div>
              <div className="text-sm text-gray-600">Total Errors</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <AlertTriangle className={`h-5 w-5 mr-1 ${data.mostProblematicArea !== 'None' ? 'text-red-500' : 'text-gray-400'}`} />
                <div className="text-sm font-medium text-gray-700">
                  {data.mostProblematicArea !== 'None' ? data.mostProblematicArea : 'No issues'}
                </div>
              </div>
              <div className="text-xs text-gray-500">Most Challenging</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <CheckCircle className={`h-5 w-5 mr-1 ${data.strongestArea !== 'None' ? 'text-green-500' : 'text-gray-400'}`} />
                <div className="text-sm font-medium text-gray-700">
                  {data.strongestArea !== 'None' ? data.strongestArea : 'Keep writing'}
                </div>
              </div>
              <div className="text-xs text-gray-500">Strongest Area</div>
            </div>
          </div>
        </div>

        {/* Category Heatmap */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Error Categories (Ranked by Accuracy)
          </h3>
          
          <div className="space-y-4">
            {categoryStats.map((category, index) => (
              <div key={category.category} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded mr-3" 
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{category.category}</h4>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getAccuracyTextColor(category.avgAccuracy)}`}>
                      {category.avgAccuracy}%
                    </div>
                    <div className="text-sm text-gray-500">
                      {category.totalErrors}/{category.totalOpportunities} errors
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full ${getAccuracyColor(category.avgAccuracy)}`}
                    style={{ width: `${category.avgAccuracy}%` }}
                  />
                </div>

                {/* Subcategory breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {category.patterns.map((pattern) => (
                    <div key={pattern.subcategory} className="bg-gray-50 rounded p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{pattern.subcategory}</span>
                        <span className={`text-sm font-bold ${getAccuracyTextColor(pattern.accuracy)}`}>
                          {Math.round(pattern.accuracy)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {pattern.count} errors, {pattern.totalOpportunities} opportunities
                      </div>
                      {pattern.examples.length > 0 && (
                        <div className="text-xs text-gray-600 mt-1 italic">
                          Example: "{pattern.examples[0]}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {categoryStats.length === 0 && (
            <div className="text-center py-12">
              <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Error Patterns Yet</h3>
              <p className="text-gray-600">
                Start writing and analyzing your text to see your error patterns appear here.
                <br />
                The more you write, the more accurate your heatmap will become!
              </p>
            </div>
          )}
        </div>

        {/* Tips Section */}
        {categoryStats.length > 0 && (
          <div className="p-6 bg-gray-50 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Improvement Suggestions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Focus Areas</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {categoryStats.slice(0, 2).map((category) => (
                    <li key={category.category}>
                      • Work on <strong>{category.category}</strong> ({category.avgAccuracy}% accuracy)
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Strong Areas</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  {categoryStats.slice(-2).reverse().map((category) => (
                    <li key={category.category}>
                      • Keep up the good work with <strong>{category.category}</strong> ({category.avgAccuracy}% accuracy)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t text-center">
          <p className="text-sm text-gray-500">
            Last updated: {data.lastUpdated.toLocaleDateString()} at {data.lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorHeatmap; 