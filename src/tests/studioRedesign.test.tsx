import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LearningMap } from '../components/dashboard/LearningMap';
import { NextBestAction } from '../components/dashboard/NextBestAction';
import { ToastProvider, useToast } from '../context/ToastContext';
import { ProgressPage } from '../pages/ProgressPage';
import { StorageService } from '../services/storage/storageService';
import { StudyPlan, TopicMastery, StudyRecommendation } from '../types';

const ToastHarness: React.FC<{ onUndo: () => void }> = ({ onUndo }) => {
  const { showToast } = useToast();
  return (
    <button
      type="button"
      onClick={() => showToast('Completed task', 'success', { label: 'Undo', onClick: onUndo })}
    >
      Trigger Toast
    </button>
  );
};

describe('Personal Learning Studio Redesign Components', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.setActiveUser(null);
  });

  it('LearningMap builds concept nodes from activePlan and masteries and switches selection on click', () => {
    const plan: StudyPlan = {
      id: 'plan-1',
      subject: 'Operating Systems',
      examDate: '2026-06-15',
      dailyHours: 2,
      level: 'Intermediate',
      topics: ['Process Synchronization', 'Virtual Memory'],
      weakTopics: ['Virtual Memory'],
      preferredDays: ['Monday', 'Tuesday'],
      totalDays: 14,
      totalStudyHours: 28,
      assumptions: ['Sample test schedule'],
      createdAt: '2026-05-01T00:00:00.000Z',
      tasks: [
        {
          id: 't1',
          day: 'Day 1',
          date: '2026-05-02',
          topic: 'Process Synchronization',
          subtopic: 'Semaphores & Mutexes',
          durationMinutes: 45,
          priority: 'High',
          difficulty: 'Intermediate',
          learningObjective: 'Avoid race conditions',
          revisionTask: 'Review semaphore invariants',
          practiceRecommendation: 'Solve 3 producer-consumer problems',
          status: 'completed',
        },
        {
          id: 't2',
          day: 'Day 2',
          date: '2026-05-03',
          topic: 'Virtual Memory',
          subtopic: 'Page Replacement',
          durationMinutes: 45,
          priority: 'High',
          difficulty: 'Intermediate',
          learningObjective: 'Compare LRU and FIFO',
          revisionTask: 'Trace page faults',
          practiceRecommendation: 'Work through 4 reference strings',
          status: 'pending',
        },
      ],
    };

    const masteries: Record<string, TopicMastery> = {
      'Virtual Memory': {
        topic: 'Virtual Memory',
        subject: 'Operating Systems',
        score: 42,
        level: 'Weak',
        totalQuestions: 5,
        correctQuestions: 2,
        accuracy: 40,
        attemptsCount: 2,
        totalStudyMinutes: 30,
        lastTestedAt: '2026-05-01T00:00:00.000Z',
        trend: [40, 42],
        concepts: {},
      },
    };

    render(
      <BrowserRouter>
        <LearningMap activePlan={plan} syllabus={null} masteries={masteries} />
      </BrowserRouter>
    );

    expect(screen.getByText('Interactive Learning Map')).toBeDefined();
    expect(screen.getAllByText('Process Synchronization').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Virtual Memory/i }));
    expect(screen.getByText('Page Replacement')).toBeDefined();
    expect(screen.getAllByText('42%').length).toBeGreaterThan(0);
  });

  it('LearningMap shows honest empty state with opt-in sample preview toggle when user has no plan', () => {
    render(
      <BrowserRouter>
        <LearningMap activePlan={null} syllabus={null} masteries={{}} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Your Concept Map Builds Automatically/i)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Preview Sample CS Map/i }));
    expect(screen.getByText('Sample Preview')).toBeDefined();
    expect(screen.getAllByText('Recursion & Complexity').length).toBeGreaterThan(0);
  });

  it('NextBestAction displays transparent reasoning and cycles multiple recommendations', () => {
    const recs: StudyRecommendation[] = [
      {
        id: 'r1',
        type: 'quiz',
        title: 'Drill Virtual Memory',
        targetTopic: 'Virtual Memory',
        description: 'Review paging and TLB lookups.',
        reason: 'Your recent quiz accuracy is 42% with 2 unresolved mistakes.',
        priority: 'High',
        estimatedMinutes: 25,
        actionRoute: '/quiz?topic=Virtual%20Memory',
        actionLabel: 'Practice Quiz',
      },
      {
        id: 'r2',
        type: 'review',
        title: 'Review Deadlocks',
        targetTopic: 'Deadlocks',
        description: 'Complete scheduled Leitner recall.',
        reason: 'Due for 3-day spaced retrieval interval.',
        priority: 'Medium',
        estimatedMinutes: 15,
        actionRoute: '/progress',
        actionLabel: 'Open Review',
      },
    ];

    render(
      <BrowserRouter>
        <NextBestAction recommendations={recs} />
      </BrowserRouter>
    );

    expect(screen.getByText('Drill Virtual Memory')).toBeDefined();
    expect(screen.getByText(/Your recent quiz accuracy is 42%/i)).toBeDefined();

    fireEvent.click(screen.getByTitle(/Cycle next recommendation/i));
    expect(screen.getByText('Review Deadlocks')).toBeDefined();
  });

  it('NextBestAction displays honest Goal Setup prompt when recommendations are empty', () => {
    render(
      <BrowserRouter>
        <NextBestAction recommendations={[]} />
      </BrowserRouter>
    );

    expect(screen.getByText('Set Your First Study Goal')).toBeDefined();
  });

  it('ToastProvider renders toast and invokes Undo action', () => {
    const onUndo = vi.fn();
    render(
      <ToastProvider>
        <ToastHarness onUndo={onUndo} />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Trigger Toast/i }));
    expect(screen.getByText('Completed task')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Undo/i }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('ProgressPage shows 0 of 0 tasks completed instead of dividing by 1 when empty', () => {
    StorageService.setActiveUser('fresh-empty-progress-user');
    render(
      <BrowserRouter>
        <ToastProvider>
          <ProgressPage />
        </ToastProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('0 of 0 tasks completed')).toBeDefined();
  });
});
