'use client';

import { useEffect, useRef } from 'react';
import { useSproutStore } from '@/store/useSproutStore';
import { Widget } from '@/types/sprout';
import { useDashboard } from '@/components/DashboardContext';

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
        // Check if data is nested or flat. 
        // If nested: obj.data = { value, trend... }
        // If flat: obj.value... (but our schema says nested in 'data')

        let scorecardData = obj.data as Record<string, unknown>;
        // Fallback if flat
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
                // Scorecards are stored as 'scorecard' type in Dashboard?
                // Dashboard likely expects type='scorecard' and props={ title, value, trend }
                // We need to map this to the Dashboard's expected Widget structure.
                // The Dashboard WIDGET_LIBRARY has type='scorecard' and props.
                // But DynamicWidget mechanism might differ.
                // Let's assume we store it as is, and the renderer handles it.
                // Existing `renderWidget` in insights/page.tsx:
                // if (widget.type === "scorecard") ... return <ScorecardWidget {...props} />
                // So we need to structure it such that `widget.props` has the data, OR `widget` itself has the data if it's dynamic?
                // insights/page.tsx:
                // if (dynamicWidgets[widgetId]) return <DynamicChart widget={...} />
                // DynamicChart only handles charts?
                // Check DynamicChart.tsx... it seems to only handle charts.
                // WE NEED TO UPDATE Insights Page to render Dynamic Scorecards too!

                // For now, let's pass it through as a valid widget.
                data: scorecardData, // Store raw data
                // We might need to transform this later or update the renderer.
                chartType: 'bar', // Dummy text to satisfy types if needed, or valid?
                // Widget type definition:
                // export interface Widget { id, title, type: 'chart' | 'scorecard', ... }
                // We need to check `types/sprout.ts` to see if 'scorecard' is valid in Widget type.
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
            const value = typeof itemObj.value === 'number' && isFinite(itemObj.value)
                ? Math.max(0, Math.min(itemObj.value, 1000000)) // Cap values
                : 0;

            if (name && value >= 0) {
                chartData.push({ name, value });
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
        }
    };
}

/**
 * WidgetListener - Securely listens for chart data from the DM Agent Extension
 */
export function WidgetListener() {
    const { addWidget } = useSproutStore();
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

                addWidget({ ...widget, id: `widget-${Date.now()}` });

                // Sync to Dashboard Context (Data availability only, NO INSIGHT AUTO-ADD)
                const widgetId = `widget-${Date.now()}`;
                const widgetWithId = { ...widget, id: widgetId };
                addDynamicWidget(widgetWithId);
                // REMOVED: addGeneratedInsight(widgetId, widget.title);

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

                const widgetId = `widget-${Date.now()}`;

                // Add to store
                addWidget({ ...widget, id: widgetId });

                // Sync to Dashboard Context
                addDynamicWidget({ ...widget, id: widgetId });
                // REMOVED: addGeneratedInsight(widgetId, widget.title);

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

            const widgetId = `widget-${Date.now()}`;

            addWidget({ ...widget, id: widgetId });

            // Sync to Dashboard Context for Insights
            addDynamicWidget({ ...widget, id: widgetId });
            // REMOVED: addGeneratedInsight(widgetId, widget.title);

            processedIds.current.add(uniqueId);
        };

        // Initialize processing
        processPendingWidget();

        const handleManualAddEvent = (event: StorageEvent | MessageEvent) => {
            let data: any;

            if (event instanceof StorageEvent) {
                const MANUAL_KEY = 'sprout_add_insight_event';
                if (event.key === MANUAL_KEY && event.newValue) {
                    try {
                        const parsed = JSON.parse(event.newValue);
                        data = parsed.widget;
                        // Clear to prevent re-trigger
                        localStorage.removeItem(MANUAL_KEY);
                    } catch (e) { console.error(e) }
                }
            } else if (event instanceof MessageEvent) {
                if (event.data?.type === 'SPROUT_ADD_INSIGHT') {
                    data = event.data.payload;
                }
            }

            if (data) {
                const { valid, widget } = validateWidgetData(data);
                if (valid && widget) {
                    const widgetId = `widget-${Date.now()}`;
                    // Ensure widget data is in context
                    addWidget({ ...widget, id: widgetId });
                    addDynamicWidget({ ...widget, id: widgetId });

                    // THIS IS THE ONLY PLACE WE ADD INSIGHT
                    addGeneratedInsight(widgetId, widget.title);
                    console.log('[WidgetListener] Manually added insight:', widget.title);
                }
            }
        };

        // Listeners
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('storage', handleManualAddEvent);
        window.addEventListener('sprout-widget-data', handleCustomEvent as EventListener);
        window.addEventListener('message', handleMessageEvent);
        window.addEventListener('message', handleManualAddEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('storage', handleManualAddEvent);
            window.removeEventListener('sprout-widget-data', handleCustomEvent as EventListener);
            window.removeEventListener('message', handleMessageEvent);
            window.removeEventListener('message', handleManualAddEvent);
        };
    }, [addWidget, addDynamicWidget, addGeneratedInsight]);

    return null;
}
