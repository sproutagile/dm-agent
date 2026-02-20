"use client";

import { useParams } from "next/navigation";
import { useDashboard } from "@/components/DashboardContext";
import { Trash2, Globe } from "lucide-react";
import { ShareDashboardButton } from "@/components/dashboard/ShareDashboardButton";

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
import { ExportActions } from "@/components/dashboard/ExportActions"; // Import ExportActions

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
    const { getDashboard, removeGraphFromDashboard, dynamicWidgets } = useDashboard();
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

            {/* Dashboard Content - Targeted for PDF Export */}
            <div
                id="dashboard-content"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1" // Added padding to prevent cut-off in PDF
            >
                {dashboard.graphs.map((graphId) => {
                    let WidgetContent: React.ReactNode;

                    // Check dynamic widgets first
                    if (dynamicWidgets[graphId]) {
                        WidgetContent = <DynamicChart widget={dynamicWidgets[graphId]} />;
                    } else {
                        // Check static library
                        const widget = WIDGET_LIBRARY.find(w => w.id === graphId);
                        if (!widget) return null;

                        if (widget.type === "scorecard") {
                            const props = widget.props as { title: string; value: string; trend?: { value: string; direction: "up" | "down" } };
                            WidgetContent = <ScorecardWidget {...props} />;
                        } else if (widget.type === "text") {
                            const props = widget.props as { title: string; content: string };
                            WidgetContent = <TextWidget {...props} />;
                        } else if (widget.type === "chart" && widget.component) {
                            const ChartComponent = WIDGET_COMPONENTS[widget.component];
                            if (ChartComponent) {
                                WidgetContent = <ChartComponent />;
                            }
                        }
                    }

                    if (!WidgetContent) return null;

                    // Determine column span
                    let colSpan = 1;
                    if (dynamicWidgets[graphId] && dynamicWidgets[graphId].colSpan) {
                        colSpan = dynamicWidgets[graphId].colSpan;
                    }

                    return (
                        <div
                            key={graphId}
                            className={`relative group min-h-[320px] ${colSpan === 2 ? 'md:col-span-2' : colSpan === 3 ? 'md:col-span-2 lg:col-span-3' : ''
                                }`}
                        >
                            {/* Remove Button - Hidden during export usually, but html2canvas might capture it if not handled. 
                                We can use data-html2canvas-ignore attribute to exclude it from PDF. 
                            */}
                            <button
                                onClick={() => handleRemove(graphId)}
                                data-html2canvas-ignore
                                className="absolute top-2 right-2 z-20 p-1.5 bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4 text-red-600" />
                            </button>

                            {/* Widget Content */}
                            {WidgetContent}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
