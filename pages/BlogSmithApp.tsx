import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Textarea } from '../components/ui/textarea';
import { Loader2, Wand2, Edit, Save, RefreshCw, Image as ImageIcon, Share2, Download, ArrowLeft } from 'lucide-react';
import {
    generateBlogPost,
    regenerateParagraph,
    generateImage,
    publishToWordPress,
} from '../services/blogSmithService';
import { saveHistory } from '../services/historyService';

const IMAGE_PLACEHOLDER_START = '[GENERATE_IMAGE';

interface WordPressPreset {
    name: string;
    url: string;
    username: string;
    password?: string;
}

interface BlogSmithAppProps {
    onNavigateBack: () => void;
}

export const BlogSmithApp: React.FC<BlogSmithAppProps> = ({ onNavigateBack }) => {
    const [topic, setTopic] = useState('');
    const [numberOfInlineImages, setNumberOfInlineImages] = useState(0);
    const [wordCount, setWordCount] = useState<number | undefined>(undefined);
    const [language, setLanguage] = useState('English');
    const [clientWebsiteUrl, setClientWebsiteUrl] = useState('');
    const [blogTitle, setBlogTitle] = useState('');
    const [blogContent, setBlogContent] = useState<string[]>([]);
    const [headerImageUrl, setHeaderImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
    const [regeneratingHeader, setRegeneratingHeader] = useState(false);
    const [showPublishDialog, setShowPublishDialog] = useState(false);
    const [wpSiteUrl, setWpSiteUrl] = useState('');
    const [wpUsername, setWpUsername] = useState('');
    const [wpPassword, setWpPassword] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [publishedPostUrl, setPublishedPostUrl] = useState('');
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [wpPresets, setWpPresets] = useState<WordPressPreset[]>([]);
    const [newPresetName, setNewPresetName] = useState('');

    useEffect(() => {
        try {
            const savedPresets = localStorage.getItem('wpPresets');
            if (savedPresets) {
                setWpPresets(JSON.parse(savedPresets));
            }
        } catch (error) {
            console.error("Could not load presets from local storage", error);
        }
    }, []);

    const handleSavePreset = () => {
        if (!newPresetName || !wpSiteUrl || !wpUsername) {
            alert('Please fill in preset name, site URL, and username.');
            return;
        }
        const newPreset: WordPressPreset = {
            name: newPresetName,
            url: wpSiteUrl,
            username: wpUsername,
            password: wpPassword,
        };
        const updatedPresets = [...wpPresets, newPreset];
        setWpPresets(updatedPresets);
        localStorage.setItem('wpPresets', JSON.stringify(updatedPresets));
        setNewPresetName('');
        alert(`Preset "${newPresetName}" saved!`);
    };

    const handleSelectPreset = (presetName: string) => {
        const preset = wpPresets.find(p => p.name === presetName);
        if (preset) {
            setWpSiteUrl(preset.url);
            setWpUsername(preset.username);
            setWpPassword(preset.password || '');
        }
    };

    const handleGenerate = async () => {
        if (!topic) {
            alert('Please enter a topic.');
            return;
        }
        setLoading(true);
        setBlogTitle('');
        setBlogContent([]);
        setHeaderImageUrl('');
        setIsEditing(false);

        try {
            // Step 1: Generate the main blog post content.
            const blogResult = await generateBlogPost({
                topic,
                numberOfInlineImages,
                wordCount,
                language,
                clientWebsiteUrl: clientWebsiteUrl || undefined
            });

            if (!blogResult) {
                throw new Error("Blog post generation failed to return a result.");
            }

            // Store results locally
            const generatedTitle = blogResult.title;
            let generatedContent = [...blogResult.content];
            let generatedHeaderUrl = '';

            // Step 2: Generate the header image
            try {
                const headerResult = await generateImage(topic);
                if (headerResult) {
                    generatedHeaderUrl = headerResult.imageUrl;
                }
            } catch (headerImageError) {
                console.error('Failed to generate header image:', headerImageError);
            }

            // Step 3: Generate inline images in parallel
            const imageIndices: number[] = [];
            generatedContent.forEach((item, index) => {
                if (item.startsWith(IMAGE_PLACEHOLDER_START)) {
                    imageIndices.push(index);
                }
            });

            // Process only up to numberOfInlineImages
            const indicesToGenerate = imageIndices.slice(0, numberOfInlineImages);
            const indicesToRemove = imageIndices.slice(numberOfInlineImages);

            // Remove excess placeholders
            indicesToRemove.forEach(index => {
                generatedContent[index] = '';
            });

            // Generate images for the valid placeholders
            const imagePromises = indicesToGenerate.map(async (index) => {
                const item = generatedContent[index];
                const hintMatch = item.match(/:(.*)\]/);
                const hint = hintMatch ? hintMatch[1].trim() : undefined;

                try {
                    const imageResult = await generateImage(topic, hint);
                    if (imageResult?.imageUrl) {
                        const imageHtml = `<img src="${imageResult.imageUrl}" alt="${topic}" data-hint="${hint || ''}" referrerpolicy="no-referrer" style="float: right; width: 50%; margin-left: 1rem; margin-bottom: 1rem; border-radius: 0.5rem;" />`;
                        generatedContent[index] = imageHtml;
                    } else {
                        generatedContent[index] = `<p><em>[Error: Image could not be generated]</em></p>`;
                    }
                } catch (imageError) {
                    console.error(`Failed to generate inline image at index ${index}:`, imageError);
                    generatedContent[index] = `<p><em>[Error: Image could not be generated]</em></p>`;
                }
            });

            await Promise.all(imagePromises);

            // Filter out empty strings from removed placeholders
            const finalContent = generatedContent.filter(item => item !== '');

            // Step 4: Update State ONCE
            setBlogTitle(generatedTitle);
            setBlogContent(finalContent);
            setHeaderImageUrl(generatedHeaderUrl);

            // Step 5: Save to History
            saveHistory(
                'SEO Blog Writer',
                {
                    topic,
                    wordCount,
                    language,
                    clientWebsiteUrl,
                    numberOfInlineImages
                },
                finalContent.join('')
            );

        } catch (error) {
            console.error('Error generating content:', error);
            alert('Failed to generate content. Check the console for details.');
        } finally {
            setLoading(false);
        }
    };

    const handleContentChange = (index: number, value: string) => {
        const newContent = [...blogContent];
        newContent[index] = value;
        setBlogContent(newContent);
    };

    const handleRegenerate = async (index: number) => {
        setRegeneratingIndex(index);
        try {
            const result = await regenerateParagraph(
                topic,
                blogContent[index]
            );
            if (result && result.newParagraph) {
                const newContent = [...blogContent];
                newContent[index] = result.newParagraph;
                setBlogContent(newContent);
            }
        } catch (error) {
            console.error('Error regenerating paragraph:', error);
            alert('Failed to regenerate paragraph.');
        }
        setRegeneratingIndex(null);
    };

    const handleRegenerateHeaderImage = async () => {
        if (!topic) return;
        setRegeneratingHeader(true);
        try {
            const imageResult = await generateImage(topic);
            if (imageResult) {
                setHeaderImageUrl(imageResult.imageUrl);
            }
        } catch (error) {
            console.error('Error regenerating header image:', error);
            alert('Failed to regenerate header image.');
        }
        setRegeneratingHeader(false);
    };

    const handleRegenerateInlineImage = async (index: number) => {
        if (!topic) return;
        setRegeneratingIndex(index);
        try {
            // Extract hint from existing content if possible
            const existingContent = blogContent[index];
            const hintMatch = existingContent.match(/data-hint="([^"]*)"/);
            const hint = hintMatch ? hintMatch[1] : undefined;

            const imageResult = await generateImage(topic, hint);
            if (imageResult) {
                setBlogContent(currentContent => {
                    const newContent = [...currentContent];
                    const existingContent = newContent[index];
                    const hintMatch = existingContent.match(/data-hint="([^"]*)"/);
                    const hint = hintMatch ? hintMatch[1] : undefined;

                    const imageHtml = `<img src="${imageResult.imageUrl}" alt="${topic}" data-hint="${hint || ''}" referrerpolicy="no-referrer" style="float: right; width: 50%; margin-left: 1rem; margin-bottom: 1rem; border-radius: 0.5rem;" />`;
                    newContent[index] = imageHtml;
                    return newContent;
                });
            }
        } catch (error) {
            console.error('Error regenerating inline image:', error);
            alert('Failed to regenerate inline image.');
        }
        setRegeneratingIndex(null);
    }

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const headerImageHtml = headerImageUrl ? `<img src="${headerImageUrl}" alt="${topic}" referrerpolicy="no-referrer" style="width: 100%; height: auto; border-radius: 0.5rem; display: block; margin: 1rem auto; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" />` : '';
            const fullContent = headerImageHtml + blogContent.join('');

            const result = await publishToWordPress(
                blogTitle,
                fullContent,
                wpSiteUrl,
                wpUsername,
                wpPassword
            );

            if (!result.postUrl) {
                throw new Error('Publishing succeeded but no post URL was returned.');
            }

            setPublishedPostUrl(result.postUrl);
            setShowSuccessDialog(true);
        } catch (error: any) {
            setErrorMessage(error.message || 'An unknown error occurred.');
            setShowErrorDialog(true);
        }
        setIsPublishing(false);
        setShowPublishDialog(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !loading) {
            handleGenerate();
        }
    };

    const handleDownloadImage = async (imageUrl: string, filename: string) => {
        try {
            // Fetch the image as a blob to bypass CORS restrictions
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // Create a temporary object URL
            const objectUrl = URL.createObjectURL(blob);

            // Create and click download link
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the object URL
            URL.revokeObjectURL(objectUrl);
        } catch (error) {
            console.error('Failed to download image:', error);
            alert('Failed to download image. Please try again.');
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
                            BlogSmith AI
                        </h1>
                        <p className="text-gray-400 mt-2">
                            Enter a topic and let our AI craft a unique, SEO-optimized blog post for you.
                        </p>
                    </div>
                </header>

                <Card className="bg-gray-800 border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-cyan-400">
                            <Wand2 className="h-6 w-6" />
                            <span>Create Your Post</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-start">
                            <div className="lg:col-span-2">
                                <Label htmlFor="topic-input" className="sr-only">Topic</Label>
                                <Input
                                    id="topic-input"
                                    type="text"
                                    placeholder="e.g., 'The Future of Renewable Energy'"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full text-lg p-6 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                    disabled={loading}
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <Label htmlFor="client-website-input" className="sr-only">Client Website</Label>
                                <Input
                                    id="client-website-input"
                                    type="url"
                                    placeholder="Client website (for brand voice)"
                                    value={clientWebsiteUrl}
                                    onChange={(e) => setClientWebsiteUrl(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full text-lg p-6 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 lg:col-span-2">
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger className="w-full text-lg p-6 bg-gray-700 border-gray-600 text-white">
                                        <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                        <SelectItem value="English">English</SelectItem>
                                        <SelectItem value="Hindi">Hindi</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    id="inline-images-input"
                                    type="number"
                                    min="0"
                                    max="5"
                                    placeholder="Images (0-5)"
                                    value={numberOfInlineImages}
                                    onChange={(e) => setNumberOfInlineImages(parseInt(e.target.value, 10) || 0)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full text-lg p-6 bg-gray-700 border-gray-600 text-white"
                                    disabled={loading}
                                />
                                <Input
                                    id="word-count-input"
                                    type="number"
                                    min="100"
                                    max="5000"
                                    step="50"
                                    placeholder="Word count"
                                    value={wordCount || ''}
                                    onChange={(e) => setWordCount(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full text-lg p-6 bg-gray-700 border-gray-600 text-white col-span-2"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full text-lg p-6 bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                'Generate Post'
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {(loading || headerImageUrl || blogTitle) && (
                    <Card className="bg-gray-800 border-gray-700 shadow-lg animate-fade-in">
                        <div className="relative group">
                            {loading && !headerImageUrl && (
                                <div className="w-full h-96 bg-gray-700 animate-pulse flex items-center justify-center rounded-t-lg">
                                    <ImageIcon className="h-12 w-12 text-gray-500" />
                                </div>
                            )}
                            {headerImageUrl && (
                                <img
                                    src={headerImageUrl}
                                    alt={topic}
                                    className="w-full h-auto rounded-t-lg"
                                    referrerPolicy="no-referrer"
                                />
                            )}
                            {isEditing && headerImageUrl && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 rounded-t-lg transition-opacity opacity-0 group-hover:opacity-100 z-10">
                                    <Button onClick={handleRegenerateHeaderImage} disabled={regeneratingHeader} variant="secondary">
                                        {regeneratingHeader ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                        Regenerate
                                    </Button>
                                    <Button onClick={() => handleDownloadImage(headerImageUrl, 'header-image.png')} variant="secondary">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                </div>
                            )}
                        </div>
                        {blogTitle && (
                            <>
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="text-3xl font-bold text-white flex-1">
                                            {blogTitle}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setIsEditing(!isEditing)}
                                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                            >
                                                {isEditing ? (
                                                    <Save className="h-5 w-5" />
                                                ) : (
                                                    <Edit className="h-5 w-5" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setShowPublishDialog(true)}
                                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                            >
                                                <Share2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 text-lg text-gray-300">
                                    {blogContent.map((item, index) => {
                                        const isRegenerating = regeneratingIndex === index;
                                        if (item.startsWith(IMAGE_PLACEHOLDER_START)) {
                                            return (
                                                <div key={index} className="w-full h-64 bg-gray-700 animate-pulse flex items-center justify-center rounded-lg my-4">
                                                    <ImageIcon className="h-12 w-12 text-gray-500" />
                                                </div>
                                            )
                                        }

                                        if (item.startsWith('<img')) {
                                            const srcMatch = item.match(/src="([^"]+)"/);
                                            const imageUrl = srcMatch ? srcMatch[1] : '';
                                            return (
                                                <div key={index} className="float-right w-1/2 ml-4 mb-4 relative group">
                                                    <img
                                                        src={imageUrl}
                                                        alt={topic}
                                                        className="w-full h-auto rounded-lg shadow-md"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                    {isEditing && (
                                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 rounded-lg transition-opacity opacity-0 group-hover:opacity-100 z-10">
                                                            <Button onClick={() => handleRegenerateInlineImage(index)} disabled={isRegenerating} variant="secondary" size="sm">
                                                                {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                                                Regenerate
                                                            </Button>
                                                            <Button onClick={() => handleDownloadImage(imageUrl, `inline-image-${index}.png`)} variant="secondary" size="sm">
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Download
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        }

                                        const isH2 = item.startsWith('<h2>') && item.endsWith('</h2>');
                                        const isH3 = item.startsWith('<h3>') && item.endsWith('</h3>');
                                        const isHeading = isH2 || isH3;

                                        const content = isH2
                                            ? item.substring(4, item.length - 5)
                                            : isH3
                                                ? item.substring(4, item.length - 5)
                                                : item;

                                        return (
                                            <div key={index} className="relative group">
                                                {isEditing ? (
                                                    <div className="flex items-start gap-2">
                                                        <Textarea
                                                            value={content}
                                                            onChange={(e) =>
                                                                handleContentChange(
                                                                    index,
                                                                    isHeading
                                                                        ? `<h2>${e.target.value}</h2>`
                                                                        : e.target.value
                                                                )
                                                            }
                                                            className={`w-full resize-y bg-gray-700 border-gray-600 text-white ${isHeading
                                                                ? 'text-2xl font-bold mt-6'
                                                                : ''
                                                                }`}
                                                            rows={isHeading ? 1 : Math.ceil(content.length / 80)}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRegenerate(index)}
                                                            disabled={isRegenerating}
                                                            className="mt-1 text-gray-400 hover:text-white"
                                                        >
                                                            {isRegenerating ? (
                                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                            ) : (
                                                                <RefreshCw className="h-5 w-5" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={
                                                            isHeading
                                                                ? 'text-2xl font-bold text-white mt-6'
                                                                : ''
                                                        }
                                                        dangerouslySetInnerHTML={{ __html: item }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </CardContent>
                                {isEditing && (
                                    <CardFooter>
                                        <Button onClick={() => setIsEditing(false)} className="bg-green-600 hover:bg-green-700 text-white">
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </Button>
                                    </CardFooter>
                                )}
                            </>
                        )}
                    </Card>
                )}
            </div>

            <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                <DialogContent className="bg-gray-800 border-gray-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Publish to WordPress</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Enter your WordPress site details below. It is highly recommended to use an{' '}
                            <a href="https://wordpress.org/documentation/article/application-passwords/" target="_blank" rel="noopener noreferrer" className="underline text-cyan-400">
                                Application Password
                            </a>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="wp-preset">Load Preset</Label>
                            <Select onValueChange={handleSelectPreset}>
                                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                    <SelectValue placeholder="Select a preset" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    {wpPresets.map((preset) => (
                                        <SelectItem key={preset.name} value={preset.name}>
                                            {preset.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="wp-url">WordPress Site URL</Label>
                            <Input
                                id="wp-url"
                                placeholder="https://example.com"
                                value={wpSiteUrl}
                                onChange={(e) => setWpSiteUrl(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wp-username">Username</Label>
                            <Input
                                id="wp-username"
                                placeholder="your_username"
                                value={wpUsername}
                                onChange={(e) => setWpUsername(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wp-password">Application Password</Label>
                            <Input
                                id="wp-password"
                                type="password"
                                placeholder="••••••••••••••••"
                                value={wpPassword}
                                onChange={(e) => setWpPassword(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white"
                            />
                        </div>

                        <div className="border-t border-gray-700 pt-4 space-y-2">
                            <Label htmlFor="wp-preset-name">Save as Preset</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="wp-preset-name"
                                    placeholder="e.g., 'My Tech Blog'"
                                    value={newPresetName}
                                    onChange={(e) => setNewPresetName(e.target.value)}
                                    className="bg-gray-700 border-gray-600 text-white"
                                />
                                <Button variant="outline" onClick={handleSavePreset} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                    Save
                                </Button>
                            </div>
                        </div>

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPublishDialog(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                            Cancel
                        </Button>
                        <Button onClick={handlePublish} disabled={isPublishing} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                            {isPublishing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Publish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Successfully Published!</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Your blog post has been published as a draft to WordPress.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">Close</AlertDialogCancel>
                        <AlertDialogAction asChild className="bg-green-600 hover:bg-green-700 text-white">
                            <a href={publishedPostUrl} target="_blank" rel="noopener noreferrer">
                                View Post
                            </a>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
                <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Publishing Failed</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            {`There was an error publishing your post: ${errorMessage}`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowErrorDialog(false)} className="bg-red-600 hover:bg-red-700 text-white">
                            Close
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
