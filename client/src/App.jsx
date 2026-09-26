import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { FamilyProvider } from './context/FamilyContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { AppRoutes } from './routes/AppRoutes.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { OfflineBanner } from './components/common/OfflineBanner.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <OfflineBanner />
      <BrowserRouter>
        <AuthProvider>
          <FamilyProvider>
            <SocketProvider>
              <AppRoutes />
            </SocketProvider>
          </FamilyProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
