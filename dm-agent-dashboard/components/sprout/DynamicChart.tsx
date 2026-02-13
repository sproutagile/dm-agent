'use client';

import { useState } from 'react';
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
import { X, BarChart3, Pencil, Save, Plus, Trash2 } from 'lucide-react';


interface DynamicChartProps {
    widget: Widget;
    onRemove?: (id: string) => void;
}

const COLORS = ['#2D3A8C', '#2E7D32', '#F5A623', '#02AFCE', '#8952F6'];

export function DynamicChart({ widget, onRemove }: DynamicChartProps) {
    const { updateDynamicWidget } = useDashboard();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(widget.title);
    const [editType, setEditType] = useState(widget.chartType || 'bar');
    const [editColSpan, setEditColSpan] = useState(widget.colSpan || 1);
    // State for user-friendly data editing
    const [dataRows, setDataRows] = useState<Array<{ name: string; value: string | number }>>(
        Array.isArray(widget.data) ? widget.data : []
    );

    const handleSave = () => {
        // clean up data: convert value to numbers and remove empty rows
        const cleanData = dataRows
            .map(row => ({ name: row.name, value: Number(row.value) }))
            .filter(row => row.name.trim() !== '' && !isNaN(row.value));

        updateDynamicWidget(widget.id, {
            title: editTitle,
            chartType: editType,
            colSpan: editColSpan,
            data: cleanData
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
        setDataRows(Array.isArray(widget.data) ? widget.data : []);
        setIsEditing(true);
    };

    const renderChart = () => {
        const chartData = widget.data;
        const mainColor = chartData[0]?.fill || '#2D3A8C';

        switch (widget.chartType || 'bar') {
            case 'line':
                return (
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
                return (
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
                return (
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
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
                                {chartData.map((entry, index) => (
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
                return (
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
                                dataKey="value"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={50}
                            >
                                {chartData.map((entry, index) => (
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
                                        onClick={() => handleRemoveRow(index)}
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
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white animate-fadeIn">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-50">
                        <BarChart3 className="h-4 w-4 text-[#2D3A8C]" />
                    </div>
                    <CardTitle className="text-base font-semibold text-gray-900">
                        {widget.title}
                    </CardTitle>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={startEditing}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-blue-600"
                        title="Edit Chart"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    {onRemove && (
                        <button
                            onClick={() => onRemove(widget.id)}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-red-600"
                            title="Remove Widget"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </CardHeader>
            <CardContent>{renderChart()}</CardContent>
        </Card>
    );
}
