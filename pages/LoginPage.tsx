import React, { useState } from 'react';
import { sendOtp, verifyOtp } from '../services/authService';
import { Loader } from '../components/Loader';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await sendOtp(email);
            setStep('otp');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await verifyOtp(email, otp);
            onLoginSuccess();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Verification failed.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-cyan-400 mb-2">Am's AI Dashboard</h1>
                    <p className="text-gray-400">Secure Login</p>
                </div>

                {isLoading && (
                    <div className="mb-6">
                        <Loader messages={step === 'email' ? ["Verifying domain...", "Sending OTP..."] : ["Verifying code...", "Logging in..."]} />
                    </div>
                )}

                {!isLoading && (
                    <>
                        {step === 'email' ? (
                            <form onSubmit={handleSendOtp} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                        Work Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="you@bloomxsolutions.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-700 transition-colors"
                                >
                                    Send Verification Code
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div>
                                    <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-2">
                                        Verification Code
                                    </label>
                                    <input
                                        type="text"
                                        id="otp"
                                        required
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 tracking-widest text-center text-xl"
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={6}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                                >
                                    Verify & Login
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="w-full text-gray-400 text-sm hover:text-white transition-colors"
                                >
                                    Back to Email
                                </button>
                            </form>
                        )}

                        {error && (
                            <div className="mt-6 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm text-center">
                                {error}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
