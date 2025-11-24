import React, { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { CustomerAvatarApp } from './pages/CustomerAvatarApp';
import { MasterPromptApp } from './pages/MasterPromptApp';
import { LoginPage } from './pages/LoginPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { ProfilePage } from './pages/ProfilePage';
import { BlogSmithApp } from './pages/BlogSmithApp';
import { ContentResearchApp } from './pages/ContentResearchApp';
import { N8nTestApp } from './pages/N8nTestApp';


import { Footer } from './components/Footer';
import { Chatbot } from './components/Chatbot';
import { Sidebar } from './components/Sidebar';
import { HistoryPanel } from './components/HistoryPanel';
import { isAuthenticated, logout, hasProfile } from './services/authService';

export type Page = 'dashboard' | 'customerAvatar' | 'masterPrompt' | 'profile' | 'blogSmith' | 'contentResearch' | 'n8nTest';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(isAuthenticated());
  const [profileComplete, setProfileComplete] = useState<boolean>(hasProfile());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setProfileComplete(hasProfile());
    navigateTo('dashboard');
  };

  const handleProfileComplete = () => {
    setProfileComplete(true);
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    navigateTo('dashboard'); // Will redirect to login effectively
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (!profileComplete) {
    return <ProfileSetupPage onComplete={handleProfileComplete} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'customerAvatar':
        return <CustomerAvatarApp onNavigateBack={() => navigateTo('dashboard')} />;
      case 'masterPrompt':
        return <MasterPromptApp onNavigateBack={() => navigateTo('dashboard')} />;
      case 'profile':
        return <ProfilePage onNavigateBack={() => navigateTo('dashboard')} />;
      case 'blogSmith':
        return <BlogSmithApp onNavigateBack={() => navigateTo('dashboard')} />;
      case 'contentResearch':
        return <ContentResearchApp onNavigateBack={() => navigateTo('dashboard')} />;
      case 'n8nTest':
        return <N8nTestApp onNavigateBack={() => navigateTo('dashboard')} />;

      case 'dashboard':
      default:
        return <Dashboard
          onNavigateToAvatar={() => navigateTo('customerAvatar')}
          onNavigateToMasterPrompt={() => navigateTo('masterPrompt')}
          onNavigateToProfile={() => navigateTo('profile')}
          onNavigateToBlogSmith={() => navigateTo('blogSmith')}
          onNavigateToContentResearch={() => navigateTo('contentResearch')}
          onNavigateToN8nTest={() => navigateTo('n8nTest')}
          onLogout={handleLogout}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex relative">
      {/* Sidebar */}
      <Sidebar
        onNavigateToProfile={() => navigateTo('profile')}
        onLogout={handleLogout}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        <div className="flex-grow">
          {renderPage()}
        </div>
        <Footer />
      </div>

      {/* History Panel */}
      <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default App;
