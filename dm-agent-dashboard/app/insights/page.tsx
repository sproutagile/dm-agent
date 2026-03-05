"use client";

import { useDashboard } from "@/components/DashboardContext";
import { Sparkles, Plus, Check, Trash2, Eye, BarChart3 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { WIDGET_LIBRARY } from "@/data/mockMetrics";

// Widget Components
import { ScorecardWidget } from "@/components/widgets/ScorecardWidget";
import { TextWidget } from "@/components/widgets/TextWidget";
import { ReleaseBurnupChart } from "@/components/charts/ReleaseBurnupChart";
import { VelocityTrendChart } from "@/components/charts/VelocityTrendChart";
import { DoneTicketChart } from "@/components/charts/DoneTicketChart";
import { TeamEfficiencyChart } from "@/components/charts/TeamEfficiencyChart";
import { WorkflowEfficiencyChart } from "@/components/charts/WorkflowEfficiencyChart";
import { DynamicChart } from "@/components/sprout/DynamicChart";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const WIDGET_COMPONENTS: Record<string, React.FC<any>> = {
    VelocityTrendChart,
    ReleaseBurnupChart,
    DoneTicketChart,
    TeamEfficiencyChart,
    WorkflowEfficiencyChart,
};

const ONE_HOUR_MS = 60 * 60 * 1000;
const LS_VIEWED_KEY = "sprout_viewed_insight_ids";

// Load persisted viewed IDs from localStorage
function loadViewedIds(): Set<string> {
    try {
        const raw = localStorage.getItem(LS_VIEWED_KEY);
        if (raw) return new Set(JSON.parse(raw));
    } catch { }
    return new Set();
}

// Save viewed IDs to localStorage
function saveViewedIds(ids: Set<string>) {
    try {
        localStorage.setItem(LS_VIEWED_KEY, JSON.stringify([...ids]));
    } catch { }
}

export default function InsightsPage() {
    const { generatedInsights, dashboards, removeGeneratedInsight, addGraphToDashboard, removeGraphFromDashboard, dynamicWidgets } = useDashboard();
    const [selectedGraphForAdd, setSelectedGraphForAdd] = useState<string | null>(null);
    const [viewingInsightId, setViewingInsightId] = useState<string | null>(null);
    const [insightToDelete, setInsightToDelete] = useState<string | null>(null);

    // Persisted set of insight IDs that have been viewed (survives page refresh)
    const [viewedInsightIds, setViewedInsightIds] = useState<Set<string>>(new Set());

    // Track which direction the add popover should open (up or down)
    const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');
    // Ref for click-outside detection
    const popoverRef = useRef<HTMLDivElement>(null);

    // Load from localStorage on mount
    useEffect(() => {
        setViewedInsightIds(loadViewedIds());
    }, []);

    // Click-outside closes the popover
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setSelectedGraphForAdd(null);
            }
        };
        if (selectedGraphForAdd) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedGraphForAdd]);

    // Pinned ID for green highlight — only updates when a NEW insight arrives
    const [newestInsightId, setNewestInsightId] = useState<string | null>(null);
    const prevInsightCount = useRef(generatedInsights.length);
    const initialised = useRef(false);

    // --- Highlight Helpers ---
    const isNewInsight = (generatedAt: string): boolean => {
        return Date.now() - new Date(generatedAt).getTime() < ONE_HOUR_MS;
    };

    // On first load: pin the topmost new insight as green ONLY if it hasn't been viewed before
    useEffect(() => {
        if (!initialised.current && generatedInsights.length > 0) {
            initialised.current = true;
            const persisted = loadViewedIds();
            const topNew = generatedInsights.find(
                i => isNewInsight(i.generatedAt) && !persisted.has(i.id)
            );
            if (topNew) setNewestInsightId(topNew.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [generatedInsights]);

    // When a brand-new insight is prepended, make it the green one
    useEffect(() => {
        if (generatedInsights.length > prevInsightCount.current) {
            const topNew = generatedInsights.find(i => isNewInsight(i.generatedAt));
            if (topNew) setNewestInsightId(topNew.id);
        }
        prevInsightCount.current = generatedInsights.length;
    }, [generatedInsights]);

    const getHighlightTier = (insight: typeof generatedInsights[0]): "newest" | "new" | "none" => {
        if (!isNewInsight(insight.generatedAt)) return "none";
        // Green only if it is the pinned newest AND has never been viewed
        if (insight.id === newestInsightId && !viewedInsightIds.has(insight.id)) return "newest";
        return "new";
    };

    const handleViewGraph = (insightId: string) => {
        // Persist the viewed state so it survives page refreshes
        const updated = new Set([...viewedInsightIds, insightId]);
        setViewedInsightIds(updated);
        saveViewedIds(updated);
        setViewingInsightId(insightId);
    };

    const isWidgetInDashboard = (widgetId: string, dashboardId: string): boolean => {
        const dashboard = dashboards.find(d => d.id === dashboardId);
        return dashboard?.graphs.includes(widgetId) || false;
    };

    // Returns names of all dashboards the widget is added to
    const getDashboardsForWidget = (widgetId: string): string[] => {
        return dashboards
            .filter(d => d.graphs.includes(widgetId))
            .map(d => d.name);
    };

    const renderWidget = (widgetId: string) => {
        if (dynamicWidgets[widgetId]) {
            const widget = dynamicWidgets[widgetId];
            if (widget.type === 'scorecard' || widget.type === 'kpi') {
                const props = widget.data as any;
                return <ScorecardWidget title={widget.title} value={props.value} trend={props.trend} />;
            }
            return <DynamicChart widget={widget} />;
        }

        const widget = WIDGET_LIBRARY.find(w => w.id === widgetId);
        if (!widget) return null;

        if (widget.type === "scorecard") {
            const props = widget.props as { title: string; value: string; trend?: { value: string; direction: "up" | "down" } };
            return <ScorecardWidget {...props} />;
        } else if (widget.type === "text") {
            const props = widget.props as { title: string; content: string };
            return <TextWidget {...props} />;
        } else if (widget.type === "chart" && widget.component) {
            const ChartComponent = WIDGET_COMPONENTS[widget.component];
            if (ChartComponent) return <ChartComponent />;
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
                <span className="text-sm text-muted-foreground bg-white px-3 py-1 rounded-full border">
                    {generatedInsights.length} Saved Insights
                </span>
            </div>

            {generatedInsights.length === 0 ? (
                <div className="border-2 border-dashed border-border bg-white rounded-xl p-16 flex flex-col items-center justify-center min-h-[500px]">
                    <div className="h-16 w-16 rounded-full bg-mushroom flex items-center justify-center mb-6">
                        <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No insights yet</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                        Use the Chatbot to generate new charts and click &quot;Add to Insight&quot; to save them here.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b rounded-t-lg">
                            <tr>
                                <th className="px-6 py-3">Insight Title</th>
                                <th className="px-6 py-3">Date Generated</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {generatedInsights.map((insight) => {
                                const addedToDashboards = getDashboardsForWidget(insight.widgetId);
                                const isAdded = addedToDashboards.length > 0;
                                const highlightTier = getHighlightTier(insight);

                                const rowClass =
                                    highlightTier === "newest"
                                        ? "bg-green-50 outline outline-2 outline-green-400 outline-offset-[-2px] transition-colors group"
                                        : highlightTier === "new"
                                            ? "bg-blue-50 outline outline-1 outline-blue-200 outline-offset-[-1px] transition-colors group"
                                            : "hover:bg-gray-50 transition-colors group";

                                return (
                                    <tr key={insight.id} className={rowClass}>
                                        {/* Title column */}
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded flex-shrink-0 ${highlightTier === "newest" ? "bg-green-100 text-green-600" : "bg-blue-50 text-blue-600"}`}>
                                                    <BarChart3 className="h-4 w-4" />
                                                </div>
                                                <span>{insight.label}</span>
                                                {highlightTier === "newest" && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-500 text-white animate-pulse flex-shrink-0">
                                                        NEW
                                                    </span>
                                                )}
                                                {highlightTier === "new" && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex-shrink-0">
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Date column */}
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(insight.generatedAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>

                                        {/* Status column — shows specific dashboard names */}
                                        <td className="px-6 py-4">
                                            {isAdded ? (
                                                <div className="flex flex-col gap-1">
                                                    {addedToDashboards.map((name) => (
                                                        <span
                                                            key={name}
                                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit"
                                                        >
                                                            <Check className="h-3 w-3 flex-shrink-0" />
                                                            {name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Saved
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions column */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* View Graph */}
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2"
                                                            onClick={() => handleViewGraph(insight.id)}
                                                        >
                                                            <Eye className="h-4 w-4" /> View Graph
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl">
                                                        <DialogHeader>
                                                            <DialogTitle>{insight.label}</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="mt-4">
                                                            {renderWidget(insight.widgetId)}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>

                                                {/* Add to Dashboard — always shows Plus, never changes to Check icon */}
                                                <div className="relative" ref={selectedGraphForAdd === insight.id ? popoverRef : undefined}>
                                                    {selectedGraphForAdd === insight.id ? (
                                                        <div className={`absolute right-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right ${dropdownDirection === 'up'
                                                                ? 'bottom-full mb-2 origin-bottom-right'
                                                                : 'top-full mt-2 origin-top-right'
                                                            }`}>
                                                            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                                                                <p className="text-xs font-semibold text-gray-500 uppercase">Select Dashboard</p>
                                                            </div>
                                                            <div className="max-h-60 overflow-y-auto">
                                                                {dashboards.map((dashboard) => {
                                                                    const Icon = (LucideIcons as any)[dashboard.icon] || LucideIcons.LayoutDashboard;
                                                                    const alreadyAdded = isWidgetInDashboard(insight.widgetId, dashboard.id);

                                                                    return (
                                                                        <label
                                                                            key={dashboard.id}
                                                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors cursor-pointer hover:bg-gray-50 text-gray-700"
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={alreadyAdded}
                                                                                onChange={(e) => {
                                                                                    if (e.target.checked) {
                                                                                        addGraphToDashboard(dashboard.id, insight.widgetId);
                                                                                    } else {
                                                                                        removeGraphFromDashboard(dashboard.id, insight.widgetId);
                                                                                    }
                                                                                }}
                                                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                            />
                                                                            <Icon className="h-4 w-4 text-gray-500" />
                                                                            <span className="flex-1 text-left truncate">{dashboard.name}</span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                            {/* Done + Close buttons */}
                                                            <div className="px-2 pt-2 mt-1 border-t flex gap-2">
                                                                <button
                                                                    onClick={() => setSelectedGraphForAdd(null)}
                                                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#2D3A8C] text-white hover:bg-blue-800 rounded transition-colors"
                                                                >
                                                                    <Check className="h-3 w-3" /> Done
                                                                </button>
                                                                <button
                                                                    onClick={() => setSelectedGraphForAdd(null)}
                                                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors border"
                                                                >
                                                                    Close
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // Always shows Plus — click detects position to set dropdown direction
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="bg-[#2D3A8C] text-white hover:bg-blue-800"
                                                            onClick={(e) => {
                                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                                const spaceBelow = window.innerHeight - rect.bottom;
                                                                setDropdownDirection(spaceBelow < 280 ? 'up' : 'down');
                                                                setSelectedGraphForAdd(insight.id);
                                                            }}
                                                            title="Add to Dashboard"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => setInsightToDelete(insight.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete Insight"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!insightToDelete}
                onOpenChange={(open) => !open && setInsightToDelete(null)}
                title="Delete Insight"
                description="Are you sure you want to delete this insight? This action cannot be undone."
                confirmText="Delete Insight"
                onConfirm={() => {
                    if (insightToDelete) {
                        removeGeneratedInsight(insightToDelete);
                        setInsightToDelete(null);
                    }
                }}
            />
        </div>
    );
}
