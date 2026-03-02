"use client";

import { useState, useEffect } from "react";
import { Plus, X, Edit2, Save, XCircle } from "lucide-react";
import { useDashboard } from "@/components/DashboardContext";

export default function ProfilePage() {
    const { user, updateUser } = useDashboard();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        jobRole: ""
    });

    const [teams, setTeams] = useState([
        "Lireo",
        "Adamya",
        "Hathoria",
    ]);

    // Sync state when user loads
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                jobRole: user.jobRole || "User"
            });
        }
    }, [user]);

    const handleSave = async () => {
        await updateUser(formData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                name: user.name || "",
                jobRole: user.jobRole || "User"
            });
        }
        setIsEditing(false);
    };

    const handleAddTeam = () => {
        const teamName = prompt("Enter team name:");
        if (teamName && teamName.trim()) {
            setTeams([...teams, teamName.trim()]);
        }
    };

    const handleRemoveTeam = (index: number) => {
        setTeams(teams.filter((_, i) => i !== index));
    };

    return (
        <div className="px-6">
            {/* Side-by-Side Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Identity Card */}
                <div className="bg-white rounded-lg shadow-sm p-8 h-full relative">
                    {/* Edit Button */}
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <Edit2 className="h-5 w-5" />
                        </button>
                    ) : (
                        <div className="absolute top-8 right-8 flex gap-2">
                            <button
                                onClick={handleSave}
                                className="text-green-600 hover:text-green-700 transition-colors"
                            >
                                <Save className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleCancel}
                                className="text-red-500 hover:text-red-600 transition-colors"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="h-24 w-24 rounded-full bg-[#1B5E20] flex items-center justify-center shrink-0">
                            <span className="text-3xl font-bold text-white">
                                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                            </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-4">
                            {/* Name Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E20] bg-white text-lg font-semibold"
                                    />
                                ) : (
                                    <p className="text-lg font-semibold text-gray-900">{user?.name || 'N/A'}</p>
                                )}
                            </div>

                            {/* Job Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Job Role
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.jobRole}
                                        onChange={(e) => setFormData(prev => ({ ...prev, jobRole: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E20] bg-white text-sm"
                                        placeholder="e.g. Product Manager"
                                    />
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#2E7D32] text-white">
                                        {user?.jobRole || 'User'}
                                    </span>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <p className="text-gray-600">{user?.email || 'N/A'}</p>
                            </div>

                            {/* System Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    System Role
                                </label>
                                <p className="text-gray-600 font-mono text-sm">{user?.systemRole || 'USER'}</p>
                            </div>

                            {/* User ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    User ID
                                </label>
                                <p className="text-gray-500 font-mono text-xs">{user?.id || '...'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Managed Teams Scope */}
                <div className="bg-white rounded-lg shadow-sm p-8 h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">My Teams Scope</h2>
                        <button
                            onClick={handleAddTeam}
                            className="flex items-center gap-2 px-4 py-2 bg-[#2E7D32] text-white rounded-lg hover:bg-[#256629] transition-colors text-sm font-medium"
                        >
                            <Plus className="h-4 w-4" />
                            Add Team
                        </button>
                    </div>

                    {/* Teams List */}
                    <div className="flex flex-wrap gap-2">
                        {teams.map((team, index) => (
                            <div
                                key={index}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-medium group hover:bg-gray-200 transition-colors"
                            >
                                <span>{team}</span>
                                <button
                                    onClick={() => handleRemoveTeam(index)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {teams.length === 0 && (
                        <p className="text-gray-500 text-sm">
                            No teams added yet. Click "Add Team" to get started.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
