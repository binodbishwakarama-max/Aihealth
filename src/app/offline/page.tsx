'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <WifiOff className="h-10 w-10 text-teal-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">You&apos;re Offline</h1>
                <p className="text-gray-600 mb-6">
                    It looks like you&apos;ve lost your internet connection. Some features of HealthLens require an active connection to work.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/25"
                >
                    <RefreshCw className="h-5 w-5" />
                    Try Again
                </button>
                <p className="text-xs text-gray-400 mt-6">
                    Your previous symptom checks and results are still available when you reconnect.
                </p>
            </div>
        </div>
    );
}
