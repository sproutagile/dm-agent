"use client";

import { ChartContainer } from "@/components/ChartContainer";
import { velocityTrendData } from "@/data/mockMetrics";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

export function VelocityTrendChart() {
    return (
        <ChartContainer
            title="Velocity Trend"
            description="Committed vs Completed story points over last 3 sprints"
        >
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={velocityTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                        dataKey="sprint"
                        tick={{ fill: "#666" }}
                        tickLine={{ stroke: "#666" }}
                    />
                    <YAxis tick={{ fill: "#666" }} tickLine={{ stroke: "#666" }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                        }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="committed"
                        stroke="#2D3A8C"
                        strokeWidth={2}
                        name="Committed"
                        dot={{ fill: "#2D3A8C", r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="completed"
                        stroke="#2E7D32"
                        strokeWidth={2}
                        name="Completed"
                        dot={{ fill: "#2E7D32", r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
