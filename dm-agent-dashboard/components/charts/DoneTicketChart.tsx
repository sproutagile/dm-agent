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

export function DoneTicketChart() {
    return (
        <ChartContainer
            title="Done Ticket Count per Team"
            description="Breakdown of tickets by team: Done, Planned, and Added"
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
                    <Bar isAnimationActive={false} dataKey="ticketsDone" stackId="a" fill="#2E7D32" name="Tickets Done" radius={[0, 0, 0, 0]} />
                    <Bar isAnimationActive={false} dataKey="plannedTickets" stackId="a" fill="#2D3A8C" name="Planned Tickets" radius={[0, 0, 0, 0]} />
                    <Bar isAnimationActive={false} dataKey="addedTickets" stackId="a" fill="#F5A623" name="Added Tickets" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
