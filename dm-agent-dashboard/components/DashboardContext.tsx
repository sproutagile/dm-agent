"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ChatMessage, KPIData, GeneratedInsight } from "@/types/sprout";

// Dashboard Interface (Frontend View)
export interface Dashboard {
    id: string;
    name: string;
    icon: string;
    graphs: string[];
    layout?: any[];
    is_public?: boolean;
    share_token?: string;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    jobRole: string;
    systemRole: 'ADMIN' | 'USER';
}

interface DashboardContextType {
    user: UserProfile | null;
    dashboards: Dashboard[];
    generatedInsights: GeneratedInsight[];
    dynamicWidgets: Record<string, any>; // Key: widgetId, Value: Widget Data
    chatMessages: ChatMessage[];
    kpiData: KPIData;
    loading: boolean;
    isSidebarExpanded: boolean;

    // Actions
    setIsSidebarExpanded: (expanded: boolean) => void;
    addDashboard: (name: string, icon: string) => Promise<string>;
    renameDashboard: (id: string, name: string) => Promise<void>;
    updateDashboardIcon: (id: string, icon: string) => Promise<void>;
    deleteDashboard: (id: string) => Promise<void>;
    addGraphToDashboard: (dashboardId: string, graphId: string) => Promise<void>;
    removeGraphFromDashboard: (dashboardId: string, graphId: string) => Promise<void>;
    reorderDashboardGraphs: (dashboardId: string, newGraphs: string[]) => Promise<void>;
    updateDashboardLayout: (dashboardId: string, layout: any[]) => Promise<void>;
    getDashboard: (id: string) => Dashboard | undefined;

    // Insights
    addGeneratedInsight: (widgetId: string, label: string, data?: any) => Promise<string>;
    removeGeneratedInsight: (id: string) => Promise<void>;

    // Dynamic Widgets
    addDynamicWidget: (widget: any) => void;
    updateDynamicWidget: (id: string, updates: any) => void;

    // Chat
    addMessage: (role: 'user' | 'assistant' | 'system', content: string) => Promise<void>;
    clearMessages: () => Promise<void>;

    // KPIs & Metrics
    updateKPIs: (data: Partial<KPIData>) => Promise<void>;
    sourceMetrics: Record<string, any>;
    refreshMetrics: () => Promise<void>;

