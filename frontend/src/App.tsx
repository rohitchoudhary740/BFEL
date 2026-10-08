import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/common/AppShell';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function AuthWrapper() {
  const { addAuditLog } = useApp();
  return (
    <AuthProvider
      onAuditLog={(action, entity, reference, description) =>
        addAuditLog(action, entity, reference, description)
      }
    >
      <AppShell />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="BFEL FLOW System Application">
      <ThemeProvider>
        <AppProvider>
          <AuthWrapper />
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
