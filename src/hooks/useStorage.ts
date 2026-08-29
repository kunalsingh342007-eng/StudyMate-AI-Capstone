import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storage/storageService';
import { StudyPlan, UserPreferences, StudyProgress, QuizResult } from '../types';

export function useStorage() {
  const [activePlan, setActivePlanState] = useState<StudyPlan | null>(() => StorageService.getActivePlan());
  const [savedPlans, setSavedPlansState] = useState<StudyPlan[]>(() => StorageService.getSavedPlans());
  const [preferences, setPreferencesState] = useState<UserPreferences>(() => StorageService.getPreferences());
  const [progress, setProgressState] = useState<StudyProgress>(() => StorageService.getProgress());
  const [quizHistory, setQuizHistoryState] = useState<QuizResult[]>(() => StorageService.getQuizHistory());

  const syncFromStorage = useCallback(() => {
    setActivePlanState(StorageService.getActivePlan());
    setSavedPlansState(StorageService.getSavedPlans());
    setPreferencesState(StorageService.getPreferences());
    setProgressState(StorageService.getProgress());
    setQuizHistoryState(StorageService.getQuizHistory());
  }, []);

  useEffect(() => {
    StorageService.seedSampleDataIfEmpty();
    syncFromStorage();

    const handleStorageChange = () => {
      syncFromStorage();
    };

    window.addEventListener('studymate_storage_change', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('studymate_storage_change', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncFromStorage]);

  const setActivePlan = useCallback((plan: StudyPlan) => {
    StorageService.setActivePlan(plan);
  }, []);

  const updateTaskStatus = useCallback((taskId: string, status: 'pending' | 'completed' | 'missed', reason?: string) => {
    return StorageService.updateTaskStatus(taskId, status, reason);
  }, []);

  const updateTaskNotes = useCallback((taskId: string, notes: string) => {
    return StorageService.updateTaskNotes(taskId, notes);
  }, []);

  const saveQuizResult = useCallback((result: QuizResult) => {
    StorageService.saveQuizResult(result);
  }, []);

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    return StorageService.setPreferences(prefs);
  }, []);

  const deletePlan = useCallback((id: string) => {
    StorageService.deletePlan(id);
  }, []);

  return {
    activePlan,
    savedPlans,
    preferences,
    progress,
    quizHistory,
    setActivePlan,
    updateTaskStatus,
    updateTaskNotes,
    saveQuizResult,
    updatePreferences,
    deletePlan,
    refresh: syncFromStorage,
  };
}
