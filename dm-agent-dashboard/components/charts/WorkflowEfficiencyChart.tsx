"use client";

import { ChartContainer } from "@/components/ChartContainer";
import { workflowEfficiencyData } from "@/data/mockMetrics";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

export function WorkflowEfficiencyChart() {
    return (
        <ChartContainer
            title="Workflow Efficiency"
            description="Cycle Time vs Lead Time per sprint (in days)"
        >
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workflowEfficiencyData}>
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
                    <Bar isAnimationActive={false} dataKey="cycleTime" fill="#2E7D32" name="Cycle Time (days)" />
                    <Bar isAnimationActive={false} dataKey="leadTime" fill="#2D3A8C" name="Lead Time (days)" />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
