import React, { useState } from 'react';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, FileText, TrendingUp, Sparkles, Upload, Target, Lightbulb, Wand2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { generateContent } from '../services/geminiService';

interface AdInsightAppProps {
    onNavigateBack: () => void;
}

interface ParsedData {
    winningAds: string[];
    losingAds: string[];
    audiences: { name: string; count: number }[];
    keywords: { word: string; count: number; normalizedCount: number }[];
    formats: { name: string; count: number }[];
    themes: { name: string; count: number }[];
    stats: {
        totalWinning: number;
        totalLosing: number;
        winRate: number;
        dateRange: string;
    };
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export const AdInsightApp: React.FC<AdInsightAppProps> = ({ onNavigateBack }) => {
    const [activeView, setActiveView] = useState<'input' | 'dashboard' | 'generator'>('input');
    const [rawText, setRawText] = useState('');
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [generatorInput, setGeneratorInput] = useState('');
    const [generatedScripts, setGeneratedScripts] = useState<any[]>([]);
    const [expandedScript, setExpandedScript] = useState<number | null>(null);
    const [fullScript, setFullScript] = useState<string>('');
    const [isGeneratingFull, setIsGeneratingFull] = useState(false);
    const [scriptLanguage, setScriptLanguage] = useState<'English' | 'Hindi'>('English');

    const analyzeReport = (text: string): ParsedData => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // Extract date range
        let dateRange = 'Not specified';
        const durationMatch = text.match(/Duration:\s*([^\n]+)/i);
        if (durationMatch) {
            dateRange = durationMatch[1].trim();
        }

        const winningAds: string[] = [];
        const losingAds: string[] = [];
        let isWinning = false;
        let isLosing = false;

        lines.forEach(line => {
            if (line.toLowerCase().includes('winning ads') || line.toLowerCase().includes('potential winning')) {
                isWinning = true;
                isLosing = false;
            } else if (line.toLowerCase().includes('underperforming') || line.toLowerCase().includes('losing')) {
                isLosing = true;
                isWinning = false;
            } else if (line.match(/^(VS|IG|PC|Reel)/i)) {
                if (isWinning) winningAds.push(line);
                if (isLosing) losingAds.push(line);
            }
        });

        const keywordCounts: Record<string, number> = {};
        const themeCounts: Record<string, number> = {
            'Family/Parenting': 0,
            'Science/Logic': 0,
            'Health/Healing': 0,
            'Money/Wealth': 0,
            'Distance/Convenience': 0,
            'Emotional': 0,
        };

        const commonWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'is', 'vs', 'ig', 'reel', 'nov', 'oct', 'sep', 'hf', 'really', 'should', 'through', 'with', 'from', 'what', 'can', 'like', 'one', 'how']);

        const themePatterns = {
            'Family/Parenting': /family|parent|mother|father|child|home/i,
            'Science/Logic': /science|research|study|proof|evidence|fact|skeptic|superstition/i,
            'Health/Healing': /heal|cure|health|wellness|medicine|illness|pain|disease/i,
            'Money/Wealth': /money|wealth|lottery|rich|attract|abundance|financial/i,
            'Distance/Convenience': /distance|online|home|anywhere|convenient|remote/i,
            'Emotional': /feel|emotion|stress|anxiety|peace|calm|transform|energy/i,
        };

        winningAds.forEach(ad => {
            ad.toLowerCase().split(/\W+/).forEach(word => {
                if (word.length > 3 && !commonWords.has(word)) {
                    keywordCounts[word] = (keywordCounts[word] || 0) + 1;
                }
            });

            Object.entries(themePatterns).forEach(([theme, pattern]) => {
                if (pattern.test(ad)) {
                    themeCounts[theme]++;
                }
            });
        });

        losingAds.forEach(ad => {
            Object.entries(themePatterns).forEach(([theme, pattern]) => {
                if (pattern.test(ad)) {
                    themeCounts[theme] -= 0.5;
                }
            });
        });

        // Normalize keyword sizing for balanced display
        const keywordEntries = Object.entries(keywordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        const maxCount = keywordEntries[0]?.[1] || 1;
        const minCount = Math.min(...keywordEntries.map(([, count]) => count));

        const keywords = keywordEntries.map(([word, count]) => ({
            word,
            count,
            normalizedCount: 1 + ((count - minCount) / (maxCount - minCount || 1)) * 2
        }));

        const themes = Object.entries(themeCounts)
            .map(([name, count]) => ({ name, count }))
            .filter(t => t.count > 0)
            .sort((a, b) => b.count - a.count);

        const formatCounts: Record<string, number> = {
            'IG Reels': 0,
            'Video Sales (VS)': 0,
            'Static/PC': 0,
            'Carousel': 0
        };

        winningAds.forEach(ad => {
            if (ad.toLowerCase().includes('ig') && ad.toLowerCase().includes('reel')) formatCounts['IG Reels']++;
            else if (ad.toLowerCase().includes('vs')) formatCounts['Video Sales (VS)']++;
            else if (ad.toLowerCase().includes('pc') || ad.toLowerCase().includes('static')) formatCounts['Static/PC']++;
            else if (ad.toLowerCase().includes('carousel')) formatCounts['Carousel']++;
        });

        const formats = Object.entries(formatCounts)
            .map(([name, count]) => ({ name, count }))
            .filter(f => f.count > 0)
            .sort((a, b) => b.count - a.count);

        const audiences = [
            { name: 'Parents', count: 35 },
            { name: 'Homemakers', count: 25 },
            { name: 'Coaching Interests', count: 20 },
            { name: 'Cold Audience', count: 20 },
        ];

        const stats = {
            totalWinning: winningAds.length,
            totalLosing: losingAds.length,
            winRate: winningAds.length > 0 ? Math.round((winningAds.length / (winningAds.length + losingAds.length)) * 100) : 0,
            dateRange
        };

        return { winningAds, losingAds, audiences, keywords, formats, themes, stats };
    };

    const handleAnalyze = () => {
        if (!rawText.trim()) {
            alert('Please paste your report text first!');
            return;
        }
        const data = analyzeReport(rawText);
        setParsedData(data);
        setActiveView('dashboard');
    };

    const generateScripts = () => {
        if (!parsedData || !generatorInput.trim()) {
            alert('Please enter a topic!');
            return;
        }

        const topKeywords = parsedData.keywords.map(k => k.word);

        const scripts = [
            {
                title: `${generatorInput} for Families`,
                format: 'IG Reel (15s)',
                hook: `"Why every parent should know about ${generatorInput}"`,
                script: `Hook: Show a parent looking stressed. Text: "Parenting is hard..." \n\nBody: Quick cuts showing ${generatorInput} helping the family. Focus on ${topKeywords[0] || 'family harmony'}.\n\nCTA: "Learn how in our workshop →"`
            },
            {
                title: `Science Behind ${generatorInput}`,
                format: 'IG Reel (20s)',
                hook: `"Is ${generatorInput} science or superstition?"`,
                script: `Hook: Asking the skeptical question.\n\nBody: Show scientific research/studies. Use keywords: ${topKeywords.slice(0, 2).join(', ')}.\n\nCTA: "See the proof yourself →"`
            },
            {
                title: `${generatorInput} from Anywhere`,
                format: 'Story/Reel (10s)',
                hook: `"You don't even need to be there..."`,
                script: `Hook: Show someone relaxing at home.\n\nBody: Emphasize distance/convenience aspect of ${generatorInput}. Use ${topKeywords[2] || 'healing'} angle.\n\nCTA: "Try it from home →"`
            }
        ];

        setGeneratedScripts(scripts);
        setExpandedScript(null);
        setFullScript('');
    };

    const expandToFullScript = async (scriptIndex: number) => {
        const script = generatedScripts[scriptIndex];
        if (!script || !parsedData) return;

        setIsGeneratingFull(true);
        setExpandedScript(scriptIndex);

        const topThemes = parsedData.themes.slice(0, 3).map(t => t.name).join(', ');
        const topKeywords = parsedData.keywords.slice(0, 5).map(k => k.word).join(', ');

        const languageInstruction = scriptLanguage === 'Hindi'
            ? 'Write the ENTIRE script in HINDI language (Devanagari script). All voiceovers, on-screen text, and dialogues must be in Hindi. You can use Hinglish for brand names if needed.'
            : 'Write the script in English.';

        const prompt = `You are a professional social media ad scriptwriter. Create a COMPLETE, DETAILED video ad script for the following concept:

Title: ${script.title}
Format: ${script.format}
Hook: ${script.hook}

Context:
- Winning Themes from data: ${topThemes}
- Top Keywords: ${topKeywords}
- This is for ${generatorInput}

LANGUAGE REQUIREMENT: ${languageInstruction}

Create a PRODUCTION-READY script with clear sections. Use this EXACT format (NO markdown symbols like ** or *** or ---, just clean text):

═══════════════════════════════════════
TITLE: ${script.title}
FORMAT: ${script.format}  
DURATION: 15-25 seconds
═══════════════════════════════════════

📍 SECTION 1: HOOK (0-3 SECONDS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Opening Line: [Write exact dialogue]
Visual: [Describe the shot]
On-Screen Text: [What text appears]

📍 SECTION 2: PROBLEM AGITATION (3-8 SECONDS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Voiceover: [Exact script]
Visual: [Describe what viewer sees]
On-Screen Text: [Key text overlay]

📍 SECTION 3: SOLUTION (8-15 SECONDS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Voiceover: [Exact script]
Visual: [Show the solution in action]
On-Screen Text: [Main benefit text]

📍 SECTION 4: SOCIAL PROOF (15-20 SECONDS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Voiceover: [Build credibility]
Visual: [Show testimonials/results]
On-Screen Text: [Stats or quotes]

📍 SECTION 5: CALL-TO-ACTION (20-25 SECONDS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Voiceover: [Clear next step]
Visual: [CTA button/link visual]
On-Screen Text: [Action text]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎵 MUSIC: [Mood and style recommendation]
🎨 COLOR PALETTE: [Suggested colors]
💡 PRO TIP: [One production insight]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Make it compelling, specific, and ready to hand to a video editor. Include exact words to say and specific shots to capture. Optimize for ${script.format.includes('Reel') ? 'Instagram Reels' : 'video ads'}.`;

        try {
            const result = await generateContent(prompt);
            setFullScript(result);
        } catch (error) {
            console.error('Error generating full script:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

            // Check if it's an overload error
            if (errorMessage.includes('overloaded') || errorMessage.includes('503')) {
                setFullScript(`⏳ The AI service is currently busy. This usually resolves in a few seconds.\n\n🔄 Please click "Expand to Full Production Script" again in a moment.\n\nThe service automatically retries, but sometimes it needs an extra attempt during peak usage.`);
            } else {
                setFullScript(`❌ Error generating script:\n\n${errorMessage}\n\nPlease check:\n• Your API key is configured correctly\n• You have internet connection\n• Try again in a moment`);
            }
        } finally {
            setIsGeneratingFull(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="flex">
                <div className="w-64 bg-slate-900 min-h-screen p-6 border-r border-slate-800">
                    <Button variant="ghost" className="text-slate-400 hover:text-white mb-8 -ml-3" onClick={onNavigateBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>

                    <h1 className="text-2xl font-bold text-purple-400 mb-8">AdInsight AI</h1>

                    <nav className="space-y-2">
                        <button
                            onClick={() => setActiveView('input')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'input' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                                }`}
                        >
                            <Upload className="h-5 w-5" />
                            <span>Input Report</span>
                        </button>

                        <button
                            onClick={() => parsedData && setActiveView('dashboard')}
                            disabled={!parsedData}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800 disabled:opacity-50'
                                }`}
                        >
                            <TrendingUp className="h-5 w-5" />
                            <span>Insights</span>
                        </button>

                        <button
                            onClick={() => parsedData && setActiveView('generator')}
                            disabled={!parsedData}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'generator' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800 disabled:opacity-50'
                                }`}
                        >
                            <Sparkles className="h-5 w-5" />
                            <span>AI Generator</span>
                        </button>
                    </nav>
                </div>

                <div className="flex-1 p-8 overflow-y-auto">
                    {activeView === 'input' && (
                        <div className="max-w-4xl">
                            <h2 className="text-3xl font-bold text-white mb-2">Paste Your Ad Report</h2>
                            <p className="text-slate-400 mb-6">Copy and paste your social media ad performance report below for AI analysis</p>

                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-purple-400 flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Report Text
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <textarea
                                        className="w-full h-96 bg-slate-800 border-slate-700 rounded-lg p-4 text-slate-100 font-mono text-sm resize-none"
                                        placeholder={`Paste your report here...\n\nDuration: Sept 15 to Nov 26\n\nWinning Ads:\nVS 20\nVS 29 (HF)\nIG Reels - Can Reiki Really Cure Illness?\nIG Reel - One Should Learn Reiki in a Family (HF)\n\nUnderperforming Ads:\nVS 44 - Money Attraction\nIG Reel - Lottery through Reiki`}
                                        value={rawText}
                                        onChange={(e) => setRawText(e.target.value)}
                                    />
                                    <Button
                                        className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-8"
                                        onClick={handleAnalyze}
                                    >
                                        Analyze Report
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeView === 'dashboard' && parsedData && (
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">Deep Insights Analysis</h2>

                            {/* Statistics Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <Card className="bg-slate-900 border-slate-800">
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-emerald-400">{parsedData.stats.totalWinning}</p>
                                            <p className="text-sm text-slate-400 mt-1">Winning Ads</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-slate-900 border-slate-800">
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-rose-400">{parsedData.stats.totalLosing}</p>
                                            <p className="text-sm text-slate-400 mt-1">Underperforming</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-slate-900 border-slate-800">
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-cyan-400">{parsedData.stats.winRate}%</p>
                                            <p className="text-sm text-slate-400 mt-1">Win Rate</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-slate-900 border-slate-800">
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-purple-400">{parsedData.stats.dateRange}</p>
                                            <p className="text-xs text-slate-400 mt-1">Date Range</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Theme Analysis */}
                            {parsedData.themes.length > 0 && (
                                <Card className="bg-gradient-to-br from-indigo-900/30 to-slate-900 border-indigo-700 mb-6">
                                    <CardHeader>
                                        <CardTitle className="text-indigo-300 flex items-center gap-2">
                                            <Target className="h-5 w-5" />
                                            Winning Themes Analysis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {parsedData.themes.map((theme, idx) => (
                                                <div key={idx} className="bg-slate-800/50 rounded-lg p-4 border border-indigo-600/30">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-semibold text-indigo-200">{theme.name}</span>
                                                        <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">
                                                            {theme.count > 0 ? `+${theme.count.toFixed(1)}` : theme.count.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${theme.count > 2 ? 'bg-emerald-500' : theme.count > 0 ? 'bg-cyan-500' : 'bg-slate-600'}`}
                                                            style={{ width: `${Math.min(100, Math.abs(theme.count) * 25)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-700 rounded-lg">
                                            <p className="text-sm text-emerald-300">
                                                <Lightbulb className="inline h-4 w-4 mr-1" />
                                                <strong>Insight:</strong> {parsedData.themes[0]?.name} is your top-performing theme. Use it in your next campaign!
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                <Card className="bg-slate-900 border-slate-800">
                                    <CardHeader>
                                        <CardTitle className="text-purple-400">Audience Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={parsedData.audiences}
                                                    dataKey="count"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    label
                                                >
                                                    {parsedData.audiences.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {parsedData.formats.length > 0 && (
                                    <Card className="bg-slate-900 border-slate-800">
                                        <CardHeader>
                                            <CardTitle className="text-purple-400">Winning Formats</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <BarChart data={parsedData.formats}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                    <XAxis dataKey="name" stroke="##94a3b8" />
                                                    <YAxis stroke="#94a3b8" />
                                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                                                    <Bar dataKey="count" fill="#8b5cf6" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {parsedData.keywords.length > 0 && (
                                <Card className="bg-slate-900 border-slate-800 mb-6">
                                    <CardHeader>
                                        <CardTitle className="text-purple-400">Top Keywords in Winning Ads</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-3">
                                            {parsedData.keywords.map((kw, idx) => (
                                                <div
                                                    key={idx}
                                                    className="px-6 py-3 rounded-full bg-purple-600/20 border border-purple-500"
                                                    style={{ fontSize: `${14 + kw.normalizedCount * 4}px` }}
                                                >
                                                    <span className="font-semibold text-purple-300">{kw.word}</span>
                                                    <span className="text-xs text-slate-400 ml-2">({kw.count})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-emerald-900/20 border-emerald-700">
                                    <CardHeader>
                                        <CardTitle className="text-emerald-400 flex items-center gap-2">
                                            ✅ Winning Strategies
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {parsedData.winningAds.slice(0, 7).map((ad, idx) => (
                                                <li key={idx} className="text-slate-300 text-sm">• {ad}</li>
                                            ))}
                                        </ul>
                                        <p className="mt-4 text-emerald-300 font-semibold">
                                            📈 Scale these themes and formats
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-rose-900/20 border-rose-700">
                                    <CardHeader>
                                        <CardTitle className="text-rose-400 flex items-center gap-2">
                                            ⚠️ Underperforming Strategies
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {parsedData.losingAds.slice(0, 7).map((ad, idx) => (
                                                <li key={idx} className="text-slate-300 text-sm">• {ad}</li>
                                            ))}
                                        </ul>
                                        <p className="mt-4 text-rose-300 font-semibold">
                                            ⛔ Stop spending on these angles
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeView === 'generator' && parsedData && (
                        <div className="max-w-4xl">
                            <h2 className="text-3xl font-bold text-white mb-2">AI Content Generator</h2>
                            <p className="text-slate-400 mb-6">Generate new ad scripts based on your winning themes: {parsedData.themes.slice(0, 2).map(t => t.name).join(', ')}</p>

                            <Card className="bg-slate-900 border-slate-800 mb-6">
                                <CardHeader>
                                    <CardTitle className="text-purple-400">Enter Your Topic</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-3 text-slate-100"
                                            placeholder="e.g., 'New Reiki Workshop' or 'Distance Healing Course'"
                                            value={generatorInput}
                                            onChange={(e) => setGeneratorInput(e.target.value)}
                                        />

                                        <div className="flex items-center gap-3">
                                            <label className="text-sm font-medium text-slate-300">Script Language:</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setScriptLanguage('English')}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${scriptLanguage === 'English'
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                        }`}
                                                >
                                                    English
                                                </button>
                                                <button
                                                    onClick={() => setScriptLanguage('Hindi')}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${scriptLanguage === 'Hindi'
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                        }`}
                                                >
                                                    हिंदी (Hindi)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-8"
                                        onClick={generateScripts}
                                    >
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Generate Ad Scripts
                                    </Button>
                                </CardContent>
                            </Card>

                            {generatedScripts.length > 0 && (
                                <div className="space-y-6">
                                    {generatedScripts.map((script, idx) => (
                                        <Card key={idx} className="bg-gradient-to-br from-purple-900/30 to-slate-900 border-purple-700">
                                            <CardHeader>
                                                <CardTitle className="text-purple-300">{script.title}</CardTitle>
                                                <p className="text-sm text-slate-400">{script.format}</p>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-400 mb-1">HOOK (First 3 seconds):</p>
                                                        <p className="text-cyan-300 font-medium">{script.hook}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-400 mb-1">BRIEF SCRIPT:</p>
                                                        <p className="text-slate-300 whitespace-pre-line text-sm">{script.script}</p>
                                                    </div>

                                                    {expandedScript === idx && fullScript ? (
                                                        <div className="mt-6 pt-6 border-t border-purple-700">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <Wand2 className="h-5 w-5 text-purple-400" />
                                                                <p className="text-lg font-semibold text-purple-300">Complete Production Script</p>
                                                            </div>
                                                            <div className="bg-slate-900 rounded-lg p-8 border border-slate-700">
                                                                <pre className="text-slate-100 whitespace-pre-wrap font-mono text-sm leading-loose">
                                                                    {fullScript}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                                                            onClick={() => expandToFullScript(idx)}
                                                            disabled={isGeneratingFull}
                                                        >
                                                            {isGeneratingFull && expandedScript === idx ? (
                                                                <>
                                                                    <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    Generating Complete Script...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Wand2 className="mr-2 h-4 w-4" />
                                                                    Expand to Full Production Script
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
