import React from 'react';
import { AlertTriangle, Sparkles, ShieldCheck } from 'lucide-react';
import { useAIStatus } from '../../hooks/useAIStatus';

interface BannerProps {
  isDemoData?: boolean;
}

export const Banner: React.FC<BannerProps> = ({ isDemoData }) => {
  const { status } = useAIStatus();

  if (isDemoData) {
    return (
      <div
        id="demo-data-banner"
        role="status"
        aria-live="polite"
        className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2 w-full">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-amber-950 dark:text-amber-100">Sample Plan Preview</strong>: Displaying a structured sample plan. Live AI generation uses Google Gemini.
          </span>
        </div>
      </div>
    );
  }

  if (!status.isConfigured) {
    return (
      <div
        id="ai-offline-banner"
        role="status"
        aria-live="polite"
        className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs font-medium"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span>
              {status.message || 'StudyMate AI server configuration is pending. Please ensure GEMINI_API_KEY is configured.'}
            </span>
          </div>
          <span className="hidden md:inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 text-xs whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" /> Keys Protected Server-Side
          </span>
        </div>
      </div>
    );
  }

  return null;
};
