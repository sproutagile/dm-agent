import React, { useState, useCallback, useEffect, useRef } from "react"
import { Header } from "./Header"
import { MessageList } from "./MessageList"
import { ChatInput } from "./ChatInput"
import { sendMessageToAI, createMessage, type Message, getSessionId } from "~lib/ai-service"
import { cn } from "~lib/utils"

interface SidebarProps {
    onClose: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false) // Track if storage is loaded
    const sessionId = useRef(getSessionId())

    // Load messages from storage on mount
    useEffect(() => {
        if (!chrome.storage || !chrome.storage.local) {
            setIsHydrated(true);
            return;
        }

        chrome.storage.local.get(['sprout_chat_messages'], (result) => {
            if (result.sprout_chat_messages && Array.isArray(result.sprout_chat_messages)) {
                setMessages(result.sprout_chat_messages);
            } else {
                // Initial welcome message if no history
                setMessages([
                    createMessage("ai", "Hello! I'm Sprout AI. How can I help you manage your delivery operations today?")
                ]);
            }
            setIsHydrated(true);
        });
    }, []);

    // Save messages to storage whenever they change
    useEffect(() => {
        if (!isHydrated || !chrome.storage || !chrome.storage.local) return;

        // Debounce or just save? Chat is low freq, direct save is fine.
        chrome.storage.local.set({ 'sprout_chat_messages': messages });
    }, [messages, isHydrated]);

    const handleSendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return

        // Add user message immediately
        const userMessage = createMessage("user", content)
        setMessages(prev => [...prev, userMessage])
        setIsLoading(true)

        try {
            // Call real AI service
            const { reply, data } = await sendMessageToAI(content)

            // Dispatch event if chart data is present
            if (data && (data.type === 'chart' || data.chartType)) {
                console.log("Dispatching sprout-widget-data event", data)

                // Method 1: Custom Event (works if in same context)
                const event = new CustomEvent('sprout-widget-data', {
                    detail: data,
                    bubbles: true,
                    composed: true
                })
                window.dispatchEvent(event)

                // Method 2: LocalStorage (works across isolated worlds)
                try {
                    localStorage.setItem('sprout_pending_widget', JSON.stringify(data));
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: 'sprout_pending_widget',
                        newValue: JSON.stringify(data),
                        storageArea: localStorage
                    }));
                } catch (e) {
                    console.error("Failed to write to localStorage", e)
                }

                // Method 3: PostMessage (Best for Content Script -> Page communication)
                try {
                    // Send to current window and top window (if iframe)
                    window.postMessage({ type: 'SPROUT_WIDGET_DATA', payload: data }, '*');
                    if (window.top && window.top !== window) {
                        window.top.postMessage({ type: 'SPROUT_WIDGET_DATA', payload: data }, '*');
                    }
                } catch (e) {
                    console.error("Failed to postMessage", e);
                }
            }

            // Add AI response
            const aiMessage = createMessage("ai", reply, false, data)
            setMessages(prev => [...prev, aiMessage])
        } catch (error) {
            console.error("Failed to get response:", error)
            const errorMessage = createMessage("ai", "Sorry, I'm having trouble connecting to the brain. Please try again later.")
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }, [])

    const handleSummarizeHighlight = useCallback(() => {
        const selectedText = window.getSelection()?.toString().trim()

        if (selectedText) {
            handleSendMessage(`Summarize this: "${selectedText}"`)
        } else {
            handleSendMessage("Summarize the highlighted text")
        }
    }, [handleSendMessage])

    return (
        <div className={cn(
            "sprout-flex sprout-flex-col sprout-h-full",
            "sprout-bg-background sprout-text-foreground",
            "sprout-font-sans sprout-antialiased"
        )}>
            <Header onClose={onClose} />
            <MessageList messages={messages} isLoading={isLoading} />
            <ChatInput
                onSendMessage={handleSendMessage}
                onSummarizeHighlight={handleSummarizeHighlight}
                disabled={isLoading}
            />
        </div>
    )
}
