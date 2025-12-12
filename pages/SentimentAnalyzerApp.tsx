import React, { useState } from 'react';
import { ArrowLeft, Sparkles, MessageSquare, AlertTriangle, CheckCircle, Brain, Mail, Activity } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { generateContent } from '../services/geminiService';

interface SentimentAnalyzerAppProps {
    onNavigateBack: () => void;
}

interface SentimentResult {
    client_sentiment_score: number;
    primary_tone: string;
    summary_of_issue: string;
    requires_manager_intervention: boolean;
    suggested_action: string;
}

export const SentimentAnalyzerApp: React.FC<SentimentAnalyzerAppProps> = ({ onNavigateBack }) => {
    const [emailText, setEmailText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<SentimentResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!emailText.trim()) {
            setError('Please enter some text to analyze.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setResult(null);

        const prompt = `
### ROLE
You are an expert Client Success Analyst and Psychologist. Your job is to analyze incoming client communications to detect hidden frustration, churn risks, and sentiment trends.

### INPUT DATA
You will receive the text of an email or client message.

### INSTRUCTIONS
Analyze the text for the following:
1. **Sentiment Score:** Rate from 1 (Furious/Churn Imminent) to 10 (Extremely Happy/Promoter).
2. **Tone:** Identify the primary emotion (e.g., "Anxious," "Dismissive," "Grateful," "Urgent," "Passive-Aggressive").
3. **Key Issue:** Extract the specific problem if one exists (e.g., "Budget constraints," "Missed deadline," "ROI concerns").
4. **Manager Alert:** Determine if a Senior AM (Ojas) needs to intervene immediately. Set to "True" if the score is below 5 OR if the client mentions cancellation, refunds, or legal action.

### OUTPUT FORMAT
You must respond ONLY in strict JSON format. Do not add conversational text. Use this structure:

{
  "client_sentiment_score": [Integer 1-10],
  "primary_tone": "[String]",
  "summary_of_issue": "[String: Max 10 words]",
  "requires_manager_intervention": [Boolean: true/false],
  "suggested_action": "[String: Short recommendation, e.g., 'Schedule emergency call' or 'Send performance report']"
}

### TEXT TO ANALYZE
${emailText}
`;

        try {
            const responseText = await generateContent(prompt);

            // Clean up basic markdown code blocks if present
            const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

            const parsedResult = JSON.parse(cleanText);
            setResult(parsedResult);
        } catch (err) {
            console.error("Analysis failed:", err);
            setError("Failed to analyze sentiment. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Helper to determine color based on sentiment
    const getSentimentColor = (score: number) => {
        if (score >= 8) return 'text-emerald-400 border-emerald-500';
        if (score >= 5) return 'text-yellow-400 border-yellow-500';
        return 'text-rose-400 border-rose-500';
    };

    const getSentimentBg = (score: number) => {
        if (score >= 8) return 'bg-emerald-900/20';
        if (score >= 5) return 'bg-yellow-900/20';
        return 'bg-rose-900/20';
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
            <div className="max-w-6xl mx-auto">
                <Button variant="ghost" className="text-slate-400 hover:text-white mb-6 pl-0" onClick={onNavigateBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-cyan-900/30 rounded-lg">
                        <Activity className="h-8 w-8 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Client Sentiment Analyzer</h1>
                        <p className="text-slate-400">Detect hidden frustration and churn risks with AI psychology</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="space-y-6">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-200">
                                    <Mail className="h-5 w-5 text-purple-400" />
                                    Client Communication
                                </CardTitle>
                                <CardDescription>Paste the email or message text below</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <textarea
                                    className="w-full h-64 bg-slate-950 border-slate-700 rounded-lg p-4 text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                                    placeholder="Paste client email here..."
                                    value={emailText}
                                    onChange={(e) => setEmailText(e.target.value)}
                                />
                                {error && (
                                    <div className="mt-4 p-3 bg-rose-900/20 border border-rose-800 rounded-lg text-rose-300 text-sm flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}
                                <Button
                                    className="w-full mt-6 bg-cyan-600 hover:bg-cyan-700 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-cyan-900/20 transition-all"
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                                            Analyzing Psychology...
                                        </>
                                    ) : (
                                        <>
                                            <Brain className="mr-2 h-5 w-5" />
                                            Analyze Sentiment
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Results Section */}
                    <div>
                        {result ? (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                {/* Manager Alert Banner */}
                                {result.requires_manager_intervention ? (
                                    <div className="bg-rose-600 text-white p-4 rounded-lg shadow-lg flex items-center justify-between border-2 border-rose-400 animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="h-6 w-6 fill-white text-rose-600" />
                                            <div>
                                                <h3 className="font-bold text-lg">MANAGER INTERVENTION REQUIRED</h3>
                                                <p className="text-rose-100 text-sm">High churn risk detected. Alert Senior AM immediately.</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-600/20 text-emerald-400 p-4 rounded-lg border border-emerald-500/50 flex items-center gap-3">
                                        <CheckCircle className="h-6 w-6" />
                                        <div>
                                            <h3 className="font-bold">Status Normal</h3>
                                            <p className="text-emerald-300/80 text-sm">No immediate escalation needed.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Main Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className={`bg-slate-900 border-slate-800 ${getSentimentBg(result.client_sentiment_score)} border-l-4 ${getSentimentColor(result.client_sentiment_score).split(' ')[1]}`}>
                                        <CardContent className="pt-6">
                                            <div className="text-center">
                                                <div className={`text-5xl font-bold mb-2 ${getSentimentColor(result.client_sentiment_score).split(' ')[0]}`}>
                                                    {result.client_sentiment_score}<span className="text-xl text-slate-500">/10</span>
                                                </div>
                                                <p className="text-slate-400 font-medium uppercase tracking-wider text-xs">Sentiment Score</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-slate-900 border-slate-800">
                                        <CardContent className="pt-6">
                                            <div className="text-center h-full flex flex-col justify-center">
                                                <div className="text-2xl font-bold text-white mb-2 capitalize px-2 py-1 bg-slate-800 rounded-full inline-block">
                                                    {result.primary_tone}
                                                </div>
                                                <p className="text-slate-400 font-medium uppercase tracking-wider text-xs mt-2">Primary Tone</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Deep Dive */}
                                <Card className="bg-slate-900 border-slate-800">
                                    <CardHeader>
                                        <CardTitle className="text-purple-400">Analysis Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Issue Identified</h4>
                                            <p className="text-lg text-white border-l-2 border-purple-500 pl-4 py-1">
                                                "{result.summary_of_issue}"
                                            </p>
                                        </div>

                                        <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                                            <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <Sparkles className="h-4 w-4" />
                                                Suggested Action
                                            </h4>
                                            <p className="text-slate-300 leading-relaxed">
                                                {result.suggested_action}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            // Empty State / Placeholder
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-12 border-2 border-dashed border-slate-800 rounded-lg">
                                <Activity className="h-16 w-16 mb-4 opacity-20" />
                                <p className="text-lg font-medium">Ready to analyze</p>
                                <p className="text-sm">Paste a client email to detect emotional insights</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
