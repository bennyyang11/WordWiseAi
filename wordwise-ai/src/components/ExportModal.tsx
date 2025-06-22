import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  FileText, 
  Globe, 
  File, 
  FileType,
  CheckCircle,
  Settings,
  X
} from "lucide-react";
import { exportService } from '../services/exportService';
import type { ExportFormat, ExportOptions } from '../services/exportService';
import type { Document } from '../types';

interface ExportModalProps {
  document: Document;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ document, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('txt');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeStatistics, setIncludeStatistics] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const formats = exportService.getAvailableFormats();

  const getFormatIcon = (format: ExportFormat) => {
    const icons = {
      txt: FileText,
      html: Globe,
      rtf: File,
      docx: FileType,
      pdf: File,
    };
    return icons[format] || FileText;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const options: ExportOptions = {
        format: selectedFormat,
        title: document.title,
        includeMetadata,
        includeStatistics,
      };

      const result = await exportService.exportDocument(document, options);
      
      if (result.success) {
        // Show success message or toast
        console.log('Export successful:', result.fileName);
        onClose();
      } else {
        console.error('Export failed:', result.error);
        // Show error message
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatRecommendation = (format: ExportFormat) => {
    const recommendations = {
      txt: 'Best for simple text sharing',
      html: 'Great for web publishing or email',
      rtf: 'Perfect for Word/Google Docs compatibility',
      docx: 'Professional Microsoft Word format',
      pdf: 'Professional document sharing',
    };
    return recommendations[format] || '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          {/* Header */}
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Export Document</h2>
                <p className="text-gray-600">"{document.title}"</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Format Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Export Format</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formats.map((format) => {
                  const Icon = getFormatIcon(format.value);
                  const isSelected = selectedFormat === format.value;
                  
                  return (
                    <Card 
                      key={format.value}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
                          : 'hover:shadow-md hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedFormat(format.value)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-sm">{format.label}</CardTitle>
                            <CardDescription className="text-xs">
                              {format.description}
                            </CardDescription>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-gray-500">
                          {getFormatRecommendation(format.value)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Export Options */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Export Options
              </h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Include Document Information</span>
                    <p className="text-xs text-gray-600">Add title, creation date, and word count</p>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={includeStatistics}
                    onChange={(e) => setIncludeStatistics(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Include Statistics</span>
                    <p className="text-xs text-gray-600">Add word count, character count, and paragraph count</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Document Preview */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Document Preview</h3>
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Title:</strong> {document.title}</div>
                  <div><strong>Word Count:</strong> {document.wordCount}</div>
                  <div><strong>Characters:</strong> {document.content.length}</div>
                  <div><strong>Last Modified:</strong> {document.updatedAt.toLocaleDateString()}</div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {document.content.substring(0, 200)}
                    {document.content.length > 200 && '...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-6 bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Exporting as <strong>{formats.find(f => f.value === selectedFormat)?.label}</strong>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={onClose} disabled={isExporting}>
                  Cancel
                </Button>
                <Button onClick={handleExport} disabled={isExporting}>
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export Document
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal; 