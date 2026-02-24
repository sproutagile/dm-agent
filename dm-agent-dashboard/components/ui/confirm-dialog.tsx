"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "default";
}

export function ConfirmDialog({
    isOpen,
    onOpenChange,
    onConfirm,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Continue",
    cancelText = "Cancel",
    variant = "destructive"
}: ConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] border-t-4 border-t-[#22C558] rounded-xl shadow-2xl">
                <DialogHeader className="flex flex-col items-center gap-2 pt-4">
                    <div className={`p-3 rounded-full ${variant === 'destructive' ? 'bg-red-100 text-red-600' : 'bg-[#e9f8ed] text-[#14532B]'}`}>
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-center text-gray-900">{title}</DialogTitle>
                    <DialogDescription className="text-center text-gray-500">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6 sm:justify-center w-full">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto min-w-[120px] rounded-lg border-gray-300 hover:bg-gray-100 text-gray-700 font-medium"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        className={`w-full sm:w-auto min-w-[120px] rounded-lg font-medium shadow-sm ${variant === 'destructive'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-[#14532B] hover:bg-[#0f4021] text-white'
                            }`}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
