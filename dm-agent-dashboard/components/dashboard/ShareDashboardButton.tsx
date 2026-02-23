import { useState } from "react";
import { Share2, Link as LinkIcon, Lock, Check } from "lucide-react";

export function ShareDashboardButton({ dashboard, onUpdate }: { dashboard: any, onUpdate: (data: any) => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showPopover, setShowPopover] = useState(false);

    const shareUrl = dashboard.share_token
        ? `${window.location.origin}/share/${dashboard.share_token}`
        : '';

    const handleShare = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/dashboards/${dashboard.id}/share`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                onUpdate({ is_public: true, share_token: data.shareToken });
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevoke = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/dashboards/${dashboard.id}/share`, {
                method: 'DELETE'
            });
            if (res.ok) {
                onUpdate({ is_public: false, share_token: null });
                setShowPopover(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowPopover(!showPopover)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${dashboard.is_public
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
            >
                <Share2 className="h-4 w-4" />
                {dashboard.is_public ? 'Shared' : 'Share'}
            </button>

            {showPopover && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50">
                    <h3 className="font-semibold text-gray-900 mb-1">Share Dashboard</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Anyone with the link can view this dashboard in read-only mode.
                    </p>

                    {dashboard.is_public ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 overflow-hidden bg-gray-50 border rounded-lg px-3 py-2">
                                    <p className="text-xs text-gray-600 truncate">{shareUrl}</p>
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <LinkIcon className="h-4 w-4" />}
                                </button>
                            </div>
                            <button
                                onClick={handleRevoke}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 font-medium bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                                <Lock className="h-4 w-4" />
                                {isLoading ? 'Revoking...' : 'Revoke Access'}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleShare}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <LinkIcon className="h-4 w-4" />
                            {isLoading ? 'Creating Link...' : 'Create Public Link'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
