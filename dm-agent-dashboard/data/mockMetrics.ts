// Mock Metrics Data for Delivery Management Dashboard

export interface ScorecardMetrics {
    avgLeadTimePlanned: string;
    avgCycleTimePlanned: string;
    avgVelocity: string;
    sprintCompletion: string;
}

export interface VelocityTrendData {
    sprint: string;
    committed: number;
    completed: number;
}

export interface TeamEfficiencyData {
    team: string;
    ticketsDone: number;
    plannedTickets: number;
    addedTickets: number;
}

export interface WorkflowEfficiencyData {
    sprint: string;
    cycleTime: number;
    leadTime: number;
}

export interface ReleaseBurnupData {
    week: string;
    projected: number;
    actual: number;
}

// Scorecards Data
export const scorecardMetrics: ScorecardMetrics = {
    avgLeadTimePlanned: "23 days 7 hours",
    avgCycleTimePlanned: "8 days 22 hours",
    avgVelocity: "98.83",
    sprintCompletion: "39.15%",
};

// Velocity Trend Data (Last 3 Sprints)
export const velocityTrendData: VelocityTrendData[] = [
    {
        sprint: "Sprint 13",
        committed: 120,
        completed: 95,
    },
    {
        sprint: "Sprint 14",
        committed: 130,
        completed: 118,
    },
    {
        sprint: "Sprint 15",
        committed: 125,
        completed: 110,
    },
];

// Team Efficiency Data (Stacked Bar Chart)
export const teamEfficiencyData: TeamEfficiencyData[] = [
    {
        team: "Adamya",
        ticketsDone: 42,
        plannedTickets: 38,
        addedTickets: 8,
    },
    {
        team: "Athena",
        ticketsDone: 38,
        plannedTickets: 35,
        addedTickets: 5,
    },
    {
        team: "Bathala",
        ticketsDone: 45,
        plannedTickets: 40,
        addedTickets: 10,
    },
];

// Workflow Efficiency Data (Cycle Time vs Lead Time)
export const workflowEfficiencyData: WorkflowEfficiencyData[] = [
    {
        sprint: "Sprint 13",
        cycleTime: 8.5,
        leadTime: 22.3,
    },
    {
        sprint: "Sprint 14",
        cycleTime: 9.2,
        leadTime: 24.8,
    },
    {
        sprint: "Sprint 15",
        cycleTime: 8.9,
        leadTime: 22.1,
    },
];

// Release Burnup Data (AI Generated Insight)
export const releaseBurnupData: ReleaseBurnupData[] = [
    {
        week: "Week 1",
        projected: 50,
        actual: 45,
    },
    {
        week: "Week 2",
        projected: 100,
        actual: 95,
    },
    {
        week: "Week 3",
        projected: 150,
        actual: 140,
    },
    {
        week: "Week 4",
        projected: 200,
        actual: 190,
    },
    {
        week: "Week 5",
        projected: 250,
        actual: 235,
    },
    {
        week: "Week 6",
        projected: 300,
        actual: 280,
    },
];

// Widget Library - Expanded with 10+ types
export const WIDGET_LIBRARY = [
    // Scorecards (1x1)
    {
        id: "avg-lead-time",
        type: "scorecard",
        label: "Avg Lead Time",
        defaultSize: { w: 1, h: 1 },
        props: {
            title: "Avg Lead Time",
            value: "23d 7h",
            trend: { value: "5% improvement", direction: "down" as const }
        }
    },
    {
        id: "avg-cycle-time",
        type: "scorecard",
        label: "Avg Cycle Time",
        defaultSize: { w: 1, h: 1 },
        props: {
            title: "Avg Cycle Time",
            value: "8d 22h",
            trend: { value: "3% slower", direction: "up" as const }
        }
    },
    {
        id: "velocity",
        type: "scorecard",
        label: "Velocity",
        defaultSize: { w: 1, h: 1 },
        props: {
            title: "Avg Velocity",
            value: "98.83",
            trend: { value: "2% increase", direction: "up" as const }
        }
    },
    {
        id: "sprint-completion",
        type: "scorecard",
        label: "Sprint Completion",
        defaultSize: { w: 1, h: 1 },
        props: {
            title: "Sprint Completion",
            value: "39.15%",
            trend: { value: "8% lower", direction: "down" as const }
        }
    },

    // Charts (4x2)
    {
        id: "velocity-trend",
        type: "chart",
        label: "Velocity Trend",
        defaultSize: { w: 4, h: 2 },
        component: "VelocityTrendChart"
    },
    {
        id: "release-burnup",
        type: "chart",
        label: "Release Burnup Chart",
        defaultSize: { w: 4, h: 2 },
        component: "ReleaseBurnupChart"
    },
    {
        id: "done-tickets",
        type: "chart",
        label: "Done Ticket Count",
        defaultSize: { w: 4, h: 2 },
        component: "DoneTicketChart"
    },
    {
        id: "team-efficiency",
        type: "chart",
        label: "Team Efficiency",
        defaultSize: { w: 4, h: 2 },
        component: "TeamEfficiencyChart"
    },
    {
        id: "workflow-efficiency",
        type: "chart",
        label: "Workflow Efficiency",
        defaultSize: { w: 4, h: 2 },
        component: "WorkflowEfficiencyChart"
    },

    // Text Widget (2x1)
    {
        id: "sprint-goal",
        type: "text",
        label: "Sprint Goal",
        defaultSize: { w: 2, h: 1 },
        props: {
            title: "Sprint Goal",
            content: "Complete migration to Next.js 16 and implement new dashboard features with drag-and-drop functionality."
        }
    },
];
