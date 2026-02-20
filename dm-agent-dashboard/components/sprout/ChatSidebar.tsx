'use client';

import { useState, useRef, useEffect } from 'react';
import { useDashboard } from '@/components/DashboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage, KPIData, WebhookResponse, Widget } from '@/types/sprout';

export function ChatSidebar() {
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const {
        chatMessages,
        addMessage,
        updateKPIs,
        addDynamicWidget,
        addGeneratedInsight
    } = useDashboard();

    // Generate or retrieve sessionId for multi-user isolation
    useEffect(() => {
        const STORAGE_KEY = 'sprout_session_id';
        let storedSessionId = localStorage.getItem(STORAGE_KEY);

        if (!storedSessionId) {
            storedSessionId = crypto.randomUUID();
            localStorage.setItem(STORAGE_KEY, storedSessionId);
        }

        setSessionId(storedSessionId);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const content = input.trim();

        // Context handles optimistic update
        await addMessage('user', content);
        setInput('');
        setIsLoading(true);

        try {
            // Call the API route which proxies to the webhook
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    sessionId: sessionId,
                }),
            });

            const data: WebhookResponse = await response.json();

            // Log the webhook response for debugging
            console.log('Webhook response:', data);

            // Add assistant response
            const assistantContent = data.message || (typeof data === 'string' ? data : JSON.stringify(data));
            await addMessage('assistant', assistantContent);

            // If webhook returned chart data, render it
            if (data.type === 'chart' && data.data && Array.isArray(data.data)) {
                await addMessage('assistant', '✨ Generating chart from webhook data...');

                setTimeout(() => {
                    const widget: Widget = {
                        id: `widget-${Date.now()}`,
                        type: 'chart',
                        chartType: data.chartType || 'bar',
                        title: data.title || 'Webhook Analytics',
                        data: data.data as { name: string; value: number }[],
                    };

                    // Sync to main Dashboard Insights
                    addDynamicWidget(widget);
                    addGeneratedInsight(widget.id, widget.title, widget);
                }, 500);
            }

            // Handle KPI updates from webhook
            if (data.type === 'kpi' && data.data && !Array.isArray(data.data)) {
                updateKPIs(data.data as KPIData);
            }
        } catch (error) {
            console.error('Webhook error:', error);
            await addMessage('assistant', 'Failed to connect to webhook. Please check if the webhook URL is accessible.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Card className="h-full flex flex-col border-0 shadow-lg bg-white rounded-none md:rounded-l-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-100 px-4 py-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-[#0052cc] to-[#0747a6]">
                        <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold text-gray-900">
                            Sprout Assistant
                        </CardTitle>
                        <p className="text-xs text-gray-500">Connected to webhook</p>
                    </div>
                </div>
            </CardHeader>

            <div className="flex-1 overflow-y-auto px-4">
                <div className="py-4 space-y-4">
                    {chatMessages.length === 0 && (
                        <div className="text-center py-8">
                            <div className="p-3 rounded-full bg-blue-50 inline-block mb-3">
                                <Sparkles className="h-6 w-6 text-[#0052cc]" />
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                Send a message to the webhook assistant.
                            </p>
                            <div className="space-y-2">
                                {[
                                    'Show me team velocity',
                                    'Generate a delivery report',
                                    'Task distribution breakdown',
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setInput(suggestion)}
                                        className="block w-full text-left px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        &quot;{suggestion}&quot;
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {chatMessages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''
                                }`}
                        >
                            <div
                                className={`p-2 rounded-lg h-8 w-8 flex items-center justify-center shrink-0 ${message.role === 'user'
                                    ? 'bg-[#0052cc]'
                                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                                    }`}
                            >
                                {message.role === 'user' ? (
                                    <User className="h-4 w-4 text-white" />
                                ) : (
                                    <Bot className="h-4 w-4 text-gray-600" />
                                )}
                            </div>
                            <div
                                className={`px-4 py-2.5 rounded-2xl max-w-[80%] ${message.role === 'user'
                                    ? 'bg-[#0052cc] text-white rounded-tr-md'
                                    : 'bg-gray-100 text-gray-800 rounded-tl-md'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed">{message.content}</p>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 h-8 w-8 flex items-center justify-center">
                                <Bot className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="px-4 py-2.5 rounded-2xl rounded-tl-md bg-gray-100">
                                <Loader2 className="h-4 w-4 animate-spin text-[#0052cc]" />
                            </div>
                        </div>
                    )}

                    <div ref={scrollRef} />
                </div>
            </div>

            <CardContent className="border-t border-gray-100 p-4 shrink-0">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask for analytics..."
                        className="flex-1 border-gray-200 focus:border-[#0052cc] focus:ring-[#0052cc] rounded-xl"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isLoading}
                        className="bg-[#0052cc] hover:bg-[#0747a6] rounded-xl px-4"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
