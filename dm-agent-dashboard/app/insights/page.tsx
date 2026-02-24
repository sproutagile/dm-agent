"use client";

import { useDashboard } from "@/components/DashboardContext";
import { Sparkles, Plus, Check, X, Trash2, Eye, BarChart3 } from "lucide-react";
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
import { useState } from "react";
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

export default function InsightsPage() {
    const { generatedInsights, dashboards, removeGeneratedInsight, addGraphToDashboard, removeGraphFromDashboard, dynamicWidgets } = useDashboard();
    const [selectedGraphForAdd, setSelectedGraphForAdd] = useState<string | null>(null);
    const [viewingInsightId, setViewingInsightId] = useState<string | null>(null);
    const [insightToDelete, setInsightToDelete] = useState<string | null>(null);

    // Remove handleAddToDashboard so the popover doesn't auto-close on selection

    const isWidgetInDashboard = (widgetId: string, dashboardId: string): boolean => {
        const dashboard = dashboards.find(d => d.id === dashboardId);
        return dashboard?.graphs.includes(widgetId) || false;
    };

    const isWidgetInAnyDashboard = (widgetId: string): boolean => {
        return dashboards.some(d => d.graphs.includes(widgetId));
    };

    const renderWidget = (widgetId: string) => {
        // First check dynamic widgets (from Sprout)
        if (dynamicWidgets[widgetId]) {
            const widget = dynamicWidgets[widgetId];
            if (widget.type === 'scorecard' || widget.type === 'kpi') {
                // Dynamic Scorecard
                // Map data to props. ScorecardWidget expects { title, value, trend }
                // Our widget.data usually has these fields if it came from the extension
                const props = widget.data as any;
                // Ensure title is present, fallback to widget.title
                return <ScorecardWidget title={widget.title} value={props.value} trend={props.trend} />;
            }
            return <DynamicChart widget={widget} />;
        }

        // Then check static widget library
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
            if (ChartComponent) {
                return <ChartComponent />;
            }
        }
        return null;
    };

    const viewingInsight = generatedInsights.find(i => i.id === viewingInsightId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
                <span className="text-sm text-muted-foreground bg-white px-3 py-1 rounded-full border">
                    {generatedInsights.length} Saved Insights
                </span>
            </div>

            {generatedInsights.length === 0 ? (
                /* Empty State */
                <div className="border-2 border-dashed border-border bg-white rounded-xl p-16 flex flex-col items-center justify-center min-h-[500px]">
                    <div className="h-16 w-16 rounded-full bg-mushroom flex items-center justify-center mb-6">
                        <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No insights yet</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                        Use the Chatbot to generate new charts and click "Add to Insight" to save them here.
                    </p>
                </div>
            ) : (
                /* Table View */
                <div className="bg-white rounded-lg border shadow-sm">
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
                                const isAdded = isWidgetInAnyDashboard(insight.widgetId);

                                return (
                                    <tr key={insight.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-50 rounded text-blue-600">
                                                <BarChart3 className="h-4 w-4" />
                                            </div>
                                            {insight.label}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(insight.generatedAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isAdded ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <Check className="h-3 w-3" /> Added to Dashboard
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Saved
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="gap-2">
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
                                                        <div className="flex justify-end mt-6 gap-2">
                                                            {/* Dashboard Selection Logic reused here if needed, or keeping it simple */}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>

                                                <div className="relative">
                                                    {selectedGraphForAdd === insight.id ? (
                                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
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
                                                            <div className="px-2 pt-2 mt-1 border-t">
                                                                <button
                                                                    onClick={() => setSelectedGraphForAdd(null)}
                                                                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors"
                                                                >
                                                                    Close
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant={isAdded ? "ghost" : "default"}
                                                            size="sm"
                                                            className={isAdded ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "bg-[#2D3A8C] text-white hover:bg-blue-800"}
                                                            onClick={() => setSelectedGraphForAdd(insight.id)}
                                                        >
                                                            {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                                        </Button>
                                                    )}
                                                </div>

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
