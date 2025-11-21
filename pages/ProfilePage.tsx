import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { getProfile, updateProfile, type UserProfile } from '../services/authService';

interface ProfilePageProps {
    onNavigateBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigateBack }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('');
    const [phone, setPhone] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const data = getProfile();
        if (data) {
            setProfile(data);
            setFullName(data.fullName);
            setRole(data.role);
            setPhone(data.phone || '');
        }
    }, []);

    const handleSave = () => {
        if (!fullName.trim() || !role.trim()) {
            return;
        }

        updateProfile({
            fullName: fullName.trim(),
            role: role.trim(),
            phone: phone.trim() || undefined,
        });

        const updated = getProfile();
        if (updated) {
            setProfile(updated);
        }

        setIsEditing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    const handleCancel = () => {
        if (profile) {
            setFullName(profile.fullName);
            setRole(profile.role);
            setPhone(profile.phone || '');
        }
        setIsEditing(false);
    };

    if (!profile) {
        return (
            <>
                <Header title="Profile" subtitle="Your Account Information" onBack={onNavigateBack} />
                <main className="container mx-auto px-4 py-8">
                    <p className="text-gray-400 text-center">Loading profile...</p>
                </main>
            </>
        );
    }

    return (
        <>
            <Header title="Profile" subtitle="Your Account Information" onBack={onNavigateBack} />
            <main className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
                    {success && (
                        <div className="mb-6 p-3 bg-green-900/50 border border-green-500 rounded text-green-200 text-sm text-center">
                            Profile updated successfully!
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <div className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-gray-300">
                                {profile.email}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            ) : (
                                <div className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white">
                                    {profile.fullName}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Role / Position</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                />
                            ) : (
                                <div className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white">
                                    {profile.role}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Optional"
                                />
                            ) : (
                                <div className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white">
                                    {profile.phone || 'Not provided'}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 pt-4">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-700 transition-colors"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};
