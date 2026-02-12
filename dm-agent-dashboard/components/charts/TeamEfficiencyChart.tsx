"use client";

import { ChartContainer } from "@/components/ChartContainer";
import { teamEfficiencyData } from "@/data/mockMetrics";
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

export function TeamEfficiencyChart() {
    return (
        <ChartContainer
            title="Team Efficiency"
            description="Ticket breakdown by team: Done, Planned, and Added"
        >
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={teamEfficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                        dataKey="team"
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
                    <Bar dataKey="ticketsDone" stackId="a" fill="#2E7D32" name="Tickets Done" />
                    <Bar dataKey="plannedTickets" stackId="a" fill="#2D3A8C" name="Planned Tickets" />
                    <Bar dataKey="addedTickets" stackId="a" fill="#F5A623" name="Added Tickets" />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
