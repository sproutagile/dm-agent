'use client';

import { useEffect, useRef } from 'react';
import { useDashboard } from '@/components/DashboardContext';
import { Widget } from '@/types/sprout';

// Allowed chart types - whitelist
const ALLOWED_CHART_TYPES = ['bar', 'line', 'area', 'pie'] as const;

/**
 * Sanitize string to prevent XSS - removes HTML tags and limits length
 */
function sanitizeString(input: unknown, maxLength = 100): string {
    if (typeof input !== 'string') return '';
    return input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>"'&]/g, '') // Remove dangerous characters
        .slice(0, maxLength)
        .trim();
}

/**
 * Validate and sanitize chart data from extension
 */
function validateWidgetData(data: unknown): { valid: boolean; widget?: Omit<Widget, 'id'> } {
    if (!data || typeof data !== 'object') {
        return { valid: false };
    }

    const obj = data as Record<string, unknown>;

    // Handle Scorecards
    if (obj.type === 'scorecard' || obj.type === 'kpi') {
        const title = sanitizeString(obj.title, 100) || 'Scorecard';
        let scorecardData = obj.data as Record<string, unknown>;
        if (!scorecardData || typeof scorecardData !== 'object') {
            scorecardData = obj;
        }

        const value = sanitizeString(String(scorecardData.value || ''), 50);

        if (!value) return { valid: false };

        return {
            valid: true,
            widget: {
                type: 'scorecard',
                title,
                data: scorecardData,
            } as any
        };
    }

    // Must have type 'chart' and data array
    if (obj.type !== 'chart' || !Array.isArray(obj.data)) {
        return { valid: false };
    }

    // Validate chart type
    const chartType = ALLOWED_CHART_TYPES.includes(obj.chartType as typeof ALLOWED_CHART_TYPES[number])
        ? (obj.chartType as typeof ALLOWED_CHART_TYPES[number])
        : 'bar';

    // Sanitize title
    const title = sanitizeString(obj.title, 100) || 'Analytics';

    // Validate and sanitize data array (max 20 items)
    const chartData: { name: string; value: number }[] = [];
    for (const item of obj.data.slice(0, 20)) {
        if (item && typeof item === 'object') {
            const itemObj = item as Record<string, unknown>;
            const name = sanitizeString(itemObj.name, 50);

            if (typeof itemObj.value === 'number' && isFinite(itemObj.value)) {
                // Standard format: { name: "Planned", value: 35 }
                const value = Math.max(0, Math.min(itemObj.value, 1000000));
                if (name) chartData.push({ name, value });

            } else if (typeof itemObj.value === 'object' && itemObj.value !== null && !Array.isArray(itemObj.value)) {
                // Grouped object format: { name: "Planned Tickets", value: { planned: 35, unplanned: 9 } }
                // Explode each key into its own bar entry
                for (const [key, val] of Object.entries(itemObj.value as Record<string, unknown>)) {
                    if (typeof val === 'number' && isFinite(val)) {
                        const entryName = sanitizeString(key.charAt(0).toUpperCase() + key.slice(1) + ' Tickets', 50) || sanitizeString(key, 50);
                        chartData.push({ name: entryName, value: Math.max(0, Math.min(val, 1000000)) });
                    }
                }

            } else if (typeof itemObj.value === 'string') {
                // String number: { name: "Planned", value: "35" }
                const parsed = parseFloat(itemObj.value as string);
                if (!isNaN(parsed) && name) chartData.push({ name, value: Math.max(0, Math.min(parsed, 1000000)) });
            }
        }
    }


    if (chartData.length === 0) {
        return { valid: false };
    }

    return {
        valid: true,
        widget: {
            type: 'chart',
            chartType,
            title,
            data: chartData,
        } as any
    };
}

/**
 * WidgetListener - Securely listens for chart data from the DM Agent Extension
 */
