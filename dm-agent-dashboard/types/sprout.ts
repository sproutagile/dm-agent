export interface Widget {
    id: string;
    type: 'chart' | 'table' | 'metric';
    chartType?: 'bar' | 'line' | 'area' | 'pie';
    title: string;
    data: ChartDataPoint[];
}

export interface ChartDataPoint {
    name: string;
    value: number;
    fill?: string;
    [key: string]: string | number | undefined;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface KPIData {
    activeTasks: number;
    throughput: number;
    blockers: number;
}

export interface WebhookResponse {
    message?: string;
    type?: 'chart' | 'kpi' | 'text';
    chartType?: 'bar' | 'line' | 'area' | 'pie';
    title?: string;
    data?: ChartDataPoint[] | KPIData;
}

export interface WebhookRequest {
    message: string;
}
