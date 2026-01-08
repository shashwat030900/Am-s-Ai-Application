import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, CheckCircle, AlertTriangle, FileText, Download, Loader2, Facebook, Instagram, Linkedin, Youtube, Twitter, Globe, FileOutput } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import ReactMarkdown from 'react-markdown';
import { jsPDF } from "jspdf";

interface SocialMediaAuditAppProps {
    onNavigateBack: () => void;
}

export const SocialMediaAuditApp: React.FC<SocialMediaAuditAppProps> = ({ onNavigateBack }) => {
    const [urls, setUrls] = useState<string[]>(['']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState<string>('');
    const [isSimplifying, setIsSimplifying] = useState(false);

    const handleAddUrl = () => {
        setUrls([...urls, '']);
    };

    const handleRemoveUrl = (index: number) => {
        const newUrls = [...urls];
        newUrls.splice(index, 1);
        setUrls(newUrls);
    };

    const handleUrlChange = (index: number, value: string) => {
        const newUrls = [...urls];
        newUrls[index] = value;
        setUrls(newUrls);
    };

    const handleAudit = async () => {
        const validUrls = urls.filter(u => u.trim() !== '');
        if (validUrls.length === 0) {
            setError("Please enter at least one valid social media URL.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setReport(null);
        setLoadingStep('Initializing multi-platform scraper...');

        try {
            setLoadingStep(`Scraping ${validUrls.length} profiles (Instagram/YouTube)...`);

            const response = await fetch('http://localhost:3001/api/agent/profile-audit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ urls: validUrls }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to generate audit.");
            }

            setLoadingStep('Analyzing brand positioning & strategy...');
            const data = await response.json();
            setReport(data.result);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };

    const exportToDoc = () => {
        if (!report) return;

        // Simple markdown to docx conversion
        const lines = report.split('\n');
        const children: any[] = [];

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('# ')) {
                children.push(new Paragraph({
                    text: trimmedLine.replace('# ', ''),
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                }));
            } else if (trimmedLine.startsWith('## ')) {
                children.push(new Paragraph({
                    text: trimmedLine.replace('## ', ''),
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 150 }
                }));
            } else if (trimmedLine.startsWith('### ')) {
                children.push(new Paragraph({
                    text: trimmedLine.replace('### ', ''),
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 }
                }));
            } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                children.push(new Paragraph({
                    children: [
                        new TextRun({
                            text: trimmedLine.substring(2),
                        }),
                    ],
                    bullet: { level: 0 },
                    spacing: { after: 100 }
                }));
            } else if (trimmedLine.length > 0) {
                const parts = trimmedLine.split(/(\*\*.*?\*\*)/);
                const textRuns = parts.map(part => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return new TextRun({
                            text: part.replace(/\*\*/g, ''),
                            bold: true
                        });
                    }
                    return new TextRun(part);
                });

                children.push(new Paragraph({
                    children: textRuns,
                    spacing: { after: 120 }
                }));
            }
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: children,
            }],
        });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, "Social-Media-Profile-Audit.docx");
        });
    };

    const downloadPDF = () => {
        if (!report) return;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Social Media Profile Audit", 10, 10);
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(report.replace(/[#*]/g, ''), 180);
        doc.text(splitText, 10, 20);
        doc.save("social-media-profile-audit.pdf");
    };

    const handleSimplifyLanguage = async () => {
        if (!report) return;

        setIsSimplifying(true);
        setLoadingStep('Simplifying language...');

        try {
            const response = await fetch('http://localhost:3001/api/agent/simplify-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reportContent: report }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to simplify report.");
            }

            const data = await response.json();
            setReport(data.result);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to simplify language.");
        } finally {
            setIsSimplifying(false);
            setLoadingStep('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
            {/* Header */}
            <div className="flex items-center mb-8">
                <button
                    onClick={onNavigateBack}
                    className="mr-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
                    Social Media Profile Audit
                </h1>
            </div>

            {/* Input Section */}
            <div className="max-w-4xl mx-auto mb-12">
                <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-pink-400" />
                        Add Client Profile Links
                    </h2>
                    <p className="text-gray-400 mb-6 text-sm">
                        Add links for Instagram, YouTube, LinkedIn, or Twitter. We will analyze the **last 3 months** of content.
                    </p>

                    <div className="space-y-4 mb-6">
                        {urls.map((url, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="https://www.instagram.com/brandname"
                                    className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                                    value={url}
                                    onChange={(e) => handleUrlChange(index, e.target.value)}
                                />
                                {urls.length > 1 && (
                                    <button
                                        onClick={() => handleRemoveUrl(index)}
                                        className="p-3 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleAddUrl}
                            className="px-4 py-3 rounded-lg border border-gray-600 hover:bg-gray-700 text-gray-300 flex items-center gap-2 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Another Link
                        </button>
                        <button
                            onClick={handleAudit}
                            disabled={isLoading}
                            className={`flex-1 px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${isLoading
                                ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                                : 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg hover:shadow-pink-500/30'
                                }`}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                            {isLoading ? 'Running Strategic Audit...' : 'Generate Profile Report'}
                        </button>
                    </div>

                    {/* Supported Platforms Badges */}
                    <div className="flex gap-4 mt-6 justify-center text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Instagram className="w-3 h-3" /> Instagram</span>
                        <span className="flex items-center gap-1"><Youtube className="w-3 h-3" /> YouTube</span>
                        <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" /> LinkedIn (Limited)</span>
                        <span className="flex items-center gap-1"><Twitter className="w-3 h-3" /> Twitter/X</span>
                    </div>

                    {/* Status / Error */}
                    {isLoading && (
                        <div className="mt-6 flex items-center justify-center gap-3 text-pink-400 animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{loadingStep}</span>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-3 text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Section */}
            {report && !isLoading && (
                <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            Strategic Audit Report
                        </h2>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSimplifyLanguage}
                                disabled={isSimplifying}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-900/30 hover:bg-purple-900/50 rounded-lg text-sm border border-purple-500/50 text-purple-300 transition-colors"
                            >
                                {isSimplifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                {isSimplifying ? 'Simplifying...' : 'Simplify Language'}
                            </button>
                            <button
                                onClick={exportToDoc}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm border border-blue-500 transition-colors text-white shadow-lg"
                            >
                                <FileOutput className="w-4 h-4" /> Export to Word
                            </button>
                            <button
                                onClick={downloadPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm border border-gray-500 transition-colors"
                            >
                                <Download className="w-4 h-4" /> PDF
                            </button>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none prose-headings:text-pink-100 prose-a:text-pink-400 prose-strong:text-white">
                        <ReactMarkdown>{report}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};
