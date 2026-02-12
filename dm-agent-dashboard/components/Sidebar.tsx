"use client";

import React from "react";
import { Sparkles, Plus, MoreVertical, Edit2, Trash2, Check, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useDashboard } from "@/components/DashboardContext";
import * as LucideIcons from "lucide-react";

const CURATED_ICONS = [
    "LayoutDashboard", "TrendingUp", "Zap", "Target", "Users",
    "Briefcase", "Clock", "Activity", "BarChart3", "PieChart",
    "LineChart", "Gauge", "Trophy", "Rocket", "Flame",
    "Star", "Heart", "Sparkles", "Calendar", "Folder", "Sprout",
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const { dashboards, addDashboard, renameDashboard, updateDashboardIcon, deleteDashboard } = useDashboard();

    // Inline create state
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newIcon, setNewIcon] = useState("LayoutDashboard");
    const [showCreateIconPicker, setShowCreateIconPicker] = useState(false);

    // Inline edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editIcon, setEditIcon] = useState("");
    const [showEditIconPicker, setShowEditIconPicker] = useState(false);

    // Dropdown state
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const handleCreateStart = () => {
        setIsCreating(true);
        setNewName("");
        setNewIcon("LayoutDashboard");
        setShowCreateIconPicker(false);
    };

    const handleCreateSave = () => {
        if (newName.trim()) {
            const id = addDashboard(newName.trim(), newIcon);
            setIsCreating(false);
            setNewName("");
            setNewIcon("LayoutDashboard");
            setShowCreateIconPicker(false);
            router.push(`/dashboard/${id}`);
        }
    };

    const handleCreateCancel = () => {
        setIsCreating(false);
        setNewName("");
        setNewIcon("LayoutDashboard");
        setShowCreateIconPicker(false);
    };

    const handleEditStart = (id: string, currentName: string, currentIcon: string) => {
        setEditingId(id);
        setEditName(currentName);
        setEditIcon(currentIcon);
        setShowEditIconPicker(false);
        setOpenDropdownId(null);
    };

    const handleEditSave = () => {
        if (editingId && editName.trim()) {
            renameDashboard(editingId, editName.trim());
            updateDashboardIcon(editingId, editIcon);
            setEditingId(null);
            setEditName("");
            setEditIcon("");
            setShowEditIconPicker(false);
        }
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditName("");
        setEditIcon("");
        setShowEditIconPicker(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this dashboard?")) {
            deleteDashboard(id);
            setOpenDropdownId(null);
            if (pathname === `/dashboard/${id}`) {
                router.push("/insights");
            }
        }
    };

    const getIconComponent = (iconName: string) => {
        const Icon = (LucideIcons as any)[iconName] || LucideIcons.LayoutDashboard;
        return Icon;
    };

    return (
        <div
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className={`fixed left-0 top-0 h-screen bg-[#14532B] flex flex-col z-50 transition-all duration-300 ease-in-out ${isExpanded ? "w-64" : "w-20"
                }`}
        >
            {/* Header / Logo */}
            <div className={`border-b border-white/20 flex items-center h-16 ${isExpanded ? "px-4 gap-3" : "justify-center"}`}>
                <div className="h-10 w-10 rounded-full bg-[#22C558] flex items-center justify-center shrink-0">
                    <LucideIcons.Sprout className="h-6 w-6 text-white" />
                </div>
                {isExpanded && (
                    <div className="overflow-hidden">
                        <h1 className="text-base font-bold text-white whitespace-nowrap">
                            Sprout DM Agent
                        </h1>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
                {/* Generated Insights */}
                <div>
                    <Link
                        href="/insights"
                        className={`flex items-center rounded-lg transition-colors ${isExpanded ? "gap-3 px-3 py-3" : "justify-center py-3"
                            } ${pathname === "/insights"
                                ? "bg-white/20 text-white"
                                : "text-white/80 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        <Sparkles className="h-5 w-5 shrink-0" />
                        {isExpanded && (
                            <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                                Generated Insights
                            </span>
                        )}
                    </Link>
                </div>



                {/* Your Dashboards Section */}
                {isExpanded && (
                    <div className="pt-2">
                        <div className="px-3 pb-2">
                            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                                Your Dashboards
                            </p>
                        </div>
                    </div>
                )}

                {/* Dashboard List */}
                <div className="space-y-1">
                    {dashboards.map((dashboard) => {
                        const Icon = getIconComponent(dashboard.icon);
                        const isActive = pathname === `/dashboard/${dashboard.id}`;
                        const isEditing = editingId === dashboard.id;

                        if (isEditing && isExpanded) {
                            // Edit Mode - Inline Form
                            const EditIcon = getIconComponent(editIcon);

                            return (
                                <div key={dashboard.id} className="flex flex-col gap-2 p-2 bg-white/5 rounded-md">
                                    {/* Top Row: Icon + Input */}
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowEditIconPicker(!showEditIconPicker)}
                                                className="h-8 w-8 rounded flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors shrink-0"
                                            >
                                                <EditIcon className="h-4 w-4 text-white" />
                                            </button>

                                            {/* Icon Picker Dropdown */}
                                            {showEditIconPicker && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-40"
                                                        onClick={() => setShowEditIconPicker(false)}
                                                    />
                                                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50">
                                                        <div className="grid grid-cols-5 gap-1.5 w-48">
                                                            {CURATED_ICONS.map((iconName) => {
                                                                const IconComp = getIconComponent(iconName);
                                                                const isSelected = editIcon === iconName;
                                                                return (
                                                                    <button
                                                                        key={iconName}
                                                                        onClick={() => {
                                                                            setEditIcon(iconName);
                                                                            setShowEditIconPicker(false);
                                                                        }}
                                                                        className={`h-8 w-8 rounded flex items-center justify-center transition-all ${isSelected
                                                                            ? "bg-[#2E7D32] text-white"
                                                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                                            }`}
                                                                    >
                                                                        <IconComp className="h-4 w-4" />
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleEditSave();
                                                if (e.key === "Escape") handleEditCancel();
                                            }}
                                            placeholder="Name..."
                                            autoFocus
                                            className="flex-1 h-8 bg-white/20 text-white text-sm px-2 rounded outline-none focus:bg-white/30 placeholder:text-white/50"
                                        />
                                    </div>

                                    {/* Bottom Row: Buttons */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={handleEditSave}
                                            className="h-7 bg-[#2E7D32] text-white text-xs font-medium rounded hover:bg-[#256629] transition-colors flex items-center justify-center"
                                        >
                                            <Check className="h-3 w-3 mr-1" />
                                            Save
                                        </button>
                                        <button
                                            onClick={handleEditCancel}
                                            className="h-7 text-gray-400 text-xs hover:bg-white/10 rounded transition-colors flex items-center justify-center"
                                        >
                                            <X className="h-3 w-3 mr-1" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        // Normal Mode
                        return (
                            <div key={dashboard.id} className="relative group">
                                <Link
                                    href={`/dashboard/${dashboard.id}`}
                                    className={`flex items-center rounded-lg transition-colors ${isExpanded ? "gap-3 px-3 py-3 pr-8" : "justify-center py-3"
                                        } ${isActive
                                            ? "bg-white/20 text-white"
                                            : "text-white/80 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />
                                    {isExpanded && (
                                        <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                                            {dashboard.name}
                                        </span>
                                    )}
                                </Link>

                                {/* Dropdown Trigger */}
                                {isExpanded && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setOpenDropdownId(openDropdownId === dashboard.id ? null : dashboard.id);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-opacity"
                                    >
                                        <MoreVertical className="h-4 w-4 text-white" />
                                    </button>
                                )}

                                {/* Dropdown Menu */}
                                {openDropdownId === dashboard.id && isExpanded && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setOpenDropdownId(null)}
                                        />
                                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                            <button
                                                onClick={() => handleEditStart(dashboard.id, dashboard.name, dashboard.icon)}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                                Rename
                                            </button>
                                            <button
                                                onClick={() => handleDelete(dashboard.id)}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {/* Inline Create Form */}
                    {isCreating && isExpanded && (
                        <div className="flex flex-col gap-2 p-2 bg-white/5 rounded-md">
                            {/* Top Row: Icon + Input */}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowCreateIconPicker(!showCreateIconPicker)}
                                        className="h-8 w-8 rounded flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors shrink-0"
                                    >
                                        {React.createElement(getIconComponent(newIcon), { className: "h-4 w-4 text-white" })}
                                    </button>

                                    {/* Icon Picker Dropdown */}
                                    {showCreateIconPicker && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setShowCreateIconPicker(false)}
                                            />
                                            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50">
                                                <div className="grid grid-cols-5 gap-1.5 w-48">
                                                    {CURATED_ICONS.map((iconName) => {
                                                        const IconComp = getIconComponent(iconName);
                                                        const isSelected = newIcon === iconName;
                                                        return (
                                                            <button
                                                                key={iconName}
                                                                onClick={() => {
                                                                    setNewIcon(iconName);
                                                                    setShowCreateIconPicker(false);
                                                                }}
                                                                className={`h-8 w-8 rounded flex items-center justify-center transition-all ${isSelected
                                                                    ? "bg-[#2E7D32] text-white"
                                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                                    }`}
                                                            >
                                                                <IconComp className="h-4 w-4" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCreateSave();
                                        if (e.key === "Escape") handleCreateCancel();
                                    }}
                                    placeholder="Name..."
                                    autoFocus
                                    className="flex-1 h-8 bg-white/20 text-white text-sm px-2 rounded outline-none focus:bg-white/30 placeholder:text-white/50"
                                />
                            </div>

                            {/* Bottom Row: Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleCreateSave}
                                    disabled={!newName.trim()}
                                    className="h-7 bg-[#2E7D32] text-white text-xs font-medium rounded hover:bg-[#256629] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    <Check className="h-3 w-3 mr-1" />
                                    Create
                                </button>
                                <button
                                    onClick={handleCreateCancel}
                                    className="h-7 text-gray-400 text-xs hover:bg-white/10 rounded transition-colors flex items-center justify-center"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* New Dashboard Button */}
                {isExpanded && !isCreating && (
                    <button
                        onClick={handleCreateStart}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <Plus className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-medium">New Dashboard</span>
                    </button>
                )}
            </nav>
        </div>
    );
}
