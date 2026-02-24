import React from "react"
import { TrendingDown, TrendingUp, Clock, Activity, BarChart3 } from "lucide-react"

interface ScorecardPreviewProps {
    data: any
}

export function ScorecardPreview({ data }: ScorecardPreviewProps) {
    if (!data) return null

    // Handle potential nesting if 'data' is inside the widget data object
    // usage: <ScorecardPreview data={payload} /> where payload could be { type: 'scorecard', data: { value... } }
    const content = data.data || data
    const { title, value, trend, icon } = content

    // Map icon string to Lucide component
    const IconComponent = () => {
        switch (icon) {
            case 'time': return <Clock className="sprout-h-4 sprout-w-4 sprout-text-mushroom-500" />
            case 'activity': return <Activity className="sprout-h-4 sprout-w-4 sprout-text-mushroom-500" />
            default: return <BarChart3 className="sprout-h-4 sprout-w-4 sprout-text-mushroom-500" />
        }
    }

    return (
        <div className="sprout-mt-3 sprout-bg-white sprout-rounded-lg sprout-p-4 sprout-border sprout-border-mushroom-200 sprout-shadow-sm sprout-min-w-[200px]">
            <div className="sprout-flex sprout-items-center sprout-justify-between sprout-mb-2">
                <h4 className="sprout-text-xs sprout-font-medium sprout-text-mushroom-500 sprout-uppercase sprout-tracking-wider">
                    {title}
                </h4>
                <IconComponent />
            </div>

            <div className="sprout-flex sprout-flex-col sprout-gap-1">
                <div className="sprout-text-2xl sprout-font-bold sprout-text-gray-900">
                    {value}
                </div>

                {trend && (
                    <div className={`sprout-flex sprout-items-center sprout-gap-1 sprout-text-xs ${trend.direction === "down" ? "sprout-text-green-600" : "sprout-text-red-500"
                        }`}>
                        {trend.direction === "down" ? (
                            <TrendingDown className="sprout-h-3 sprout-w-3" />
                        ) : (
                            <TrendingUp className="sprout-h-3 sprout-w-3" />
                        )}
                        <span className="sprout-font-medium">{trend.value}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
