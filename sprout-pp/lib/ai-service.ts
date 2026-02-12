import { v4 as uuidv4 } from "uuid"

export interface Message {
    id: string
    role: "user" | "ai"
    content: string
    isStreaming?: boolean
    timestamp?: number
}

// Session Management
export function getSessionId(): string {
    let sessionId = localStorage.getItem("sprout_session_id")
    if (!sessionId) {
        sessionId = uuidv4()
        localStorage.setItem("sprout_session_id", sessionId)
    }
    return sessionId
}

export function createMessage(role: "user" | "ai", content: string, isStreaming = false): Message {
    return {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role,
        content,
        isStreaming,
        timestamp: Date.now()
    }
}

// API Interaction via Background Script
export async function sendMessageToAI(text: string): Promise<{ reply: string, data?: any }> {
    const sessionId = getSessionId()

    try {
        console.log("Sending message to background script...")
        const response = await chrome.runtime.sendMessage({
            action: "SEND_MESSAGE",
            payload: { text, sessionId }
        })

        if (!response.ok) {
            throw new Error(response.error || "Unknown error from background script")
        }

        return { reply: response.reply, data: response.data }
    } catch (error) {
        console.error("Error sending message to AI via background:", error)
        throw error
    }
}
