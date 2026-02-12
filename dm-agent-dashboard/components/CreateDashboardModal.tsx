"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import * as LucideIcons from "lucide-react";

const CURATED_ICONS = [
    "LayoutDashboard", "TrendingUp", "Zap", "Target", "Users",
    "Briefcase", "Clock", "Activity", "BarChart3", "PieChart",
    "LineChart", "Gauge", "Trophy", "Rocket", "Flame",
    "Star", "Heart", "Sparkles", "Calendar", "Folder",
];

interface CreateDashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, icon: string) => void;
}

export function CreateDashboardModal({ isOpen, onClose, onCreate }: CreateDashboardModalProps) {
    const [name, setName] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("LayoutDashboard");

    if (!isOpen) return null;

    const handleCreate = () => {
        if (name.trim()) {
            onCreate(name.trim(), selectedIcon);
            setName("");
            setSelectedIcon("LayoutDashboard");
        }
    };

    const handleCancel = () => {
        setName("");
        setSelectedIcon("LayoutDashboard");
        onClose();
    };

    const getIconComponent = (iconName: string) => {
        const Icon = (LucideIcons as any)[iconName] || LucideIcons.LayoutDashboard;
        return Icon;
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[100]"
                onClick={handleCancel}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-white rounded-xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Create Dashboard</h2>
                    <button
                        onClick={handleCancel}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6">
                    {/* Dashboard Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dashboard Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                            placeholder="e.g., Sprint 16"
                            autoFocus
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
                        />
                    </div>

                    {/* Icon Picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Choose Icon
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {CURATED_ICONS.map((iconName) => {
                                const Icon = getIconComponent(iconName);
                                const isSelected = selectedIcon === iconName;

                                return (
                                    <button
                                        key={iconName}
                                        onClick={() => setSelectedIcon(iconName)}
                                        className={`h-12 w-12 rounded-lg flex items-center justify-center transition-all ${isSelected
                                            ? "bg-[#2E7D32] text-white shadow-md ring-2 ring-[#2E7D32] ring-offset-2"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        title={iconName}
                                    >
                                        <Icon className="h-6 w-6" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim()}
                        className="px-6 py-2 bg-[#2E7D32] text-white rounded-lg hover:bg-[#256629] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        Create
                    </button>
                </div>
            </div>
        </>
    );
}
