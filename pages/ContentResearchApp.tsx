import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, Search, ArrowLeft, ExternalLink, FileText, Lightbulb } from 'lucide-react';
import { researchTopic, ResearchResult } from '../services/contentResearchService';
import ReactMarkdown from 'react-markdown';

interface ContentResearchAppProps {
    onNavigateBack: () => void;
}

export const ContentResearchApp: React.FC<ContentResearchAppProps> = ({ onNavigateBack }) => {
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ResearchResult | null>(null);

    const handleResearch = async () => {
        if (!topic.trim()) {
            alert('Please enter a research topic.');
            return;
        }

        setLoading(true);
        try {
            const researchResult = await researchTopic(topic);
            setResult(researchResult);
        } catch (error) {
            console.error('Research error:', error);
            alert(error instanceof Error ? error.message : 'Failed to conduct research.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !loading) {
            handleResearch();
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="relative flex items-center justify-center mb-8">
                    <Button
                        variant="ghost"
                        className="absolute left-0 text-gray-400 hover:text-white"
                        onClick={onNavigateBack}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-cyan-400">
                            Content Research Automation
                        </h1>
                        <p className="text-gray-400 mt-2">
                            AI-powered research with real-time web data and source verification
                        </p>
                    </div>
                </header>

                <Card className="bg-gray-800 border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-cyan-400">
                            <Search className="h-6 w-6" />
                            <span>Research Topic</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input
                            type="text"
                            placeholder="e.g., 'Latest trends in AI marketing for 2025'"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full text-lg p-6 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            disabled={loading}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={handleResearch}
                            disabled={loading}
                            className="w-full text-lg p-6 bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                    Researching...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-6 w-6" />
                                    Start Research
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {result && (
                    <>
                        <Card className="bg-gray-800 border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <FileText className="h-6 w-6 text-cyan-400" />
                                    <span>Summary</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="prose prose-invert max-w-none">
                                <div className="text-gray-300 leading-relaxed">
                                    <ReactMarkdown>{result.summary}</ReactMarkdown>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-800 border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Lightbulb className="h-6 w-6 text-cyan-400" />
                                    <span>Content Ideas</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {result.contentIdeas.map((idea, index) => (
                                        <li key={index} className="flex items-start gap-3 text-gray-300">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-sm font-bold">
                                                {index + 1}
                                            </span>
                                            <span className="flex-1">{idea}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {result.sources.length > 0 && (
                            <Card className="bg-gray-800 border-gray-700 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <ExternalLink className="h-6 w-6 text-cyan-400" />
                                        <span>Sources ({result.sources.length})</span>
                                    </CardTitle>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Verified sources used by the AI for this research
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {result.sources.map((source, index) => (
                                            <a
                                                key={index}
                                                href={source.uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600 hover:border-cyan-500"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <ExternalLink className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-white truncate">
                                                            {source.title}
                                                        </p>
                                                        <p className="text-sm text-gray-400 truncate mt-1">
                                                            {source.uri}
                                                        </p>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
