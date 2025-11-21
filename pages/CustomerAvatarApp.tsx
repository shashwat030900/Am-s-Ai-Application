
import React, { useState, useCallback } from 'react';
import { InputForm } from '../components/InputForm';
import { AvatarOutput } from '../components/AvatarOutput';
import { Loader } from '../components/Loader';
import { Modal } from '../components/Modal';
import { generateAvatarProfile } from '../services/geminiService';
import { saveHistory } from '../services/historyService';
import { Header } from '../components/Header';

interface CustomerAvatarAppProps {
  onNavigateBack: () => void;
}

const avatarLoadingMessages = [
  "Warming up the AI thought engine...",
  "Analyzing market nuances for India...",
  "Consulting with marketing strategists...",
  "Crafting your detailed customer persona...",
  "Mapping emotional triggers...",
  "Adding the final strategic touches...",
];


export const CustomerAvatarApp: React.FC<CustomerAvatarAppProps> = ({ onNavigateBack }) => {
  const [businessType, setBusinessType] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarMarkdown, setAvatarMarkdown] = useState<string>('');

  const handleGenerate = useCallback(async () => {
    if (!businessType.trim() || !problem.trim() || !solution.trim()) {
      setError('All input fields are required. Please provide details for Business Type, Problem, and Solution.');
      return;
    }

    setIsLoading(true);
    setAvatarMarkdown('');
    setError(null);

    try {
      const markdown = await generateAvatarProfile({ businessType, problem, solution });
      setAvatarMarkdown(markdown);
      // Save to history
      saveHistory('Customer Avatar', { businessType, problem, solution }, markdown);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate avatar. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [businessType, problem, solution]);

  return (
    <>
      <Header
        title="Customer Avatar Deep Dive"
        subtitle="AI-Powered Insights for the Indian Market"
        onBack={onNavigateBack}
      />
      {isLoading && <Loader messages={avatarLoadingMessages} />}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <div>
            <InputForm
              businessType={businessType}
              setBusinessType={setBusinessType}
              problem={problem}
              setProblem={setProblem}
              solution={solution}
              setSolution={setSolution}
              onSubmit={handleGenerate}
              isLoading={isLoading}
            />
          </div>

          {avatarMarkdown && !isLoading && (
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 min-h-[400px]">
              <AvatarOutput markdown={avatarMarkdown} />
            </div>
          )}
        </div>
      </main>
      <Modal isOpen={!!error} onClose={() => setError(null)} title="Warning">
        <p>{error}</p>
      </Modal>
    </>
  );
};
