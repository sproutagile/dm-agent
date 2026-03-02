export interface ChartDataPoint {
    name: string;
    value: number;
    fill?: string;
    [key: string]: string | number | undefined;
}

export interface Widget {
    id: string;
    type: 'chart' | 'scorecard' | 'text' | 'table' | 'metric';
    chartType?: 'bar' | 'line' | 'area' | 'pie';
    title: string;
    data?: any; // Dynamic data for dynamic widgets
    props?: any; // Legacy compatibility

    // Additional fields from original file
    colSpan?: number;
    refreshInterval?: number;
    webhookEndpoint?: string;
    chartContext?: string;

    // AI Source Data Pointer
    source_pointer?: {
        source_system: string;
        source_id: string;
        source_tab: string;
        source_cell: string;
        key: string;
    };
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at?: string; // Changed from timestamp: Date to created_at: string
}

export interface GeneratedInsight {
    id: string;
    widgetId: string;
    label: string;
    generatedAt: string;
    data?: any; // Dynamic widget config
}

export interface KPIData {
    activeTasks: number;
    throughput: number;
    blockers: number;
}

export interface WebhookResponse {
    message?: string;
    type?: 'chart' | 'kpi' | 'text' | 'scorecard';
    chartType?: 'bar' | 'line' | 'area' | 'pie';
    title?: string;
    data?: ChartDataPoint[] | KPIData | any;
}

export interface WebhookRequest {
    message: string;
}
