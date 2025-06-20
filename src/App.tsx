import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import MainApp from './components/MainApp';

function App() {
  return (
    <AuthProvider>
      <MainApp />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App; 