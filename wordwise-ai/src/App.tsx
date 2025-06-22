import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle, Users, TrendingUp, FileText, Save, Download, AlertTriangle, Lightbulb, Mail, FileEdit, BarChart3, PenTool, MessageCircle, ArrowLeft, Globe, Folder, Plus, User, LogOut, Sparkles, Zap, Crown } from "lucide-react";
// import SampleContentGenerator from './components/SampleContentGenerator';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import TextEditor from './components/TextEditor';
import BilingualDemo from './components/BilingualDemo';
import QuickLanguageTest from './components/QuickLanguageTest';
import FileBrowser from './components/FileBrowser';
import ExportModal from './components/ExportModal';
import DebugPanel from './components/DebugPanel';
import { useWritingStore } from './store/writingStore';
import { authService } from './services/authService';
import { goalBasedFeedbackService } from './services/goalBasedFeedbackService';
import { fileManagementService } from './services/fileManagementService';
// import type { User } from 'firebase/auth';
import type { AuthState } from './services/authService';

function App() {
  const { 
    currentDocument, 
    suggestions, 
    analysisResult, 
    isAnalyzing, 
    // updateDocumentContent,
    // goalBasedFeedback,
    // isGeneratingGoalFeedback,
    setGoalBasedFeedback,
    setIsGeneratingGoalFeedback,
    aiWritingSuggestions,
    isGeneratingAISuggestions,
    setAIWritingSuggestions,
    setIsGeneratingAISuggestions,
    userProfile,
    // setUserProfile
  } = useWritingStore();
  
  // Firebase Authentication State
  const [authState, setAuthState] = useState<AuthState>({ user: null, loading: true, error: null });
  const [isWriting, setIsWriting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [writingType, setWritingType] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    nativeLanguage: '',
    englishLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [essayTitle, setEssayTitle] = useState('Untitled Document');

  // Add demo mode state
  const [demoMode, setDemoMode] = useState<'none' | 'bilingual' | 'quicktest'>('none');

  // File management state
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Initialize Firebase Auth listener
  useEffect(() => {
    console.log('🚀 WordWise AI App loaded - ready for enhanced grammar checking!');
    
    const unsubscribe = authService.onAuthStateChange((newAuthState) => {
      setAuthState(newAuthState);
      
      // Auto-show debug panel if there are errors
      if (newAuthState.error && newAuthState.error.includes('400')) {
        setShowDebugPanel(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Generate goal-based feedback when content or writing type changes
  useEffect(() => {
    if (currentDocument?.content && writingType && authState.user) {
      const content = currentDocument.content.trim();
      if (content.length > 20) { // Only generate feedback for substantial content
        setIsGeneratingGoalFeedback(true);
        
        goalBasedFeedbackService.generateFeedbackDebounced(
          content,
          writingType,
          userProfile?.englishLevel || 'intermediate',
          (feedback) => {
            setGoalBasedFeedback(feedback);
            setIsGeneratingGoalFeedback(false);
          },
          2000, // 2 second delay
          userProfile?.nativeLanguage
        );
      } else {
        // Clear feedback for short content
        setGoalBasedFeedback(null);
        setIsGeneratingGoalFeedback(false);
      }
    }
  }, [currentDocument?.content, writingType, userProfile?.englishLevel, userProfile?.nativeLanguage, authState.user, setGoalBasedFeedback, setIsGeneratingGoalFeedback]);

  // Generate AI writing suggestions when writing type or language changes
  useEffect(() => {
    if (writingType && authState.user) {
      setIsGeneratingAISuggestions(true);
      
      goalBasedFeedbackService.generateAIWritingSuggestions(
        writingType,
        userProfile?.englishLevel || 'intermediate',
        userProfile?.nativeLanguage
      ).then((suggestions) => {
        setAIWritingSuggestions(suggestions);
        setIsGeneratingAISuggestions(false);
      }).catch((error) => {
        console.error('Error generating AI writing suggestions:', error);
        setIsGeneratingAISuggestions(false);
      });
    }
  }, [writingType, userProfile?.englishLevel, userProfile?.nativeLanguage, authState.user, setAIWritingSuggestions, setIsGeneratingAISuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple validation
    if (!formData.email || !formData.password) {
      toast.error('Please fill in email and password');
      setIsLoading(false);
      return;
    }

    if (isSignUp && (!formData.name || !formData.nativeLanguage)) {
      toast.error('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign up with Firebase
        const result = await authService.signUp({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          nativeLanguage: formData.nativeLanguage,
          englishLevel: formData.englishLevel
        });
        
        if (!result.success) {
          // Error handling is done in authService with toast
          setIsLoading(false);
          return;
        }
      } else {
        // Sign in with Firebase
        const result = await authService.signIn(formData.email, formData.password);
        
        if (!result.success) {
          // Error handling is done in authService with toast
          setIsLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setIsLoading(false);
    }
    
    setIsLoading(false);
  };

  const handleLogout = async () => {
    const result = await authService.signOut();
    if (result.success) {
      setIsWriting(false);
      setWritingType(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        nativeLanguage: '',
        englishLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced'
      });
    }
  };

  const selectWritingType = (type: string) => {
    setWritingType(type);
    setIsWriting(true);
    // Clear previous feedback and suggestions
    setGoalBasedFeedback(null);
    setIsGeneratingGoalFeedback(false);
    setAIWritingSuggestions(null);
    setIsGeneratingAISuggestions(false);
    // Update document title based on type
    const titles = {
      'essay': 'Untitled Essay',
      'email': 'New Email',
      'letter': 'New Letter',
      'report': 'Untitled Report',
      'creative': 'Creative Writing',
      'conversation': 'Casual Text'
    };
    setEssayTitle(titles[type as keyof typeof titles] || 'Untitled Document');
  };

  // File management handlers
  const handleSave = async () => {
    if (!authState.user) {
      toast.error('Please log in to save your document');
      return;
    }

    setIsSaving(true);
    try {
      const result = await fileManagementService.saveCurrentDocument(
        authState.user.uid,
        essayTitle,
        writingType || 'essay'
      );

      if (result.success) {
        toast.success('Document saved successfully!');
      } else {
        toast.error(result.error || 'Failed to save document');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!currentDocument) {
      toast.error('No document to export');
      return;
    }
    setShowExportModal(true);
  };

  const handleNewFile = (type: string) => {
    const typeMap = {
      'essay': 'essay',
      'email': 'email',
      'letter': 'letter',
      'report': 'report',
      'creative': 'creative',
      'conversation': 'conversation'
    } as const;
    
    const documentType = typeMap[type as keyof typeof typeMap] || 'essay';
    fileManagementService.createNewDocument(documentType, `New ${type.charAt(0).toUpperCase() + type.slice(1)}`);
    
    setWritingType(type);
    setIsWriting(true);
    setEssayTitle(`New ${type.charAt(0).toUpperCase() + type.slice(1)}`);
    
    // Clear previous feedback and suggestions
    setGoalBasedFeedback(null);
    setIsGeneratingGoalFeedback(false);
    setAIWritingSuggestions(null);
    setIsGeneratingAISuggestions(false);
  };

  const handleFileSelect = (fileId: string) => {
    // For now, just show a message that file loading is not implemented yet
    toast.error('File loading will be implemented soon!');
    console.log('Selected file ID:', fileId);
  };

  const backToTypeSelection = () => {
    setIsWriting(false);
    setWritingType(null);
    setDemoMode('none'); // Reset demo mode when going back to type selection
    // Clear all feedback and suggestions
    setGoalBasedFeedback(null);
    setIsGeneratingGoalFeedback(false);
    setAIWritingSuggestions(null);
    setIsGeneratingAISuggestions(false);
  };

  // const backToHome = () => {
  //   setIsWriting(false);
  //   setWritingType(null);
  //   setDemoMode('none'); // Reset demo mode when going back home
  //   // Clear all feedback and suggestions
  //   setGoalBasedFeedback(null);
  //   setIsGeneratingGoalFeedback(false);
  //   setAIWritingSuggestions(null);
  //   setIsGeneratingAISuggestions(false);
  // };

  // Analysis is now handled by the TextEditor component via the writing store

  // Get suggestions by type from the writing store (synced with highlighted errors)
  const getGrammarSuggestions = () => suggestions.filter(s => s.type === 'grammar') || [];
  const getSpellingSuggestions = () => suggestions.filter(s => s.type === 'spelling') || [];
  const getVocabularySuggestions = () => suggestions.filter(s => s.type === 'vocabulary') || [];
  const getStyleSuggestions = () => suggestions.filter(s => s.type === 'style' || s.type === 'structure' || s.type === 'clarity') || [];

  // Helper function to get user initials
  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Show loading spinner while auth is loading
  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0"></div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">Loading WordWise AI</h3>
            <p className="text-gray-600">Preparing your writing assistant...</p>
            <Progress value={75} className="w-64 mt-4" />
          </div>
        </div>
      </div>
    );
  }

  // Show demo mode components
  if (demoMode === 'bilingual') {
    return <BilingualDemo />;
  }

  if (demoMode === 'quicktest') {
    return <QuickLanguageTest />;
  }

  // Essay Writing Interface
  if (authState.user && isWriting) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95 shadow-sm">
            <div className="w-full px-6 py-4 flex items-center justify-between">
              {/* Left Side - Back Arrow and WordWise Icon */}
              <div className="flex items-center space-x-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" onClick={backToTypeSelection} className="hover:bg-gray-100 p-2 rounded-lg">
                      <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Back to document types</TooltipContent>
                </Tooltip>
                
                <div className="flex items-center space-x-3">
                  <div className="p-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-bold text-gray-900 text-lg tracking-tight">WordWise AI</span>
                  <Badge variant="success" className="text-xs">Pro</Badge>
                </div>
              </div>

              {/* Center - Document Title */}
              <div className="flex-1 max-w-[500px] mx-8">
                <Input
                  value={essayTitle}
                  onChange={(e) => setEssayTitle(e.target.value)}
                  className="text-lg font-medium border-2 border-gray-200 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 px-4 py-3 bg-gray-50 focus:bg-white transition-all duration-200 rounded-xl"
                  placeholder={`Enter ${writingType === 'essay' ? 'essay' : writingType === 'email' ? 'email' : writingType === 'letter' ? 'letter' : writingType === 'report' ? 'report' : writingType === 'creative' ? 'story' : 'text'} title...`}
                />
              </div>

              {/* Right Side - Action Buttons */}
              <div className="flex items-center space-x-3 ml-auto">
                {analysisResult && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="success" className="flex items-center space-x-2 px-3 py-2 text-sm font-medium">
                        <TrendingUp className="h-4 w-4" />
                        <span>{analysisResult.overallScore}/100</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Writing Quality Score</TooltipContent>
                  </Tooltip>
                )}
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="shadow-sm hover:shadow-md transition-shadow" 
                      onClick={() => setShowFileBrowser(true)}
                    >
                      <Folder className="h-4 w-4 mr-2" />
                      My Files
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Browse your documents</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="shadow-sm hover:shadow-md transition-shadow" 
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save your document</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="shadow-sm hover:shadow-md transition-shadow" 
                      onClick={handleExport}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export as PDF, DOCX, etc.</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="h-8" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                          {getUserInitials(userProfile?.name || authState.user?.email || '')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-medium">{userProfile?.name || authState.user?.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{userProfile?.englishLevel} Level</p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleLogout} className="shadow-sm hover:shadow-md transition-shadow">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sign out</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </header>

          {/* Main Writing Interface - Single Scrollable Container */}
          <div className="overflow-y-auto h-[calc(100vh-81px)]">
            <div className="flex min-h-full">
              {/* Text Editor with Highlighting */}
              <div className="flex-1 flex flex-col">
                <TextEditor />
              </div>

              {/* Suggestions Panel */}
              <div className="w-80 border-l bg-gradient-to-b from-white to-gray-50 shadow-lg">
                <div className="p-4 border-b bg-white">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg text-gray-900">Writing Assistant</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {isAnalyzing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                        <span>Analyzing your text...</span>
                      </div>
                    ) : (
                      'AI-powered suggestions'
                    )}
                  </p>
                </div>
                
                <div className="p-4 space-y-6">
                  {/* Grammar & Spelling Check */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          <span>Grammar & Spelling</span>
                        </div>
                        {(getGrammarSuggestions().length > 0 || getSpellingSuggestions().length > 0) && (
                          <Badge variant="destructive" className="text-xs">
                            {getGrammarSuggestions().length + getSpellingSuggestions().length}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {getGrammarSuggestions().length === 0 && getSpellingSuggestions().length === 0 ? (
                        <div className="flex items-center space-x-2 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>No errors detected</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {[...getGrammarSuggestions(), ...getSpellingSuggestions()].map((suggestion, index) => (
                            <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-100">
                              <div className="flex items-start space-x-2">
                                <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="text-xs font-medium text-red-800 mb-1">
                                    {suggestion.type === 'grammar' ? 'Grammar' : 'Spelling'}: {suggestion.explanation}
                                  </div>
                                  {suggestion.suggestedText && (
                                    <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                                      "{suggestion.suggestedText}"
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Vocabulary Suggestions */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                          <span>Vocabulary Enhancement</span>
                        </div>
                        {getVocabularySuggestions().length > 0 && (
                          <Badge variant="info" className="text-xs">
                            {getVocabularySuggestions().length}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {getVocabularySuggestions().length === 0 ? (
                        <p className="text-xs text-gray-500">
                          Vocabulary suggestions will appear as you write
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {getVocabularySuggestions().map((suggestion, index) => (
                            <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <div className="flex items-start space-x-2">
                                <Lightbulb className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="text-xs font-medium text-blue-800 mb-1">
                                    {suggestion.explanation}
                                  </div>
                                  {suggestion.suggestedText && (
                                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                                      "{suggestion.suggestedText}"
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Style & Clarity */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center">
                          <Crown className="h-4 w-4 mr-2 text-purple-500" />
                          <span>Style & Clarity</span>
                        </div>
                        {getStyleSuggestions().length > 0 && (
                          <Badge variant="warning" className="text-xs">
                            {getStyleSuggestions().length}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {getStyleSuggestions().length === 0 ? (
                        <p className="text-xs text-gray-500">
                          Style improvements will appear as you write
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {getStyleSuggestions().map((suggestion, index) => (
                            <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <div className="flex items-start space-x-2">
                                <Crown className="h-3 w-3 text-purple-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="text-xs font-medium text-purple-800 mb-1">
                                    {suggestion.explanation}
                                  </div>
                                  {suggestion.suggestedText && (
                                    <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
                                      "{suggestion.suggestedText}"
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* File Browser Modal */}
          {showFileBrowser && (
            <FileBrowser
              authState={authState}
              onFileSelect={handleFileSelect}
              onNewFile={handleNewFile}
              onClose={() => setShowFileBrowser(false)}
            />
          )}
          
          {/* Export Modal */}
          {showExportModal && currentDocument && (
            <ExportModal
              document={currentDocument}
              onClose={() => setShowExportModal(false)}
            />
          )}
          
          {/* Debug Panel */}
          {showDebugPanel && (
            <DebugPanel
              authState={authState}
              onClose={() => setShowDebugPanel(false)}
            />
          )}
          
          <Toaster position="bottom-right" />
        </div>
      </TooltipProvider>
    );
  }

  // Writing Type Selection Interface
  if (authState.user && !isWriting) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50 shadow-lg">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">WordWise AI</h1>
                  <p className="text-sm text-gray-600">AI-Powered Writing Assistant</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowDebugPanel(!showDebugPanel)}
                      className="shadow-sm hover:shadow-md transition-shadow"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Debug
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Firebase debugging tools</TooltipContent>
                </Tooltip>

                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                      {getUserInitials(userProfile?.name || authState.user?.email || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{userProfile?.name || authState.user?.email}</p>
                    <Badge variant="info" className="text-xs">
                      {userProfile?.englishLevel || 'intermediate'} level
                    </Badge>
                  </div>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleLogout} className="shadow-sm hover:shadow-md transition-shadow">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sign out</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <div className="bg-gradient-to-b from-white/50 to-transparent border-b border-white/20">
            <div className="container mx-auto px-4 py-20">
              <div className="text-center max-w-4xl mx-auto">
                <Badge variant="success" className="mb-6 text-sm font-medium">
                  <Crown className="h-4 w-4 mr-2" />
                  Pro Account Active
                </Badge>
                <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
                  Welcome to WordWise AI
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Choose your writing type to get started with AI-powered assistance tailored to your needs
                </p>
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Real-time Grammar Check</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <span>Vocabulary Enhancement</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    <span>ESL Focused</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Writing Types Grid */}
          <main className="container mx-auto px-4 py-16">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                {/* Academic Essay */}
                <Card 
                  className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 bg-white shadow-lg h-[280px] rounded-2xl"
                  onClick={() => selectWritingType('essay')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative p-8 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Academic Essay</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        College essays, research papers, and academic writing with advanced grammar and style checking
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <Badge variant="info" className="text-xs">Most Popular</Badge>
                      <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                        Get started <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Professional Email */}
                <Card 
                  className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 bg-white shadow-lg h-[280px] rounded-2xl"
                  onClick={() => selectWritingType('email')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative p-8 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <Mail className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Professional Email</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Business communications, job applications, and professional correspondence
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <Badge variant="success" className="text-xs">Business</Badge>
                      <div className="flex items-center text-sm font-medium text-green-600 group-hover:text-green-700">
                        Get started <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Formal Letter */}
                <Card 
                  className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 bg-white shadow-lg h-[280px] rounded-2xl"
                  onClick={() => selectWritingType('letter')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative p-8 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <FileEdit className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Formal Letter</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Cover letters, applications, and formal correspondence with proper formatting
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <Badge variant="outline" className="text-xs">Formal</Badge>
                      <div className="flex items-center text-sm font-medium text-purple-600 group-hover:text-purple-700">
                        Get started <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Business Report */}
                <Card 
                  className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 bg-white shadow-lg h-[280px] rounded-2xl"
                  onClick={() => selectWritingType('report')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative p-8 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <BarChart3 className="h-8 w-8 text-orange-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Business Report</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Professional reports, analysis, and structured business documents
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <Badge variant="warning" className="text-xs">Professional</Badge>
                      <div className="flex items-center text-sm font-medium text-orange-600 group-hover:text-orange-700">
                        Get started <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Creative Writing */}
                <Card 
                  className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 bg-white shadow-lg h-[280px] rounded-2xl"
                  onClick={() => selectWritingType('creative')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative p-8 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <PenTool className="h-8 w-8 text-yellow-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Creative Writing</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Stories, poems, narratives, and creative expression with style focus
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <Badge variant="warning" className="text-xs">Creative</Badge>
                      <div className="flex items-center text-sm font-medium text-yellow-600 group-hover:text-yellow-700">
                        Get started <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Casual Text */}
                <Card 
                  className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 bg-white shadow-lg h-[280px] rounded-2xl"
                  onClick={() => selectWritingType('conversation')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative p-8 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <MessageCircle className="h-8 w-8 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Casual Text</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Social media posts, casual messages, and informal communication
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <Badge variant="secondary" className="text-xs">Casual</Badge>
                      <div className="flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                        Get started <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Language Demo Section */}
              <div className="mb-20">
                <div className="text-center mb-12">
                  <Badge variant="info" className="mb-4">
                    <Globe className="h-4 w-4 mr-2" />
                    Multilingual Features
                  </Badge>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Try Our Advanced Features</h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Experience our bilingual suggestion system designed specifically for ESL learners
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {/* Bilingual Demo */}
                  <Card 
                    className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 bg-white shadow-lg rounded-2xl"
                    onClick={() => setDemoMode('bilingual')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-8 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                        <Globe className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Bilingual Demo</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-6">
                        Experience our writing interface with support for 15+ languages and real-time translation
                      </p>
                      <Badge variant="info" className="mb-4">Interactive Demo</Badge>
                      <div className="flex items-center justify-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                        Try demo <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                      </div>
                    </div>
                  </Card>

                  {/* Quick Language Test */}
                  <Card 
                    className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 bg-white shadow-lg rounded-2xl"
                    onClick={() => setDemoMode('quicktest')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-teal-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-8 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                        <CheckCircle className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Quick Language Test</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-6">
                        Test our AI with multilingual examples and see real-time grammar suggestions
                      </p>
                      <Badge variant="success" className="mb-4">Test Drive</Badge>
                      <div className="flex items-center justify-center text-sm font-medium text-green-600 group-hover:text-green-700">
                        Test now <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Features Section */}
              <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-0 shadow-xl rounded-3xl overflow-hidden">
                <CardContent className="p-16">
                  <div className="text-center mb-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                      <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">Powerful AI Features</h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                      Every writing type includes comprehensive AI assistance to help you write better, faster, and with confidence
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div className="text-center group">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-3">Grammar Check</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Real-time grammar and spelling corrections with detailed explanations
                      </p>
                    </div>
                    
                    <div className="text-center group">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-3">Vocabulary</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Smart vocabulary enhancement suggestions with context-aware alternatives
                      </p>
                    </div>
                    
                    <div className="text-center group">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <Users className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-3">ESL Support</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Specialized feedback designed for English as Second Language learners
                      </p>
                    </div>
                    
                    <div className="text-center group">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <TrendingUp className="h-8 w-8 text-orange-600" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-3">Style & Clarity</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Professional writing style improvements and clarity enhancements
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
          
          {/* File Browser Modal */}
          {showFileBrowser && (
            <FileBrowser
              authState={authState}
              onFileSelect={handleFileSelect}
              onNewFile={handleNewFile}
              onClose={() => setShowFileBrowser(false)}
            />
          )}
          
          {/* Export Modal */}
          {showExportModal && currentDocument && (
            <ExportModal
              document={currentDocument}
              onClose={() => setShowExportModal(false)}
            />
          )}
          
          {/* Debug Panel */}
          {showDebugPanel && (
            <DebugPanel
              authState={authState}
              onClose={() => setShowDebugPanel(false)}
            />
          )}
          
          <Toaster position="bottom-right" />
        </div>
      </TooltipProvider>
    );
  }

  // Authentication Screen
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Features */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">WordWise AI</h1>
                  <p className="text-lg text-gray-600">AI-Powered Writing Assistant</p>
                </div>
              </div>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Transform your writing with intelligent AI assistance designed specifically for ESL students
              </p>
            </div>

            {/* Debug Panel Toggle */}
            <div className="text-center lg:text-left">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowDebugPanel(!showDebugPanel)}
                    className="mb-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {showDebugPanel ? 'Hide' : 'Show'} Debug Info
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Firebase debugging and connection tools</TooltipContent>
              </Tooltip>
            </div>

            <div className="grid gap-8">
              <div className="flex items-start space-x-4 p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
                <div className="bg-green-100 p-4 rounded-xl shadow-md">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Real-time Grammar Check</h3>
                  <p className="text-gray-600 leading-relaxed">Get instant feedback on grammar, punctuation, and sentence structure as you write</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
                <div className="bg-blue-100 p-4 rounded-xl shadow-md">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Vocabulary Enhancement</h3>
                  <p className="text-gray-600 leading-relaxed">Improve your vocabulary and writing style with intelligent word suggestions</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
                <div className="bg-purple-100 p-4 rounded-xl shadow-md">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">ESL Focused</h3>
                  <p className="text-gray-600 leading-relaxed">Specialized feedback designed for English as Second Language learners</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
                <div className="bg-orange-100 p-4 rounded-xl shadow-md">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Progress Tracking</h3>
                  <p className="text-gray-600 leading-relaxed">Monitor your improvement with detailed analytics and writing scores</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Authentication Form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md bg-white/80 backdrop-blur-lg border-0 shadow-2xl rounded-3xl">
              <CardHeader className="space-y-1 text-center p-8">
                <CardTitle className="text-3xl font-bold text-gray-900">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  {isSignUp 
                    ? 'Start your journey to better writing' 
                    : 'Sign in to continue improving your writing'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required={isSignUp}
                        placeholder="Enter your full name"
                        className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your email"
                      className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your password"
                      className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {isSignUp && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="nativeLanguage" className="text-sm font-medium text-gray-700">Native Language</Label>
                        <Input
                          id="nativeLanguage"
                          name="nativeLanguage"
                          type="text"
                          value={formData.nativeLanguage}
                          onChange={handleInputChange}
                          required={isSignUp}
                          placeholder="e.g., Spanish, Chinese, French"
                          className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="englishLevel" className="text-sm font-medium text-gray-700">English Level</Label>
                        <select
                          id="englishLevel"
                          name="englishLevel"
                          value={formData.englishLevel}
                          onChange={handleInputChange}
                          className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl shadow-lg transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                      </div>
                    ) : (
                      <>
                        {isSignUp ? 'Create Account' : 'Sign In'}
                        <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
                      </>
                    )}
                  </Button>
                </form>

                <Separator className="my-6" />

                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {isSignUp 
                      ? 'Already have an account? Sign in' 
                      : "Don't have an account? Sign up"
                    }
                  </Button>
                </div>

                {isSignUp && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-700 text-center leading-relaxed">
                      By creating an account, you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Debug Panel */}
        {showDebugPanel && (
          <DebugPanel
            authState={authState}
            onClose={() => setShowDebugPanel(false)}
          />
        )}
        
        <Toaster position="bottom-right" />
      </div>
    </TooltipProvider>
  );
}

export default App;
