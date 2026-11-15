import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#0A1628] flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-[#0A1628] dark:bg-[#0F1D32] border border-[#E5E1D6] dark:border-[#1E2F47] flex items-center justify-center text-teal-400 shadow-lg mb-4">
          <GraduationCap className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 tracking-wide">
          Preparing StudyMate Learning Studio...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
