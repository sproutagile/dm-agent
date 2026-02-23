"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DashboardProvider } from "@/components/DashboardContext";
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
            <main className="ml-20 pt-24 min-h-screen bg-background p-8">
                {children}
            </main>
        </DashboardProvider>
    );
}
