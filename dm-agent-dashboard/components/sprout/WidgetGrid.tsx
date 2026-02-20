'use client';

import { useDashboard } from '@/components/DashboardContext';
import { DynamicChart } from './DynamicChart';
import { LayoutGrid } from 'lucide-react';
import { Widget } from '@/types/sprout';

export function WidgetGrid() {
    const { generatedInsights, dynamicWidgets, removeGeneratedInsight } = useDashboard();

    // Map insights to widgets
    const widgets = generatedInsights
        .map(insight => dynamicWidgets[insight.widgetId])
        .filter(widget => !!widget) as Widget[];

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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {widgets.map((widget) => {
                // Find insight ID for this widget to allow removal
                const insight = generatedInsights.find(i => i.widgetId === widget.id);
                const handleRemove = () => {
                    if (insight) removeGeneratedInsight(insight.id);
                };

                return (
                    <DynamicChart key={widget.id} widget={widget} onRemove={handleRemove} />
                );
            })}
        </div>
    );
}
