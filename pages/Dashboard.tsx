import React from 'react';
import { Header } from '../components/Header';

interface DashboardProps {
  onNavigateToAvatar: () => void;
  onNavigateToMasterPrompt: () => void;
  onNavigateToProfile: () => void;
  onNavigateToBlogSmith: () => void;
  onNavigateToContentResearch: () => void;
  onNavigateToN8nTest: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToAvatar, onNavigateToMasterPrompt, onNavigateToProfile, onNavigateToBlogSmith, onNavigateToContentResearch, onNavigateToN8nTest, onLogout }) => {
  return (
    <>
      <div className="bg-gray-800 p-6 shadow-md">
        <Header title="AI Application Dashboard" subtitle="A collection of powerful AI tools" />
      </div>
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* App Card 1 */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between hover:ring-2 hover:ring-cyan-500 transition-all duration-300 transform hover:-translate-y-1">
            <div>
              <h2 className="text-xl font-bold text-cyan-400 mb-2">Customer Avatar Deep Dive</h2>
              <p className="text-gray-400 text-sm mb-6 h-20">
                Generate detailed customer personas for the Indian market by analyzing your business, the problem it solves, and your solution.
              </p>
            </div>
            <button
              onClick={onNavigateToAvatar}
              className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50 transition-all"
            >
              Launch App
            </button>
          </div>

          {/* Master Prompt Generator Card */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between hover:ring-2 hover:ring-green-500 transition-all duration-300 transform hover:-translate-y-1">
            <div>
              <h2 className="text-xl font-bold text-green-400 mb-2">Master Prompt Generator</h2>
              <p className="text-gray-400 text-sm mb-6 h-20">
                Diagnose and refine your AI prompts. Get a rapid diagnosis and a precision rewrite to ensure your prompts deliver the best results.
              </p>
            </div>
            <button
              onClick={onNavigateToMasterPrompt}
              className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 transition-all"
            >
              Launch App
            </button>
          </div>

          {/* BlogSmith AI Card */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between hover:ring-2 hover:ring-cyan-500 transition-all duration-300 transform hover:-translate-y-1">
            <div>
              <h2 className="text-xl font-bold text-cyan-400 mb-2">BlogSmith AI</h2>
              <p className="text-gray-400 text-sm mb-6 h-20">
                Craft unique, SEO-optimized blog posts with AI. Features deep research, brand voice matching, and WordPress publishing.
              </p>
            </div>
            <button
              onClick={onNavigateToBlogSmith}
              className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50 transition-all"
            >
              Launch App
            </button>
          </div>

          {/* Content Research Automation Card */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between hover:ring-2 hover:ring-purple-500 transition-all duration-300 transform hover:-translate-y-1">
            <div>
              <h2 className="text-xl font-bold text-purple-400 mb-2">Content Research Automation</h2>
              <p className="text-gray-400 text-sm mb-6 h-20">
                AI-powered research with real-time web data. Get summaries, content ideas, and verified sources instantly.
              </p>
            </div>
            <button
              onClick={onNavigateToContentResearch}
              className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 transition-all"
            >
              Launch App
            </button>
          </div>

          {/* N8n Workflow Tester Card */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between hover:ring-2 hover:ring-orange-500 transition-all duration-300 transform hover:-translate-y-1">
            <div>
              <h2 className="text-xl font-bold text-orange-400 mb-2">N8n Workflow Tester</h2>
              <p className="text-gray-400 text-sm mb-6 h-20">
                Test connectivity with your n8n workflows. Send test messages to webhook URLs and see responses instantly.
              </p>
            </div>
            <button
              onClick={onNavigateToN8nTest}
              className="w-full bg-orange-600 text-white font-bold py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-500 focus:ring-opacity-50 transition-all"
            >
              Launch App
            </button>
          </div>

        </div>
      </main>
    </>
  );
};
