import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { FamilyProvider } from './context/FamilyContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { AppRoutes } from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FamilyProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </FamilyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
