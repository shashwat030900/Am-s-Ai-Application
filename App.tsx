import React, { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { CustomerAvatarApp } from './pages/CustomerAvatarApp';
import { MasterPromptApp } from './pages/MasterPromptApp';
import { Footer } from './components/Footer';
import { Chatbot } from './components/Chatbot';

export type Page = 'dashboard' | 'customerAvatar' | 'masterPrompt';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'customerAvatar':
        return <CustomerAvatarApp onNavigateBack={() => navigateTo('dashboard')} />;
      case 'masterPrompt':
        return <MasterPromptApp onNavigateBack={() => navigateTo('dashboard')} />;
      case 'dashboard':
      default:
        return <Dashboard
          onNavigateToAvatar={() => navigateTo('customerAvatar')}
          onNavigateToMasterPrompt={() => navigateTo('masterPrompt')}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col relative">
      <div className="flex-grow">
        {renderPage()}
      </div>
      <Footer />
      <Chatbot />
    </div>
  );
};

export default App;
