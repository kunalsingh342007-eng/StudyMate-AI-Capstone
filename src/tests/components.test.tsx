import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PriorityCard } from '../components/dashboard/PriorityCard';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { StudyTask, StudyProgress } from '../types';

describe('Dashboard Component Testing', () => {
  it('renders PriorityCard with top high-priority task details', () => {
    const mockTask: StudyTask = {
      id: 'task-1',
      day: 'Day 1',
      date: '2026-05-01',
      topic: 'Calculus',
      subtopic: 'Integration by Parts',
      durationMinutes: 45,
      priority: 'High',
      difficulty: 'Intermediate',
      learningObjective: 'Master integration techniques',
      revisionTask: 'Recite formula',
      practiceRecommendation: 'Solve 5 problems',
      status: 'pending',
    };

    render(
      <BrowserRouter>
        <PriorityCard task={mockTask} totalPendingToday={2} />
      </BrowserRouter>
    );

    expect(screen.getByText('Calculus')).toBeDefined();
    expect(screen.getByText('Integration by Parts')).toBeDefined();
    expect(screen.getByText(/45 min/i)).toBeDefined();
  });

  it('renders honest empty state when no tasks exist vs completed state when tasks are finished', () => {
    const { rerender } = render(
      <BrowserRouter>
        <PriorityCard task={null} totalPendingToday={0} hasAnyTasks={false} />
      </BrowserRouter>
    );

    expect(screen.getByText(/No tasks yet/i)).toBeDefined();
    expect(screen.getByText(/Create Task/i)).toBeDefined();

    rerender(
      <BrowserRouter>
        <PriorityCard task={null} totalPendingToday={0} hasAnyTasks={true} />
      </BrowserRouter>
    );

    expect(screen.getByText(/All Scheduled Tasks Completed/i)).toBeDefined();
  });

  it('renders StatsGrid with user streak and progress metrics', () => {
    const mockProgress: StudyProgress = {
      streakDays: 12,
      totalHoursStudied: 42.5,
      completedTasksCount: 87,
      totalTasksCount: 100,
      quizzesTaken: 14,
      averageQuizScore: 78,
      weakTopicsIdentified: ['Trees'],
      masteredTopics: ['Arrays', 'Recursion'],
      lastStudyDate: '2026-05-01',
    };

    render(<StatsGrid progress={mockProgress} activePlan={null} />);

    expect(screen.getByText('12 Days')).toBeDefined();
    expect(screen.getByText('42.5h')).toBeDefined();
    expect(screen.getByText(/87 \/ 100/i)).toBeDefined();
  });
});
