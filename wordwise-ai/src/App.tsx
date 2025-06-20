import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, Users, TrendingUp, FileText, Save, Download, AlertTriangle, Lightbulb, Mail, FileEdit, BarChart3, PenTool, MessageCircle, ArrowLeft, Globe } from "lucide-react";
// import SampleContentGenerator from './components/SampleContentGenerator';
import { Toaster } from 'react-hot-toast';
import TextEditor from './components/TextEditor';
import BilingualDemo from './components/BilingualDemo';
import QuickLanguageTest from './components/QuickLanguageTest';
import { useWritingStore } from './store/writingStore';
import { authService } from './services/authService';
import { goalBasedFeedbackService } from './services/goalBasedFeedbackService';
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

  // Initialize Firebase Auth listener
  useEffect(() => {
    console.log('🚀 WordWise AI App loaded - ready for enhanced grammar checking!');
    
    const unsubscribe = authService.onAuthStateChange((newAuthState) => {
      setAuthState(newAuthState);
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
      alert('Please fill in email and password');
      setIsLoading(false);
      return;
    }

    if (isSignUp && (!formData.name || !formData.nativeLanguage)) {
      alert('Please fill in all fields');
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

  // Show loading spinner while auth is loading
  if (authState.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading WordWise AI...</p>
        </div>
      </div>
    );
  }

  // Essay Writing Interface
  if (authState.user && isWriting) {
    return (
      <div className="min-h-screen bg-gray-50">
                {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
          <div className="w-full px-6 py-4 flex items-center justify-between">
            {/* Left Side - Back Arrow and WordWise Icon */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={backToTypeSelection} className="hover:bg-gray-100 p-2 rounded-lg">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <FileEdit className="h-7 w-7 text-blue-600" />
                <span className="font-bold text-gray-900 text-lg tracking-tight">WordWiseAI</span>
              </div>
            </div>

            {/* Center - Document Title */}
            <div className="flex-1 max-w-[500px] mx-8">
              <Input
                value={essayTitle}
                onChange={(e) => setEssayTitle(e.target.value)}
                className="text-lg font-medium border border-gray-200 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 px-4 py-2 bg-gray-50 focus:bg-white transition-colors"
                placeholder={`Enter ${writingType === 'essay' ? 'essay' : writingType === 'email' ? 'email' : writingType === 'letter' ? 'letter' : writingType === 'report' ? 'report' : writingType === 'creative' ? 'story' : 'text'} title...`}
              />
            </div>

            {/* Right Side - Action Buttons */}
            <div className="flex items-center space-x-3 ml-auto">
              {analysisResult && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-green-700">
                    {analysisResult.overallScore}/100
                  </span>
                </div>
              )}
              <Button variant="outline" size="sm" className="shadow-sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm" className="shadow-sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={handleLogout} className="shadow-sm">
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Writing Interface - Single Scrollable Container */}
        <div className="overflow-y-auto h-[calc(100vh-73px)]">
          <div className="flex min-h-full">
            {/* Text Editor with Highlighting */}
            <div className="flex-1 flex flex-col">
              <TextEditor />
            </div>

            {/* Suggestions Panel */}
            <div className="w-80 border-l bg-muted/30">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-lg">Writing Assistant</h3>
                <p className="text-sm text-muted-foreground">
                  {isAnalyzing ? 'Analyzing your text...' : 'AI-powered suggestions'}
                </p>
              </div>
              
              <div className="p-4 space-y-4">
              {/* Grammar & Spelling Check */}
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Grammar & Spelling
                    {(getGrammarSuggestions().length > 0 || getSpellingSuggestions().length > 0) && (
                      <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        {getGrammarSuggestions().length + getSpellingSuggestions().length}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {getGrammarSuggestions().length === 0 && getSpellingSuggestions().length === 0 ? (
                    <div className="text-xs text-green-600">
                      ✓ No grammar or spelling errors detected
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[...getGrammarSuggestions(), ...getSpellingSuggestions()].map((suggestion, index) => (
                        <div key={index} className="p-2 bg-red-50 rounded border-l-2 border-red-200">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-xs font-medium text-red-800">
                                {suggestion.type === 'grammar' ? 'Grammar' : 'Spelling'}: {suggestion.explanation}
                              </div>
                              {suggestion.suggestedText && (
                                <div className="text-xs text-red-600 mt-1">
                                  Suggestion: "{suggestion.suggestedText}"
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vocabulary Suggestions */}
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                    Vocabulary Enhancement
                    {getVocabularySuggestions().length > 0 && (
                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {getVocabularySuggestions().length}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {getVocabularySuggestions().length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Vocabulary suggestions will appear as you write
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {getVocabularySuggestions().map((suggestion, index) => (
                        <div key={index} className="p-2 bg-blue-50 rounded border-l-2 border-blue-200">
                          <div className="flex items-start space-x-2">
                            <Lightbulb className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-xs font-medium text-blue-800">
                                {suggestion.explanation}
                              </div>
                              {suggestion.suggestedText && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Try: {suggestion.suggestedText}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Writing Style */}
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-purple-500" />
                    Style & Clarity
                    {getStyleSuggestions().length > 0 && (
                      <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                        {getStyleSuggestions().length}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {getStyleSuggestions().length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Style suggestions will appear as you write more
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {getStyleSuggestions().map((suggestion, index) => (
                        <div key={index} className="p-2 bg-purple-50 rounded border-l-2 border-purple-200">
                          <div className="text-xs text-purple-800">
                            {suggestion.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>



              {/* Statistics */}
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-gray-500" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-1 text-xs">
                    <div>Words: {currentDocument?.wordCount || 0}</div>
                    <div>Characters: {currentDocument?.content?.length || 0}</div>
                    <div>Paragraphs: {currentDocument?.content?.split('\n\n').filter(p => p.trim().length > 0).length || 0}</div>
                    {analysisResult && (
                      <>
                        <div>Overall Score: {analysisResult.overallScore}/100</div>
                        <div>Suggestions: {suggestions.length}</div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* AI Writing Suggestions - Always Visible */}
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                    AI Writing Suggestions
                    {isGeneratingAISuggestions && (
                      <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-500"></div>
                    )}
                  </CardTitle>
                  <div className="text-xs text-gray-600 mt-1">
                    Language: {userProfile?.nativeLanguage === 'English' ? 'English Only' : `English + ${userProfile?.nativeLanguage || 'English'}`}
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {isGeneratingAISuggestions ? (
                    <div className="text-xs text-yellow-600 p-2 bg-yellow-50 rounded flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-500 mr-2"></div>
                      Generating AI suggestions...
                    </div>
                  ) : aiWritingSuggestions ? (
                    <div className="space-y-3">
                      {/* General Tips */}
                      {aiWritingSuggestions.generalTips.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-yellow-800 mb-1">💡 General Tips:</div>
                          {aiWritingSuggestions.generalTips.map((tip, index) => (
                            <div key={index} className="text-xs text-yellow-700 p-1 bg-yellow-50 rounded mb-1">
                              • {tip}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Writing Type Specific */}
                      {aiWritingSuggestions.writingTypeSpecific.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-blue-800 mb-1">🎯 {writingType && writingType.charAt(0).toUpperCase() + writingType.slice(1)} Specific:</div>
                          {aiWritingSuggestions.writingTypeSpecific.map((tip, index) => (
                            <div key={index} className="text-xs text-blue-700 p-1 bg-blue-50 rounded mb-1">
                              • {tip}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Common Mistakes */}
                      {aiWritingSuggestions.commonMistakes.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-red-800 mb-1">⚠️ Avoid These Mistakes:</div>
                          {aiWritingSuggestions.commonMistakes.map((mistake, index) => (
                            <div key={index} className="text-xs text-red-700 p-1 bg-red-50 rounded mb-1">
                              • {mistake}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Improvement Areas */}
                      {aiWritingSuggestions.improvementAreas.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-green-800 mb-1">🚀 Focus On:</div>
                          {aiWritingSuggestions.improvementAreas.map((area, index) => (
                            <div key={index} className="text-xs text-green-700 p-1 bg-green-50 rounded mb-1">
                              • {area}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-yellow-600 p-2 bg-yellow-50 rounded">
                      💡 AI writing suggestions will appear when you select a writing type...
                    </div>
                  )}
                </CardContent>
              </Card>

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Demo Mode Rendering
  if (authState.user && demoMode !== 'none') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with Back Button */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                onClick={() => setDemoMode('none')} 
                className="hover:bg-gray-100 p-2 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                WordWise AI - {
                  demoMode === 'bilingual' ? 'Bilingual Demo' : 
                  demoMode === 'quicktest' ? 'Quick Test' : 'Demo'
                }
              </h1>
            </div>
            <Button variant="outline" onClick={handleLogout} className="hover:bg-gray-50">
              Logout
            </Button>
          </div>
        </header>

        {/* Demo Content */}
        <div className="container mx-auto px-4 py-8">
          {demoMode === 'bilingual' && <BilingualDemo />}
          {demoMode === 'quicktest' && <QuickLanguageTest />}
        </div>
      </div>
    );
  }

  // Main App (after authentication, before writing)
  if (authState.user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">WordWise AI</h1>
            </div>
            <Button variant="outline" onClick={handleLogout} className="hover:bg-gray-50">
              Logout
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="bg-gradient-to-b from-slate-50 to-white border-b">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
                Welcome to WordWise AI
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Choose your writing type to get started with AI-powered assistance tailored to your needs
              </p>
            </div>
          </div>
        </div>

        {/* Writing Types Grid */}
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {/* Academic Essay */}
              <Card 
                className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white shadow-lg h-[220px]"
                onClick={() => selectWritingType('essay')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors duration-300">
                      <BookOpen className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Academic Essay</h3>
                    <p className="text-xs text-gray-600 leading-tight">
                      College essays & research papers
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-medium text-blue-600 group-hover:text-blue-700 mt-2">
                    Get started →
                  </div>
                </div>
              </Card>

              {/* Professional Email */}
              <Card 
                className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white shadow-lg h-[220px]"
                onClick={() => selectWritingType('email')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors duration-300">
                      <Mail className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Professional Email</h3>
                    <p className="text-xs text-gray-600 leading-tight">
                      Business & job applications
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-medium text-green-600 group-hover:text-green-700 mt-2">
                    Get started →
                  </div>
                </div>
              </Card>

              {/* Formal Letter */}
              <Card 
                className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white shadow-lg h-[220px]"
                onClick={() => selectWritingType('letter')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-violet-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors duration-300">
                      <FileEdit className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Formal Letter</h3>
                    <p className="text-xs text-gray-600 leading-tight">
                      Cover letters & applications
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-medium text-purple-600 group-hover:text-purple-700 mt-2">
                    Get started →
                  </div>
                </div>
              </Card>

              {/* Business Report */}
              <Card 
                className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white shadow-lg h-[220px]"
                onClick={() => selectWritingType('report')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors duration-300">
                      <BarChart3 className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Business Report</h3>
                    <p className="text-xs text-gray-600 leading-tight">
                      Professional reports & analysis
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-medium text-orange-600 group-hover:text-orange-700 mt-2">
                    Get started →
                  </div>
                </div>
              </Card>

              {/* Creative Writing */}
              <Card 
                className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white shadow-lg h-[220px]"
                onClick={() => selectWritingType('creative')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-amber-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-yellow-200 transition-colors duration-300">
                      <PenTool className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Creative Writing</h3>
                    <p className="text-xs text-gray-600 leading-tight">
                      Stories, poems & narratives
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-medium text-yellow-600 group-hover:text-yellow-700 mt-2">
                    Get started →
                  </div>
                </div>
              </Card>

              {/* Casual Text */}
              <Card 
                className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white shadow-lg h-[220px]"
                onClick={() => selectWritingType('conversation')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors duration-300">
                      <MessageCircle className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Casual Text</h3>
                    <p className="text-xs text-gray-600 leading-tight">
                      Social media & casual messages
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-medium text-indigo-600 group-hover:text-indigo-700 mt-2">
                    Get started →
                  </div>
                </div>
              </Card>
            </div>

            {/* Language Demo Section */}
            <div className="mb-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🌍 Multilingual Features</h2>
                <p className="text-gray-600">Try our new bilingual suggestion system for ESL learners</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Bilingual Demo */}
                <Card 
                  className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white shadow-lg"
                  onClick={() => setDemoMode('bilingual')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative p-4 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Globe className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">🌍 Bilingual Demo</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      Writing interface with 15+ languages
                    </p>
                    <div className="flex items-center justify-center text-xs font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                      Try demo →
                    </div>
                  </div>
                </Card>

                {/* Quick Language Test */}
                <Card 
                  className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white shadow-lg"
                  onClick={() => setDemoMode('quicktest')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-teal-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative p-4 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">🚀 Quick Test</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      Test with multilingual examples
                    </p>
                    <div className="flex items-center justify-center text-xs font-medium text-green-600 group-hover:text-green-700 transition-colors">
                      Test now →
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Features Section */}
            <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-0 shadow-lg">
              <CardContent className="p-12">
                <div className="text-center mb-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful AI Features</h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Every writing type includes comprehensive AI assistance to help you write better
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Grammar Check</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Real-time grammar and spelling corrections
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Vocabulary</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Smart vocabulary enhancement suggestions
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">ESL Support</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Specialized feedback for English learners
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Style & Clarity</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Professional writing style improvements
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Authentication Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Features */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
              <BookOpen className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold text-gray-900">WordWise AI</h1>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              AI-Powered Writing Assistant for ESL Students
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Real-time Grammar Check</h3>
                <p className="text-gray-600">Instant feedback on grammar, punctuation, and sentence structure</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Writing Enhancement</h3>
                <p className="text-gray-600">Improve vocabulary, style, and academic writing skills</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">ESL Focused</h3>
                <p className="text-gray-600">Specialized feedback for English as Second Language learners</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Progress Tracking</h3>
                <p className="text-gray-600">Monitor your improvement with detailed analytics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Authentication Form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
              <CardDescription className="text-center">
                {isSignUp 
                  ? 'Start your journey to better writing' 
                  : 'Sign in to continue improving your writing'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      required={isSignUp}
                      placeholder="Enter your full name"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your password"
                  />
                </div>

                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nativeLanguage">Native Language</Label>
                      <Input
                        id="nativeLanguage"
                        name="nativeLanguage"
                        type="text"
                        value={formData.nativeLanguage}
                        onChange={handleInputChange}
                        required={isSignUp}
                        placeholder="e.g., Spanish, Chinese, French"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="englishLevel">English Level</Label>
                      <select
                        id="englishLevel"
                        name="englishLevel"
                        value={formData.englishLevel}
                        onChange={handleInputChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                    </span>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
                </Button>
              </div>

              {isSignUp && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground text-center">
                    By creating an account, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
