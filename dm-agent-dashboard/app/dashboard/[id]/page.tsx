"use client";

import { useParams } from "next/navigation";
import { useDashboard } from "@/components/DashboardContext";
import { useState } from "react";
import { Globe } from "lucide-react";
import { ShareDashboardButton } from "@/components/dashboard/ShareDashboardButton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import dynamic from 'next/dynamic';

const DashboardGrid = dynamic(
    () => import('@/components/dashboard/DashboardGrid').then(m => ({ default: m.DashboardGrid })),
    { ssr: false, loading: () => <div className="p-8 text-center text-muted-foreground">Loading...</div> }
);

// Widget Components
import { ScorecardWidget } from "@/components/widgets/ScorecardWidget";
import { TextWidget } from "@/components/widgets/TextWidget";
import { ReleaseBurnupChart } from "@/components/charts/ReleaseBurnupChart";
import { VelocityTrendChart } from "@/components/charts/VelocityTrendChart";
import { DoneTicketChart } from "@/components/charts/DoneTicketChart";
import { TeamEfficiencyChart } from "@/components/charts/TeamEfficiencyChart";
import { WorkflowEfficiencyChart } from "@/components/charts/WorkflowEfficiencyChart";
import { WIDGET_LIBRARY } from "@/data/mockMetrics";
import { DynamicChart } from "@/components/sprout/DynamicChart";
import { ExportActions } from "@/components/dashboard/ExportActions";

const WIDGET_COMPONENTS: Record<string, React.FC<any>> = {
    VelocityTrendChart,
    ReleaseBurnupChart,
    DoneTicketChart,
    TeamEfficiencyChart,
    WorkflowEfficiencyChart,
};

export default function DashboardPage() {
    const params = useParams();
    const dashboardId = params.id as string;
    const [widgetToRemove, setWidgetToRemove] = useState<string | null>(null);
    const dashboardContext = useDashboard();
    const { getDashboard, removeGraphFromDashboard, dynamicWidgets, updateDashboardLayout } = dashboardContext;
    const dashboard = getDashboard(dashboardId);

    if (!dashboard) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Dashboard not found</p>
            </div>
        );
    }

    const handleRemove = (graphId: string) => {
        removeGraphFromDashboard(dashboardId, graphId);
    };

    // Build layout for react-grid-layout — scorecards h=1 (160px), charts h=2 (320px)
    const buildLayout = () => {
        return dashboard.graphs.map((graphId, i) => {
            const existing = (dashboard.layout || []).find((l: any) => l.i === graphId);
            if (existing) return existing;
            const dynW = dynamicWidgets[graphId];
            const isSc = (dynW?.type as string) === 'scorecard' || (dynW?.type as string) === 'kpi';
            return {
                i: graphId,
                x: (i * 2) % 6,
                y: Math.floor(i / 3) * 4,
                w: 2,
                h: isSc ? 1 : 2,
                minW: 1,
                minH: 1,
            };
        });
    };


    // If no graphs, show empty state
    if (dashboard.graphs.length === 0) {
        return (
            <div className="border-2 border-dashed border-border bg-white rounded-xl p-16 flex flex-col items-center justify-center min-h-[400px]">
                <div className="h-16 w-16 rounded-full bg-mushroom flex items-center justify-center mb-6">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-8 w-8 text-muted-foreground"
                    >
                        <rect width="7" height="9" x="3" y="3" rx="1" />
                        <rect width="7" height="5" x="14" y="3" rx="1" />
                        <rect width="7" height="9" x="14" y="12" rx="1" />
                        <rect width="7" height="5" x="3" y="16" rx="1" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Empty Dashboard</h3>
                <p className="text-muted-foreground text-center max-w-md">
                    Head over to{" "}
                    <a href="/insights" className="text-[#22C558] font-medium hover:underline">
                        Generated Insights
                    </a>{" "}
                    to add widgets to this dashboard.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex justify-end mb-4">
                <div className="flex items-center gap-2">
                    {dashboard.is_public && (
                        <span title="Public Dashboard" className="flex items-center text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium border border-green-200 mr-2">
                            <Globe className="w-3 h-3 mr-1" /> Public
                        </span>
                    )}
                    <ShareDashboardButton dashboard={dashboard} onUpdate={(updates) => {
                        window.location.reload();
                    }} />
                    <ExportActions targetId="dashboard-content" dashboardName={dashboard.name} />
                </div>
            </div>

            {/* Dashboard Content */}
            <div id="dashboard-content" className="px-4 pb-4">
                <DashboardGrid
                    layout={buildLayout()}
                    onLayoutChange={(layout) => updateDashboardLayout(dashboardId, layout)}
                    rowHeight={160}
                    cols={6}
                    margin={[8, 8]}
                >
                    {dashboard.graphs.map((graphId) => {
                        let WidgetContent: React.ReactNode;

                        if (dynamicWidgets[graphId]) {
                            WidgetContent = <DynamicChart widget={dynamicWidgets[graphId]} onRemove={() => setWidgetToRemove(graphId)} />;
                        } else {
                            const widget = WIDGET_LIBRARY.find(w => w.id === graphId);
                            if (!widget) return null;

                            if (widget.type === "scorecard") {
                                const props = widget.props as { title: string; value: string; trend?: { value: string; direction: "up" | "down" } };
                                const liveMetric = dashboardContext.sourceMetrics && dashboardContext.sourceMetrics[graphId];
                                if (liveMetric && liveMetric.data) props.value = liveMetric.data;
                                WidgetContent = <ScorecardWidget {...props} />;
                            } else if (widget.type === "text") {
                                const props = widget.props as { title: string; content: string };
                                WidgetContent = <TextWidget {...props} />;
                            } else if (widget.type === "chart" && widget.component) {
                                const ChartComponent = WIDGET_COMPONENTS[widget.component];
                                if (ChartComponent) WidgetContent = <ChartComponent />;
                            }
                        }

                        if (!WidgetContent) return null;

                        return (
                            <div key={graphId} className="relative group h-full">
                                {WidgetContent}
                            </div>
                        );
                    })}
                </DashboardGrid>
            </div>

            <ConfirmDialog
                isOpen={!!widgetToRemove}
                onOpenChange={(open) => !open && setWidgetToRemove(null)}
                title="Remove Widget"
                description="Are you sure you want to remove this widget from the dashboard?"
                confirmText="Remove"
                onConfirm={() => {
                    if (widgetToRemove) {
                        handleRemove(widgetToRemove);
                        setWidgetToRemove(null);
                    }
                }}
            />
        </div>
    );
}
