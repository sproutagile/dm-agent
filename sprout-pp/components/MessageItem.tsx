import React, { useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Bot, User, Plus, Check } from "lucide-react"
import { cn } from "~lib/utils"
import { ChartPreview } from "./ChartPreview"

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

    const handleAddToInsight = () => {
        if (!data) return

        setIsAdded(true)
        console.log("Dispatching SPROUT_ADD_INSIGHT", data)

        // Method 1: LocalStorage event (cross-context)
        try {
            localStorage.setItem('sprout_add_insight_event', JSON.stringify({
                timestamp: Date.now(),
                widget: data
            }));
            // Trigger storage event manually for same-window listeners
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'sprout_add_insight_event',
                newValue: JSON.stringify({ timestamp: Date.now(), widget: data }),
                storageArea: localStorage
            }));
        } catch (e) {
            console.error("Failed to dispatch via localStorage", e)
        }

        // Method 2: PostMessage (iframe/window)
        try {
            window.postMessage({ type: 'SPROUT_ADD_INSIGHT', payload: data }, '*');
            if (window.top && window.top !== window) {
                window.top.postMessage({ type: 'SPROUT_ADD_INSIGHT', payload: data }, '*');
            }
        } catch (e) {
            console.error("Failed to postMessage", e);
        }

        setTimeout(() => setIsAdded(false), 2000)
    }

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
                data && "sprout-w-full sprout-max-w-[90%]" // Wider bubble for charts
            )}>
                <p className="sprout-text-sm sprout-leading-relaxed sprout-whitespace-pre-wrap">
                    {content}
                </p>

                {/* Chart Preview & Actions */}
                {data && data.type === 'chart' && (
                    <div className="sprout-mt-2">
                        <ChartPreview data={data} />
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
