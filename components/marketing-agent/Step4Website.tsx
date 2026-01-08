import React, { useState } from 'react';
import { auditWebsite } from '../../services/marketingAgentService';
import { Loader2, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Step4Props {
    onNext: (url: string, audit: string) => void;
    onSkip: () => void;
}

export const Step4Website: React.FC<Step4Props> = ({ onNext, onSkip }) => {
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [audit, setAudit] = useState('');
    const [error, setError] = useState('');

    const handleAudit = async () => {
        if (!websiteUrl) return;
        setIsLoading(true);
        setError('');
        try {
            const data = await auditWebsite(websiteUrl);
            setAudit(data.result);
        } catch (err: any) {
            setError(err.message || 'Failed to audit website');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-400">Step 4: Website Audit</h2>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Client Website URL</label>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <button
                        onClick={handleAudit}
                        disabled={isLoading || !websiteUrl}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                        Audit
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-900/50 border border-red-500 rounded-md text-red-200">
                    {error}
                </div>
            )}

            {audit && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 prose prose-invert max-w-none">
                        <h3 className="text-xl font-semibold mb-4 text-cyan-300">Website Analysis</h3>
                        <ReactMarkdown>{audit}</ReactMarkdown>
                    </div>

                    <button
                        onClick={() => onNext(websiteUrl, audit)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md flex items-center justify-center transition-all"
                    >
                        Confirm & Next Step <ArrowRight className="ml-2" />
                    </button>
                </div>
            )}
            {!audit && !isLoading && (
                <div className="pt-4 border-t border-gray-700">
                    <button
                        onClick={onSkip}
                        className="text-gray-400 hover:text-white text-sm"
                    >
                        Skip this step
                    </button>
                </div>
            )}
        </div>
    );
};
