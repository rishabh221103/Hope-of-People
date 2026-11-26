import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { GlobalAudioPlayerBar } from '../components/GlobalAudioPlayerBar';

export const MainLayout: React.FC = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <GlobalAudioPlayerBar />
      <Footer />
    </div>
  );
};
