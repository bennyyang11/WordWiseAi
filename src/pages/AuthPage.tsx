import React, { useState } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { BookOpen, CheckCircle, Users, TrendingUp, AlertCircle, Mail } from "lucide-react";
import { signIn, signUp, signInWithGoogle } from '../services/authService';
import toast from 'react-hot-toast';

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    nativeLanguage: '',
    englishLevel: 'intermediate'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!formData.name || !formData.nativeLanguage) {
          toast.error('Please fill in all fields');
          return;
        }
        await signUp(
          formData.email,
          formData.password,
          formData.name,
          formData.nativeLanguage,
          formData.englishLevel
        );
        toast.success('Account created successfully! Please check your email for verification.');
      } else {
        await signIn(formData.email, formData.password);
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome to WordWise AI!');
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
              {/* Google Sign In Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full mb-4"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                    Signing in with Google...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Continue with Google
                  </>
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

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
                      placeholder="Enter your full name"
                      required={isSignUp}
                      disabled={isLoading}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
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
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  {isSignUp && (
                    <p className="text-xs text-muted-foreground">
                      Password should be at least 6 characters long
                    </p>
                  )}
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
                        placeholder="e.g., Spanish, Chinese, French"
                        required={isSignUp}
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="englishLevel">English Level</Label>
                      <select
                        id="englishLevel"
                        name="englishLevel"
                        value={formData.englishLevel}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                  {isLoading ? (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                      {isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm"
                  onClick={() => setIsSignUp(!isSignUp)}
                  disabled={isLoading || isGoogleLoading}
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
                </Button>
              </div>

              {isSignUp && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground text-center">
                    By creating an account, you agree to our Terms of Service and Privacy Policy.
                    We'll send you a verification email to confirm your account.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 