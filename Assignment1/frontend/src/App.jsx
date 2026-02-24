import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Participant pages
import ParticipantDashboard from './pages/Participant/Dashboard';
import BrowseEvents from './pages/Participant/BrowseEvents';
import EventDetails from './pages/Participant/EventDetails';
import EventDiscussions from './pages/Participant/EventDiscussions';
import TeamManagement from './pages/Participant/TeamManagement';
import TeamChat from './pages/Participant/TeamChat';
import ParticipantProfile from './pages/Participant/Profile';
import ClubsList from './pages/Participant/ClubsList';
import ClubDetails from './pages/Participant/ClubDetails';
import SubmitFeedback from './pages/Participant/SubmitFeedback';

// Organizer pages
import OrganizerDashboard from './pages/Organizer/Dashboard';
import CreateEvent from './pages/Organizer/CreateEvent';
import EditEvent from './pages/Organizer/EditEvent';
import OrganizerEventDetails from './pages/Organizer/EventDetails';
import AttendanceScanner from './pages/Organizer/AttendanceScanner';
import PasswordResetRequest from './pages/Organizer/PasswordResetRequest';
import OrganizerProfile from './pages/Organizer/Profile';
import EventFeedback from './pages/Organizer/EventFeedback';

// Admin pages
import AdminDashboard from './pages/Admin/Dashboard';
import ManageClubs from './pages/Admin/ManageClubs';
import PasswordResetManagement from './pages/Admin/PasswordResetManagement';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App Routes
function AppRoutes() {
  const { user, isAuthenticated } = useAuth();

  // Redirect based on role
  const getDashboardRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'participant':
        return '/dashboard';
      case 'organizer':
        return '/organizer/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={getDashboardRoute()} />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={getDashboardRoute()} />} />

      {/* Participant routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <ParticipantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <BrowseEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:eventId"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <EventDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:eventId/team"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <TeamManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams/:teamId/chat"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <TeamChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:eventId/discussions"
        element={
          <ProtectedRoute allowedRoles={['participant', 'organizer']}>
            <EventDiscussions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:eventId/feedback"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <SubmitFeedback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clubs"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <ClubsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clubs/:clubId"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <ClubDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['participant']}>
            <ParticipantProfile />
          </ProtectedRoute>
        }
      />

      {/* Organizer routes */}
      <Route
        path="/organizer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/create-event"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <CreateEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/events/:eventId"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerEventDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/events/:eventId/edit"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <EditEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/events/:eventId/attendance"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <AttendanceScanner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/events/:eventId/feedback"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <EventFeedback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/profile"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/password-reset"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <PasswordResetRequest />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clubs"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageClubs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/password-reset"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PasswordResetManagement />
          </ProtectedRoute>
        }
      />

      {/* Default route */}
      <Route path="/" element={<Navigate to={getDashboardRoute()} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
