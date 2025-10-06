import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Courses from './pages/Courses';
import Attendance from './pages/Attendance';
import Assignments from './pages/Assignments';
import Fees from './pages/Fees';
import Events from './pages/Events';
import Notifications from './pages/Notifications';
import AcademicPerformance from './pages/AcademicPerformance';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="courses" element={<Courses />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="fees" element={<Fees />} />
            <Route path="events" element={<Events />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="academic-performance" element={<AcademicPerformance />} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
