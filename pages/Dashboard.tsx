
import React from 'react';
import { Header } from '../components/Header';

interface DashboardProps {
  onNavigateToAvatar: () => void;
  onNavigateToMasterPrompt: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToAvatar, onNavigateToMasterPrompt }) => {
  return (
    <>
      <Header title="AI Application Dashboard" subtitle="A collection of powerful AI tools" />
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
        </div>
      </main>
    </>
  );
};
