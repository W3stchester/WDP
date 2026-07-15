// App.jsx — Root layout with theme + settings providers.
import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import BottomNav from './components/BottomNav';
import PlanningPage from './components/Planning/PlanningPage';
import SettingsPage from './components/Settings/SettingsPage';
import Toast from './components/Common/Toast';

export default function App() {
  // Default to planning (dashboard removed).
  const [page, setPage] = useState('planning');

  return (
    <ThemeProvider>
      <SettingsProvider>
        <div className="min-h-screen transition-colors duration-500 md:h-screen md:overflow-hidden">
          <div className="md:flex md:h-full">
            <BottomNav page={page} setPage={setPage} />

            <main
              className="
                max-w-md mx-auto
                pb-16
                md:max-w-none md:mx-0 md:flex-1
                md:overflow-y-auto md:pb-0
              "
            >
              <div className="md:p-6 md:max-w-5xl md:mx-auto">
                <div style={{ display: page === 'planning' ? 'block' : 'none' }}>
                  <PlanningPage />
                </div>
                <div style={{ display: page === 'settings' ? 'block' : 'none' }}>
                  <SettingsPage />
                </div>
              </div>
            </main>
          </div>

          {/* Global toast notifications */}
          <Toast />
        </div>
      </SettingsProvider>
    </ThemeProvider>
  );
}
