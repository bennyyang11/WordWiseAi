import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Search, 
  Plus, 
  Clock, 
  ChevronRight,
  BookOpen,
  Mail,
  FileEdit,
  BarChart3,
  PenTool,
  MessageCircle,
  TrendingUp
} from "lucide-react";
import { fileManagementService } from '../services/fileManagementService';
import type { FileMetadata } from '../services/fileManagementService';
import type { AuthState } from '../services/authService';

interface FileBrowserProps {
  authState: AuthState;
  onFileSelect: (fileId: string) => void;
  onNewFile: (type: string) => void;
  onClose: () => void;
}

const getTypeIcon = (type: string) => {
  const icons = {
    essay: BookOpen,
    email: Mail,
    letter: FileEdit,
    report: BarChart3,
    creative: PenTool,
    conversation: MessageCircle,
  };
  return icons[type as keyof typeof icons] || FileText;
};

const getTypeColor = (type: string) => {
  const colors = {
    essay: 'text-blue-600 bg-blue-50',
    email: 'text-green-600 bg-green-50',
    letter: 'text-purple-600 bg-purple-50',
    report: 'text-orange-600 bg-orange-50',
    creative: 'text-yellow-600 bg-yellow-50',
    conversation: 'text-pink-600 bg-pink-50',
  };
  return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50';
};

const FileBrowser: React.FC<FileBrowserProps> = ({ authState, onFileSelect, onNewFile, onClose }) => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    loadFiles();
  }, [authState.user]);

  const loadFiles = async () => {
    if (!authState.user) return;
    
    setLoading(true);
    try {
      const userFiles = await fileManagementService.getUserFiles(authState.user.uid);
      setFiles(userFiles);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.preview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || file.type === selectedType;
    return matchesSearch && matchesType;
  });

  const documentTypes = [
    { value: 'all', label: 'All Files', icon: FileText },
    { value: 'essay', label: 'Essays', icon: BookOpen },
    { value: 'email', label: 'Emails', icon: Mail },
    { value: 'letter', label: 'Letters', icon: FileEdit },
    { value: 'report', label: 'Reports', icon: BarChart3 },
    { value: 'creative', label: 'Creative', icon: PenTool },
    { value: 'conversation', label: 'Casual', icon: MessageCircle },
  ];

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="border-b p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Documents</h2>
                <p className="text-gray-600">Manage your writing projects</p>
              </div>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>

            {/* Search and filters */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search documents..."
                  className="pl-10"
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - New Document */}
            <div className="w-80 border-r bg-gray-50 p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Create New Document</h3>
                  <div className="space-y-2">
                    {documentTypes.slice(1).map(type => {
                      const Icon = type.icon;
                      return (
                        <Button
                          key={type.value}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            onNewFile(type.value);
                            onClose();
                          }}
                        >
                          <Icon className="h-4 w-4 mr-3" />
                          {type.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Total Documents:</span>
                      <span className="font-medium">{files.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Words:</span>
                      <span className="font-medium">
                        {files.reduce((sum, file) => sum + file.wordCount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Score:</span>
                      <span className="font-medium">
                        {files.length > 0 
                          ? Math.round(files.reduce((sum, file) => sum + (file.overallScore || 0), 0) / files.length)
                          : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main content - File list */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading your documents...</span>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No documents found' : 'No documents yet'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search terms or filters'
                      : 'Create your first document to get started'
                    }
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => {
                      onNewFile('essay');
                      onClose();
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Document
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredFiles.map((file) => {
                    const TypeIcon = getTypeIcon(file.type);
                    const typeColors = getTypeColor(file.type);
                    
                    return (
                      <Card 
                        key={file.id} 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 hover:border-l-blue-600"
                        onClick={() => {
                          onFileSelect(file.id);
                          onClose();
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`p-2 rounded-lg ${typeColors}`}>
                                <TypeIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-base line-clamp-1">
                                  {file.title}
                                </CardTitle>
                                <CardDescription className="text-xs capitalize">
                                  {file.type}
                                </CardDescription>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {file.preview}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(file.updatedAt)}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span>{file.wordCount} words</span>
                              {file.overallScore && (
                                <div className="flex items-center space-x-1">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>{file.overallScore}/100</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileBrowser; 