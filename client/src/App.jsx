import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Components
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import OrganizationDashboard from './pages/dashboard/OrganizationDashboard';
import ServicesManagement from './pages/dashboard/ServicesManagement';
import StatusOverview from './pages/dashboard/StatusOverview';
import IncidentsPage from './pages/dashboard/IncidentsPage';
import IncidentsTimeline from './pages/dashboard/IncidentsTimeline';
import TeamPage from './pages/dashboard/TeamPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import PublicStatusPage from './pages/public/PublicStatusPage';
import PublicIncidentPage from './pages/public/PublicIncidentPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Status Pages */}
      <Route path="/status/:slug" element={<PublicStatusPage />} />
      <Route path="/status/:slug/incidents/:incidentId" element={<PublicIncidentPage />} />
      
      {/* Auth Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } 
      />

      {/* Dashboard Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/dashboard/organizations/:organizationId" 
        element={
          <ProtectedRoute>
            <OrganizationDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/dashboard/organizations/:organizationId/services" 
        element={
          <ProtectedRoute>
            <ServicesManagement />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/dashboard/organizations/:organizationId/status" 
        element={
          <ProtectedRoute>
            <StatusOverview />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/dashboard/organizations/:organizationId/incidents" 
        element={
          <ProtectedRoute>
            <IncidentsPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/dashboard/organizations/:organizationId/timeline" 
        element={
          <ProtectedRoute>
            <IncidentsTimeline />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/dashboard/organizations/:organizationId/team" 
        element={
          <ProtectedRoute>
            <TeamPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/dashboard/organizations/:organizationId/settings" 
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } 
      />

      {/* Default redirects */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
