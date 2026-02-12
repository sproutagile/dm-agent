import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

interface ScorecardWidgetProps {
    title: string;
    value: string;
    trend?: {
        value: string;
        direction: "up" | "down";
    };
}

export function ScorecardWidget({ title, value, trend }: ScorecardWidgetProps) {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
                <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
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
            </CardContent>
        </Card>
    );
}