    // Auth
    logout: () => Promise<void>;
    updateUser: (data: { name: string; jobRole: string }) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [generatedInsights, setGeneratedInsights] = useState<GeneratedInsight[]>([]);
    const [dynamicWidgets, setDynamicWidgets] = useState<Record<string, any>>({});
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [kpiData, setKpiData] = useState<KPIData>({ activeTasks: 0, throughput: 0, blockers: 0 });
    const [sourceMetrics, setSourceMetrics] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    // Initial Data Load
    useEffect(() => {
        async function loadData() {
            try {
                // 1. Fetch User Profile
                const userRes = await fetch("/api/auth/me");
                if (userRes.ok) {
                    const { user: fetchedUser } = await userRes.json();
                    setUser(fetchedUser);

                    if (!fetchedUser) {
                        setLoading(false);
                        return;
                    }

                    // Only fetch other data if logged in
                    const [dashRes, insightRes, chatRes, kpiRes, metricsRes] = await Promise.all([
                        fetch("/api/dashboards"),
                        fetch("/api/insights"),
                        fetch("/api/chat"),
                        fetch("/api/kpi"),
                        fetch("/api/metrics")
                    ]);

                    if (dashRes.ok) setDashboards(await dashRes.json());

                    if (insightRes.ok) {
                        const insights: any[] = await insightRes.json();
                        const loadedInsights: GeneratedInsight[] = insights.map(i => ({
                            id: i.id,
                            widgetId: i.id,
                            label: i.label,
                            generatedAt: i.generatedAt
                        }));
                        setGeneratedInsights(loadedInsights);

                        const widgets: Record<string, any> = {};
                        insights.forEach(i => {
                            if (i.data) {
                                widgets[i.id] = { ...i.data, id: i.id };
                            }
                        });
                        setDynamicWidgets(widgets);
                    }

                    if (chatRes.ok) setChatMessages(await chatRes.json());

                    if (kpiRes.ok) {
                        const kpis = await kpiRes.json();
                        setKpiData({
                            activeTasks: kpis.activeTasks || 0,
                            throughput: kpis.throughput || 0,
                            blockers: kpis.blockers || 0
                        });
                    }

                    if (metricsRes.ok) {
                        setSourceMetrics(await metricsRes.json());
                    }
                }
            } catch (error) {
                console.error("Failed to load initial data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();

        // Polling mechanism to receive newly added HTTP POST insights
        const pollInterval = setInterval(async () => {
            try {
                // Only poll if we have successfully loaded a user profile initially 
                // Using the 'user' closure variable directly won't update in setInterval, but the API will just return 401 if unauth'd anyway
                const [insightRes, metricsRes] = await Promise.all([
                    fetch("/api/insights", {
                        cache: 'no-store',
                        headers: {
                            'Pragma': 'no-cache',
                            'Cache-Control': 'no-cache'
                        }
                    }),
                    fetch("/api/metrics", {
                        cache: 'no-store',
                        headers: {
                            'Pragma': 'no-cache',
                            'Cache-Control': 'no-cache'
                        }
                    })
                ]);

                if (!insightRes.ok && !metricsRes.ok) return; // 401 naturally handles the "unauthenticated" skip

                if (metricsRes.ok) {
                    const latestMetrics = await metricsRes.json();
                    setSourceMetrics(latestMetrics);
                }

                if (insightRes.ok) {
                    const insights: any[] = await insightRes.json();

                    // Update insights list if there's a difference
                    setGeneratedInsights(prev => {
                        const currentIds = new Set(prev.map(p => p.id));
                        const newInsights = insights.filter(i => !currentIds.has(i.id));

                        if (newInsights.length > 0) {
                            const loadedNewInsights = newInsights.map(i => ({
                                id: i.id,
                                widgetId: i.id,
                                label: i.label || i.title || 'Generated Insight',
                                generatedAt: i.generatedAt || i.created_at || new Date().toISOString()
                            }));

                            // Also update the dynamicWidgets map for those new ones
                            setDynamicWidgets(prevWidgets => {
                                const nextWidgets = { ...prevWidgets };
                                newInsights.forEach(i => {
                                    if (i.data) {
                                        nextWidgets[i.id] = { ...i.data, id: i.id };
                                    }
                                });
                                return nextWidgets;
                            });

                            return [...loadedNewInsights, ...prev];
                        }
                        return prev;
                    });
                }
            } catch (err) {
                // silently fail polling
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, []);

    const addDashboard = async (name: string, icon: string) => {
        const res = await fetch("/api/dashboards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, icon }),
        });
        if (res.ok) {
            const newDashboard = await res.json();
            setDashboards((prev) => [...prev, newDashboard]);
            return newDashboard.id;
        }
        return "";
    };

    const renameDashboard = async (id: string, name: string) => {
        setDashboards((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)));
        await fetch(`/api/dashboards/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
    };

    const updateDashboardIcon = async (id: string, icon: string) => {
        setDashboards((prev) => prev.map((d) => (d.id === id ? { ...d, icon } : d)));
        await fetch(`/api/dashboards/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ icon }),
        });
    };

    const deleteDashboard = async (id: string) => {
        setDashboards((prev) => prev.filter((d) => d.id !== id));
        await fetch(`/api/dashboards/${id}`, { method: "DELETE" });
    };

    const addGraphToDashboard = async (dashboardId: string, graphId: string) => {
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard || dashboard.graphs.includes(graphId)) return;

        const newGraphs = [...dashboard.graphs, graphId];
        setDashboards((prev) =>
            prev.map((d) => (d.id === dashboardId ? { ...d, graphs: newGraphs } : d))
        );

        await fetch(`/api/dashboards/${dashboardId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ graphs: newGraphs }),
        });
    };

    const removeGraphFromDashboard = async (dashboardId: string, graphId: string) => {
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard) return;

        const newGraphs = dashboard.graphs.filter((g) => g !== graphId);
        setDashboards((prev) =>
            prev.map((d) => (d.id === dashboardId ? { ...d, graphs: newGraphs } : d))
        );

        await fetch(`/api/dashboards/${dashboardId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ graphs: newGraphs }),
        });
    };

    const reorderDashboardGraphs = async (dashboardId: string, newGraphs: string[]) => {
        setDashboards((prev) =>
            prev.map((d) => (d.id === dashboardId ? { ...d, graphs: newGraphs } : d))
        );

        await fetch(`/api/dashboards/${dashboardId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ graphs: newGraphs }),
        });
    };

    const updateDashboardLayout = async (dashboardId: string, layout: any[]) => {
        setDashboards((prev) =>
            prev.map((d) => (d.id === dashboardId ? { ...d, layout } : d))
        );

        await fetch(`/api/dashboards/${dashboardId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layout }),
        });
    };

    const getDashboard = (id: string) => dashboards.find((d) => d.id === id);

    const addGeneratedInsight = async (widgetId: string, label: string, data?: any) => {
        // Optimistic
        const tempId = widgetId;
        const newInsight: GeneratedInsight = {
            id: tempId,
            widgetId: tempId,
            label,
            generatedAt: new Date().toISOString()
        };

        setGeneratedInsights(prev => [newInsight, ...prev]);
        if (data) setDynamicWidgets(prev => ({ ...prev, [tempId]: data }));

        // API
        const res = await fetch("/api/insights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label, data }),
        });

        if (res.ok) {
            const serverInsight = await res.json();
            const finalId = serverInsight.id;

            setGeneratedInsights(prev => prev.map(i => i.id === tempId ? {
                id: finalId,
                widgetId: finalId,
                label: serverInsight.label,
                generatedAt: serverInsight.generatedAt
            } : i));

            if (data) {
                setDynamicWidgets(prev => {
                    const next = { ...prev };
                    delete next[tempId];
                    next[finalId] = { ...data, id: finalId };
                    return next;
                });
            }
            return finalId;
        }
        return tempId;
    };

    const removeGeneratedInsight = async (id: string) => {
        setGeneratedInsights((prev) => prev.filter((i) => i.id !== id));
        setDynamicWidgets(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        await fetch(`/api/insights/${id}`, { method: "DELETE" });
    };

    const addDynamicWidget = (widget: any) => {
        setDynamicWidgets(prev => ({ ...prev, [widget.id]: widget }));
    };

    const updateDynamicWidget = async (id: string, updates: any) => {
        setDynamicWidgets(prev => {
            const nextState = { ...prev[id], ...updates };
            return { ...prev, [id]: nextState };
        });

        // Persist back to the DB so refresh/reload doesn't wipe changes
        try {
            // we need to pass the FULL updated object state to the DB, not just the isolated delta
            const currentWidget = dynamicWidgets[id] || {};
            const payloadToSave = { ...currentWidget, ...updates };

            await fetch(`/api/insights/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadToSave),
            });
        } catch (e) {
            console.error("Failed to persist insights update:", e);
        }
    };

    const addMessage = async (role: 'user' | 'assistant' | 'system', content: string) => {
        const tempId = crypto.randomUUID();
        const newMessage: ChatMessage = {
            id: tempId,
            role,
            content,
            created_at: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, newMessage]);

        await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role, content }),
        });
    };

    const clearMessages = async () => {
        setChatMessages([]);
        await fetch("/api/chat", { method: "DELETE" });
    };

    const updateKPIs = async (data: Partial<KPIData>) => {
        setKpiData(prev => ({ ...prev, ...data }));
        await fetch("/api/kpi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
    };

    const refreshMetrics = async () => {
        try {
            const metricsRes = await fetch("/api/metrics", {
                cache: 'no-store',
                headers: {
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache'
                }
            });
            if (metricsRes.ok) {
                const latestMetrics = await metricsRes.json();
                setSourceMetrics(latestMetrics);
            }
        } catch (err) {
            console.error("Manual refresh of metrics failed:", err);
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const updateUser = async (data: { name: string; jobRole: string }) => {
        const res = await fetch("/api/auth/me", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            const { user: updatedUser } = await res.json();
            setUser(updatedUser);
        }
    };

    return (
        <DashboardContext.Provider
            value={{
                user,
                dashboards,
                generatedInsights,
                dynamicWidgets,
                chatMessages,
                kpiData,
                loading,
                isSidebarExpanded,
                setIsSidebarExpanded,
                addDashboard,
                renameDashboard,
                updateDashboardIcon,
                deleteDashboard,
                addGraphToDashboard,
                removeGraphFromDashboard,
                reorderDashboardGraphs,
                updateDashboardLayout,
                getDashboard,
                addGeneratedInsight,
                removeGeneratedInsight,
                addDynamicWidget,
                updateDynamicWidget,
                addMessage,
                clearMessages,
                updateKPIs,
                sourceMetrics,
                refreshMetrics,
                logout,
                updateUser
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