export function WidgetListener() {
    // Removed legacy store usage
    const { addDynamicWidget, addGeneratedInsight } = useDashboard();
    const processedIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        const WIDGET_KEY = 'sprout_pending_widget';

        const processPendingWidget = () => {
            const pending = localStorage.getItem(WIDGET_KEY);
            if (!pending) return;

            // Immediately remove to prevent reprocessing
            localStorage.removeItem(WIDGET_KEY);

            try {
                const rawData = JSON.parse(pending);
                const { valid, widget } = validateWidgetData(rawData);

                if (!valid || !widget) {
                    console.warn('[WidgetListener] Invalid widget data rejected');
                    return;
                }

                // Create unique ID for deduplication
                const uniqueId = `${widget.title}-${JSON.stringify(widget.data).slice(0, 50)}`;
                if (processedIds.current.has(uniqueId)) return;

                // Use provided ID from n8n (originally generated by background.ts) or fallback to Date
                const widgetId = rawData.id || `widget-${Date.now()}`;
                // Forward source_pointer and original_query from the extension payload
                const widgetWithId = {
                    ...widget,
                    id: widgetId,
                    ...(rawData.source_pointer ? { source_pointer: rawData.source_pointer } : {}),
                    ...(rawData.original_query ? { original_query: rawData.original_query } : {})
                };

                // Add to dynamic widgets (context)
                addDynamicWidget(widgetWithId);

                processedIds.current.add(uniqueId);
                console.log('[WidgetListener] Added validated widget:', widget.title);
            } catch (err) {
                console.error('[WidgetListener] Error:', err);
            }
        };

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === WIDGET_KEY && event.newValue) {
                processPendingWidget();
            }
        };

        const handleMessageEvent = (event: MessageEvent) => {
            // Security check: ensure message is from trusted source (extension)
            if (event.data?.type === 'SPROUT_WIDGET_DATA') {
                const { valid, widget } = validateWidgetData(event.data.payload);

                if (!valid || !widget) {
                    console.warn('[WidgetListener] Invalid message data rejected');
                    return;
                }

                const uniqueId = `${widget.title}-${JSON.stringify(widget.data).slice(0, 50)}`;
                if (processedIds.current.has(uniqueId)) return;

                // Use provided ID from n8n (originally generated by background.ts) or fallback to Date
                const widgetId = event.data.payload.id || `widget-${Date.now()}`;
                addDynamicWidget({
                    ...widget,
                    id: widgetId,
                    ...(event.data.payload.source_pointer ? { source_pointer: event.data.payload.source_pointer } : {}),
                    ...(event.data.payload.original_query ? { original_query: event.data.payload.original_query } : {})
                });

                processedIds.current.add(uniqueId);
                console.log('[WidgetListener] Added widget via postMessage:', widget.title);
            }
        };

        const handleCustomEvent = (event: CustomEvent) => {
            const { valid, widget } = validateWidgetData(event.detail);
            if (!valid || !widget) {
                console.warn('[WidgetListener] Invalid event data rejected');
                return;
            }

            const uniqueId = `${widget.title}-${JSON.stringify(widget.data).slice(0, 50)}`;
            if (processedIds.current.has(uniqueId)) return;

            // Use provided ID from n8n (originally generated by background.ts) or fallback to Date
            const widgetId = event.detail.id || `widget-${Date.now()}`;
            addDynamicWidget({
                ...widget,
                id: widgetId,
                ...(event.detail.source_pointer ? { source_pointer: event.detail.source_pointer } : {}),
                ...(event.detail.original_query ? { original_query: event.detail.original_query } : {})
            });

            processedIds.current.add(uniqueId);
        };

        // Initialize processing
        processPendingWidget();

        // Listeners for programmatic AI chart generations
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('sprout-widget-data', handleCustomEvent as EventListener);
        window.addEventListener('message', handleMessageEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('sprout-widget-data', handleCustomEvent as EventListener);
            window.removeEventListener('message', handleMessageEvent);
        };
    }, [addDynamicWidget, addGeneratedInsight]);

    return null;
}
