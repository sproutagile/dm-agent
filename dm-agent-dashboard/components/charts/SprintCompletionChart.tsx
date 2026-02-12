"use client";

import { ChartContainer } from "@/components/ChartContainer";
import { scorecardMetrics } from "@/data/mockMetrics";

export function SprintCompletionChart() {
    const completionValue = parseFloat(scorecardMetrics.sprintCompletion);
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const progress = (completionValue / 100) * circumference;

    return (
        <ChartContainer
            title="Sprint Completion"
            description="Overall sprint completion percentage"
        >
            <div className="flex items-center justify-center h-[300px]">
                <div className="relative">
                    <svg width="200" height="200" className="transform -rotate-90">
                        {/* Background circle */}
                        <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="none"
                            stroke="#F5F5F5"
                            strokeWidth="15"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="none"
                            stroke="#2E7D32"
                            strokeWidth="15"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - progress}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-foreground">
                            {scorecardMetrics.sprintCompletion}
                        </span>
                        <span className="text-sm text-muted-foreground mt-1">Complete</span>
                    </div>
                </div>
            </div>
        </ChartContainer>
    );
}
