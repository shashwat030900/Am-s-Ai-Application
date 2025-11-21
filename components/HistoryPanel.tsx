import React, { useState, useEffect } from 'react';
import { getHistory, clearHistory, deleteHistoryItem, formatRelativeTime, type HistoryEntry } from '../services/historyService';

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose }) => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    // Load history on mount and when panel opens
    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = () => {
        const data = getHistory();
        setHistory(data);
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to clear all chat history?')) {
            clearHistory();
            setHistory([]);
        }
    };

    const handleDelete = (id: string) => {
        deleteHistoryItem(id);
        loadHistory();
    };

    const handleCopy = (text: string, section: string) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(section);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    const getAppColor = (appName: HistoryEntry['appName']) => {
        switch (appName) {
            case 'Customer Avatar':
                return 'bg-cyan-600';
            case 'Master Prompt':
                return 'bg-green-600';
            case 'SEO Blog Writer':
                return 'bg-purple-600';
            default:
                return 'bg-gray-600';
        }
    };

    const formatInput = (entry: HistoryEntry): string => {
        switch (entry.appName) {
            case 'Customer Avatar':
                return `Business: ${entry.input.businessType}\nProblem: ${entry.input.problem}\nSolution: ${entry.input.solution}`;
            case 'Master Prompt':
                return entry.input.draftPrompt;
            case 'SEO Blog Writer':
                return `Topic: ${entry.input.topic}\nWebsite: ${entry.input.websiteUrl}\nWord Count: ${entry.input.wordCount}`;
            default:
                return JSON.stringify(entry.input);
        }
    };

    const truncateText = (text: string, maxLength: number = 100): string => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <>
            {/* Side Panel */}
            <div
                className={`fixed right-0 top-0 h-full bg-gray-800 shadow-2xl z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    } w-full md:w-96 overflow-hidden flex flex-col`}
            >
                {/* Header */}
                <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700">
                    <h2 className="text-xl font-bold text-cyan-400">Chat History</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {history.length === 0 ? (
                        <div className="text-center text-gray-400 mt-8">
                            <p>No chat history yet.</p>
                            <p className="text-sm mt-2">Your conversations will appear here.</p>
                        </div>
                    ) : (
                        <>
                            {history.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-cyan-500 transition-colors"
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`${getAppColor(entry.appName)} text-white text-xs font-bold px-2 py-1 rounded`}>
                                            {entry.appName}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">
                                                {formatRelativeTime(entry.timestamp)}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                title="Delete"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    <div className="text-sm text-gray-300 mb-2">
                                        <p className="font-semibold text-gray-200">Input:</p>
                                        <p className="text-xs whitespace-pre-wrap">
                                            {truncateText(formatInput(entry))}
                                        </p>
                                    </div>

                                    {/* Expand/Collapse Button */}
                                    <button
                                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                                        className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors"
                                    >
                                        {expandedId === entry.id ? 'Hide Details' : 'View Full Conversation'}
                                    </button>

                                    {/* Expanded Content */}
                                    {expandedId === entry.id && (
                                        <div className="mt-4 space-y-4 border-t border-gray-600 pt-4">
                                            {/* Full Input */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="font-semibold text-gray-200">Input:</p>
                                                    <button
                                                        onClick={() => handleCopy(formatInput(entry), `input-${entry.id}`)}
                                                        className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded transition-colors"
                                                    >
                                                        {copySuccess === `input-${entry.id}` ? 'Copied!' : 'Copy'}
                                                    </button>
                                                </div>
                                                <div className="bg-gray-900 p-3 rounded text-xs text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                                    {formatInput(entry)}
                                                </div>
                                            </div>

                                            {/* Full Output */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="font-semibold text-gray-200">Output:</p>
                                                    <button
                                                        onClick={() => handleCopy(entry.output, `output-${entry.id}`)}
                                                        className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded transition-colors"
                                                    >
                                                        {copySuccess === `output-${entry.id}` ? 'Copied!' : 'Copy'}
                                                    </button>
                                                </div>
                                                <div className="bg-gray-900 p-3 rounded text-xs text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                                                    {entry.output}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Footer */}
                {history.length > 0 && (
                    <div className="bg-gray-900 p-4 border-t border-gray-700">
                        <button
                            onClick={handleClearAll}
                            className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500 transition-all"
                        >
                            Clear All History
                        </button>
                    </div>
                )}
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                />
            )}
        </>
    );
};
