"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DashboardProvider, useDashboard } from "@/components/DashboardContext";
import { WidgetListener } from "@/components/sprout/WidgetListener";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/register";

    if (isAuthPage) {
        return (
            <DashboardProvider>
                <main className="min-h-screen bg-gray-50 flex flex-col justify-center">
                    {children}
                </main>
            </DashboardProvider>
        );
    }

    return (
        <DashboardProvider>
            <WidgetListener />
            <Sidebar />
            <Header />
            <MainLayout>
                {children}
            </MainLayout>
        </DashboardProvider>
    );
}

function MainLayout({ children }: { children: React.ReactNode }) {
    const { isSidebarExpanded } = useDashboard();

    return (
        <main
            className="pt-24 min-h-screen bg-background p-8 transition-all duration-300 ease-in-out"
            style={{ marginLeft: isSidebarExpanded ? '256px' : '80px' }}
        >
            {children}
        </main>
    );
}
