import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, GripHorizontal, ExternalLink } from "lucide-react";

interface ScorecardWidgetProps {
    title: string;
    value: any;
    trend?: {
        value: string;
        direction: "up" | "down";
    };
}

export function ScorecardWidget({ title, value, trend }: ScorecardWidgetProps) {
    // Extract primitive value if the source metric is a complex Data Pointer object
    const displayValue = typeof value === 'object' && value !== null && 'value' in value
        ? value.value
        : value;

    const pointer = typeof value === 'object' && value !== null ? value.source_pointer : null;

    const getSourceLink = () => {
        if (!pointer) return '#';
        if (pointer.source_system.toLowerCase() === 'gsheets') {
            return `https://docs.google.com/spreadsheets/d/${pointer.source_id}`;
        }
        if (pointer.source_system.toLowerCase() === 'jira') {
            return `https://${pointer.source_id}.atlassian.net/browse/${pointer.source_cell}`; // Rough guess, Jira URLs vary
        }
        return '#';
    };

    return (
        <Card className="h-full flex flex-col relative group">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="drag-handle cursor-move -ml-2">
                        <GripHorizontal className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                    </div>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center relative">
                <div className="text-3xl font-bold text-foreground mb-1">{displayValue}</div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs ${trend.direction === "down" ? "text-[#22C558]" : "text-red-600"
                        }`}>
                        {trend.direction === "down" ? (
                            <TrendingDown className="h-3 w-3" />
                        ) : (
                            <TrendingUp className="h-3 w-3" />
                        )}
                        <span>{trend.value}</span>
                    </div>
                )}

                {pointer && (
                    <a
                        href={getSourceLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-600 mt-2 transition-colors w-fit"
                        title="View Source Data"
                    >
                        <ExternalLink className="h-3 w-3" />
                        <span>Source: {pointer.source_system}</span>
                    </a>
                )}
            </CardContent>
        </Card>
    );
}
