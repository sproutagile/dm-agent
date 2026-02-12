"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Dashboard {
    id: string;
    name: string;
    icon: string;
    graphs: string[];
}

export interface GeneratedInsight {
    id: string;
    widgetId: string;
    label: string;
    generatedAt: string;
}

interface DashboardContextType {
    dashboards: Dashboard[];
    generatedInsights: GeneratedInsight[];
    dynamicWidgets: Record<string, any>;
    addDashboard: (name: string, icon: string) => string;
    renameDashboard: (id: string, name: string) => void;
    updateDashboardIcon: (id: string, icon: string) => void;
    deleteDashboard: (id: string) => void;
    addGraphToDashboard: (dashboardId: string, graphId: string) => void;
    removeGraphFromDashboard: (dashboardId: string, graphId: string) => void;
    getDashboard: (id: string) => Dashboard | undefined;
    addGeneratedInsight: (widgetId: string, label: string) => string;
    removeGeneratedInsight: (id: string) => void;
    addDynamicWidget: (widget: any) => void;
    updateDynamicWidget: (id: string, updates: any) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const STORAGE_KEY = "dm-dashboards-v3";

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [generatedInsights, setGeneratedInsights] = useState<GeneratedInsight[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Dynamic Widgets (from Sprout)
    const [dynamicWidgets, setDynamicWidgets] = useState<Record<string, any>>({});

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                setDashboards(data.dashboards || []);
                setGeneratedInsights(data.generatedInsights || []);
                setDynamicWidgets(data.dynamicWidgets || {});
            } else {
                // Initialize with a default dashboard if empty
                const defaultDashboard: Dashboard = {
                    id: "default",
                    name: "Main Dashboard",
                    icon: "LayoutDashboard",
                    graphs: []
                };
                setDashboards([defaultDashboard]);
            }
        } catch {
            // Ignore parse errors
        }
        setLoaded(true);
    }, []);

    // Persist to localStorage on change
    useEffect(() => {
        if (loaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                dashboards,
                generatedInsights,
                dynamicWidgets
            }));
        }
    }, [dashboards, generatedInsights, dynamicWidgets, loaded]);

    const addDashboard = (name: string, icon: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newDashboard: Dashboard = {
            id,
            name,
            icon,
            graphs: []
        };
        setDashboards((prev) => [...prev, newDashboard]);
        return id;
    };

    const renameDashboard = (id: string, name: string) => {
        setDashboards((prev) =>
            prev.map((d) => (d.id === id ? { ...d, name } : d))
        );
    };

    const updateDashboardIcon = (id: string, icon: string) => {
        setDashboards((prev) =>
            prev.map((d) => (d.id === id ? { ...d, icon } : d))
        );
    };

    const deleteDashboard = (id: string) => {
        setDashboards((prev) => prev.filter((d) => d.id !== id));
    };

    const addGraphToDashboard = (dashboardId: string, graphId: string) => {
        setDashboards((prev) =>
            prev.map((d) => {
                if (d.id === dashboardId) {
                    if (d.graphs.includes(graphId)) return d;
                    return { ...d, graphs: [...d.graphs, graphId] };
                }
                return d;
            })
        );
    };

    const removeGraphFromDashboard = (dashboardId: string, graphId: string) => {
        setDashboards((prev) =>
            prev.map((d) => {
                if (d.id === dashboardId) {
                    return {
                        ...d,
                        graphs: d.graphs.filter((g) => g !== graphId)
                    };
                }
                return d;
            })
        );
    };

    const getDashboard = (id: string) => dashboards.find((d) => d.id === id);

    const addGeneratedInsight = (widgetId: string, label: string) => {
        const id = `${widgetId}-${Date.now()}`;
        const now = new Date();
        const timeStr = now.toLocaleTimeString();

        setGeneratedInsights((prev) => [
            {
                id,
                widgetId,
                label,
                generatedAt: timeStr,
            },
            ...prev,
        ]);

        return id;
    };

    const removeGeneratedInsight = (id: string) => {
        setGeneratedInsights((prev) => prev.filter((i) => i.id !== id));
    };

    const addDynamicWidget = (widget: any) => {
        setDynamicWidgets(prev => ({
            ...prev,
            [widget.id]: widget
        }));
    };

    return (
        <DashboardContext.Provider
            value={{
                dashboards,
                generatedInsights,
                dynamicWidgets,
                addDashboard,
                renameDashboard,
                updateDashboardIcon,
                deleteDashboard,
                addGraphToDashboard,
                removeGraphFromDashboard,
                getDashboard,
                addGeneratedInsight,
                removeGeneratedInsight,
                addDynamicWidget,
                updateDynamicWidget: (id: string, updates: any) => {
                    setDynamicWidgets(prev => ({
                        ...prev,
                        [id]: { ...prev[id], ...updates }
                    }));
                }
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error("useDashboard must be used within a DashboardProvider");
    }
    return context;
}
