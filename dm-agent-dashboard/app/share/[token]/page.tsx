'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// Reuse existing dashboard components
import { VelocityTrendChart } from "@/components/charts/VelocityTrendChart";
import { ReleaseBurnupChart } from "@/components/charts/ReleaseBurnupChart";
import { DoneTicketChart } from "@/components/charts/DoneTicketChart";
import { TeamEfficiencyChart } from "@/components/charts/TeamEfficiencyChart";
import { WorkflowEfficiencyChart } from "@/components/charts/WorkflowEfficiencyChart";
import { ScorecardWidget } from "@/components/widgets/ScorecardWidget";
import { TextWidget } from "@/components/widgets/TextWidget";
import { DynamicChart } from "@/components/sprout/DynamicChart";
import { WIDGET_LIBRARY } from "@/data/mockMetrics";

const WIDGET_COMPONENTS: Record<string, React.FC<any>> = {
    VelocityTrendChart,
    ReleaseBurnupChart,
    DoneTicketChart,
    TeamEfficiencyChart,
    WorkflowEfficiencyChart,
};

export default function PublicSharePage() {
    const params = useParams();
    const token = params.token as string;
    const [dashboard, setDashboard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            fetchDashboard();
        }
    }, [token]);

    const fetchDashboard = async () => {
        try {
            const res = await fetch(`/api/share/${token}`);
            if (!res.ok) {
                setError('Dashboard not found or not public');
                setLoading(false);
                return;
            }
            const data = await res.json();
            setDashboard(data);
        } catch (err) {
            setError('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading shared dashboard...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!dashboard) return null;

    // Parse graphs list
    const graphs = typeof dashboard.graphs === 'string' ? JSON.parse(dashboard.graphs) : dashboard.graphs || [];
    // We might have layout data but we will ignore it for now to match main dashboard CSS grid approach,
    // or we can use it if we want strict positioning. But for simplicity and consistency with main dashboard:

    // Helper to get widget definition
    const getWidgetContent = (graphId: string) => {
        // 1. Try to find it in the fetched dynamic insights
        const dynamicWidgetRow = (dashboard.insights || []).find((i: any) => i.id === graphId);

        if (dynamicWidgetRow && dynamicWidgetRow.data) {
            const widgetData = typeof dynamicWidgetRow.data === 'string'
                ? JSON.parse(dynamicWidgetRow.data)
                : dynamicWidgetRow.data;

            return <DynamicChart widget={{ ...widgetData, id: graphId }} />;
        }

        // 2. Fallback to static library
        const widget = WIDGET_LIBRARY.find(w => w.id === graphId);
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
        return <div className="p-4 border rounded text-gray-400">Widget data not available in public view</div>;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <header className="mb-6 bg-white p-4 rounded shadow">
                <h1 className="text-2xl font-bold">{dashboard.name} <span className="text-sm font-normal text-gray-500">(Public View)</span></h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
                {graphs.map((graphId: string) => {
                    const content = getWidgetContent(graphId);
                    if (!content) return null;

                    return (
                        <div key={graphId} className="relative group min-h-[320px] bg-white rounded-lg shadow-sm border p-4">
                            {content}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
