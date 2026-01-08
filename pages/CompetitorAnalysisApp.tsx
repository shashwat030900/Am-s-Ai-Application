import React, { useState } from 'react';
import { analyzeCompetitors, analyzeClientContext, identifyCompetitors, findOfficialDomain, CompetitorAnalysisReport } from '../services/competitorAnalysisService';
import { searchCompetitors } from '../services/apifyService';
import { Loader2, LayoutDashboard, User, LogOut, Globe, ChevronRight, Target, ShieldAlert, Zap, TrendingUp, Search } from 'lucide-react';
import { Button } from '../components/ui/button';

interface CompetitorAnalysisAppProps {
    onNavigateBack: () => void;
    onNavigateToProfile?: () => void;
    onLogout?: () => void;
}

type AppPhase = 'idle' | 'discovering' | 'selecting' | 'analyzing' | 'reported';

export const CompetitorAnalysisApp: React.FC<CompetitorAnalysisAppProps> = ({ onNavigateBack, onNavigateToProfile, onLogout }) => {
    // State
    const [inputValue, setInputValue] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientUrl, setClientUrl] = useState('');
    const [phase, setPhase] = useState<AppPhase>('idle');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [discoveredUrls, setDiscoveredUrls] = useState<{ url: string, selected: boolean }[]>([]);
    const [report, setReport] = useState<CompetitorAnalysisReport | null>(null);
    const [error, setError] = useState<string | null>(null);

    // "tabs" will be dynamic: 'playbook' | 'summary' | specific competitor index
    const [activeTab, setActiveTab] = useState<string>('summary');

    // Actions
    const handleStartDiscovery = async () => {
        if (!inputValue) return;
        setIsLoading(true);
        setError(null);
        setPhase('discovering');
        setStatusMessage("Analyzing your brand...");

        try {
            let finalName = inputValue;
            let finalUrl = "";
            let contextQuery = "";

            const isUrl = inputValue.toLowerCase().includes('http') || inputValue.includes('.com') || inputValue.includes('.io');

            if (isUrl) {
                finalUrl = inputValue.startsWith('http') ? inputValue : `https://${inputValue}`;
                setClientUrl(finalUrl);
                const context = await analyzeClientContext(finalUrl);
                if (context.name) finalName = context.name;
                if (context.query) contextQuery = context.query;
            } else {
                setClientUrl("");
            }

            setClientName(finalName);
            setStatusMessage(`Scouting competitors for ${finalName}...`);

            const baseQuery = contextQuery || `competitors for ${finalName}`;
            const query = `top ${baseQuery}`;
            const urls = await searchCompetitors(query);

            setDiscoveredUrls(urls.map(u => ({ url: u, selected: true })));
            setPhase('selecting');

        } catch (err: any) {
            setError(err.message || 'Discovery failed');
            setPhase('idle');
        } finally {
            setIsLoading(false);
            setStatusMessage("");
        }
    };

    const handleStartAnalysis = async () => {
        const selectedUrls = discoveredUrls.filter(u => u.selected).map(u => u.url);
        if (selectedUrls.length === 0) {
            setError("Select at least one competitor.");
            return;
        }

        setIsLoading(true);
        setPhase('analyzing');
        setStatusMessage("Deep diving into competitor strategies...");

        try {
            const data = await analyzeCompetitors(selectedUrls, clientName, clientUrl);
            setReport(data);
            setPhase('reported');
            setActiveTab('summary');
        } catch (err: any) {
            setError(err.message || 'Analysis failed');
            setPhase('selecting');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUrlSelection = (index: number) => {
        const newUrls = [...discoveredUrls];
        newUrls[index].selected = !newUrls[index].selected;
        setDiscoveredUrls(newUrls);
    };

    // Render Helpers
    const renderSWOT = (swot: { strengths: string[], weaknesses: string[], opportunities: string[], threats: string[] }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-900/10 p-4 rounded-xl border border-green-800/30">
                <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full" /> STRENGTHS</h4>
                <ul className="space-y-2">{swot.strengths.map((s, i) => <li key={i} className="text-sm text-gray-300">• {s}</li>)}</ul>
            </div>
            <div className="bg-red-900/10 p-4 rounded-xl border border-red-800/30">
                <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2"><div className="w-2 h-2 bg-red-400 rounded-full" /> WEAKNESSES</h4>
                <ul className="space-y-2">{swot.weaknesses.map((s, i) => <li key={i} className="text-sm text-gray-300">• {s}</li>)}</ul>
            </div>
            <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-800/30">
                <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2"><div className="w-2 h-2 bg-blue-400 rounded-full" /> OPPORTUNITIES</h4>
                <ul className="space-y-2">{swot.opportunities.map((s, i) => <li key={i} className="text-sm text-gray-300">• {s}</li>)}</ul>
            </div>
            <div className="bg-yellow-900/10 p-4 rounded-xl border border-yellow-800/30">
                <h4 className="font-bold text-yellow-400 mb-2 flex items-center gap-2"><div className="w-2 h-2 bg-yellow-400 rounded-full" /> THREATS</h4>
                <ul className="space-y-2">{swot.threats.map((s, i) => <li key={i} className="text-sm text-gray-300">• {s}</li>)}</ul>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                        <Target size={24} /> Analysis
                    </h2>
                </div>
                <div className="flex-1 p-4">
                    <div className="space-y-2">
                        <button onClick={onNavigateBack} className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-sm">
                            <LayoutDashboard size={18} /> Dashboard
                        </button>
                        <button onClick={onNavigateToProfile} className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-sm">
                            <User size={18} /> Profile
                        </button>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-colors text-sm">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8">

                    {/* Header */}
                    <header className="mb-8">
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            Competitor Intelligence
                        </h1>
                        <p className="text-gray-400">Deep-dive comparison and strategic playbook.</p>
                    </header>

                    {/* Phase 1: Input */}
                    {(phase === 'idle' || phase === 'discovering') && (
                        <div className="max-w-2xl mx-auto mt-20">
                            <div className="bg-gray-800/50 backdrop-blur-md p-8 rounded-2xl border border-gray-700 shadow-xl">
                                <h3 className="text-xl font-bold text-white mb-4 text-center">Start New Analysis</h3>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Enter Brand Name or Website URL"
                                            className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
                                            onKeyDown={(e) => e.key === 'Enter' && handleStartDiscovery()}
                                        />
                                    </div>
                                    <Button onClick={handleStartDiscovery} disabled={isLoading || !inputValue} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-6 rounded-xl text-lg font-bold">
                                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" size={20} />}
                                        {isLoading ? statusMessage : "Analyze Market"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Phase 2: Selection */}
                    {phase === 'selecting' && (
                        <div className="max-w-4xl mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Select Competitors</h2>
                                <Button onClick={handleStartAnalysis} disabled={discoveredUrls.filter(u => u.selected).length === 0} className="bg-green-600 hover:bg-green-500 text-white">
                                    Generate Report <ChevronRight className="ml-2" size={16} />
                                </Button>
                            </div>
                            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                                {discoveredUrls.map((item, index) => (
                                    <div key={index} className="flex items-center p-4 border-b border-gray-700 last:border-0 hover:bg-gray-750">
                                        <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={() => toggleUrlSelection(index)}
                                            className="w-5 h-5 rounded border-gray-600 text-cyan-600 focus:ring-cyan-500 bg-gray-700"
                                        />
                                        <div className="ml-4 flex-1">
                                            <p className="text-gray-200 font-medium">{item.url}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Phase 3: Analyzing Loading */}
                    {phase === 'analyzing' && (
                        <div className="flex flex-col items-center justify-center h-full pb-20">
                            <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-2">Analyzing Data</h2>
                            <p className="text-gray-400">{statusMessage}</p>
                        </div>
                    )}

                    {/* Phase 4: Report */}
                    {phase === 'reported' && report && (
                        <div className="max-w-6xl mx-auto space-y-6">

                            {/* Tab Navigation */}
                            <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-700">
                                <button
                                    onClick={() => setActiveTab('summary')}
                                    className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'summary' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                >
                                    Overview
                                </button>
                                {report.competitors.map((comp, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveTab(comp.name)}
                                        className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === comp.name ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                    >
                                        {comp.name}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setActiveTab('playbook')}
                                    className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'playbook' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                >
                                    The AM Playbook
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="min-h-[500px]">
                                {activeTab === 'summary' && (
                                    <div className="space-y-8 animate-in fade-in">
                                        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                                            <h3 className="text-xl font-bold text-white mb-4">Executive Summary</h3>
                                            <p className="text-gray-300 leading-relaxed">{report.competitorOverview}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-4">Your Strategic Position ({clientName})</h3>
                                            {renderSWOT(report.clientSwot)}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'playbook' && (
                                    <div className="space-y-6 animate-in fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-red-900/10 p-6 rounded-2xl border border-red-500/30">
                                                <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                                                    <ShieldAlert /> What We Are Doing Wrong
                                                </h3>
                                                <ul className="space-y-3">
                                                    {report.playbook.whatWeAreDoingWrong.map((item, i) => (
                                                        <li key={i} className="flex gap-3 text-gray-300">
                                                            <span className="text-red-500 font-bold">✗</span> {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="bg-green-900/10 p-6 rounded-2xl border border-green-500/30">
                                                <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                                                    <TrendingUp /> What We Can Do Better
                                                </h3>
                                                <ul className="space-y-3">
                                                    {report.playbook.whatWeCanDoBetter.map((item, i) => (
                                                        <li key={i} className="flex gap-3 text-gray-300">
                                                            <span className="text-green-500 font-bold">✓</span> {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="bg-blue-900/10 p-6 rounded-2xl border border-blue-500/30">
                                            <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                                                <Zap /> Action Plan
                                            </h3>
                                            <div className="space-y-4">
                                                {report.playbook.actionPlan.map((step, i) => (
                                                    <div key={i} className="flex items-start gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                                                            {i + 1}
                                                        </div>
                                                        <p className="text-gray-200 mt-1">{step}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {report.competitors.map((comp) => {
                                    if (activeTab !== comp.name) return null;
                                    return (
                                        <div key={comp.name} className="space-y-8 animate-in fade-in">
                                            <div className="flex justify-between items-center bg-gray-800 p-6 rounded-2xl border border-gray-700">
                                                <div>
                                                    <h2 className="text-3xl font-bold text-white mb-2">{comp.name}</h2>
                                                    <a href={comp.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">{comp.url}</a>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-gray-400 uppercase tracking-widest">Match Score</div>
                                                    <div className="text-4xl font-black text-purple-400">{comp.matchScore}%</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                {/* Creative Section */}
                                                <div className="space-y-4">
                                                    <h3 className="text-xl font-bold text-white">Creative Strategy</h3>
                                                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
                                                        <div>
                                                            <span className="text-xs font-bold text-gray-500 uppercase">Ad Types</span>
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {comp.creativeAnalysis.adTypes.map(t => <span key={t} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">{t}</span>)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-bold text-gray-500 uppercase">Themes</span>
                                                            <ul className="mt-2 space-y-1">
                                                                {comp.creativeAnalysis.creativeThemes.map(t => <li key={t} className="text-sm text-gray-300">- {t}</li>)}
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-bold text-gray-500 uppercase">Copy Insights</span>
                                                            <p className="text-sm text-gray-300 mt-1 italic">"{comp.creativeAnalysis.adCopyInsights}"</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Social Section */}
                                                <div className="space-y-4">
                                                    <h3 className="text-xl font-bold text-white">Social Footprint</h3>
                                                    <div className="space-y-4">
                                                        {comp.socialStats.map((social, i) => (
                                                            <div key={i} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="font-bold text-white">{social.platform}</span>
                                                                    <span className="text-xs px-2 py-1 bg-gray-700 rounded text-cyan-400">{social.followers}</span>
                                                                </div>
                                                                <p className="text-sm text-gray-400 mb-2">Engagement: <span className="text-gray-200">{social.engagement}</span></p>
                                                                <p className="text-sm text-gray-300 italic border-l-2 border-cyan-500 pl-3">
                                                                    {social.detailedAnalysis}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-4">Competitor SWOT</h3>
                                                {renderSWOT(comp.swot)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};
