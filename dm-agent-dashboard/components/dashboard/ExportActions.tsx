"use client";

import React, { useState } from "react";
import { Download, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as htmlToImage from 'html-to-image';
import jsPDF from "jspdf";


interface ExportActionsProps {
    targetId: string; // The ID of the HTML element to capture
    dashboardName?: string;
}

export function ExportActions({ targetId, dashboardName = "Dashboard" }: ExportActionsProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleExportPDF = async () => {
        const element = document.getElementById(targetId);
        if (!element) return;

        setIsExporting(true);

        try {
            // Because html-to-image uses an SVG foreignObject engine, we do not need to 
            // hackily mutate the live DOM and cause the user's screen to jump and animate.
            // We can just rely on the layout exactly as it is currently rendered.

            // Capture the canvas natively using html-to-image
            const dataUrl = await htmlToImage.toPng(element, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: "#f9fafb", // ensure solid background
                style: {
                    margin: '0',
                }
            });

            // Calculate PDF dimensions (A4 Landscape)
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Add margins
            const margin = 10;
            const contentWidth = pdfWidth - (margin * 2);

            // Calculate image height to maintain aspect ratio
            const imgProps = pdf.getImageProperties(dataUrl);
            const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

            // Add image to PDF
            pdf.addImage(dataUrl, 'PNG', margin, margin, contentWidth, Math.min(imgHeight, pdfHeight - (margin * 2)));

            // Save the PDF
            pdf.save(`${dashboardName.replace(/\s+/g, "_")}_Export.pdf`);

        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy link:", err);
        }
    };

    return (
        <div className="flex items-center gap-2">


            <Button
                variant="default"
                size="sm"
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white print:hidden"
                onClick={handleExportPDF}
                disabled={isExporting}
            >
                <Download className="h-4 w-4" />
                {isExporting ? "Generating..." : "Download PDF"}
            </Button>
        </div>
    );
}
