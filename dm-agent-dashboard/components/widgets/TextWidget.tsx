import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripHorizontal } from "lucide-react";

interface TextWidgetProps {
    title: string;
    content: string;
}

export function TextWidget({ title, content }: TextWidgetProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="drag-handle cursor-move">
                        <GripHorizontal className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    </div>
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
            </CardContent>
        </Card>
    );
}
