'use client';

import { useDashboard } from '@/components/DashboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, AlertTriangle } from 'lucide-react';

export function KPICards() {
    const { kpiData } = useDashboard();

    const kpis = [
        {
            title: 'Active Tasks',
            value: kpiData.activeTasks,
            icon: Activity,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            change: '+12%',
            changeType: 'positive' as const,
        },
        {
            title: 'Throughput',
            value: `${kpiData.throughput}%`,
            icon: TrendingUp,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            change: '+5.2%',
            changeType: 'positive' as const,
        },
        {
            title: 'Blockers',
            value: kpiData.blockers,
            icon: AlertTriangle,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            change: '-2',
            changeType: 'negative' as const,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {kpis.map((kpi) => (
                <Card
                    key={kpi.title}
                    className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white"
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            {kpi.title}
                        </CardTitle>
                        <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                            <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{kpi.value}</div>
                        <p className={`text-xs mt-1 ${kpi.changeType === 'positive' ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                            {kpi.change} from last week
                        </p>
                    </CardContent>
                    <div
                        className={`absolute bottom-0 left-0 right-0 h-1 ${kpi.title === 'Blockers' ? 'bg-amber-500' : 'bg-[#0052cc]'
                            }`}
                    />
                </Card>
            ))}
        </div>
    );
}
