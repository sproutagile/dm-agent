'use client';

import { useState, useEffect } from 'react';
import { Widget } from '@/types/sprout';
import { useDashboard } from '@/components/DashboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { X, BarChart3, Pencil, Save, Plus, Trash2, RefreshCw, GripHorizontal, ExternalLink } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';


interface DynamicChartProps {
    widget: Widget;
    onRemove?: (id: string) => void;
}

const COLORS = ['#2D3A8C', '#2E7D32', '#F5A623', '#02AFCE', '#8952F6'];

export function DynamicChart({ widget, onRemove }: DynamicChartProps) {
    const { updateDynamicWidget, refreshMetrics } = useDashboard();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(widget.title);
    const [editType, setEditType] = useState(widget.chartType || 'bar');
    const [editColSpan, setEditColSpan] = useState(widget.colSpan || 1);
    const [editWebhook, setEditWebhook] = useState(widget.webhookEndpoint || '');
    const [editRefreshInterval, setEditRefreshInterval] = useState(widget.refreshInterval || 0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [rowToDelete, setRowToDelete] = useState<number | null>(null);
    const [isWidgetDeleteConfirmOpen, setIsWidgetDeleteConfirmOpen] = useState(false);

    // State for user-friendly data editing
    const [dataRows, setDataRows] = useState<Array<{ name: string; value: string | number }>>(
        Array.isArray(widget.data) ? widget.data : []
    );

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        // Trigger a global SQLite source metrics refresh silently alongside this 
        if (refreshMetrics) {
            refreshMetrics().catch(console.error);
        }

        try {
            // Only refresh if we have a pinned data source.
            // Without one, we'd be re-prompting the AI blind = hallucinations.
            if (!widget.source_pointer) {
                setError('No data source linked. Re-prompt this chart with the updated extension to enable refresh.');
                setIsLoading(false);
                return;
            }

            console.log('[DynamicChart] Using pinned source for refresh...');
            const refreshRes = await fetch('/api/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ widgetId: widget.id })
            });

            if (!refreshRes.ok) {
                throw new Error(`Refresh request failed: ${refreshRes.status}`);
            }

            const refreshData = await refreshRes.json();

            if (refreshData.fallback) {
                // The DB doesn't have the pointer yet (e.g. widget is old/pre-pointer)
                setError('No data source saved yet. Re-prompt to link a source.');
                setIsLoading(false);
                return;
            }

            const newData = Array.isArray(refreshData) ? refreshData : (refreshData.data || []);

            if (Array.isArray(newData) && newData.length > 0) {
                const currentSchema = Array.isArray(widget.data) ? widget.data : [];
                const maskedData = currentSchema.length > 0
                    ? currentSchema.map((originalPoint: any, index: number) => {
                        const byName = newData.find((n: any) =>
                            n.name && originalPoint.name &&
                            n.name.toString().toLowerCase() === originalPoint.name.toString().toLowerCase()
                        );
                        const byIndex = newData[index];
                        const resolved = byName || byIndex;
                        return {
                            ...originalPoint,
                            value: resolved?.value !== undefined ? resolved.value : originalPoint.value
                        };
                    })
                    : newData;

                updateDynamicWidget(widget.id, { data: maskedData, source_pointer: widget.source_pointer });
                setDataRows(maskedData);
                setError(null);
                console.log('[DynamicChart] Source-pinned refresh succeeded.');
            } else {
                setError('No data returned from source');
            }
            setIsLoading(false);
            return;

        } catch (e: any) {
            console.error("Refresh error:", e);
            setError(e.message || "Refresh failed");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!widget.refreshInterval || widget.refreshInterval <= 0) return;

        // Initial fetch if needed? Maybe not, just wait for interval.
        // Or fetch immediately on mount if data is stale?
        // simple interval for now.
        const intervalId = setInterval(fetchData, widget.refreshInterval);
        return () => clearInterval(intervalId);
    }, [widget.refreshInterval, widget.webhookEndpoint, widget.id, widget.title, widget.chartType, updateDynamicWidget]);


    const handleSave = () => {
        // clean up data: convert value to numbers and remove empty rows
        const cleanData = dataRows
            .map(row => ({ name: row.name, value: Number(row.value) }))
            .filter(row => row.name.trim() !== '' && !isNaN(row.value));

        updateDynamicWidget(widget.id, {
            title: editTitle,
            chartType: editType,
            colSpan: editColSpan,
            data: cleanData,
            webhookEndpoint: editWebhook,
            refreshInterval: editRefreshInterval
        });
        setIsEditing(false);
    };

    const handleDataChange = (index: number, field: 'name' | 'value', newValue: string) => {
        const newRows = [...dataRows];
        newRows[index] = { ...newRows[index], [field]: newValue };
        setDataRows(newRows);
    };

    const handleAddRow = () => {
        setDataRows([...dataRows, { name: '', value: '' }]);
    };

    const handleRemoveRow = (index: number) => {
        const newRows = dataRows.filter((_, i) => i !== index);
        setDataRows(newRows);
    };

    // reset state when entering edit mode
    const startEditing = () => {
        setEditTitle(widget.title);
        setEditType(widget.chartType || 'bar');
        setEditColSpan(widget.colSpan || 1);
        setEditWebhook(widget.webhookEndpoint || '');
        setEditRefreshInterval(widget.refreshInterval || 0);
        setDataRows(Array.isArray(widget.data) ? widget.data : []);
        setIsEditing(true);
    };

    const renderChart = () => {
        const chartData = widget.data;

        // --- Scorecard / KPI: data is a scalar or {value, trend}, NOT an array ---
        if ((widget.type as string) === 'scorecard' || (widget.type as string) === 'kpi') {
            const rawValue = typeof chartData === 'object' && chartData !== null && 'value' in chartData
                ? (chartData as any).value
                : chartData;
            const trend = typeof chartData === 'object' && chartData !== null && 'trend' in chartData
                ? (chartData as any).trend as { value: string; direction: 'up' | 'down' }
                : undefined;
            return (
                <div className="flex flex-col items-start justify-center h-full px-1 py-2">
                    <div className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
                        {rawValue != null ? String(rawValue) : '—'}
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-sm font-medium ${trend.direction === 'down' ? 'text-green-600' : 'text-red-500'}`}>
                            {trend.direction === 'down'
                                ? <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
                                : <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                            }
                            <span>{trend.value}</span>
                        </div>
                    )}
                </div>
            );
        }

        // Only show "No data" if there is NO data AND no error (if error, we show error overlay on top of old data or empty state)
        // Actually, if we have an error and no data, we should probably show the empty state + error.
        // If we have data and error, we show data + error.

        const hasData = chartData && chartData.length > 0;

        if (!hasData) {
            return (
                <div className="flex flex-col items-center justify-center h-[280px] text-gray-400 relative">
                    {error && (
                        <div className="absolute top-2 left-2 right-2 bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-md text-xs flex items-center justify-between z-10">
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="ml-2 hover:text-red-900"><X className="h-3 w-3" /></button>
                        </div>
                    )}
                    <BarChart3 className="h-10 w-10 mb-2 opacity-20" />
                    <span className="text-sm">No data available</span>
                </div>
            );
        }

        const mainColor = chartData[0]?.fill || '#2D3A8C';

        // Helper to wrap chart with error overlay if needed
        const renderWithOverlay = (chart: React.ReactNode) => (
            <div className="relative">
                {error && (
                    <div className="absolute top-0 right-0 left-0 mx-auto w-fit max-w-[90%] bg-red-50 border border-red-200 text-red-600 px-3 py-1 rounded-full text-xs flex items-center shadow-sm z-10 mt-2 animate-in fade-in slide-in-from-top-2">
                        <span className="mr-2 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="truncate max-w-[200px]">{error}</span>
                        <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-700">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                )}
                {chart}
            </div>
        );

        switch (widget.chartType || 'bar') {
            case 'line':
                return renderWithOverlay(
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="name"
                                stroke="#6b7280"
                                fontSize={10}
                                interval={0}
                            />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                }}
                            />
                            <Legend />
                            <Line
                                isAnimationActive={false}
                                type="monotone"
                                dataKey="value"
                                stroke={mainColor}
                                strokeWidth={2}
                                dot={{ fill: mainColor, strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: mainColor }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return renderWithOverlay(
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                }}
                            />
                            <Legend />
                            <Area
                                isAnimationActive={false}
                                type="monotone"
                                dataKey="value"
                                stroke={mainColor}
                                fill={`url(#colorGradient-${widget.id})`}
                                strokeWidth={2}
                            />
                            <defs>
                                <linearGradient id={`colorGradient-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={mainColor} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={mainColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return renderWithOverlay(
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                isAnimationActive={false}
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                                }
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry: any, index: number) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.fill || COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            default: // bar chart
                return renderWithOverlay(
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="name"
                                stroke="#6b7280"
                                fontSize={10}
                                interval={0}
                            />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                }}
                            />
                            <Legend />
                            <Bar
                                isAnimationActive={false}
                                dataKey="value"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={50}
                            >
                                {chartData.map((entry: any, index: number) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.fill || COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );
        }
    };

    if (isEditing) {
        return (
            <Card className="relative overflow-hidden border-0 shadow-sm bg-white p-4">
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-semibold text-lg">Edit Chart</h3>
                        <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-gray-100 rounded-full">
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <input
                                className="w-full p-2 border rounded-md text-sm"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Chart Title"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Chart Type</label>
                            <select
                                className="w-full p-2 border rounded-md text-sm"
                                value={editType}
                                onChange={(e) => setEditType(e.target.value as any)}
                            >
                                <option value="bar">Bar Chart</option>
                                <option value="line">Line Chart</option>
                                <option value="area">Area Chart</option>
                                <option value="pie">Pie Chart</option>
                                <option value="scorecard">Scorecard</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium">Data Points</label>
                            <span className="text-xs text-muted-foreground">Label | Value</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2 bg-gray-50">
                            {dataRows.map((row, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <input
                                        className="flex-1 p-2 border rounded-md text-sm"
                                        placeholder="Label"
                                        value={row.name || ''}
                                        onChange={(e) => handleDataChange(index, 'name', e.target.value)}
                                    />
                                    <input
                                        className="w-20 p-2 border rounded-md text-sm"
                                        placeholder="Value"
                                        type="number"
                                        value={row.value || ''}
                                        onChange={(e) => handleDataChange(index, 'value', e.target.value)}
                                    />
                                    <button
                                        onClick={() => setRowToDelete(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                                        title="Remove"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={handleAddRow}
                                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-blue-500 hover:text-blue-600 text-sm flex items-center justify-center gap-2"
                            >
                                <Plus className="h-4 w-4" /> Add Data Point
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                        <h4 className="text-sm font-medium">Auto-Refresh</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {/* Webhook URL Input Removed - Using Default Sprout Webhook */}

                            <div className="flex items-center gap-2">
                                <label className="text-sm whitespace-nowrap">Refresh every:</label>
                                <select
                                    className="p-2 border rounded-md text-sm flex-1"
                                    value={editRefreshInterval}
                                    onChange={(e) => {
                                        const newVal = Number(e.target.value);
                                        setEditRefreshInterval(newVal);
                                        updateDynamicWidget(widget.id, { refreshInterval: newVal });
                                    }}
                                >
                                    <option value={0}>Disabled</option>
                                    <option value={10000}>10 seconds (Test)</option>
                                    <option value={60000}>1 Minute</option>
                                    <option value={300000}>5 Minutes</option>
                                    <option value={900000}>15 Minutes</option>
                                    <option value={3600000}>1 Hour</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                        <div className="flex-1 flex items-center gap-2">
                            <span className="text-sm font-medium">Width:</span>
                            <div className="flex gap-1">
                                {[1, 2, 3].map((span) => (
                                    <button
                                        key={span}
                                        onClick={() => setEditColSpan(span)}
                                        className={`px-2 py-1 text-xs border rounded ${editColSpan === span ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {span === 1 ? 'Regular' : span === 2 ? 'Wide' : 'Full'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm bg-[#2D3A8C] text-white rounded-md hover:bg-blue-800 flex items-center gap-2 shadow-sm"
                        >
                            <Save className="h-4 w-4" /> Save Changes
                        </button>
                    </div>
                </div>

                <ConfirmDialog
                    isOpen={rowToDelete !== null}
                    onOpenChange={(open) => !open && setRowToDelete(null)}
                    title="Remove Data Point"
                    description="Are you sure you want to remove this data point?"
                    confirmText="Remove"
                    onConfirm={() => {
                        if (rowToDelete !== null) {
                            handleRemoveRow(rowToDelete);
                            setRowToDelete(null);
                        }
                    }}
                />
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white animate-fadeIn h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="drag-handle cursor-move">
                        <GripHorizontal className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    </div>
                    <div className="p-2 rounded-lg bg-blue-50">
                        <BarChart3 className="h-4 w-4 text-[#2D3A8C]" />
                    </div>
                    <CardTitle className="text-base font-semibold text-gray-900">
                        {widget.title}
                    </CardTitle>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={fetchData}
                        className={`p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-blue-600 ${isLoading ? 'animate-spin' : ''}`}
                        title="Refresh Data"
                        disabled={isLoading}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                        onClick={startEditing}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-blue-600"
                        title="Edit Chart"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col justify-center">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}
                {renderChart()}
            </CardContent>

            {/* Source link pinned to bottom */}
            {widget.source_pointer && (
                <div className="px-4 pb-3 pt-2 border-t border-gray-100 flex-shrink-0">
                    <a
                        href={widget.source_pointer.source_system.toLowerCase() === 'gsheets'
                            ? `https://docs.google.com/spreadsheets/d/${widget.source_pointer.source_id}`
                            : `https://${widget.source_pointer.source_id}.atlassian.net/browse/${widget.source_pointer.source_cell}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-600 transition-colors w-fit"
                        title="View Source Data"
                    >
                        <ExternalLink className="h-3 w-3" />
                        <span>Source: {widget.source_pointer.source_system} ({widget.source_pointer.key})</span>
                    </a>
                </div>
            )}

            <ConfirmDialog
                isOpen={isWidgetDeleteConfirmOpen}
                onOpenChange={setIsWidgetDeleteConfirmOpen}
                title="Remove Widget"
                description="Are you sure you want to remove this widget?"
                confirmText="Remove"
                onConfirm={() => {
                    if (onRemove) {
                        onRemove(widget.id);
                        setIsWidgetDeleteConfirmOpen(false);
                    }
                }}
            />
        </Card>
    );
}
