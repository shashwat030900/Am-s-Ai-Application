import React from 'react';
import { Header } from '../components/Header';
import { Search, Zap, Activity } from 'lucide-react';

interface DashboardProps {
  onNavigateToAvatar: () => void;
  onNavigateToMasterPrompt: () => void;
  onNavigateToProfile: () => void;
  onNavigateToBlogSmith: () => void;
  onNavigateToContentResearch: () => void;

  onNavigateToAdInsight: () => void;
  onNavigateToCompetitorAnalysis: () => void;
  onNavigateToSentiment: () => void;
  onNavigateToLearning: () => void;
  onNavigateToMarketingAgent: () => void;
  onNavigateToWebsiteAudit: () => void;
  onNavigateToSocialMediaAudit: () => void;
  onNavigateToAdsAnalyzer: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToAvatar, onNavigateToMasterPrompt, onNavigateToProfile, onNavigateToBlogSmith, onNavigateToContentResearch, onNavigateToAdInsight, onNavigateToCompetitorAnalysis, onNavigateToSentiment, onNavigateToLearning, onNavigateToMarketingAgent, onNavigateToWebsiteAudit, onNavigateToSocialMediaAudit, onNavigateToAdsAnalyzer, onLogout }) => {
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



          {/* AdInsight AI Card */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between hover:ring-2 hover:ring-purple-500 transition-all duration-300 transform hover:-translate-y-1">
            <div>
              <h2 className="text-xl font-bold text-purple-400 mb-2">AdInsight AI (Claude Sonnet 4.5)</h2>
              <p className="text-gray-400 text-sm mb-6 h-20">
                Paste your ad reports, extract winning themes and keywords, then generate new content ideas powered by your data.
              </p>
            </div>
            <button
              onClick={onNavigateToAdInsight}
              className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 transition-all"
            >
              Launch App
            </button>
          </div>


          {/* Competitor Analysis Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl p-6 flex flex-col justify-between border border-gray-700 group hover:border-cyan-500/50 transition-all duration-500 transform hover:-translate-y-2">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors">Competitor Analysis</h2>
                <div className="p-2 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-all">
                  <Search className="text-cyan-400" size={20} />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-6 h-20 leading-relaxed">
                Deep-dive into market presence, SEO strategies, and product gaps. Generate actionable AM playbooks to beat the competition.
              </p>
            </div>
            <button
              onClick={onNavigateToCompetitorAnalysis}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black py-3 px-4 rounded-xl hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/30 transition-all shadow-lg active:scale-95"
            >
              LAUNCH ANALYSIS
            </button>
          </div>

          {/* Sentiment Analyzer Card */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between hover:ring-2 hover:ring-rose-500 transition-all duration-300 transform hover:-translate-y-1">
            <div>
              <h2 className="text-xl font-bold text-rose-400 mb-2">Details Client Analysis</h2>
              <p className="text-gray-400 text-sm mb-6 h-20">
                Detect hidden frustration and churn risk. Analyzes client emails for sentiment, tone, and urgent issues requiring intervention.
              </p>
            </div>
            <button
              onClick={onNavigateToSentiment}
              className="w-full bg-rose-600 text-white font-bold py-2 px-4 rounded-md hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-500 focus:ring-opacity-50 transition-all"
            >
              Launch App
            </button>
          </div>

          {/* AI for Learning & Upskilling Card */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between hover:ring-2 hover:ring-blue-500 transition-all duration-300 transform hover:-translate-y-1">
            <div>
              <h2 className="text-xl font-bold text-blue-400 mb-2">AI for Learning & Upskilling</h2>
              <p className="text-gray-400 text-sm mb-6 h-20">
                Daily upskilling for Account Managers. Get one high-impact, actionable learning resource every day tailored to your schedule.
              </p>
            </div>
            <button
              onClick={onNavigateToLearning}
              className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
            >
              Launch App
            </button>
          </div>

          {/* Marketing Agent Card */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between hover:ring-2 hover:ring-indigo-500 transition-all duration-300 transform hover:-translate-y-1">
            <div>
              <h2 className="text-xl font-bold text-indigo-400 mb-2">FutureFlow Marketing Agent</h2>
              <p className="text-gray-400 text-sm mb-6 h-20">
                End-to-end strategist. Analyzes your domain, creates a buyer persona, audits ads/website, and generates a 3-month action plan.
              </p>
            </div>
            <button
              onClick={onNavigateToMarketingAgent}
              className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-all"
            >
              Launch App
            </button>
          </div>

          {/* Website Audit Card */}
          <div className="bg-gradient-to-br from-gray-800 to-indigo-900/40 rounded-xl shadow-lg p-6 flex flex-col justify-between border border-indigo-500/30 hover:border-indigo-400 transition-all duration-300 transform hover:-translate-y-1">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-indigo-400">Website Audit Report Maker</h2>
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Activity className="text-indigo-400" size={20} />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-6 h-20">
                Generate detailed AI audit reports covering Technical, SEO, UX/UI, and 11 other critical parameters for any website.
              </p>
            </div>
            <button
              onClick={onNavigateToWebsiteAudit}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-500 transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2"
            >
              <Zap size={18} fill="currentColor" />
              <span>LAUNCH AUDIT</span>
            </button>
          </div>

          {/* Social Media Audit Card - NEW */}
          <div className="bg-gradient-to-br from-gray-800 to-blue-900/40 rounded-xl shadow-lg p-6 flex flex-col justify-between border border-blue-500/30 hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-1">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-blue-400">Ads Analyzer</h2>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Activity className="text-blue-400" size={20} />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-6 h-20">
                Generate detailed AI audit reports covering Technical, SEO, Creative, and Competitive parameters for Meta and Google Ads.
              </p>
            </div>
            <button
              onClick={onNavigateToAdsAnalyzer}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-500 transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2"
            >
              <Zap size={18} fill="currentColor" />
              <span>LAUNCH ANALYZER</span>
            </button>
          </div>

          {/* Social Media Profile Audit Card - NEW */}
          <div className="bg-gradient-to-br from-gray-800 to-pink-900/40 rounded-xl shadow-lg p-6 flex flex-col justify-between border border-pink-500/30 hover:border-pink-400 transition-all duration-300 transform hover:-translate-y-1">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-pink-400">Social Media Profile Audit</h2>
                <div className="p-2 bg-pink-500/10 rounded-lg">
                  <Activity className="text-pink-400" size={20} />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-6 h-20">
                Multi-platform strategic audit (Instagram, YouTube, etc.). Analyzes positioning, content quality, swot, and growth potential.
              </p>
            </div>
            <button
              onClick={onNavigateToSocialMediaAudit}
              className="w-full bg-pink-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-pink-500 transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2"
            >
              <Zap size={18} fill="currentColor" />
              <span>LAUNCH AUDIT</span>
            </button>
          </div>

        </div>
      </main>
    </>
  );
};

