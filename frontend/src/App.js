import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import './pages/auth/auth.css';

function AppRoutes() {
  const { isAuthenticated, user, loading } = useAuth();

  // Role-based dashboard component selector
  const getDashboardComponent = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'faculty':
        return <FacultyDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '18px',
            color: 'red'
          }}>
            Invalid user role
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? 
          <Navigate to="/dashboard" replace /> :
          <Login />
        }
      />
      <Route
        path="/register"
        element={isAuthenticated ? 
          <Navigate to="/dashboard" replace /> :
          <Register />
        }
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? 
          <Navigate to="/dashboard" replace /> :
          <ForgotPassword />
        }
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? 
          getDashboardComponent() :
          <Navigate to="/login" replace />
        }
      />
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;