import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storage/storageService';
import {
  StudyPlan,
  UserPreferences,
  StudyProgress,
  QuizResult,
  TopicMastery,
  QuestionMistake,
  SpacedReviewItem,
  StudySessionRecord,
  SyllabusStructure,
  StudyMaterial,
  Flashcard,
  FlashcardRating,
  PYQAnalysisResult,
  MockExamSession,
  TutorMessage,
  StudyNote,
  UserProfile,
} from '../types';

export function useStorage() {
  const [activePlan, setActivePlanState] = useState<StudyPlan | null>(() => StorageService.getActivePlan());
  const [savedPlans, setSavedPlansState] = useState<StudyPlan[]>(() => StorageService.getSavedPlans());
  const [preferences, setPreferencesState] = useState<UserPreferences>(() => StorageService.getPreferences());
  const [progress, setProgressState] = useState<StudyProgress>(() => StorageService.getProgress());
  const [quizHistory, setQuizHistoryState] = useState<QuizResult[]>(() => StorageService.getQuizHistory());
  const [masteries, setMasteriesState] = useState<Record<string, TopicMastery>>(() => StorageService.getMasteries());
  const [mistakes, setMistakesState] = useState<QuestionMistake[]>(() => StorageService.getMistakes());
  const [spacedReviews, setSpacedReviewsState] = useState<SpacedReviewItem[]>(() => StorageService.getSpacedReviews());
  const [studySessions, setStudySessionsState] = useState<StudySessionRecord[]>(() => StorageService.getStudySessions());
  const [syllabus, setSyllabusState] = useState<SyllabusStructure | null>(() => StorageService.getSyllabus());
  const [materials, setMaterialsState] = useState<StudyMaterial[]>(() => StorageService.getMaterials());
  const [flashcards, setFlashcardsState] = useState<Flashcard[]>(() => StorageService.getFlashcards());
  const [pyqAnalyses, setPyqAnalysesState] = useState<PYQAnalysisResult[]>(() => StorageService.getPYQAnalyses());
  const [mockExams, setMockExamsState] = useState<MockExamSession[]>(() => StorageService.getMockExams());
  const [tutorMessages, setTutorMessagesState] = useState<TutorMessage[]>(() => StorageService.getTutorMessages());
  const [notes, setNotesState] = useState<StudyNote[]>(() => StorageService.getNotes());
  const [userProfile, setUserProfileState] = useState<UserProfile>(() => StorageService.getUserProfile());

  const syncFromStorage = useCallback(() => {
    setActivePlanState(StorageService.getActivePlan());
    setSavedPlansState(StorageService.getSavedPlans());
    setPreferencesState(StorageService.getPreferences());
    setProgressState(StorageService.getProgress());
    setQuizHistoryState(StorageService.getQuizHistory());
    setMasteriesState(StorageService.getMasteries());
    setMistakesState(StorageService.getMistakes());
    setSpacedReviewsState(StorageService.getSpacedReviews());
    setStudySessionsState(StorageService.getStudySessions());
    setSyllabusState(StorageService.getSyllabus());
    setMaterialsState(StorageService.getMaterials());
    setFlashcardsState(StorageService.getFlashcards());
    setPyqAnalysesState(StorageService.getPYQAnalyses());
    setMockExamsState(StorageService.getMockExams());
    setTutorMessagesState(StorageService.getTutorMessages());
    setNotesState(StorageService.getNotes());
    setUserProfileState(StorageService.getUserProfile());
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

  const resolveMistake = useCallback((id: string) => {
    StorageService.resolveMistake(id);
  }, []);

  const completeSpacedReview = useCallback((id: string, quality?: 'poor' | 'fair' | 'good') => {
    StorageService.completeSpacedReview(id, quality);
  }, []);

  const logStudySession = useCallback((session: Omit<StudySessionRecord, 'id' | 'completedAt'>) => {
    return StorageService.logStudySession(session);
  }, []);

  const saveSyllabus = useCallback((syl: SyllabusStructure) => {
    StorageService.saveSyllabus(syl);
  }, []);

  const saveMaterial = useCallback((mat: StudyMaterial) => {
    StorageService.saveMaterial(mat);
  }, []);

  const deleteMaterial = useCallback((id: string) => {
    StorageService.deleteMaterial(id);
  }, []);

  const saveFlashcard = useCallback((card: Flashcard) => {
    StorageService.saveFlashcard(card);
  }, []);

  const reviewFlashcard = useCallback((cardId: string, rating: FlashcardRating) => {
    return StorageService.reviewFlashcard(cardId, rating);
  }, []);

  const deleteFlashcard = useCallback((cardId: string) => {
    StorageService.deleteFlashcard(cardId);
  }, []);

  const savePYQAnalysis = useCallback((res: PYQAnalysisResult) => {
    StorageService.savePYQAnalysis(res);
  }, []);

  const saveMockExam = useCallback((session: MockExamSession) => {
    StorageService.saveMockExam(session);
  }, []);

  const saveTutorMessage = useCallback((msg: TutorMessage) => {
    StorageService.saveTutorMessage(msg);
  }, []);

  const clearTutorChat = useCallback(() => {
    StorageService.clearTutorChat();
  }, []);

  const saveNote = useCallback((note: StudyNote) => {
    StorageService.saveNote(note);
  }, []);

  const deleteNote = useCallback((id: string) => {
    StorageService.deleteNote(id);
  }, []);

  const togglePinNote = useCallback((id: string) => {
    StorageService.togglePinNote(id);
  }, []);

  const saveUserProfile = useCallback((profile: Partial<UserProfile>) => {
    return StorageService.saveUserProfile(profile);
  }, []);

  return {
    activePlan,
    savedPlans,
    preferences,
    progress,
    quizHistory,
    masteries,
    mistakes,
    spacedReviews,
    studySessions,
    syllabus,
    materials,
    flashcards,
    pyqAnalyses,
    latestPYQAnalysis: pyqAnalyses[0] || null,
    mockExams,
    tutorMessages,
    notes,
    userProfile,
    setActivePlan,
    updateTaskStatus,
    updateTaskNotes,
    saveQuizResult,
    updatePreferences,
    deletePlan,
    resolveMistake,
    completeSpacedReview,
    logStudySession,
    saveSyllabus,
    saveMaterial,
    deleteMaterial,
    saveFlashcard,
    reviewFlashcard,
    deleteFlashcard,
    savePYQAnalysis,
    saveMockExam,
    saveTutorMessage,
    clearTutorChat,
    saveNote,
    deleteNote,
    togglePinNote,
    saveUserProfile,
    exportDataJson: StorageService.exportDataJson,
    importDataJson: StorageService.importDataJson,
    refresh: syncFromStorage,
  };
}
