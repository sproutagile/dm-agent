"use client";

import { useDashboard } from "@/components/DashboardContext";
import { Sparkles, Plus, Check, X, Trash2 } from "lucide-react";
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

const WIDGET_COMPONENTS: Record<string, React.FC<any>> = {
    VelocityTrendChart,
    ReleaseBurnupChart,
    DoneTicketChart,
    TeamEfficiencyChart,
    WorkflowEfficiencyChart,
};

export default function InsightsPage() {
    const { generatedInsights, dashboards, addGeneratedInsight, removeGeneratedInsight, addGraphToDashboard, dynamicWidgets } = useDashboard();
    const [selectedGraphForAdd, setSelectedGraphForAdd] = useState<string | null>(null);

    const handleAddToDashboard = (dashboardId: string, widgetId: string) => {
        addGraphToDashboard(dashboardId, widgetId);
        setSelectedGraphForAdd(null);
    };

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
            return <DynamicChart widget={dynamicWidgets[widgetId]} />;
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

    return (
        <div>
            {generatedInsights.length === 0 ? (
                /* Empty State */
                <div className="border-2 border-dashed border-border bg-white rounded-xl p-16 flex flex-col items-center justify-center min-h-[500px]">
                    <div className="h-16 w-16 rounded-full bg-mushroom flex items-center justify-center mb-6">
                        <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No insights yet</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                        Use the Chrome Extension to generate new AI insights and send them here.
                    </p>
                </div>
            ) : (
                /* Generated Insights */
                <div className="space-y-6">
                    {generatedInsights.map((insight) => {
                        const isAdded = isWidgetInAnyDashboard(insight.widgetId);

                        return (
                            <div key={insight.id} className="relative">
                                {/* Controls Bar */}
                                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground bg-mushroom px-2 py-1 rounded">
                                        Generated at {insight.generatedAt}
                                    </span>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => removeGeneratedInsight(insight.id)}
                                        className="p-2 rounded hover:bg-red-50 transition-colors"
                                        title="Remove insight"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </button>

                                    {selectedGraphForAdd === insight.id ? (
                                        /* Dashboard Selection Dropdown */
                                        <div className="relative">
                                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                                <div className="px-4 py-2 border-b border-gray-200">
                                                    <p className="text-sm font-semibold text-foreground">Add to Dashboard</p>
                                                </div>
                                                {dashboards.length === 0 ? (
                                                    <div className="px-4 py-3 text-sm text-muted-foreground">
                                                        No dashboards yet. Create one from the sidebar!
                                                    </div>
                                                ) : (
                                                    <div className="max-h-60 overflow-y-auto">
                                                        {dashboards.map((dashboard) => {
                                                            const Icon = (LucideIcons as any)[dashboard.icon] || LucideIcons.LayoutDashboard;
                                                            const alreadyAdded = isWidgetInDashboard(insight.widgetId, dashboard.id);

                                                            return (
                                                                <button
                                                                    key={dashboard.id}
                                                                    onClick={() => !alreadyAdded && handleAddToDashboard(dashboard.id, insight.widgetId)}
                                                                    disabled={alreadyAdded}
                                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${alreadyAdded
                                                                        ? "text-muted-foreground cursor-not-allowed bg-gray-50"
                                                                        : "text-foreground hover:bg-gray-50"
                                                                        }`}
                                                                >
                                                                    <Icon className="h-4 w-4" />
                                                                    <span className="flex-1 text-left">{dashboard.name}</span>
                                                                    {alreadyAdded && <Check className="h-4 w-4 text-[#22C558]" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                <div className="px-4 py-2 border-t border-gray-200">
                                                    <button
                                                        onClick={() => setSelectedGraphForAdd(null)}
                                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Add / Manage Button */
                                        <button
                                            onClick={() => setSelectedGraphForAdd(insight.id)}
                                            className={`flex items-center gap-1.5 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md text-sm font-medium ${isAdded ? 'bg-[#22C558]' : 'bg-blueberry'}`}
                                        >
                                            {isAdded ? (
                                                <>
                                                    <Check className="h-4 w-4" />
                                                    Manage Dashboards
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="h-4 w-4" />
                                                    Add to Dashboard
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {renderWidget(insight.widgetId)}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
