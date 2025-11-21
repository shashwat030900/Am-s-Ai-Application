import React, { useState, useCallback } from 'react';
import { Header } from '../components/Header';
import { Loader } from '../components/Loader';
import { Modal } from '../components/Modal';
import { generateSEOBlog, type BlogInput } from '../services/blogService';
import { saveHistory } from '../services/historyService';

interface SEOBlogWriterAppProps {
    onNavigateBack: () => void;
}

const blogLoadingMessages = [
    "Researching client website...",
    "Analyzing products and services...",
    "Crafting SEO-optimized content...",
    "Integrating keywords naturally...",
    "Polishing the final draft...",
];

export const SEOBlogWriterApp: React.FC<SEOBlogWriterAppProps> = ({ onNavigateBack }) => {
    const [topic, setTopic] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [wordCount, setWordCount] = useState(1000);
    const [blogContent, setBlogContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleGenerate = useCallback(async () => {
        if (!topic.trim() || !websiteUrl.trim()) {
            setError('Blog topic and website URL are required.');
            return;
        }

        if (wordCount < 300 || wordCount > 3000) {
            setError('Word count must be between 300 and 3000.');
            return;
        }

        setIsLoading(true);
        setBlogContent('');
        setError(null);

        try {
            const input: BlogInput = {
                topic: topic.trim(),
                websiteUrl: websiteUrl.trim(),
                wordCount,
            };
            const content = await generateSEOBlog(input);
            setBlogContent(content);
            // Save to history
            saveHistory('SEO Blog Writer', { topic, websiteUrl, wordCount }, content);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate blog. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [topic, websiteUrl, wordCount]);

    const handleCopy = () => {
        navigator.clipboard.writeText(blogContent);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <>
            <Header
                title="AI-Powered SEO Blog Writer"
                subtitle="Generate SEO-optimized blogs tailored to your client's business"
                onBack={onNavigateBack}
            />
            {isLoading && <Loader messages={blogLoadingMessages} />}
            <main className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Input Section */}
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
                        <h2 className="text-2xl font-bold text-cyan-400 mb-6">Blog Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">
                                    Blog Topic *
                                </label>
                                <input
                                    type="text"
                                    id="topic"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="e.g., Benefits of Cloud Computing for Small Businesses"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>

                            <div>
                                <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-300 mb-2">
                                    Client Website URL *
                                </label>
                                <input
                                    type="url"
                                    id="websiteUrl"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="https://example.com"
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                />
                            </div>

                            <div>
                                <label htmlFor="wordCount" className="block text-sm font-medium text-gray-300 mb-2">
                                    Target Word Count (300-3000)
                                </label>
                                <input
                                    type="number"
                                    id="wordCount"
                                    min="300"
                                    max="3000"
                                    step="100"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    value={wordCount}
                                    onChange={(e) => setWordCount(parseInt(e.target.value) || 1000)}
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full bg-cyan-600 text-white font-bold py-3 px-6 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Generating...' : 'Generate SEO Blog'}
                            </button>
                        </div>
                    </div>

                    {/* Output Section */}
                    {blogContent && !isLoading && (
                        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-green-500/30">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-green-400">Generated Blog</h2>
                                <button
                                    onClick={handleCopy}
                                    className="bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm"
                                >
                                    {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
                                </button>
                            </div>
                            <div className="prose prose-invert max-w-none bg-gray-900 p-6 rounded-md border border-gray-700">
                                <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                                    {blogContent}
                                </div>
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
