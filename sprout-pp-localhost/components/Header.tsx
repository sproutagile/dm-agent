import React from "react"
import { X, Sparkles, Trash2 } from "lucide-react"
import { cn } from "~lib/utils"

interface HeaderProps {
    onClose: () => void
    onClearChat?: () => void
    hasMessages?: boolean
}

export function Header({ onClose, onClearChat, hasMessages }: HeaderProps) {
    return (
        <header className={cn(
            "sprout-sticky sprout-top-0 sprout-z-10",
            "sprout-flex sprout-items-center sprout-justify-between",
            "sprout-px-4 sprout-py-3",
            "sprout-bg-kangkong-500 sprout-border-b sprout-border-kangkong-600"
        )}>
            <div className="sprout-flex sprout-items-center sprout-gap-2">
                <Sparkles className="sprout-w-5 sprout-h-5 sprout-text-white-50" />
                <h1 className="sprout-text-lg sprout-font-semibold sprout-text-white-50">
                    Sprout AI
                </h1>
            </div>

            <div className="sprout-flex sprout-items-center sprout-gap-1">
                {hasMessages && (
                    <button
                        onClick={onClearChat}
                        className={cn(
                            "sprout-p-1.5 sprout-rounded-md",
                            "sprout-text-white-50/70 hover:sprout-text-red-300",
                            "hover:sprout-bg-white-50/10",
                            "sprout-transition-all sprout-duration-200"
                        )}
                        aria-label="Clear chat history"
                        title="Clear Chat"
                    >
                        <Trash2 className="sprout-w-4 sprout-h-4" />
                    </button>
                )}

                <button
                    onClick={onClose}
                    className={cn(
                        "sprout-p-1.5 sprout-rounded-md",
                        "sprout-text-white-50/90 hover:sprout-text-white-50",
                        "hover:sprout-bg-white-50/10",
                        "sprout-transition-all sprout-duration-200"
                    )}
                    aria-label="Close sidebar"
                >
                    <X className="sprout-w-5 sprout-h-5" />
                </button>
            </div>
        </header>
    )
}
