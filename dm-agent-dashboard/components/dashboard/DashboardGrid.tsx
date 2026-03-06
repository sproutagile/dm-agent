'use client';

/**
 * DashboardGrid — client-only wrapper for react-grid-layout.
 * Loaded via next/dynamic with ssr:false to avoid ESM/WidthProvider issues.
 */

import { useState, useLayoutEffect, useRef } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

interface DashboardGridProps {
    layout: any[];
    onLayoutChange: (layout: any[]) => void;
    rowHeight?: number;
    cols?: number;
    margin?: [number, number];
    children: React.ReactNode;
}

export function DashboardGrid({
    layout,
    onLayoutChange,
    rowHeight = 160,
    cols = 6,
    margin = [8, 8],
    children,
}: DashboardGridProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(1200);

    useLayoutEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            setContainerWidth(entries[0].contentRect.width);
        });
        observer.observe(containerRef.current);
        setContainerWidth(containerRef.current.offsetWidth);
        return () => observer.disconnect();
    }, []);

    const GL = GridLayout as any;

    return (
        <div ref={containerRef} className="w-full">
            <GL
                layout={layout}
                cols={cols}
                rowHeight={rowHeight}
                width={containerWidth}
                margin={margin}
                containerPadding={[0, 0]}
                onLayoutChange={onLayoutChange as any}
                draggableHandle=".drag-handle"
                isDraggable
                isResizable={false}
                compactType={null}
                preventCollision={false}
            >
                {children}
            </GL>
        </div>
    );
}
