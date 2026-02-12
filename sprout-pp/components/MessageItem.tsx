import React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Bot, User } from "lucide-react"
import { cn } from "~lib/utils"

const messageVariants = cva(
    "sprout-flex sprout-gap-2 sprout-mb-4 sprout-animate-in sprout-fade-in sprout-duration-300",
    {
        variants: {
            role: {
                user: "sprout-justify-end",
                ai: "sprout-justify-start",
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
}

export function MessageItem({ role, content, isStreaming = false }: MessageItemProps) {
    return (
        <div className={messageVariants({ role })}>
            {role === "ai" && (
                <div className="sprout-flex-shrink-0 sprout-w-8 sprout-h-8 sprout-rounded-full sprout-bg-kangkong-500 sprout-flex sprout-items-center sprout-justify-center">
                    <Bot className="sprout-w-4 sprout-h-4 sprout-text-white-50" />
                </div>
            )}

            <div className={cn(
                bubbleVariants({ role }),
                isStreaming && role === "ai" && "ai-response-stream"
            )}>
                <p className="sprout-text-sm sprout-leading-relaxed sprout-whitespace-pre-wrap">
                    {content}
                </p>
            </div>

            {role === "user" && (
                <div className="sprout-flex-shrink-0 sprout-w-8 sprout-h-8 sprout-rounded-full sprout-bg-mushroom-300 sprout-flex sprout-items-center sprout-justify-center">
                    <User className="sprout-w-4 sprout-h-4 sprout-text-mushroom-900" />
                </div>
            )}
        </div>
    )
}
