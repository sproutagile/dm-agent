import React, { useState, useRef, useEffect } from "react"
import { Send, Highlighter } from "lucide-react"
import { cn } from "~lib/utils"

interface ChatInputProps {
    onSendMessage: (message: string) => void
    onSummarizeHighlight: () => void
    disabled?: boolean
}

export function ChatInput({ onSendMessage, onSummarizeHighlight, disabled = false }: ChatInputProps) {
    const [input, setInput] = useState("")
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 96)}px`
        }
    }, [input])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (input.trim() && !disabled) {
            onSendMessage(input.trim())
            setInput("")
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    return (
        <div className="sprout-border-t sprout-border-mushroom-200 sprout-bg-white-50 sprout-p-4">
            <form onSubmit={handleSubmit} className="sprout-space-y-2">
                <div className="sprout-relative">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything..."
                        disabled={disabled}
                        rows={1}
                        className={cn(
                            "sprout-w-full sprout-resize-none sprout-rounded-md",
                            "sprout-border sprout-border-mushroom-300",
                            "sprout-bg-white-50 sprout-px-4 sprout-py-2.5 sprout-pr-12",
                            "sprout-text-sm sprout-text-mushroom-900",
                            "placeholder:sprout-text-mushroom-500",
                            "focus:sprout-outline-none focus:sprout-ring-2 focus:sprout-ring-kangkong-500",
                            "disabled:sprout-opacity-50 disabled:sprout-cursor-not-allowed",
                            "sprout-transition-all",
                            "sprout-scrollbar-hide"
                        )}
                        style={{ resize: 'none' }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || disabled}
                        className={cn(
                            "sprout-absolute sprout-right-2 sprout-bottom-2",
                            "sprout-p-1.5 sprout-rounded-md",
                            "sprout-bg-kangkong-500 sprout-text-white-50",
                            "hover:sprout-bg-kangkong-600",
                            "disabled:sprout-opacity-50 disabled:sprout-cursor-not-allowed",
                            "sprout-transition-colors"
                        )}
                        aria-label="Send message"
                    >
                        <Send className="sprout-w-4 sprout-h-4" />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onSummarizeHighlight}
                    disabled={disabled}
                    className={cn(
                        "sprout-w-full sprout-flex sprout-items-center sprout-justify-center sprout-gap-2",
                        "sprout-px-4 sprout-py-2 sprout-rounded-md",
                        "sprout-border sprout-border-mushroom-300",
                        "sprout-bg-white-50 sprout-text-mushroom-900",
                        "hover:sprout-bg-kangkong-500 hover:sprout-text-white-50 hover:sprout-border-kangkong-500",
                        "disabled:sprout-opacity-50 disabled:sprout-cursor-not-allowed",
                        "sprout-transition-all sprout-duration-200 sprout-text-sm sprout-font-medium"
                    )}
                >
                    <Highlighter className="sprout-w-4 sprout-h-4" />
                    Summarize Highlight
                </button>
            </form>
        </div>
    )
}
