"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export default function ProfilePage() {
    const [name, setName] = useState("Sunny Madridano");
    const [teams, setTeams] = useState([
        "Lireo",
        "Adamya",
        "Hathoria",
    ]);

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
        <div className="pt-20 px-6">
            {/* Side-by-Side Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Identity Card */}
                <div className="bg-white rounded-lg shadow-sm p-8 h-full">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="h-24 w-24 rounded-full bg-[#1B5E20] flex items-center justify-center shrink-0">
                            <span className="text-3xl font-bold text-white">SM</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-4">
                            {/* Name Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent text-lg font-semibold"
                                />
                            </div>

                            {/* Role Badge */}
                            <div>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#2E7D32] text-white">
                                    Delivery Manager
                                </span>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <p className="text-gray-600">sunny@sprout.ph</p>
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
