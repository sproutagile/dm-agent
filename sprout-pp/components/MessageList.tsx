import React, { useEffect, useRef } from "react"
import { MessageItem } from "./MessageItem"
import type { Message } from "~lib/ai-service"
import { cn } from "~lib/utils"
import { Bot } from "lucide-react"

interface MessageListProps {
    messages: Message[]
    isLoading?: boolean
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isLoading])

    return (
        <div className={cn(
            "sprout-flex-1 sprout-overflow-y-auto sprout-px-4 sprout-py-4",
            "sprout-scrollbar"
        )}>
            {messages.length === 0 && !isLoading ? (
                <div className="sprout-flex sprout-flex-col sprout-items-center sprout-justify-center sprout-h-full sprout-text-center sprout-px-4">
                    <div className="sprout-w-16 sprout-h-16 sprout-rounded-full sprout-bg-kangkong-500/10 sprout-flex sprout-items-center sprout-justify-center sprout-mb-4">
                        <svg
                            className="sprout-w-8 sprout-h-8 sprout-text-kangkong-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                        </svg>
                    </div>
                    <h3 className="sprout-text-lg sprout-font-semibold sprout-text-mushroom-900 sprout-mb-2">
                        Welcome to Sprout AI
                    </h3>
                    <p className="sprout-text-sm sprout-text-mushroom-500 sprout-max-w-xs">
                        Your intelligent assistant is ready to help. Ask me anything or highlight text to summarize!
                    </p>
                </div>
            ) : (
                <>
                    {messages.map((message) => (
                        <MessageItem
                            key={message.id}
                            role={message.role}
                            content={message.content}
                            isStreaming={message.isStreaming}
                            data={message.data}
                        />
                    ))}

                    {isLoading && (
                        <div className="sprout-flex sprout-gap-2 sprout-mb-4 sprout-animate-in sprout-fade-in sprout-duration-300 sprout-justify-start">
                            <div className="sprout-flex-shrink-0 sprout-w-8 sprout-h-8 sprout-rounded-full sprout-bg-kangkong-500 sprout-flex sprout-items-center sprout-justify-center">
                                <Bot className="sprout-w-4 sprout-h-4 sprout-text-white-50" />
                            </div>
                            <div className="sprout-rounded-lg sprout-px-4 sprout-py-3 sprout-bg-mushroom-100 sprout-flex sprout-items-center sprout-gap-1.5">
                                <span className="sprout-w-2 sprout-h-2 sprout-bg-mushroom-500 sprout-rounded-full sprout-animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="sprout-w-2 sprout-h-2 sprout-bg-mushroom-500 sprout-rounded-full sprout-animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="sprout-w-2 sprout-h-2 sprout-bg-mushroom-500 sprout-rounded-full sprout-animate-bounce"></span>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </>
            )}
        </div>
    )
}
