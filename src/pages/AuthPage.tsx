import React, { useState } from 'react';

interface AuthPageProps {
  onLogin: (user: any) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [englishLevel, setEnglishLevel] = useState('intermediate');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simple validation
    if (!email || !password) {
      alert('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    
    if (isSignUp && (!name || !nativeLanguage)) {
      alert('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create user object
    const user = {
      id: Date.now().toString(),
      email,
      name: isSignUp ? name : 'User',
      nativeLanguage: isSignUp ? nativeLanguage : 'English',
      englishLevel,
      writingGoals: {
        type: 'academic',
        targetWordCount: 500,
        targetAudience: 'professor',
        formalityLevel: 'formal',
        essayType: 'argumentative',
      },
      preferences: {
        showExplanations: true,
        highlightComplexWords: true,
        suggestSimplifications: true,
        realTimeAnalysis: true,
      }
    };

    setIsLoading(false);
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div style={{ width: '2rem', height: '2rem', backgroundColor: '#2563eb', borderRadius: '0.25rem', marginRight: '0.5rem' }}></div>
              <h1 className="text-2xl font-bold text-gray-900">WordWise AI</h1>
            </div>
            <div className="text-sm text-gray-600">
              AI-Powered Writing Assistant for ESL Students
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Features */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Improve Your English Writing with AI
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                WordWise AI helps ESL students write better English with real-time feedback, 
                grammar correction, and personalized learning suggestions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div style={{ width: '1.5rem', height: '1.5rem', backgroundColor: '#2563eb', borderRadius: '50%', marginTop: '0.25rem' }}></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Real-time Grammar Check</h3>
                  <p className="text-sm text-gray-600">Get instant feedback on grammar, spelling, and punctuation errors as you write.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div style={{ width: '1.5rem', height: '1.5rem', backgroundColor: '#2563eb', borderRadius: '50%', marginTop: '0.25rem' }}></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Writing Enhancement</h3>
                  <p className="text-sm text-gray-600">Improve vocabulary, sentence structure, and writing style with AI-powered suggestions.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div style={{ width: '1.5rem', height: '1.5rem', backgroundColor: '#2563eb', borderRadius: '50%', marginTop: '0.25rem' }}></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">ESL Focused</h3>
                  <p className="text-sm text-gray-600">Designed specifically for English as Second Language learners with personalized feedback.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div style={{ width: '1.5rem', height: '1.5rem', backgroundColor: '#2563eb', borderRadius: '50%', marginTop: '0.25rem' }}></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Progress Tracking</h3>
                  <p className="text-sm text-gray-600">Monitor your writing improvement over time with detailed analytics and insights.</p>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#dbeafe', borderRadius: '0.5rem', padding: '1.5rem' }}>
              <h3 className="font-semibold text-blue-900 mb-2">Perfect for:</h3>
              <ul className="space-y-1 text-sm" style={{ color: '#1e3a8a' }}>
                <li>• ESL students preparing for exams</li>
                <li>• Academic essay writing</li>
                <li>• Professional email composition</li>
                <li>• Creative writing practice</li>
              </ul>
            </div>
          </div>

          {/* Right side - Auth Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isSignUp ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600">
                {isSignUp 
                  ? 'Join thousands of students improving their English writing' 
                  : 'Sign in to continue your writing journey'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              {isSignUp && (
                <>
                  <div>
                    <label htmlFor="nativeLanguage" className="block text-sm font-medium text-gray-700 mb-2">
                      Native Language
                    </label>
                    <input
                      id="nativeLanguage"
                      name="nativeLanguage"
                      type="text"
                      required={isSignUp}
                      value={nativeLanguage}
                      onChange={(e) => setNativeLanguage(e.target.value)}
                      placeholder="e.g., Spanish, Chinese, French"
                    />
                  </div>

                  <div>
                    <label htmlFor="englishLevel" className="block text-sm font-medium text-gray-700 mb-2">
                      English Level
                    </label>
                    <select
                      id="englishLevel"
                      name="englishLevel"
                      value={englishLevel}
                      onChange={(e) => setEnglishLevel(e.target.value)}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 font-medium"
                style={{ background: 'none', border: 'none', padding: '0.5rem' }}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>

            {isSignUp && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p style={{ fontSize: '0.75rem', color: '#4b5563', textAlign: 'center' }}>
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                  Your writing data is kept secure and private.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50" style={{ borderTop: '1px solid #e5e7eb' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 WordWise AI. Empowering ESL students worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthPage; 