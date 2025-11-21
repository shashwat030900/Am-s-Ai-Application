import React, { useState } from 'react';
import { saveProfile, getCurrentUser, type UserProfile } from '../services/authService';

interface ProfileSetupPageProps {
    onComplete: () => void;
}

export const ProfileSetupPage: React.FC<ProfileSetupPageProps> = ({ onComplete }) => {
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!fullName.trim() || !role.trim()) {
            setError('Full Name and Role are required.');
            return;
        }

        const email = getCurrentUser();
        if (!email) {
            setError('Session expired. Please log in again.');
            return;
        }

        const profile: UserProfile = {
            fullName: fullName.trim(),
            role: role.trim(),
            phone: phone.trim() || undefined,
            email,
        };

        saveProfile(profile);
        onComplete();
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-cyan-400 mb-2">Welcome!</h1>
                    <p className="text-gray-400">Let's set up your profile</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                            Role / Position *
                        </label>
                        <input
                            type="text"
                            id="role"
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Account Manager"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                            Phone Number (Optional)
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="+91 98765 43210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-700 transition-colors"
                    >
                        Complete Setup
                    </button>

                    {error && (
                        <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};
