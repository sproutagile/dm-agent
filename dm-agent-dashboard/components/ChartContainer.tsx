import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";
import { GripHorizontal } from "lucide-react";

interface ChartContainerProps {
    title: string;
    description?: string;
    children: ReactNode;
}

export function ChartContainer({ title, description, children }: ChartContainerProps) {
    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="drag-handle cursor-move">
                            <GripHorizontal className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                            {description && (
                                <CardDescription className="mt-1">{description}</CardDescription>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {children}
            </CardContent>
        </Card>
    );
}
