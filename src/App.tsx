import React, { useState } from 'react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    nativeLanguage: '',
    englishLevel: 'intermediate'
  });
  const [isLoading, setIsLoading] = useState(false);



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
      alert(`${isSignUp ? 'Account created' : 'Logged in'} successfully!`);
    }, 1000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setFormData({
      email: '',
      password: '',
      name: '',
      nativeLanguage: '',
      englishLevel: 'intermediate'
    });
  };

  // Main App (after authentication)
  if (isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5', 
        fontFamily: 'Arial, sans-serif' 
      }}>
        {/* Header */}
        <header style={{ 
          backgroundColor: 'white', 
          padding: '1rem 2rem', 
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ 
            color: '#2563eb', 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            margin: 0
          }}>
            WordWise AI
          </h1>
          <button 
            onClick={handleLogout}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Logout
          </button>
        </header>

        {/* Main Content */}
        <main style={{ 
          maxWidth: '800px', 
          margin: '2rem auto', 
          padding: '0 1rem' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '2rem', 
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              color: '#333'
            }}>
              Welcome to WordWise AI!
            </h2>
            <p style={{ 
              color: '#666', 
              lineHeight: '1.6',
              marginBottom: '1.5rem'
            }}>
              You have successfully logged in. This is where the main WordWise AI writing assistant would be.
              Start typing your essay and get real-time AI-powered suggestions for grammar, vocabulary, and style improvements.
            </p>
            
            <div style={{
              backgroundColor: '#f0f9ff',
              padding: '1rem',
              borderRadius: '0.25rem',
              border: '1px solid #0ea5e9'
            }}>
              <h3 style={{ 
                color: '#0369a1', 
                fontSize: '1rem', 
                marginBottom: '0.5rem' 
              }}>
                Features:
              </h3>
              <ul style={{ 
                color: '#0369a1', 
                margin: 0, 
                paddingLeft: '1.5rem' 
              }}>
                <li>Real-time grammar checking</li>
                <li>Vocabulary enhancement suggestions</li>
                <li>Writing style improvements</li>
                <li>ESL-focused feedback</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Authentication Screen
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      padding: '1rem'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '0.5rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            color: '#2563eb', 
            fontSize: '2rem', 
            fontWeight: 'bold',
            margin: '0 0 0.5rem 0'
          }}>
            WordWise AI
          </h1>
          <p style={{ 
            color: '#666', 
            fontSize: '0.875rem',
            margin: 0
          }}>
            AI-Powered Writing Assistant for ESL Students
          </p>
        </div>

        {/* Form Title */}
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          textAlign: 'center',
          marginBottom: '1.5rem',
          color: '#333'
        }}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isSignUp && (
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: '#333'
              }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required={isSignUp}
                placeholder="Enter your full name"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.25rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#333'
            }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '0.25rem',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#333'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '0.25rem',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {isSignUp && (
            <>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  color: '#333'
                }}>
                  Native Language
                </label>
                <input
                  type="text"
                  name="nativeLanguage"
                  value={formData.nativeLanguage}
                  onChange={handleInputChange}
                  required={isSignUp}
                  placeholder="e.g., Spanish, Chinese, French"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '0.25rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  color: '#333'
                }}>
                  English Level
                </label>
                <select
                  name="englishLevel"
                  value={formData.englishLevel}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '0.25rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
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
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: isLoading ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem'
            }}
          >
            {isLoading ? (
              <span>
                {isSignUp ? 'Creating Account...' : 'Signing In...'}
              </span>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        {/* Toggle Sign Up/Sign In */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>

        {/* Footer */}
        {isSignUp && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 