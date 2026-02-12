import { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

const CURATED_ICONS = [
    "LayoutDashboard",
    "TrendingUp",
    "Zap",
    "Target",
    "Users",
    "Briefcase",
    "Clock",
    "Activity",
    "BarChart3",
    "PieChart",
    "LineChart",
    "Gauge",
    "Trophy",
    "Rocket",
    "Flame",
    "Star",
    "Heart",
    "Sparkles",
    "Calendar",
    "Folder",
];

interface IconPickerProps {
    selectedIcon?: string;
    onSelect: (iconName: string) => void;
}

export function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
    return (
        <div className="grid grid-cols-5 gap-2 p-4 bg-white rounded-lg">
            {CURATED_ICONS.map((iconName) => {
                const Icon = (LucideIcons as any)[iconName] as LucideIcon;
                const isSelected = selectedIcon === iconName;

                return (
                    <button
                        key={iconName}
                        onClick={() => onSelect(iconName)}
                        className={`h-12 w-12 rounded-lg flex items-center justify-center transition-all ${isSelected
                                ? "bg-[#22C558] text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        title={iconName}
                    >
                        <Icon className="h-6 w-6" />
                    </button>
                );
            })}
        </div>
    );
}
