import React, { useState } from 'react';
import { getCurrentUser } from '../services/authService';

interface SidebarProps {
    onNavigateToProfile: () => void;
    onLogout: () => void;
    onOpenHistory: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigateToProfile, onLogout, onOpenHistory }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const userEmail = getCurrentUser();

    return (
        <>
            {/* Sidebar */}
            <div
                className={`fixed left-0 top-0 h-full bg-gray-800 shadow-2xl z-50 transition-all duration-300 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'
                    }`}
            >
                {/* Logo Section */}
                <div className="p-6 border-b border-gray-700">
                    {!isCollapsed ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-cyan-400">BloomX</h1>
                                <p className="text-xs text-gray-400 mt-1">BUSINESS SOLUTIONS</p>
                            </div>
                            <button
                                onClick={() => setIsCollapsed(true)}
                                className="text-gray-400 hover:text-white transition-colors"
                                title="Collapse sidebar"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                                    />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCollapsed(false)}
                            className="text-cyan-400 hover:text-cyan-300 transition-colors w-full flex justify-center"
                            title="Expand sidebar"
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
                                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-6">
                    <ul className="space-y-2 px-3">
                        {/* History */}
                        <li>
                            <button
                                onClick={onOpenHistory}
                                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-cyan-400 rounded-lg transition-all group"
                                title="Chat History"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                {!isCollapsed && <span className="font-medium">History</span>}
                            </button>
                        </li>

                        {/* Profile */}
                        <li>
                            <button
                                onClick={onNavigateToProfile}
                                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-cyan-400 rounded-lg transition-all group"
                                title="Profile"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                                {!isCollapsed && <span className="font-medium">Profile</span>}
                            </button>
                        </li>

                        {/* Logout */}
                        <li>
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-all group"
                                title="Logout"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    />
                                </svg>
                                {!isCollapsed && <span className="font-medium">Logout</span>}
                            </button>
                        </li>
                    </ul>
                </nav>

                {/* User Info at Bottom */}
                {!isCollapsed && userEmail && (
                    <div className="p-4 border-t border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                                {userEmail.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-200 truncate">{userEmail.split('@')[0]}</p>
                                <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Spacer to prevent content from going under sidebar */}
            <div className={`${isCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 transition-all duration-300`} />
        </>
    );
};
