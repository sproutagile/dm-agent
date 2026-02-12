"use client";

import { ChartContainer } from "@/components/ChartContainer";
import { releaseBurnupData } from "@/data/mockMetrics";
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

export function ReleaseBurnupChart() {
    return (
        <div>
            <ChartContainer
                title="Release Burnup Chart"
                description="AI-Generated: Projected vs Actual story points over release timeline"
            >
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={releaseBurnupData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis
                            dataKey="week"
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
                            dataKey="projected"
                            stroke="#2D3A8C"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Projected"
                            dot={{ fill: "#2D3A8C", r: 4 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#2E7D32"
                            strokeWidth={2}
                            name="Actual"
                            dot={{ fill: "#2E7D32", r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    );
}
