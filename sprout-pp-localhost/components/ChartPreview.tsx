import React from "react"
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
    Legend
} from "recharts"

const COLORS = ['#2D3A8C', '#2E7D32', '#F5A623', '#02AFCE', '#8952F6']

interface ChartPreviewProps {
    data: any
}

export function ChartPreview({ data }: ChartPreviewProps) {
    if (!data || !data.data || !Array.isArray(data.data)) return null

    const chartData = data.data
    const mainColor = chartData[0]?.fill || '#2D3A8C'
    const chartType = data.chartType || 'bar'

    const commonProps = {
        margin: { top: 5, right: 5, left: -20, bottom: 0 }
    }

    const renderChart = () => {
        switch (chartType) {
            case 'line':
                return (
                    <LineChart data={chartData} {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#6b7280"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            stroke="#6b7280"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '12px',
                                padding: '4px 8px'
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={mainColor}
                            strokeWidth={2}
                            dot={{ r: 2, fill: mainColor }}
                            activeDot={{ r: 4 }}
                        />
                    </LineChart>
                )
            case 'area':
                return (
                    <AreaChart data={chartData} {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#6b7280"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            stroke="#6b7280"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '12px',
                                padding: '4px 8px'
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={mainColor}
                            fill={mainColor}
                            fillOpacity={0.3}
                        />
                    </AreaChart>
                )
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '12px',
                                padding: '4px 8px'
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                    </PieChart>
                )
            default: // bar
                return (
                    <BarChart data={chartData} {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#6b7280"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            stroke="#6b7280"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '12px',
                                padding: '4px 8px'
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                        <Bar
                            dataKey="value"
                            fill={mainColor}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            {chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                )
        }
    }

    return (
        <div className="sprout-mt-3 sprout-bg-white sprout-rounded-lg sprout-p-3 sprout-border sprout-border-mushroom-200 sprout-shadow-sm">
            <h4 className="sprout-text-xs sprout-font-semibold sprout-text-mushroom-900 sprout-mb-2 sprout-truncate">
                {data.title}
            </h4>
            <div className="sprout-h-48 sprout-w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    )
}
