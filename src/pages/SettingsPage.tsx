import React, { useState } from 'react';
import {
  Settings,
  Sparkles,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Terminal,
  Volume2,
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { useAIStatus } from '../hooks/useAIStatus';
import { StorageService } from '../services/storage/storageService';
import { Badge } from '../components/ui/Common';

export const SettingsPage: React.FC = () => {
  const { preferences, updatePreferences, refresh } = useStorage();
  const { status, refetch } = useAIStatus();

  const [userName, setUserName] = useState(preferences.userName);
  const [targetExamName, setTargetExamName] = useState(preferences.targetExamName);
  const [targetExamDate, setTargetExamDate] = useState(preferences.targetExamDate);
  const [dailyGoalHours, setDailyGoalHours] = useState(preferences.dailyGoalHours);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      userName,
      targetExamName,
      targetExamDate,
      dailyGoalHours: Number(dailyGoalHours) || 2,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportData = () => {
    const json = StorageService.exportDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studymate-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    if (!importJson.trim()) return;
    const success = StorageService.importDataJson(importJson);
    if (success) {
      setImportNotice('Data imported successfully!');
      setImportJson('');
      refresh();
    } else {
      setImportNotice('Failed to parse backup JSON. Please check file format.');
    }
    setTimeout(() => setImportNotice(null), 3000);
  };

  const handleResetSampleData = () => {
    if (window.confirm('Reset local storage with fresh sample study data?')) {
      StorageService.clearAllData();
      StorageService.seedSampleDataIfEmpty();
      refresh();
      setImportNotice('Sample data restored!');
      setTimeout(() => setImportNotice(null), 2500);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to erase all local study plans and quiz history? This cannot be undone.')) {
      StorageService.clearAllData();
      refresh();
      setImportNotice('All storage cleared.');
      setTimeout(() => setImportNotice(null), 2500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-purple-100/80 pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 font-mono">
          PREFERENCES & BACKUP
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight mt-1">
          Settings & Data
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your AI connection parameters, study schedule goals, accessibility settings, and local backups.
        </p>
      </div>

      {importNotice && (
        <div role="status" className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* 1. Google Gemini AI Engine Diagnostics */}
      <section aria-labelledby="ai-engine-heading" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 id="ai-engine-heading" className="text-base sm:text-lg font-bold text-slate-900">
              Google Gemini AI Engine
            </h2>
          </div>
          <Badge variant={status.isConfigured ? 'success' : 'warning'}>
            {status.isConfigured ? 'Live Connection Active' : 'Demo Fallback Active'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 font-medium block">LLM Provider</span>
            <strong className="text-slate-900 text-sm">{status.provider}</strong>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 font-medium block">Configured Model</span>
            <strong className="text-slate-900 font-mono text-xs">{status.model}</strong>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 font-medium block">Key Exposure Security</span>
            <strong className="text-emerald-700 flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Server-Side
            </strong>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-slate-700 space-y-1.5">
          <div className="font-semibold text-indigo-950 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-600" /> Server Environment Variable Setup
          </div>
          <p className="text-slate-600">
            StudyMate runs completely with Google Gemini models with full structured validation:
          </p>
          <div className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto space-y-0.5">
            <div>GEMINI_API_KEY="your-gemini-api-key"</div>
          </div>
        </div>
      </section>

      {/* 2. Study Preferences Form */}
      <section aria-labelledby="preferences-heading" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 id="preferences-heading" className="text-base sm:text-lg font-bold text-slate-900">
            Study & Exam Targets
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your personal study capacity for dashboard metrics and countdowns.
          </p>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="pref-name" className="block text-xs font-semibold text-slate-900">
                Student Name / Handle
              </label>
              <input
                id="pref-name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pref-exam-name" className="block text-xs font-semibold text-slate-900">
                Target Exam Name
              </label>
              <input
                id="pref-exam-name"
                type="text"
                value={targetExamName}
                onChange={(e) => setTargetExamName(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pref-exam-date" className="block text-xs font-semibold text-slate-900">
                Target Exam Date
              </label>
              <input
                id="pref-exam-date"
                type="date"
                value={targetExamDate}
                onChange={(e) => setTargetExamDate(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pref-daily-goal" className="block text-xs font-semibold text-slate-900">
                Daily Study Goal (Hours)
              </label>
              <input
                id="pref-daily-goal"
                type="number"
                min={0.5}
                max={12}
                step={0.5}
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(parseFloat(e.target.value) || 2)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-indigo-600"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Preferences saved!
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </section>

      {/* 3. Accessibility Controls */}
      <section aria-labelledby="accessibility-heading" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 id="accessibility-heading" className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-600" />
            Accessibility & Display Settings (WCAG 2.1 AA)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimize color contrast, layout animations, and text scaling for comfortable reading.
          </p>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <div>
              <span className="font-semibold text-slate-900 block">High Contrast Borders</span>
              <span className="text-xs text-slate-500">Increases visual border definition for cards and controls</span>
            </div>
            <input
              type="checkbox"
              checked={preferences.highContrast}
              onChange={(e) => updatePreferences({ highContrast: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <div>
              <span className="font-semibold text-slate-900 block">Reduced Motion Mode</span>
              <span className="text-xs text-slate-500">Disables celebratory confetti and view transitions</span>
            </div>
            <input
              type="checkbox"
              checked={preferences.reducedMotion}
              onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </label>
        </div>
      </section>

      {/* 4. LocalStorage Backup & Reset */}
      <section aria-labelledby="storage-heading" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 id="storage-heading" className="text-base sm:text-lg font-bold text-slate-900">
            Local Data Storage & Backups
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All your study schedules and quiz scores are stored locally in your browser for privacy.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportData}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Export Backup JSON
          </button>

          <button
            type="button"
            onClick={handleResetSampleData}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset Sample Dataset
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Erase All Local Data
          </button>
        </div>

        {/* JSON Import Box */}
        <div className="pt-2 space-y-2">
          <label htmlFor="json-import" className="block text-xs font-semibold text-slate-700">
            Restore Backup from JSON
          </label>
          <div className="flex gap-2">
            <input
              id="json-import"
              type="text"
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste exported backup JSON here..."
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono"
            />
            <button
              type="button"
              onClick={handleImportData}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg"
            >
              Restore
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
