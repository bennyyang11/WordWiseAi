import React, { useState } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { sampleEssays } from '../data/sampleEssays';
import { useWritingStore } from '../store/writingStore';
import toast from 'react-hot-toast';

const SampleEssayLoader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setCurrentDocument } = useWritingStore();

  const loadSampleEssay = (essay: typeof sampleEssays[0]) => {
    const newDocument = {
      id: essay.id,
      title: essay.title,
      content: essay.content,
      createdAt: new Date(),
      updatedAt: new Date(),
      type: 'essay' as const,
      wordCount: essay.content.trim().split(/\s+/).filter(word => word.length > 0).length,
    };

    setCurrentDocument(newDocument);
    setIsOpen(false);
    toast.success(`Loaded "${essay.title}" - Try WordWise AI analysis!`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
      >
        <FileText className="h-4 w-4" />
        <span>Sample Essays</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Sample Essays for Testing</h3>
            <p className="text-xs text-gray-600 mt-1">
              Load essays with common ESL mistakes to test WordWise AI
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {sampleEssays.map((essay) => (
              <button
                key={essay.id}
                onClick={() => loadSampleEssay(essay)}
                className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                    {essay.title}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(essay.difficulty)}`}>
                    {essay.difficulty}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="capitalize">{essay.type}</span>
                  <span>•</span>
                  <span>{essay.targetWordCount} words target</span>
                </div>
                
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                  {essay.content.substring(0, 100)}...
                </p>
              </button>
            ))}
          </div>
          
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600">
              💡 These essays contain intentional mistakes common among ESL students. 
              Watch how WordWise AI detects and explains each issue!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SampleEssayLoader; 