import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Components
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Wait for auth to initialize
    if (!loading) {
      setIsInitializing(false);
    }
  }, [loading]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      
      {/* Protected routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/projects" element={user ? <ProjectList /> : <Navigate to="/login" />} />
      <Route path="/projects/:id" element={user ? <ProjectDetail /> : <Navigate to="/login" />} />
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
      
      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
