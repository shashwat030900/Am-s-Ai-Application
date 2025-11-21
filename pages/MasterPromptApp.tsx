import React, { useState, useCallback } from 'react';
import { Header } from '../components/Header';
import { Loader } from '../components/Loader';
import { Modal } from '../components/Modal';
import { generateMasterPrompt } from '../services/geminiService';
import { saveHistory } from '../services/historyService';

interface MasterPromptAppProps {
    onNavigateBack: () => void;
}

const promptLoadingMessages = [
    "Analyzing your draft prompt...",
    "Checking for clarity and specificity...",
    "Evaluating context utilization...",
    "Diagnosing potential weaknesses...",
    "Crafting the precision rewrite...",
];

export const MasterPromptApp: React.FC<MasterPromptAppProps> = ({ onNavigateBack }) => {
    const [draftPrompt, setDraftPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultMarkdown, setResultMarkdown] = useState<string>('');

    const handleGenerate = useCallback(async () => {
        if (!draftPrompt.trim()) {
            setError('Please enter a draft prompt to analyze.');
            return;
        }

        setIsLoading(true);
        setResultMarkdown('');
        setError(null);

        try {
            const markdown = await generateMasterPrompt(draftPrompt);
            setResultMarkdown(markdown);
            // Save to history
            saveHistory('Master Prompt', { draftPrompt }, markdown);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate master prompt. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [draftPrompt]);

    return (
        <>
            <Header
                title="Master Prompt Generator"
                subtitle="Refine and Perfect Your AI Prompts"
                onBack={onNavigateBack}
            />
            {isLoading && <Loader messages={promptLoadingMessages} />}
            <main className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-cyan-400 mb-4">Draft Prompt</h2>
                        <textarea
                            className="w-full h-48 bg-gray-700 text-gray-200 border border-gray-600 rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                            placeholder="Paste your draft prompt here..."
                            value={draftPrompt}
                            onChange={(e) => setDraftPrompt(e.target.value)}
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className={`bg-cyan-600 text-white font-bold py-2 px-6 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? 'Analyzing...' : 'Generate Master Prompt'}
                            </button>
                        </div>
                    </div>

                    {resultMarkdown && !isLoading && (
                        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold text-green-400 mb-4">Analysis & Rewrite</h2>
                            <div className="prose prose-invert max-w-none whitespace-pre-wrap font-mono text-sm bg-gray-900 p-4 rounded-md border border-gray-700">
                                {resultMarkdown}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Modal isOpen={!!error} onClose={() => setError(null)} title="Error">
                <p>{error}</p>
            </Modal>
        </>
    );
};
