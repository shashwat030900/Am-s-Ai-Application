import React, { useState } from 'react';
import { createBuyerPersona } from '../../services/marketingAgentService';
import { Loader2, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Step2Props {
    domain: string;
    competitors: string;
    scrapedContent?: string;
    onNext: (brandDetails: string, persona: string) => void;
}

export const Step2Persona: React.FC<Step2Props> = ({ domain, competitors, scrapedContent, onNext }) => {
    const [brandDetails, setBrandDetails] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [persona, setPersona] = useState('');
    const [error, setError] = useState('');

    const handleCreatePersona = async () => {
        // Allow proceeding if we have scraped content OR user provided details
        if (!brandDetails && !scrapedContent) return;

        setIsLoading(true);
        setError('');
        try {
            const data = await createBuyerPersona(domain, competitors, brandDetails, scrapedContent);
            setPersona(data.result);
        } catch (err: any) {
            setError(err.message || 'Failed to create persona');
        } finally {
            setIsLoading(false);
        }
    };

    const isReady = !!(brandDetails || scrapedContent);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-cyan-400">Step 2: Brand Info & Buyer Persona</h2>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                    Describe the Brand (Optional - AI will use website data)
                </label>
                <textarea
                    value={brandDetails}
                    onChange={(e) => setBrandDetails(e.target.value)}
                    placeholder={scrapedContent
                        ? "AI has analyzed your website content. Add specific details here only if needed..."
                        : "Describe your brand, USP, and target audience..."}
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
            </div>

            <button
                onClick={handleCreatePersona}
                disabled={isLoading || !isReady}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                Generate Buyer Persona
            </button>

            {error && (
                <div className="p-4 bg-red-900/50 border border-red-500 rounded-md text-red-200">
                    {error}
                </div>
            )}

            {persona && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 prose prose-invert max-w-none">
                        <h3 className="text-xl font-semibold mb-4 text-cyan-300">Buyer Persona</h3>
                        <ReactMarkdown>{persona}</ReactMarkdown>
                    </div>

                    <button
                        onClick={() => onNext(brandDetails, persona)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md flex items-center justify-center transition-all"
                    >
                        Confirm & Next Step <ArrowRight className="ml-2" />
                    </button>
                </div>
            )}
        </div>
    );
};
