import React, { useState } from 'react';
import { analyzeDomainAndCompetitors } from '../../services/marketingAgentService';
import { Loader2, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Step1Props {
    onNext: (domain: string, competitors: string, scrapedContent: string) => void;
}

export const Step1Domain: React.FC<Step1Props> = ({ onNext }) => {
    const [domain, setDomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [scrapedData, setScrapedData] = useState('');
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!domain) return;
        setIsLoading(true);
        setError('');
        try {
            const data = await analyzeDomainAndCompetitors(domain);
            setResult(data.result);
            setScrapedData(data.scrapedData);
        } catch (err: any) {
            setError(err.message || 'Failed to analyze domain');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-400">Step 1: Understand Domain & Competitors</h2>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Target Domain</label>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="example.com"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !domain}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                        Analyze
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-900/50 border border-red-500 rounded-md text-red-200">
                    {error}
                </div>
            )}

            {result && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 prose prose-invert max-w-none">
                        <h3 className="text-xl font-semibold mb-4 text-cyan-300">Competitor Analysis</h3>
                        <ReactMarkdown>{result}</ReactMarkdown>
                    </div>

                    <button
                        onClick={() => onNext(domain, result, scrapedData)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md flex items-center justify-center transition-all"
                    >
                        Confirm & Next Step <ArrowRight className="ml-2" />
                    </button>
                </div>
            )}
        </div>
    );
};
