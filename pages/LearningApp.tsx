import React, { useState } from 'react';
import { Header } from '../components/Header';
import { getDailyLearningResource, LearningResponse, CourseRecommendation } from '../services/learningService';
import { BookOpen, Clock, ExternalLink, Loader2, Sparkles, Youtube, GraduationCap, Link2 } from 'lucide-react';

interface LearningAppProps {
    onNavigateBack: () => void;
}

export const LearningApp: React.FC<LearningAppProps> = ({ onNavigateBack }) => {
    const [response, setResponse] = useState<LearningResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchResource = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getDailyLearningResource();
            setResponse(data);
        } catch (err) {
            setError('Failed to fetch learning resources. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getPlatformIcon = (platform: string) => {
        const lower = platform.toLowerCase();
        if (lower.includes('youtube')) return <Youtube className="w-5 h-5 text-red-500" />;
        if (lower.includes('coursera') || lower.includes('udemy') || lower.includes('edx')) return <GraduationCap className="w-5 h-5 text-blue-500" />;
        return <Link2 className="w-5 h-5 text-gray-400" />;
    };

    return (
        <div className="min-h-screen bg-gray-900 pb-12">
            <Header
                title="AI for Learning & Upskilling"
                subtitle="Daily upskilling for Account Managers"
                onBack={onNavigateBack}
            />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">

                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">Your Daily Growth Engine</h2>
                        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                            Curated, high-impact learning resources tailored to today's theme.
                        </p>

                        {!response && !loading && (
                            <button
                                onClick={handleFetchResource}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105 flex items-center justify-center mx-auto gap-2"
                            >
                                <Sparkles className="w-5 h-5" />
                                Find Today's Top Picks
                            </button>
                        )}

                        {loading && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                                <p className="text-gray-400 animate-pulse">Scouring the web for the best courses...</p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-900/30 border border-red-800 text-red-200 p-4 rounded-lg text-center mb-6">
                                {error}
                            </div>
                        )}
                    </div>

                    {response && (
                        <div className="animate-fade-in-up">
                            <div className="flex items-center justify-center gap-3 mb-8">
                                <span className="bg-blue-900/50 text-blue-200 px-4 py-2 rounded-full border border-blue-700 font-semibold flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Today's Theme: <span className="text-white">{response.theme}</span>
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {response.courses.map((course, index) => (
                                    <div key={index} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl hover:shadow-2xl hover:border-blue-500 transition-all duration-300 flex flex-col">
                                        <div className="bg-gray-700/50 p-4 border-b border-gray-700 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                {getPlatformIcon(course.platform)}
                                                <span className="text-sm font-medium text-gray-300">{course.platform}</span>
                                            </div>
                                            <span className="bg-gray-900 text-gray-400 text-xs px-2 py-1 rounded">
                                                {course.estimated_time}
                                            </span>
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col">
                                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2" title={course.title}>
                                                {course.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                                                by <span className="text-gray-300 font-medium">{course.author}</span>
                                            </p>

                                            <div className="bg-blue-900/10 rounded-lg p-3 mb-6 border-l-2 border-blue-500 flex-1">
                                                <p className="text-gray-400 text-sm italic">"{course.why_watch}"</p>
                                            </div>

                                            <a
                                                href={course.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full bg-gray-700 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors mt-auto group"
                                            >
                                                <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                Start Learning
                                                <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
