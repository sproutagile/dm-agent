"use client";

import React, { useState } from "react";
import { Download, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";


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
            // Collect styles
            let css = "";
            const styleSheets = Array.from(document.styleSheets);

            for (const sheet of styleSheets) {
                try {
                    // Check if headers are accessible (CORS)
                    if (sheet.href && !sheet.href.startsWith(window.location.origin)) {
                        continue;
                    }
                    const rules = Array.from(sheet.cssRules || []);
                    css += rules.map(rule => rule.cssText).join("\n");
                } catch (e) {
                    console.warn("Could not access stylesheet:", sheet.href);
                }
            }

            // Get HTML
            const html = element.outerHTML;

            const response = await fetch("/api/generate-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ html, css }),
            });

            if (!response.ok) throw new Error("PDF generation failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${dashboardName.replace(/\s+/g, "_")}_Export.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

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
                variant="outline"
                size="sm"
                className="gap-2 print:hidden"
                onClick={handleShare}
            >
                {isCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                ) : (
                    <Share2 className="h-4 w-4" />
                )}
                {isCopied ? "Copied Link" : "Share"}
            </Button>

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
