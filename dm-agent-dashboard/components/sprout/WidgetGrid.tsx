'use client';

import { useSproutStore } from '@/store/useSproutStore';
import { DynamicChart } from './DynamicChart';
import { LayoutGrid } from 'lucide-react';

export function WidgetGrid() {
    const { widgets, removeWidget } = useSproutStore();

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
            {widgets.map((widget) => (
                <DynamicChart key={widget.id} widget={widget} onRemove={removeWidget} />
            ))}
        </div>
    );
}
