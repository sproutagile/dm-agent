import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TextWidgetProps {
    title: string;
    content: string;
}

export function TextWidget({ title, content }: TextWidgetProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
            </CardContent>
        </Card>
    );
}
