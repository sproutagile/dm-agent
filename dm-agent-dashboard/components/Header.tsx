"use client";

import { usePathname } from "next/navigation";
import { ChevronDown, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useDashboard } from "@/components/DashboardContext";

const routeTitles: Record<string, string> = {
    "/insights": "Generated Insights",
    "/profile": "My Profile",
};

export function Header() {
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { getDashboard, user, logout, loading } = useDashboard();

    // Handle dynamic dashboard titles
    let pageTitle = routeTitles[pathname] || "Dashboard";

    // Check if we're on a dashboard page
    if (pathname.startsWith("/dashboard/")) {
        const dashboardId = pathname.split("/dashboard/")[1];
        const dashboard = getDashboard(dashboardId);
        pageTitle = dashboard?.name || "Dashboard";
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="fixed top-0 right-0 left-20 h-16 z-40 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            {/* Left: Page Title */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-800">{pageTitle}</h1>
            </div>

            {/* Right: User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
                >
                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-[#1B5E20] flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                        </span>
                    </div>
                    {/* Name */}
                    <div className="text-left hidden sm:block">
                        <p className="text-sm font-medium text-foreground">{user?.name || 'Loading...'}</p>
                        <p className="text-xs text-muted-foreground">{user?.jobRole || ''}</p>
                    </div>
                    {/* Chevron */}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                        <Link
                            href="/profile"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-gray-50 transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                        >
                            <User className="h-4 w-4 text-muted-foreground" />
                            My Profile
                        </Link>
                        <hr className="my-2 border-gray-200" />
                        <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => {
                                setIsDropdownOpen(false);
                                logout();
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
