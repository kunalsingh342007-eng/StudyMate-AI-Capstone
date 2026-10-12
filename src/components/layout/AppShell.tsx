import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { AuthModal } from '../auth/AuthModal';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Global Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-[#F8F7FC] text-[#1E1B4B] overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0 h-full">
        <Sidebar onOpenAuthModal={() => setAuthModalOpen(true)} />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 flex-1 max-w-xs w-full">
            <Sidebar
              onCloseMobile={() => setMobileMenuOpen(false)}
              onOpenAuthModal={() => {
                setMobileMenuOpen(false);
                setAuthModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <AppHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenAuthModal={() => setAuthModalOpen(true)}
        />

        <main id="main-content" className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>

      {/* Modals */}
      <GlobalSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};
