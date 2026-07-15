// SettingsContext.jsx — App settings (edit-past toggle).
import React, { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [editPast, setEditPast] = useState(true);

  return (
    <SettingsContext.Provider value={{ editPast, setEditPast }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
