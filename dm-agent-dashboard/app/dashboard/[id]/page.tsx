"use client";

import { useParams } from "next/navigation";
import { useDashboard } from "@/components/DashboardContext";
import { useState } from "react";
import { Globe } from "lucide-react";
import { ShareDashboardButton } from "@/components/dashboard/ShareDashboardButton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import 'react-grid-layout/css/styles.css';
// @ts-ignore
import { Responsive, WidthProvider } from 'react-grid-layout';

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

const ResponsiveGridLayout = WidthProvider(Responsive);

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

    // Helper: determine if a widget is a scorecard type
    const isScorecard = (graphId: string) => {
        const dynW = dynamicWidgets[graphId];
        return (dynW?.type as string) === 'scorecard' || (dynW?.type as string) === 'kpi';
    };

    // Build react-grid-layout layout: scorecards h=1 (160px), charts h=2 (320px)
    const buildLayout = () => {
        return dashboard.graphs.map((graphId, i) => {
            const existing = (dashboard.layout || []).find((l: any) => l.i === graphId);
            if (existing) return existing;
            const sc = isScorecard(graphId);
            return {
                i: graphId,
                x: (i * 2) % 6,
                y: Math.floor(i / 3) * 2,
                w: 2,
                h: sc ? 1 : 2,
                minW: 2,
                minH: sc ? 1 : 2,
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
            <div id="dashboard-content" className="p-4">
                <ResponsiveGridLayout
                    layouts={{ lg: buildLayout() }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 6, md: 4, sm: 2, xs: 2, xxs: 2 }}
                    rowHeight={160}
                    margin={[8, 8]}
                    containerPadding={[0, 0]}
                    onLayoutChange={(layout: any[]) => updateDashboardLayout(dashboardId, layout)}
                    draggableHandle=".drag-handle"
                    isDraggable={true}
                    isResizable={false}
                    compactType={null}
                    preventCollision={false}
                >
                    {dashboard.graphs.map((graphId) => {
                        let WidgetContent: React.ReactNode;

                        if (dynamicWidgets[graphId]) {
                            WidgetContent = <DynamicChart widget={dynamicWidgets[graphId]} onRemove={() => handleRemove(graphId)} />;
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
                            <div key={graphId} className="relative group">
                                {WidgetContent}
                            </div>
                        );
                    })}
                </ResponsiveGridLayout>
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
