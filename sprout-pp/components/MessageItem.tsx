import React, { useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Bot, User, Plus, Check } from "lucide-react"
import { cn } from "~lib/utils"
import { ChartPreview } from "./ChartPreview"
import { ScorecardPreview } from "./ScorecardPreview"
import { TablePreview } from "./TablePreview"

const messageVariants = cva(
    "sprout-flex sprout-gap-2 sprout-mb-4 sprout-animate-in sprout-fade-in sprout-duration-300",
    {
        variants: {
            role: {
                user: "sprout-justify-end",
                ai: "sprout-justify-start sprout-max-w-full", // Allow full width for charts
            },
        },
    }
)

const bubbleVariants = cva(
    "sprout-rounded-lg sprout-px-4 sprout-py-2.5 sprout-max-w-[85%] sprout-break-words",
    {
        variants: {
            role: {
                user: "sprout-bg-kangkong-500 sprout-text-white-50",
                ai: "sprout-bg-mushroom-100 sprout-text-mushroom-900",
            },
        },
    }
)

interface MessageItemProps extends VariantProps<typeof messageVariants> {
    content: string
    isStreaming?: boolean
    data?: any
}

export function MessageItem({ role, content, isStreaming = false, data }: MessageItemProps) {
    const [isAdded, setIsAdded] = useState(false)

    const handleAddToInsight = async () => {
        if (!data) return

        setIsAdded(true)
        console.log("Adding insight via HTTP POST", data)

        try {
            // Deliver insight directly to the backend
            const response = await fetch('https://agile.sprout.ph/api/insights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    label: data.title || 'Generated Insight',
                    data: data
                })
            });

            if (!response.ok) {
                console.error("Failed to add insight", await response.text());
                setIsAdded(false);
                return;
            }

            console.log("Insight added successfully!");
        } catch (e) {
            console.error("Network error while adding insight", e);
            setIsAdded(false);
            return;
        }

        setTimeout(() => setIsAdded(false), 2000)
    }

    const renderDataPreview = () => {
        if (!data) return null;

        switch (data.type) {
            case 'chart':
                return <ChartPreview data={data} />;
            case 'scorecard':
            case 'kpi': // Handle legacy or alternative type
                return <ScorecardPreview data={data} />;
            case 'table':
                return <TablePreview data={data} />;
            default:
                return null;
        }
    };

    return (
        <div className={messageVariants({ role })}>
            {role === "ai" && (
                <div className="sprout-flex-shrink-0 sprout-w-8 sprout-h-8 sprout-rounded-full sprout-bg-kangkong-500 sprout-flex sprout-items-center sprout-justify-center">
                    <Bot className="sprout-w-4 sprout-h-4 sprout-text-white-50" />
                </div>
            )}

            <div className={cn(
                bubbleVariants({ role }),
                isStreaming && role === "ai" && "ai-response-stream",
                data && "sprout-w-full sprout-max-w-[95%]" // Wider bubble for charts/tables
            )}>
                <p className="sprout-text-sm sprout-leading-relaxed sprout-whitespace-pre-wrap">
                    {content}
                </p>

                {/* Data Preview & Actions */}
                {data && (
                    <div className="sprout-mt-2">
                        {renderDataPreview()}

                        {/* Only show 'Add to Insight' for Charts or Scorecards currently supported by Dashboard? */}
                        {/* Assuming Dashboard supports generic widgets now or just ignoring table add for now if not supported */}
                        {['chart', 'scorecard'].includes(data.type) && (
                            <button
                                onClick={handleAddToInsight}
                                disabled={isAdded}
                                className={cn(
                                    "sprout-mt-2 sprout-flex sprout-items-center sprout-justify-center sprout-gap-1.5 sprout-w-full sprout-py-1.5 sprout-px-3 sprout-rounded-md sprout-text-xs sprout-font-medium sprout-transition-colors",
                                    isAdded
                                        ? "sprout-bg-green-100 sprout-text-green-700"
                                        : "sprout-bg-white sprout-text-kangkong-600 sprout-border sprout-border-kangkong-200 hover:sprout-bg-kangkong-50"
                                )}
                            >
                                {isAdded ? (
                                    <>
                                        <Check className="sprout-w-3 sprout-h-3" />
                                        Added to Insights
                                    </>
                                ) : (
                                    <>
                                        <Plus className="sprout-w-3 sprout-h-3" />
                                        Add to Insight
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {role === "user" && (
                <div className="sprout-flex-shrink-0 sprout-w-8 sprout-h-8 sprout-rounded-full sprout-bg-mushroom-300 sprout-flex sprout-items-center sprout-justify-center">
                    <User className="sprout-w-4 sprout-h-4 sprout-text-mushroom-900" />
                </div>
            )}
        </div>
    )
}
