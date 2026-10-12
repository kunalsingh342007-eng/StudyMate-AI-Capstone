/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlannerPage } from './pages/PlannerPage';
import { ExplainPage } from './pages/ExplainPage';
import { QuizPage } from './pages/QuizPage';
import { ProgressPage } from './pages/ProgressPage';
import { NotesPage } from './pages/NotesPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { StorageService } from './services/storage/storageService';

export default function App() {
  useEffect(() => {
    // Seed initial demo data if user has no stored data
    StorageService.seedSampleDataIfEmpty();
  }, []);

  return (
    <BrowserRouter>
      {/* WCAG Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      <Routes>
        {/* Landing / Marketing Page */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-[#F8F7FC] text-[#1E1B4B] flex flex-col font-sans selection:bg-purple-600 selection:text-white">
              <Navbar />
              <main id="main-content" className="flex-1 w-full">
                <LandingPage />
              </main>
              <Footer />
            </div>
          }
        />

        {/* Dedicated Login / Auth Page */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />

        {/* Workspace Pages with deep purple & indigo Sidebar and AppHeader */}
        <Route
          path="/dashboard"
          element={
            <AppShell>
              <DashboardPage />
            </AppShell>
          }
        />
        <Route
          path="/planner"
          element={
            <AppShell>
              <PlannerPage />
            </AppShell>
          }
        />
        <Route
          path="/explain"
          element={
            <AppShell>
              <ExplainPage />
            </AppShell>
          }
        />
        <Route
          path="/quiz"
          element={
            <AppShell>
              <QuizPage />
            </AppShell>
          }
        />
        <Route
          path="/progress"
          element={
            <AppShell>
              <ProgressPage />
            </AppShell>
          }
        />
        <Route
          path="/notes"
          element={
            <AppShell>
              <NotesPage />
            </AppShell>
          }
        />
        <Route
          path="/profile"
          element={
            <AppShell>
              <ProfilePage />
            </AppShell>
          }
        />
        <Route
          path="/settings"
          element={
            <AppShell>
              <SettingsPage />
            </AppShell>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
