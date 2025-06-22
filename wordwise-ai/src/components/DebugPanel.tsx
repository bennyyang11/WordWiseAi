import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Bug, Info } from "lucide-react";
import { testFirebaseConnection, getFirebaseErrorAdvice, type FirebaseTestResult } from '../utils/firebaseTest';
import { auth, db } from '../lib/firebase';
import type { AuthState } from '../services/authService';

interface DebugPanelProps {
  authState: AuthState;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ authState, onClose }) => {
  const [testResults, setTestResults] = useState<FirebaseTestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const runFirebaseTest = async () => {
    setTesting(true);
    try {
      const results = await testFirebaseConnection();
      setTestResults(results);
    } catch (error) {
      setTestResults([{
        step: 'Connection Test Failed',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setTesting(false);
    }
  };

  const getEnvironmentInfo = () => {
    return {
      // Environment variables (without exposing sensitive data)
      hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
      hasAuthDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      hasStorageBucket: !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      hasMessagingSenderId: !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      hasAppId: !!import.meta.env.VITE_FIREBASE_APP_ID,
      
      // Current Firebase state
      isAuthInitialized: !!auth.currentUser,
      userId: authState.user?.uid || 'Not authenticated',
      
      // Browser/Network info
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      cookiesEnabled: navigator.cookieEnabled,
      
      // Firebase project info (safe to show)
      projectId: auth.app.options.projectId,
      authDomain: auth.app.options.authDomain
    };
  };

  const envInfo = getEnvironmentInfo();
  const failedTests = testResults.filter(test => !test.success);
  const hasFirebaseErrors = failedTests.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bug className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Firebase Debug Panel</h2>
              </div>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Network Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {networkStatus === 'online' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Network Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`font-medium ${networkStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  {networkStatus === 'online' ? 'Connected' : 'Offline'}
                </p>
              </CardContent>
            </Card>

            {/* Environment Check */}
            <Card>
              <CardHeader>
                <CardTitle>Environment Configuration</CardTitle>
                <CardDescription>
                  Firebase configuration status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>API Key:</span>
                      <span className={envInfo.hasApiKey ? 'text-green-600' : 'text-red-600'}>
                        {envInfo.hasApiKey ? '✓ Set' : '✗ Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Auth Domain:</span>
                      <span className={envInfo.hasAuthDomain ? 'text-green-600' : 'text-red-600'}>
                        {envInfo.hasAuthDomain ? '✓ Set' : '✗ Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Project ID:</span>
                      <span className={envInfo.hasProjectId ? 'text-green-600' : 'text-red-600'}>
                        {envInfo.hasProjectId ? '✓ Set' : '✗ Missing'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Storage Bucket:</span>
                      <span className={envInfo.hasStorageBucket ? 'text-green-600' : 'text-red-600'}>
                        {envInfo.hasStorageBucket ? '✓ Set' : '✗ Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Messaging Sender ID:</span>
                      <span className={envInfo.hasMessagingSenderId ? 'text-green-600' : 'text-red-600'}>
                        {envInfo.hasMessagingSenderId ? '✓ Set' : '✗ Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>App ID:</span>
                      <span className={envInfo.hasAppId ? 'text-green-600' : 'text-red-600'}>
                        {envInfo.hasAppId ? '✓ Set' : '✗ Missing'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {envInfo.projectId && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm"><strong>Project:</strong> {envInfo.projectId}</p>
                    <p className="text-sm"><strong>User ID:</strong> {envInfo.userId}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Firebase Connection Test */}
            <Card>
              <CardHeader>
                <CardTitle>Firebase Connection Test</CardTitle>
                <CardDescription>
                  Test Firebase services to identify 400 error causes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={runFirebaseTest} 
                    disabled={testing}
                    className="w-full"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        <Bug className="h-4 w-4 mr-2" />
                        Run Firebase Test
                      </>
                    )}
                  </Button>

                  {testResults.length > 0 && (
                    <div className="space-y-2">
                      {testResults.map((result, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded border-l-4 ${
                            result.success 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-red-500 bg-red-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {result.success ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium">{result.step}</span>
                          </div>
                          {result.error && (
                            <p className="text-sm text-red-600 mt-1">{result.error}</p>
                          )}
                          {result.details && (
                            <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Error Analysis */}
            {hasFirebaseErrors && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>Error Analysis & Solutions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {failedTests.map((test, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-medium text-red-600 mb-2">{test.step} Failed</h4>
                        <p className="text-sm text-gray-600 mb-2">{test.error}</p>
                        <div className="text-sm text-gray-700 whitespace-pre-line">
                          {getFirebaseErrorAdvice(test.error || '')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Specific 400 Error Help */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span>400 Bad Request Troubleshooting</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium mb-1">Common Causes:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Invalid Firebase API key or project configuration</li>
                      <li>Document data contains undefined or invalid values</li>
                      <li>Firestore security rules blocking the request</li>
                      <li>Network/proxy blocking Firebase domains</li>
                      <li>Browser security settings preventing requests</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Quick Fixes:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Check browser console for detailed error messages</li>
                      <li>Verify all Firebase environment variables are set</li>
                      <li>Test from a different network/browser</li>
                      <li>Check Firestore security rules in Firebase Console</li>
                      <li>Ensure document data doesn't contain undefined values</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-blue-800 text-sm">
                      <strong>Next Step:</strong> Run the Firebase Connection Test above to get specific diagnostics for your setup.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel; 