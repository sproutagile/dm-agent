'use client';

import { useDashboard, Dashboard } from '@/components/DashboardContext';
import { DynamicChart } from './DynamicChart';
import { LayoutGrid } from 'lucide-react';
import { Widget } from '@/types/sprout';
import { Responsive, Layout } from 'react-grid-layout';
// @ts-ignore
import { WidthProvider } from "react-grid-layout";
const ResponsiveGridLayout = WidthProvider(Responsive);

export function WidgetGrid({ dashboardId }: { dashboardId?: string }) {
    const { generatedInsights, dynamicWidgets, removeGeneratedInsight, dashboards, updateDashboardLayout } = useDashboard();

    // Map insights to widgets
    const widgets = generatedInsights
        .map(insight => dynamicWidgets[insight.widgetId])
        .filter(widget => !!widget) as Widget[];

    const currentDashboard = dashboardId ? dashboards.find(d => d.id === dashboardId) : null;
    const layout = currentDashboard?.layout || [];

    if (widgets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6">
                <div className="p-4 rounded-full bg-gray-50 mb-4">
                    <LayoutGrid className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-400 mb-2">
                    No analytics yet
                </h3>
                <p className="text-sm text-gray-400 text-center max-w-sm">
                    Ask the assistant to generate charts and analytics. Try saying
                    &quot;Show me team velocity&quot; or &quot;Generate a delivery report&quot;.
                </p>
            </div>
        );
    }

    // Default layout generator for new widgets
    const defaultLayout = widgets.map((widget, i) => {
        const existingPos = layout.find((l: any) => l.i === widget.id);
        if (existingPos) return existingPos;

        return {
            i: widget.id,
            x: (i * 6) % 12,
            y: Math.floor(i / 2) * 4,
            w: widget.colSpan === 2 ? 12 : 6, // 12 columns total
            h: 4,
            minW: 4,
            minH: 3
        };
    });

    const onLayoutChange = (newLayout: any[]) => {
        if (dashboardId) {
            updateDashboardLayout(dashboardId, newLayout);
        }
    };

    return (
        <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: defaultLayout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            onLayoutChange={(layout: Layout[]) => onLayoutChange(layout)}
            draggableHandle=".drag-handle"
            isDraggable={true}
            isResizable={true}
        >
            {widgets.map((widget) => {
                // Find insight ID for this widget to allow removal
                const insight = generatedInsights.find(i => i.widgetId === widget.id);
                const handleRemove = () => {
                    if (insight) removeGeneratedInsight(insight.id);
                };

                return (
                    <div key={widget.id}>
                        <div className="h-full w-full">
                            <DynamicChart widget={widget} onRemove={handleRemove} />
                        </div>
                    </div>
                );
            })}
        </ResponsiveGridLayout>
    );
}
