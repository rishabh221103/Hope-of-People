import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AudioPlayerProvider>
          <AppRoutes />
        </AudioPlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
