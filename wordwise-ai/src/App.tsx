import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, Users, TrendingUp, FileText, Save, Download, AlertTriangle, Lightbulb } from "lucide-react";
import { Toaster } from 'react-hot-toast';
import TextEditor from './components/TextEditor';
import { useWritingStore } from './store/writingStore';

function App() {
  const { currentDocument, suggestions, analysisResult, isAnalyzing } = useWritingStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    nativeLanguage: '',
    englishLevel: 'intermediate'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [essayTitle, setEssayTitle] = useState('Untitled Essay');

  // Log when app loads for debugging
  useEffect(() => {
    console.log('🚀 WordWise AI App loaded - ready for enhanced grammar checking!');
  }, []);

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

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsAuthenticated(true);
    }, 1000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsWriting(false);
    setFormData({
      email: '',
      password: '',
      name: '',
      nativeLanguage: '',
      englishLevel: 'intermediate'
    });
  };

  const startWriting = () => {
    setIsWriting(true);
  };

  const backToHome = () => {
    setIsWriting(false);
  };

  // Analysis is now handled by the TextEditor component via the writing store

  // Get suggestions by type from the writing store (synced with highlighted errors)
  const getGrammarSuggestions = () => suggestions.filter(s => s.type === 'grammar') || [];
  const getSpellingSuggestions = () => suggestions.filter(s => s.type === 'spelling') || [];
  const getVocabularySuggestions = () => suggestions.filter(s => s.type === 'vocabulary') || [];
  const getStyleSuggestions = () => suggestions.filter(s => s.type === 'style' || s.type === 'structure' || s.type === 'clarity') || [];

  // Essay Writing Interface
  if (isAuthenticated && isWriting) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={backToHome}>
                <BookOpen className="h-5 w-5 mr-2" />
                WordWise AI
              </Button>
              <div className="h-6 w-px bg-border" />
              <Input
                value={essayTitle}
                onChange={(e) => setEssayTitle(e.target.value)}
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0"
                placeholder="Enter essay title..."
              />
            </div>
            <div className="flex items-center space-x-2">
              {analysisResult && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Score: {analysisResult.overallScore}/100</span>
                  </div>
                  {isAnalyzing && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      <span>Analyzing...</span>
                    </div>
                  )}
                </div>
              )}
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Writing Interface */}
        <div className="flex h-[calc(100vh-73px)]">
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
            
            <div className="p-4 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto">
              {/* Grammar & Spelling Check */}
              <Card>
                <CardHeader className="pb-3">
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
                <CardContent className="pt-0">
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
                <CardHeader className="pb-3">
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
                <CardContent className="pt-0">
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
                <CardHeader className="pb-3">
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
                <CardContent className="pt-0">
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

              {/* ESL Tips */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Users className="h-4 w-4 mr-2 text-orange-500" />
                    ESL Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {analysisResult?.areasForImprovement.map((tip: string, index: number) => (
                      <div key={index} className="text-xs text-orange-600 p-2 bg-orange-50 rounded">
                        💡 {tip}
                      </div>
                    )) || (
                      <div className="text-xs text-orange-600">
                        💡 Remember to use articles (a, an, the) correctly
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-gray-500" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App (after authentication, before writing)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">WordWise AI</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">Welcome to WordWise AI!</CardTitle>
                <CardDescription className="text-lg">
                  Your AI-powered writing assistant for academic excellence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  You have successfully logged in. Start typing your essay and get real-time AI-powered 
                  suggestions for grammar, vocabulary, and style improvements tailored specifically for ESL students.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Real-time Grammar Check</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Get instant feedback on grammar, punctuation, and sentence structure.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                        <span>Vocabulary Enhancement</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Discover better word choices and expand your academic vocabulary.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-purple-500" />
                        <span>ESL-Focused Feedback</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Tailored suggestions for common ESL writing challenges.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                        <span>Progress Tracking</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Monitor your writing improvement over time with detailed analytics.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-8">
                  <Button size="lg" className="w-full md:w-auto" onClick={startWriting}>
                    Start Writing Your Essay
                  </Button>
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
